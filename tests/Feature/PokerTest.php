<?php

namespace Tests\Feature;

use App\Enums\PokerSessionStatus;
use App\Http\Controllers\Api\PokerController;
use App\Models\PokerSession;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PokerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->group(function () {
            Route::post('/test/tasks/{task}/poker-sessions', [PokerController::class, 'store']);
            Route::get('/test/tasks/{task}/poker-sessions/active', [PokerController::class, 'active']);
            Route::get('/test/poker-sessions/{pokerSession}', [PokerController::class, 'show']);
            Route::post('/test/poker-sessions/{pokerSession}/vote', [PokerController::class, 'vote']);
            Route::post('/test/poker-sessions/{pokerSession}/reveal', [PokerController::class, 'reveal']);
            Route::post('/test/poker-sessions/{pokerSession}/accept', [PokerController::class, 'accept']);
        });
    }

    private function createTaskForOwner(User $owner): Task
    {
        $project = app(ProjectService::class)->create($owner, ['name' => 'Test Project']);
        $board = $project->boards->first();
        $column = $board->columns->first();

        return Task::factory()->create([
            'project_id' => $project->id,
            'board_id' => $board->id,
            'column_id' => $column->id,
            'created_by' => $owner->id,
        ]);
    }

    public function test_member_can_start_a_poker_session_for_a_task(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        $response = $this->actingAs($user)->postJson("/test/tasks/{$task->id}/poker-sessions");

        $response->assertCreated();
        $response->assertJsonPath('data.status', PokerSessionStatus::Voting->value);

        $this->assertDatabaseHas('poker_sessions', [
            'task_id' => $task->id,
            'created_by' => $user->id,
            'status' => PokerSessionStatus::Voting->value,
        ]);
    }

    public function test_starting_a_session_fails_when_one_is_already_active(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        PokerSession::factory()->create([
            'task_id' => $task->id,
            'created_by' => $user->id,
            'status' => PokerSessionStatus::Voting,
        ]);

        $response = $this->actingAs($user)->postJson("/test/tasks/{$task->id}/poker-sessions");

        $response->assertStatus(422);
        $this->assertSame(1, PokerSession::where('task_id', $task->id)->count());
    }

    public function test_member_can_vote_and_active_endpoint_reflects_session(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        $pokerSession = PokerSession::factory()->create([
            'task_id' => $task->id,
            'created_by' => $user->id,
            'status' => PokerSessionStatus::Voting,
        ]);

        $voteResponse = $this->actingAs($user)->postJson("/test/poker-sessions/{$pokerSession->id}/vote", [
            'value' => '5',
        ]);

        $voteResponse->assertOk();

        $this->assertDatabaseHas('poker_votes', [
            'poker_session_id' => $pokerSession->id,
            'user_id' => $user->id,
            'value' => '5',
        ]);

        $activeResponse = $this->actingAs($user)->getJson("/test/tasks/{$task->id}/poker-sessions/active");

        $activeResponse->assertOk();
        $activeResponse->assertJsonPath('data.id', $pokerSession->id);
    }

    public function test_revealing_requires_at_least_one_vote(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        $pokerSession = PokerSession::factory()->create([
            'task_id' => $task->id,
            'created_by' => $user->id,
            'status' => PokerSessionStatus::Voting,
        ]);

        $response = $this->actingAs($user)->postJson("/test/poker-sessions/{$pokerSession->id}/reveal");

        $response->assertStatus(422);
        $this->assertSame(PokerSessionStatus::Voting, $pokerSession->fresh()->status);
    }

    public function test_full_flow_reveal_and_accept_updates_task_story_points(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        $pokerSession = PokerSession::factory()->create([
            'task_id' => $task->id,
            'created_by' => $user->id,
            'status' => PokerSessionStatus::Voting,
        ]);

        $this->actingAs($user)->postJson("/test/poker-sessions/{$pokerSession->id}/vote", [
            'value' => '8',
        ])->assertOk();

        $revealResponse = $this->actingAs($user)->postJson("/test/poker-sessions/{$pokerSession->id}/reveal");
        $revealResponse->assertOk();
        $revealResponse->assertJsonPath('data.status', PokerSessionStatus::Revealed->value);

        $acceptResponse = $this->actingAs($user)->postJson("/test/poker-sessions/{$pokerSession->id}/accept", [
            'story_points' => 8,
        ]);

        $acceptResponse->assertOk();
        $acceptResponse->assertJsonPath('data.status', PokerSessionStatus::Accepted->value);
        $acceptResponse->assertJsonPath('data.final_estimate', '8');

        $this->assertSame(8, $task->fresh()->story_points);
    }

    public function test_non_member_cannot_vote_on_a_session(): void
    {
        $owner = User::factory()->create();
        $task = $this->createTaskForOwner($owner);

        $pokerSession = PokerSession::factory()->create([
            'task_id' => $task->id,
            'created_by' => $owner->id,
            'status' => PokerSessionStatus::Voting,
        ]);

        $outsider = User::factory()->create();

        $response = $this->actingAs($outsider)->postJson("/test/poker-sessions/{$pokerSession->id}/vote", [
            'value' => '3',
        ]);

        $response->assertForbidden();
    }
}

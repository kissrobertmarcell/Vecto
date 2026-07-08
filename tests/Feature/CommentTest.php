<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\CommentController;
use App\Models\Comment;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->group(function () {
            Route::get('/test/tasks/{task}/comments', [CommentController::class, 'index']);
            Route::post('/test/tasks/{task}/comments', [CommentController::class, 'store']);
            Route::patch('/test/comments/{comment}', [CommentController::class, 'update']);
            Route::delete('/test/comments/{comment}', [CommentController::class, 'destroy']);
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

    public function test_member_can_post_a_comment_on_a_task(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        $response = $this->actingAs($user)->postJson("/test/tasks/{$task->id}/comments", [
            'body' => 'This is a comment.',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.body', 'This is a comment.');
        $response->assertJsonPath('data.user.id', $user->id);

        $this->assertDatabaseHas('comments', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body' => 'This is a comment.',
        ]);
    }

    public function test_index_lists_comments_for_a_task(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        Comment::factory()->count(3)->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/test/tasks/{$task->id}/comments");

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }

    public function test_author_can_update_their_own_comment(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        $comment = Comment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body' => 'Original body',
        ]);

        $response = $this->actingAs($user)->patchJson("/test/comments/{$comment->id}", [
            'body' => 'Updated body',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.body', 'Updated body');

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'body' => 'Updated body',
        ]);
    }

    public function test_non_author_cannot_update_someone_elses_comment(): void
    {
        $author = User::factory()->create();
        $task = $this->createTaskForOwner($author);

        $comment = Comment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $author->id,
        ]);

        $otherUser = User::factory()->create();
        $task->project->projectMembers()->create([
            'user_id' => $otherUser->id,
            'role' => \App\Enums\ProjectRole::Member,
        ]);

        $response = $this->actingAs($otherUser)->patchJson("/test/comments/{$comment->id}", [
            'body' => 'Trying to hijack this comment',
        ]);

        $response->assertForbidden();
    }

    public function test_author_can_delete_their_own_comment(): void
    {
        $user = User::factory()->create();
        $task = $this->createTaskForOwner($user);

        $comment = Comment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->deleteJson("/test/comments/{$comment->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_non_member_cannot_post_a_comment(): void
    {
        $owner = User::factory()->create();
        $task = $this->createTaskForOwner($owner);

        $outsider = User::factory()->create();

        $response = $this->actingAs($outsider)->postJson("/test/tasks/{$task->id}/comments", [
            'body' => 'I should not be able to do this.',
        ]);

        $response->assertForbidden();
    }
}

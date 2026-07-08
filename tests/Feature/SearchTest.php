<?php

namespace Tests\Feature;

use App\Enums\ProjectRole;
use App\Http\Controllers\Api\SearchController;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/api/search', [SearchController::class, 'index']);
        });
    }

    public function test_search_returns_matching_tasks_projects_and_users(): void
    {
        $user = User::factory()->create();
        $teammate = User::factory()->create(['name' => 'Search Teammate']);

        $project = app(ProjectService::class)->create($user, ['name' => 'Search Rocket Project']);
        $project->projectMembers()->create([
            'user_id' => $teammate->id,
            'role' => ProjectRole::Member,
        ]);

        $board = $project->boards->first();
        $column = $board->columns->first();

        Task::factory()->create([
            'project_id' => $project->id,
            'board_id' => $board->id,
            'column_id' => $column->id,
            'title' => 'Fix the rocket booster',
        ]);

        Task::factory()->create([
            'project_id' => $project->id,
            'board_id' => $board->id,
            'column_id' => $column->id,
            'title' => 'Unrelated task',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/search?q=rocket');

        $response->assertOk();
        $response->assertJsonCount(1, 'tasks');
        $response->assertJsonCount(1, 'projects');
        $response->assertJsonPath('tasks.0.title', 'Fix the rocket booster');
        $response->assertJsonPath('projects.0.name', 'Search Rocket Project');
    }

    public function test_search_only_returns_users_sharing_a_project(): void
    {
        $user = User::factory()->create();
        $teammate = User::factory()->create(['name' => 'Shared Rocket Member']);
        $stranger = User::factory()->create(['name' => 'Stranger Rocket']);

        $project = app(ProjectService::class)->create($user, ['name' => 'Team Project']);
        $project->projectMembers()->create([
            'user_id' => $teammate->id,
            'role' => ProjectRole::Member,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/search?q=Rocket');

        $response->assertOk();
        $response->assertJsonCount(1, 'users');
        $response->assertJsonPath('users.0.name', 'Shared Rocket Member');
    }
}

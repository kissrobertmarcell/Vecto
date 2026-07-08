<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\DashboardController;
use App\Models\Activity;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/api/dashboard', [DashboardController::class, 'index']);
        });
    }

    public function test_dashboard_returns_projects_tasks_sprints_and_activity(): void
    {
        $user = User::factory()->create();

        $project = app(ProjectService::class)->create($user, ['name' => 'Dashboard Project']);
        $board = $project->boards->first();
        $column = $board->columns->first();

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'board_id' => $board->id,
            'column_id' => $column->id,
            'assignee_id' => $user->id,
            'due_date' => now()->addDay(),
        ]);

        $sprint = Sprint::factory()->active()->create([
            'board_id' => $board->id,
            'project_id' => $project->id,
        ]);

        Activity::factory()->create([
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $user->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/dashboard');

        $response->assertOk();
        $response->assertJsonCount(1, 'projects');
        $response->assertJsonCount(1, 'assigned_tasks');
        $response->assertJsonCount(1, 'active_sprints');
        $response->assertJsonCount(1, 'recent_activity');
        $response->assertJsonPath('projects.0.name', 'Dashboard Project');
        $response->assertJsonPath('assigned_tasks.0.id', $task->id);
        $response->assertJsonPath('active_sprints.0.id', $sprint->id);
    }
}

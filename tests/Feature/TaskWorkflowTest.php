<?php

namespace Tests\Feature;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_member_can_create_update_and_move_a_task(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $project = app(ProjectService::class)->create($owner, ['name' => 'Task Project']);
        $project->projectMembers()->create([
            'user_id' => $member->id,
            'role' => ProjectRole::Member,
        ]);

        Sanctum::actingAs($member);

        $createResponse = $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Write unit tests',
            'description' => 'Ensure key flows are covered.',
        ]);

        $createResponse->assertCreated();
        $createResponse->assertJsonPath('data.title', 'Write unit tests');

        $taskId = $createResponse->json('data.id');
        $task = Task::findOrFail($taskId);
        $targetColumn = $project->boards->first()->columns->where('name', 'Todo')->first();

        $moveResponse = $this->postJson("/api/tasks/{$taskId}/move", [
            'column_id' => $targetColumn->id,
            'position' => 0,
        ]);

        $moveResponse->assertOk();
        $moveResponse->assertJsonPath('data.column_id', $targetColumn->id);

        Sanctum::actingAs($owner);

        $sprintResponse = $this->postJson("/api/projects/{$project->id}/sprints", [
            'name' => 'Sprint 1',
        ]);

        $sprintResponse->assertCreated();

        $sprintId = $sprintResponse->json('data.id');

        $assignResponse = $this->postJson("/api/tasks/{$taskId}/assign-sprint", [
            'sprint_id' => $sprintId,
        ]);

        $assignResponse->assertOk();
        $assignResponse->assertJsonPath('data.sprint_id', $sprintId);
    }

    public function test_non_member_cannot_create_task_on_project(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        $project = app(ProjectService::class)->create($owner, ['name' => 'Private Project']);

        Sanctum::actingAs($outsider);

        $response = $this->postJson("/api/projects/{$project->id}/tasks", [
            'title' => 'Sneaky task',
        ]);

        $response->assertForbidden();
    }
}

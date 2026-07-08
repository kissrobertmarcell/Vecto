<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_owner_can_create_update_and_delete_a_project(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/projects', [
            'name' => 'Sprint Board',
            'description' => 'A team project',
        ]);

        $createResponse->assertCreated();
        $createResponse->assertJsonPath('data.name', 'Sprint Board');
        $createResponse->assertJsonPath('data.description', 'A team project');
        $this->assertDatabaseHas('projects', ['name' => 'Sprint Board', 'owner_id' => $user->id]);

        $projectId = $createResponse->json('data.id');

        $listResponse = $this->getJson('/api/projects');
        $listResponse->assertOk();
        $listResponse->assertJsonCount(1, 'data');

        $showResponse = $this->getJson("/api/projects/{$projectId}");
        $showResponse->assertOk();
        $showResponse->assertJsonPath('data.id', $projectId);
        $showResponse->assertJsonPath('data.boards.0.name', 'Main Board');

        $updateResponse = $this->patchJson("/api/projects/{$projectId}", [
            'description' => 'Updated project description',
        ]);

        $updateResponse->assertOk();
        $updateResponse->assertJsonPath('data.description', 'Updated project description');
        $this->assertDatabaseHas('projects', ['id' => $projectId, 'description' => 'Updated project description']);

        $deleteResponse = $this->deleteJson("/api/projects/{$projectId}");
        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('projects', ['id' => $projectId]);
    }

    public function test_project_owner_can_invite_another_user(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create();

        Sanctum::actingAs($owner);

        $projectResponse = $this->postJson('/api/projects', [
            'name' => 'Invite Project',
        ]);

        $projectResponse->assertCreated();

        $projectId = $projectResponse->json('data.id');

        $inviteResponse = $this->postJson("/api/projects/{$projectId}/members", [
            'email' => $invitee->email,
            'role' => 'member',
        ]);

        $inviteResponse->assertCreated();
        $inviteResponse->assertJsonPath('data.user.id', $invitee->id);
        $inviteResponse->assertJsonPath('data.role', 'member');
        $this->assertDatabaseHas('project_members', [
            'project_id' => $projectId,
            'user_id' => $invitee->id,
            'role' => 'member',
        ]);
    }
}

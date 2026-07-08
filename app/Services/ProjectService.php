<?php

namespace App\Services;

use App\Enums\ProjectRole;
use App\Models\Board;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProjectService
{
    /**
     * The default Kanban columns created for every new board.
     *
     * @var list<array{name: string, is_done_column: bool}>
     */
    private const DEFAULT_COLUMNS = [
        ['name' => 'Backlog', 'is_done_column' => false],
        ['name' => 'Todo', 'is_done_column' => false],
        ['name' => 'In Progress', 'is_done_column' => false],
        ['name' => 'Review', 'is_done_column' => false],
        ['name' => 'Done', 'is_done_column' => true],
    ];

    /**
     * @param  array{name: string, description?: string|null}  $data
     */
    public function create(User $owner, array $data): Project
    {
        return DB::transaction(function () use ($owner, $data) {
            $project = Project::create([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'description' => $data['description'] ?? null,
                'owner_id' => $owner->id,
            ]);

            $project->projectMembers()->create([
                'user_id' => $owner->id,
                'role' => ProjectRole::Owner,
            ]);

            $this->createDefaultBoard($project);

            return $project->fresh(['boards.columns', 'members']);
        });
    }

    /**
     * @param  array{name?: string, description?: string|null}  $data
     */
    public function update(Project $project, array $data): Project
    {
        $project->update(array_filter([
            'name' => $data['name'] ?? null,
            'description' => $data['description'] ?? $project->description,
        ], fn ($value) => $value !== null));

        return $project->fresh();
    }

    public function delete(Project $project): void
    {
        $project->delete();
    }

    public function inviteMember(Project $project, string $email, ProjectRole $role): ProjectMember
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'No user was found with that email address.',
            ]);
        }

        if ($project->hasMember($user)) {
            throw ValidationException::withMessages([
                'email' => 'This user is already a member of the project.',
            ]);
        }

        return $project->projectMembers()->create([
            'user_id' => $user->id,
            'role' => $role,
        ]);
    }

    public function updateMemberRole(Project $project, ProjectMember $member, ProjectRole $role): ProjectMember
    {
        if ($member->user_id === $project->owner_id) {
            throw ValidationException::withMessages([
                'role' => 'The project owner\'s role cannot be changed.',
            ]);
        }

        $member->update(['role' => $role]);

        return $member->fresh();
    }

    public function removeMember(Project $project, ProjectMember $member): void
    {
        if ($member->user_id === $project->owner_id) {
            throw ValidationException::withMessages([
                'member' => 'The project owner cannot be removed.',
            ]);
        }

        $member->delete();
    }

    private function createDefaultBoard(Project $project): Board
    {
        $board = $project->boards()->create(['name' => 'Main Board']);

        foreach (self::DEFAULT_COLUMNS as $position => $column) {
            $board->columns()->create([
                'name' => $column['name'],
                'position' => $position,
                'is_done_column' => $column['is_done_column'],
            ]);
        }

        return $board;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (Project::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}

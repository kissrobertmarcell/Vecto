<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $task->project->hasMember($user);
    }

    public function create(User $user, Project $project): bool
    {
        return $project->roleFor($user)?->canEditContent() ?? false;
    }

    public function update(User $user, Task $task): bool
    {
        return $task->project->roleFor($user)?->canEditContent() ?? false;
    }

    public function move(User $user, Task $task): bool
    {
        return $task->project->roleFor($user)?->canEditContent() ?? false;
    }

    public function delete(User $user, Task $task): bool
    {
        return $task->project->roleFor($user)?->canEditContent() ?? false;
    }
}

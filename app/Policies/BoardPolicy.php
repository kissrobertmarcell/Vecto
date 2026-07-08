<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;

class BoardPolicy
{
    public function view(User $user, Board $board): bool
    {
        return $board->project->hasMember($user);
    }

    public function create(User $user, Board $board): bool
    {
        return $board->project->roleFor($user)?->canManageProject() ?? false;
    }

    public function update(User $user, Board $board): bool
    {
        return $board->project->roleFor($user)?->canManageProject() ?? false;
    }

    public function delete(User $user, Board $board): bool
    {
        return $board->project->roleFor($user)?->canManageProject() ?? false;
    }
}

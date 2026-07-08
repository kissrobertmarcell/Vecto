<?php

namespace App\Policies;

use App\Models\PokerSession;
use App\Models\Task;
use App\Models\User;

class PokerSessionPolicy
{
    public function view(User $user, PokerSession $pokerSession): bool
    {
        return $pokerSession->task->project->hasMember($user);
    }

    public function create(User $user, Task $task): bool
    {
        return $task->project->roleFor($user)?->canEditContent() ?? false;
    }

    public function vote(User $user, PokerSession $pokerSession): bool
    {
        return $pokerSession->task->project->roleFor($user)?->canEditContent() ?? false;
    }

    public function manage(User $user, PokerSession $pokerSession): bool
    {
        return $pokerSession->task->project->roleFor($user)?->canEditContent() ?? false;
    }
}

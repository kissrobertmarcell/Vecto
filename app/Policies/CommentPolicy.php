<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentPolicy
{
    public function view(User $user, Comment $comment): bool
    {
        return $comment->task->project->hasMember($user);
    }

    public function create(User $user, Task $task): bool
    {
        return $task->project->roleFor($user)?->canEditContent() ?? false;
    }

    public function update(User $user, Comment $comment): bool
    {
        return $comment->user_id === $user->id;
    }

    public function delete(User $user, Comment $comment): bool
    {
        if ($comment->user_id === $user->id) {
            return true;
        }

        return $comment->task->project->roleFor($user)?->canManageProject() ?? false;
    }
}

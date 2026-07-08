<?php

namespace App\Services;

use App\Events\CommentPosted;
use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Task $task, array $data, User $author): Comment
    {
        $comment = $task->comments()->create([
            'user_id' => $author->id,
            'body' => $data['body'],
        ]);

        CommentPosted::dispatch($comment);

        return $comment->fresh('user');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Comment $comment, array $data): Comment
    {
        $comment->update([
            'body' => $data['body'],
        ]);

        return $comment->fresh('user');
    }

    public function delete(Comment $comment): void
    {
        $comment->delete();
    }
}

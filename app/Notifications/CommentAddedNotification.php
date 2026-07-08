<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CommentAddedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Comment $comment,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $task = $this->comment->task;

        return [
            'type' => NotificationType::Comment->value,
            'task_id' => $task->id,
            'project_id' => $task->project_id,
            'task_title' => $task->title,
            'comment_author' => $this->comment->user->only(['id', 'name']),
            'message' => "{$this->comment->user->name} commented on \"{$task->title}\"",
        ];
    }
}

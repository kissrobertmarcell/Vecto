<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\PokerSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PokerSessionStartedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public PokerSession $pokerSession,
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
        $task = $this->pokerSession->task;

        return [
            'type' => NotificationType::PokerStarted->value,
            'task_id' => $task->id,
            'project_id' => $task->project_id,
            'poker_session_id' => $this->pokerSession->id,
            'task_title' => $task->title,
            'message' => "Planning poker started for \"{$task->title}\"",
        ];
    }
}

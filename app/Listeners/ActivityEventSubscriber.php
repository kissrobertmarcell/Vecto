<?php

namespace App\Listeners;

use App\Enums\ActivityType;
use App\Events\CommentPosted;
use App\Events\PokerSessionStarted;
use App\Events\TaskAssigned;
use App\Events\TaskCompleted;
use App\Events\TaskCreated;
use App\Events\TaskEstimated;
use App\Events\TaskMoved;
use App\Events\TaskUpdated;
use App\Notifications\CommentAddedNotification;
use App\Notifications\PokerSessionStartedNotification;
use App\Notifications\TaskAssignedNotification;
use App\Services\ActivityLogService;
use Illuminate\Events\Dispatcher;

/**
 * Central place where domain events are translated into activity log
 * entries and database notifications.
 */
class ActivityEventSubscriber
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
    ) {}

    public function handleTaskCreated(TaskCreated $event): void
    {
        $this->activityLog->log(
            project: $event->task->project,
            type: ActivityType::Created,
            description: "{$event->causer->name} created \"{$event->task->title}\"",
            task: $event->task,
            user: $event->causer,
        );
    }

    public function handleTaskUpdated(TaskUpdated $event): void
    {
        if (empty($event->changedFields)) {
            return;
        }

        $this->activityLog->log(
            project: $event->task->project,
            type: ActivityType::Updated,
            description: "{$event->causer->name} updated \"{$event->task->title}\"",
            task: $event->task,
            user: $event->causer,
            meta: ['fields' => $event->changedFields],
        );
    }

    public function handleTaskMoved(TaskMoved $event): void
    {
        $this->activityLog->log(
            project: $event->task->project,
            type: ActivityType::Moved,
            description: "{$event->causer->name} moved \"{$event->task->title}\" from {$event->from->name} to {$event->to->name}",
            task: $event->task,
            user: $event->causer,
            meta: ['from' => $event->from->name, 'to' => $event->to->name],
        );
    }

    public function handleTaskAssigned(TaskAssigned $event): void
    {
        $assignee = $event->task->assignee;

        $this->activityLog->log(
            project: $event->task->project,
            type: ActivityType::Assigned,
            description: $assignee
                ? "{$event->causer->name} assigned \"{$event->task->title}\" to {$assignee->name}"
                : "{$event->causer->name} unassigned \"{$event->task->title}\"",
            task: $event->task,
            user: $event->causer,
        );

        if ($assignee && $assignee->id !== $event->causer->id) {
            $assignee->notify(new TaskAssignedNotification($event->task, $event->causer));
        }
    }

    public function handleCommentPosted(CommentPosted $event): void
    {
        $task = $event->comment->task;

        $this->activityLog->log(
            project: $task->project,
            type: ActivityType::Commented,
            description: "{$event->comment->user->name} commented on \"{$task->title}\"",
            task: $task,
            user: $event->comment->user,
        );

        $recipients = collect([$task->assignee, $task->creator])
            ->filter()
            ->unique('id')
            ->reject(fn ($user) => $user->id === $event->comment->user_id);

        foreach ($recipients as $recipient) {
            $recipient->notify(new CommentAddedNotification($event->comment));
        }
    }

    public function handleTaskEstimated(TaskEstimated $event): void
    {
        $this->activityLog->log(
            project: $event->task->project,
            type: ActivityType::Estimated,
            description: "{$event->causer->name} estimated \"{$event->task->title}\" at {$event->storyPoints} points",
            task: $event->task,
            user: $event->causer,
            meta: ['story_points' => $event->storyPoints],
        );
    }

    public function handleTaskCompleted(TaskCompleted $event): void
    {
        $this->activityLog->log(
            project: $event->task->project,
            type: ActivityType::Completed,
            description: "{$event->causer->name} completed \"{$event->task->title}\"",
            task: $event->task,
            user: $event->causer,
        );
    }

    public function handlePokerSessionStarted(PokerSessionStarted $event): void
    {
        $task = $event->pokerSession->task;
        $project = $task->project->loadMissing('members');

        $recipients = $project->members->reject(fn ($user) => $user->id === $event->causer->id);

        foreach ($recipients as $recipient) {
            $recipient->notify(new PokerSessionStartedNotification($event->pokerSession));
        }
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            TaskCreated::class => 'handleTaskCreated',
            TaskUpdated::class => 'handleTaskUpdated',
            TaskMoved::class => 'handleTaskMoved',
            TaskAssigned::class => 'handleTaskAssigned',
            CommentPosted::class => 'handleCommentPosted',
            TaskEstimated::class => 'handleTaskEstimated',
            TaskCompleted::class => 'handleTaskCompleted',
            PokerSessionStarted::class => 'handlePokerSessionStarted',
        ];
    }
}

<?php

namespace App\Services;

use App\Enums\PokerSessionStatus;
use App\Events\PokerSessionStarted;
use App\Events\TaskEstimated;
use App\Models\PokerSession;
use App\Models\Task;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class PokerService
{
    public function start(Task $task, User $causer): PokerSession
    {
        if ($this->activeForTask($task)) {
            throw ValidationException::withMessages([
                'task' => 'This task already has an active planning poker session.',
            ]);
        }

        $pokerSession = $task->pokerSessions()->create([
            'created_by' => $causer->id,
            'status' => PokerSessionStatus::Voting,
        ]);

        PokerSessionStarted::dispatch($pokerSession, $causer);

        return $pokerSession->fresh(['creator', 'votes']);
    }

    public function vote(PokerSession $pokerSession, User $voter, string $value): PokerSession
    {
        if ($pokerSession->status !== PokerSessionStatus::Voting) {
            throw ValidationException::withMessages([
                'value' => 'Voting is closed for this session.',
            ]);
        }

        $pokerSession->votes()->updateOrCreate(
            ['user_id' => $voter->id],
            ['value' => $value],
        );

        return $pokerSession->fresh(['creator', 'votes.user']);
    }

    public function reveal(PokerSession $pokerSession): PokerSession
    {
        if ($pokerSession->status !== PokerSessionStatus::Voting) {
            throw ValidationException::withMessages([
                'status' => 'This session is not currently accepting votes.',
            ]);
        }

        if ($pokerSession->votes()->count() === 0) {
            throw ValidationException::withMessages([
                'status' => 'At least one vote is required before revealing.',
            ]);
        }

        $pokerSession->update([
            'status' => PokerSessionStatus::Revealed,
            'revealed_at' => now(),
        ]);

        return $pokerSession->fresh(['creator', 'votes.user']);
    }

    public function accept(PokerSession $pokerSession, int $storyPoints, User $causer): PokerSession
    {
        if ($pokerSession->status !== PokerSessionStatus::Revealed) {
            throw ValidationException::withMessages([
                'status' => 'This session must be revealed before an estimate can be accepted.',
            ]);
        }

        $pokerSession->update([
            'status' => PokerSessionStatus::Accepted,
            'final_estimate' => (string) $storyPoints,
            'accepted_at' => now(),
        ]);

        $task = $pokerSession->task;
        $task->update(['story_points' => $storyPoints]);

        TaskEstimated::dispatch($task, $causer, $storyPoints);

        return $pokerSession->fresh(['creator', 'votes.user']);
    }

    public function activeForTask(Task $task): ?PokerSession
    {
        return $task->pokerSessions()
            ->whereIn('status', [PokerSessionStatus::Voting, PokerSessionStatus::Revealed])
            ->latest()
            ->first();
    }
}

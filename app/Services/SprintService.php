<?php

namespace App\Services;

use App\Enums\SprintStatus;
use App\Models\Project;
use App\Models\Sprint;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SprintService
{
    public function list(Project $project): Collection
    {
        return $project->sprints()->withCount('tasks')->latest('starts_at')->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Project $project, array $data): Sprint
    {
        $board = $project->boards()->firstOrFail();

        return $project->sprints()->create([
            'board_id' => $board->id,
            'name' => $data['name'],
            'goal' => $data['goal'] ?? null,
            'status' => SprintStatus::Planned,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Sprint $sprint, array $data): Sprint
    {
        $sprint->update(array_filter([
            'name' => $data['name'] ?? null,
            'goal' => $data['goal'] ?? $sprint->goal,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ], fn ($value) => $value !== null));

        return $sprint->fresh();
    }

    public function start(Sprint $sprint): Sprint
    {
        if ($sprint->status !== SprintStatus::Planned) {
            throw ValidationException::withMessages([
                'status' => 'Only a planned sprint can be started.',
            ]);
        }

        $activeExists = Sprint::where('board_id', $sprint->board_id)
            ->where('status', SprintStatus::Active)
            ->exists();

        if ($activeExists) {
            throw ValidationException::withMessages([
                'status' => 'Another sprint is already active on this board.',
            ]);
        }

        $sprint->update([
            'status' => SprintStatus::Active,
            'started_at' => now(),
        ]);

        return $sprint->fresh();
    }

    public function complete(Sprint $sprint): Sprint
    {
        if ($sprint->status !== SprintStatus::Active) {
            throw ValidationException::withMessages([
                'status' => 'Only an active sprint can be completed.',
            ]);
        }

        return DB::transaction(function () use ($sprint) {
            $sprint->update([
                'status' => SprintStatus::Completed,
                'completed_at' => now(),
            ]);

            // Unfinished tasks return to the backlog for re-planning.
            $sprint->tasks()
                ->whereHas('column', fn ($query) => $query->where('is_done_column', false))
                ->update(['sprint_id' => null]);

            return $sprint->fresh();
        });
    }

    public function delete(Sprint $sprint): void
    {
        $sprint->delete();
    }
}

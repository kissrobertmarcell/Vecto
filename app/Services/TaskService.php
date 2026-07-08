<?php

namespace App\Services;

use App\Enums\TaskPriority;
use App\Events\TaskAssigned;
use App\Events\TaskCompleted;
use App\Events\TaskCreated;
use App\Events\TaskEstimated;
use App\Events\TaskMoved;
use App\Events\TaskUpdated;
use App\Models\BoardColumn;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TaskService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function list(Project $project, array $filters = []): Collection
    {
        $query = $project->tasks()->with(['assignee', 'sprint']);

        if (array_key_exists('sprint_id', $filters)) {
            $filters['sprint_id'] === null
                ? $query->whereNull('sprint_id')
                : $query->where('sprint_id', $filters['sprint_id']);
        }

        if (! empty($filters['column_id'])) {
            $query->where('column_id', $filters['column_id']);
        }

        if (! empty($filters['assignee_id'])) {
            $query->where('assignee_id', $filters['assignee_id']);
        }

        if (! empty($filters['search'])) {
            $search = mb_strtolower($filters['search']);
            $query->whereRaw('LOWER(title) LIKE ?', ['%'.$search.'%']);
        }

        return $query->orderBy('position')->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Project $project, array $data, User $creator): Task
    {
        return DB::transaction(function () use ($project, $data, $creator) {
            $board = $project->boards()->firstOrFail();

            $column = isset($data['column_id'])
                ? $board->columns()->whereKey($data['column_id'])->firstOrFail()
                : $board->columns()->orderBy('position')->firstOrFail();

            $position = (int) $column->tasks()->max('position') + 1;

            $task = Task::create([
                'project_id' => $project->id,
                'board_id' => $board->id,
                'column_id' => $column->id,
                'sprint_id' => $data['sprint_id'] ?? null,
                'assignee_id' => $data['assignee_id'] ?? null,
                'created_by' => $creator->id,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? TaskPriority::Medium->value,
                'story_points' => $data['story_points'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'position' => $position,
            ]);

            TaskCreated::dispatch($task, $creator);

            if ($task->assignee_id && $task->assignee_id !== $creator->id) {
                TaskAssigned::dispatch($task, $creator, null);
            }

            return $task->fresh(['assignee', 'creator', 'sprint']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Task $task, array $data, User $causer): Task
    {
        $trackedFields = ['title', 'description', 'priority', 'due_date', 'story_points', 'assignee_id', 'sprint_id'];
        $previousAssigneeId = $task->assignee_id;
        $previousStoryPoints = $task->story_points;

        $updates = array_intersect_key($data, array_flip($trackedFields));
        $changedFields = [];

        foreach ($updates as $field => $value) {
            if ($task->{$field} != $value) {
                $changedFields[] = $field;
            }
        }

        $task->update($updates);

        if (in_array('assignee_id', $changedFields, true)) {
            $previousAssignee = $previousAssigneeId ? User::find($previousAssigneeId) : null;
            TaskAssigned::dispatch($task->fresh(), $causer, $previousAssignee);
        }

        if (in_array('story_points', $changedFields, true) && $task->story_points !== null && $task->story_points !== $previousStoryPoints) {
            TaskEstimated::dispatch($task->fresh(), $causer, $task->story_points);
        }

        $remainingChanges = array_values(array_diff($changedFields, ['assignee_id', 'story_points']));

        if (! empty($remainingChanges)) {
            TaskUpdated::dispatch($task->fresh(), $causer, $remainingChanges);
        }

        return $task->fresh(['assignee', 'creator', 'sprint']);
    }

    public function move(Task $task, int $columnId, int $position, User $causer): Task
    {
        return DB::transaction(function () use ($task, $columnId, $position, $causer) {
            $fromColumn = $task->column;
            $toColumn = BoardColumn::findOrFail($columnId);
            $movedColumns = $fromColumn->id !== $toColumn->id;

            if ($movedColumns) {
                $this->reindexColumn($fromColumn->id, excludeTaskId: $task->id);
            }

            $siblings = Task::where('column_id', $toColumn->id)
                ->where('id', '!=', $task->id)
                ->orderBy('position')
                ->get()
                ->values();

            $position = max(0, min($position, $siblings->count()));
            $siblings->splice($position, 0, [$task]);

            foreach ($siblings->values() as $index => $sibling) {
                if ($sibling->is($task)) {
                    $task->column_id = $toColumn->id;
                    $task->position = $index;
                } else {
                    $sibling->update(['position' => $index]);
                }
            }

            if ($movedColumns && $toColumn->is_done_column) {
                $task->completed_at = now();
            } elseif ($movedColumns && $fromColumn->is_done_column) {
                $task->completed_at = null;
            }

            $task->save();

            if ($movedColumns) {
                TaskMoved::dispatch($task->fresh(), $causer, $fromColumn, $toColumn);

                if ($toColumn->is_done_column) {
                    TaskCompleted::dispatch($task->fresh(), $causer);
                }
            }

            return $task->fresh(['assignee', 'creator', 'sprint', 'column']);
        });
    }

    public function assignSprint(Task $task, ?int $sprintId, User $causer): Task
    {
        $task->update(['sprint_id' => $sprintId]);

        TaskUpdated::dispatch($task->fresh(), $causer, ['sprint_id']);

        return $task->fresh(['assignee', 'sprint']);
    }

    /**
     * @param  list<int>  $orderedTaskIds
     */
    public function reorderBacklog(Project $project, array $orderedTaskIds): void
    {
        DB::transaction(function () use ($project, $orderedTaskIds) {
            foreach ($orderedTaskIds as $position => $taskId) {
                $project->tasks()->whereKey($taskId)->update(['position' => $position]);
            }
        });
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }

    private function reindexColumn(int $columnId, int $excludeTaskId): void
    {
        Task::where('column_id', $columnId)
            ->where('id', '!=', $excludeTaskId)
            ->orderBy('position')
            ->get()
            ->values()
            ->each(fn (Task $task, int $index) => $task->update(['position' => $index]));
    }
}

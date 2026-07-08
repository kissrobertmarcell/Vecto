<?php

namespace App\Services;

use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class ActivityLogService
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public function log(
        Project $project,
        ActivityType $type,
        string $description,
        ?Task $task = null,
        ?User $user = null,
        array $meta = [],
    ): Activity {
        return Activity::create([
            'project_id' => $project->id,
            'task_id' => $task?->id,
            'user_id' => $user?->id,
            'type' => $type,
            'description' => $description,
            'meta' => $meta,
        ]);
    }
}

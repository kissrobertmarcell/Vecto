<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Sprint
 */
class SprintResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'board_id' => $this->board_id,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'goal' => $this->goal,
            'status' => $this->status,
            'starts_at' => $this->starts_at?->toDateString(),
            'ends_at' => $this->ends_at?->toDateString(),
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'tasks_count' => $this->whenCounted('tasks'),
            'story_points_total' => $this->whenLoaded('tasks', fn () => (int) $this->tasks->sum('story_points')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
        ];
    }
}

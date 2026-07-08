<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Task
 */
class TaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'board_id' => $this->board_id,
            'column_id' => $this->column_id,
            'sprint_id' => $this->sprint_id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'story_points' => $this->story_points,
            'due_date' => $this->due_date?->toDateString(),
            'position' => $this->position,
            'completed_at' => $this->completed_at,
            'assignee' => UserResource::make($this->whenLoaded('assignee')),
            'creator' => UserResource::make($this->whenLoaded('creator')),
            'project' => ProjectResource::make($this->whenLoaded('project')),
            'sprint' => SprintResource::make($this->whenLoaded('sprint')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'comments_count' => $this->whenCounted('comments'),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

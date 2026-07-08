<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Project
 */
class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'owner' => UserResource::make($this->whenLoaded('owner')),
            'my_role' => $this->when(
                $request->user() !== null,
                fn () => $this->roleFor($request->user())?->value
            ),
            'members_count' => $this->whenCounted('members'),
            'tasks_count' => $this->whenCounted('tasks'),
            'boards' => BoardResource::collection($this->whenLoaded('boards')),
            'members' => ProjectMemberResource::collection($this->whenLoaded('projectMembers')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

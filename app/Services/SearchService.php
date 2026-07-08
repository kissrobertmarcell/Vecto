<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;

class SearchService
{
    /**
     * @return array{tasks: \Illuminate\Database\Eloquent\Collection, projects: \Illuminate\Database\Eloquent\Collection, users: \Illuminate\Database\Eloquent\Collection}
     */
    public function search(User $user, string $query): array
    {
        $projectIds = $user->projects()->pluck('projects.id');

        $search = mb_strtolower($query);

        $tasks = Task::whereIn('project_id', $projectIds)
            ->whereRaw('LOWER(title) LIKE ?', ['%'.$search.'%'])
            ->with(['project', 'assignee'])
            ->limit(10)
            ->get();

        $projects = $user->projects()
            ->whereRaw('LOWER(name) LIKE ?', ['%'.$search.'%'])
            ->limit(10)
            ->get();

        $userIds = User::whereHas('projects', fn ($q) => $q->whereIn('projects.id', $projectIds))
            ->pluck('id');

        $users = User::whereIn('id', $userIds)
            ->where(
                fn ($q) => $q->whereRaw('LOWER(name) LIKE ?', ['%'.$search.'%'])
                    ->orWhereRaw('LOWER(email) LIKE ?', ['%'.$search.'%'])
            )
            ->limit(10)
            ->get();

        return [
            'tasks' => $tasks,
            'projects' => $projects,
            'users' => $users,
        ];
    }
}

<?php

namespace App\Services;

use App\Enums\SprintStatus;
use App\Models\Activity;
use App\Models\Sprint;
use App\Models\User;

class DashboardService
{
    /**
     * @return array{projects: \Illuminate\Database\Eloquent\Collection, assigned_tasks: \Illuminate\Database\Eloquent\Collection, active_sprints: \Illuminate\Database\Eloquent\Collection, recent_activity: \Illuminate\Database\Eloquent\Collection}
     */
    public function forUser(User $user): array
    {
        $projectIds = $user->projects()->pluck('projects.id');

        $projects = $user->projects()
            ->withCount(['tasks'])
            ->orderBy('name')
            ->limit(10)
            ->get();

        $assignedTasks = $user->assignedTasks()
            ->whereNull('completed_at')
            ->with(['project', 'sprint'])
            ->orderBy('due_date')
            ->limit(10)
            ->get();

        $activeSprints = Sprint::whereIn('project_id', $projectIds)
            ->where('status', SprintStatus::Active)
            ->with('project')
            ->withCount('tasks')
            ->get();

        $recentActivity = Activity::whereIn('project_id', $projectIds)
            ->with(['user', 'task', 'project'])
            ->latest()
            ->limit(20)
            ->get();

        return [
            'projects' => $projects,
            'assigned_tasks' => $assignedTasks,
            'active_sprints' => $activeSprints,
            'recent_activity' => $recentActivity,
        ];
    }
}

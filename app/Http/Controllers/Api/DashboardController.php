<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\SprintResource;
use App\Http\Resources\TaskResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboard,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $data = $this->dashboard->forUser($request->user());

        return response()->json([
            'projects' => ProjectResource::collection($data['projects']),
            'assigned_tasks' => TaskResource::collection($data['assigned_tasks']),
            'active_sprints' => SprintResource::collection($data['active_sprints']),
            'recent_activity' => ActivityResource::collection($data['recent_activity']),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\AssignSprintRequest;
use App\Http\Requests\Task\MoveTaskRequest;
use App\Http\Requests\Task\ReorderBacklogRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function __construct(
        private readonly TaskService $tasks,
    ) {}

    public function index(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $filters = $request->only(['column_id', 'assignee_id', 'search']);

        if ($request->has('sprint_id')) {
            $filters['sprint_id'] = $request->input('sprint_id') === 'null' || $request->input('sprint_id') === null
                ? null
                : (int) $request->input('sprint_id');
        }

        $tasks = $this->tasks->list($project, $filters);

        return TaskResource::collection($tasks)->response();
    }

    public function store(StoreTaskRequest $request, Project $project): JsonResponse
    {
        $task = $this->tasks->create($project, $request->validated(), $request->user());

        return TaskResource::make($task)->response()->setStatusCode(201);
    }

    public function show(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $task->load(['assignee', 'creator', 'sprint', 'comments.user', 'activities.user', 'project']);

        return TaskResource::make($task)->response();
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $task = $this->tasks->update($task, $request->validated(), $request->user());

        return TaskResource::make($task)->response();
    }

    public function destroy(Task $task): JsonResponse
    {
        Gate::authorize('delete', $task);

        $this->tasks->delete($task);

        return response()->json(['message' => 'Task deleted.']);
    }

    public function move(MoveTaskRequest $request, Task $task): JsonResponse
    {
        $task = $this->tasks->move(
            $task,
            $request->validated('column_id'),
            $request->validated('position'),
            $request->user(),
        );

        return TaskResource::make($task)->response();
    }

    public function assignSprint(AssignSprintRequest $request, Task $task): JsonResponse
    {
        $task = $this->tasks->assignSprint($task, $request->validated('sprint_id'), $request->user());

        return TaskResource::make($task)->response();
    }

    public function reorderBacklog(ReorderBacklogRequest $request, Project $project): JsonResponse
    {
        $this->tasks->reorderBacklog($project, $request->validated('task_ids'));

        return response()->json(['message' => 'Backlog reordered.']);
    }
}

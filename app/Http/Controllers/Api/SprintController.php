<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sprint\StoreSprintRequest;
use App\Http\Requests\Sprint\UpdateSprintRequest;
use App\Http\Resources\SprintResource;
use App\Models\Project;
use App\Models\Sprint;
use App\Services\SprintService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SprintController extends Controller
{
    public function __construct(
        private readonly SprintService $sprints,
    ) {}

    public function index(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        return SprintResource::collection($this->sprints->list($project))->response();
    }

    public function store(StoreSprintRequest $request, Project $project): JsonResponse
    {
        $sprint = $this->sprints->create($project, $request->validated());

        return SprintResource::make($sprint)->response()->setStatusCode(201);
    }

    public function show(Sprint $sprint): JsonResponse
    {
        Gate::authorize('view', $sprint);

        $sprint->load(['tasks.assignee']);

        return SprintResource::make($sprint)->response();
    }

    public function update(UpdateSprintRequest $request, Sprint $sprint): JsonResponse
    {
        $sprint = $this->sprints->update($sprint, $request->validated());

        return SprintResource::make($sprint)->response();
    }

    public function destroy(Sprint $sprint): JsonResponse
    {
        Gate::authorize('delete', $sprint);

        $this->sprints->delete($sprint);

        return response()->json(['message' => 'Sprint deleted.']);
    }

    public function start(Sprint $sprint): JsonResponse
    {
        Gate::authorize('update', $sprint);

        return SprintResource::make($this->sprints->start($sprint))->response();
    }

    public function complete(Sprint $sprint): JsonResponse
    {
        Gate::authorize('update', $sprint);

        return SprintResource::make($this->sprints->complete($sprint))->response();
    }
}

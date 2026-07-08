<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProjectRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\InviteMemberRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateMemberRoleRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectMemberResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectService $projects,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $projects = $request->user()
            ->projects()
            ->withCount(['members', 'tasks'])
            ->orderBy('name')
            ->get();

        return ProjectResource::collection($projects)->response();
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $this->projects->create($request->user(), $request->validated());

        return ProjectResource::make($project)->response()->setStatusCode(201);
    }

    public function show(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $project->load(['owner', 'boards.columns', 'projectMembers.user'])
            ->loadCount(['members', 'tasks']);

        return ProjectResource::make($project)->response();
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project = $this->projects->update($project, $request->validated());

        return ProjectResource::make($project)->response();
    }

    public function destroy(Project $project): JsonResponse
    {
        Gate::authorize('delete', $project);

        $this->projects->delete($project);

        return response()->json(['message' => 'Project deleted.']);
    }

    public function members(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $members = $project->projectMembers()->with('user')->get();

        return ProjectMemberResource::collection($members)->response();
    }

    public function inviteMember(InviteMemberRequest $request, Project $project): JsonResponse
    {
        $member = $this->projects->inviteMember(
            $project,
            $request->validated('email'),
            ProjectRole::from($request->validated('role')),
        );

        return ProjectMemberResource::make($member->load('user'))->response()->setStatusCode(201);
    }

    public function updateMemberRole(UpdateMemberRoleRequest $request, Project $project, ProjectMember $member): JsonResponse
    {
        $member = $this->projects->updateMemberRole(
            $project,
            $member,
            ProjectRole::from($request->validated('role')),
        );

        return ProjectMemberResource::make($member->load('user'))->response();
    }

    public function removeMember(Project $project, ProjectMember $member): JsonResponse
    {
        Gate::authorize('manageMembers', $project);

        $this->projects->removeMember($project, $member);

        return response()->json(['message' => 'Member removed.']);
    }
}

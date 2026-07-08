<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Http\Resources\UserResource;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(
        private readonly SearchService $search,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:1']);

        $results = $this->search->search($request->user(), $request->string('q')->toString());

        return response()->json([
            'tasks' => TaskResource::collection($results['tasks']),
            'projects' => ProjectResource::collection($results['projects']),
            'users' => UserResource::collection($results['users']),
        ]);
    }
}

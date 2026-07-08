<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Poker\AcceptEstimateRequest;
use App\Http\Requests\Poker\VoteRequest;
use App\Http\Resources\PokerSessionResource;
use App\Models\PokerSession;
use App\Models\Task;
use App\Services\PokerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PokerController extends Controller
{
    public function __construct(
        private readonly PokerService $poker,
    ) {}

    public function store(Task $task, Request $request): JsonResponse
    {
        if (! $request->user()->can('create', [PokerSession::class, $task])) {
            abort(403);
        }

        $pokerSession = $this->poker->start($task, $request->user());

        return PokerSessionResource::make($pokerSession)->response()->setStatusCode(201);
    }

    public function show(PokerSession $pokerSession): JsonResponse
    {
        Gate::authorize('view', $pokerSession);

        $pokerSession->load(['creator', 'votes.user']);

        return PokerSessionResource::make($pokerSession)->response();
    }

    public function active(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $pokerSession = $this->poker->activeForTask($task);

        if (! $pokerSession) {
            return response()->json(['data' => null]);
        }

        $pokerSession->load(['creator', 'votes.user']);

        return PokerSessionResource::make($pokerSession)->response();
    }

    public function vote(VoteRequest $request, PokerSession $pokerSession): JsonResponse
    {
        $pokerSession = $this->poker->vote($pokerSession, $request->user(), $request->validated('value'));

        return PokerSessionResource::make($pokerSession)->response();
    }

    public function reveal(PokerSession $pokerSession): JsonResponse
    {
        Gate::authorize('manage', $pokerSession);

        $pokerSession = $this->poker->reveal($pokerSession);

        return PokerSessionResource::make($pokerSession)->response();
    }

    public function accept(AcceptEstimateRequest $request, PokerSession $pokerSession): JsonResponse
    {
        $pokerSession = $this->poker->accept($pokerSession, $request->validated('story_points'), $request->user());

        return PokerSessionResource::make($pokerSession)->response();
    }
}

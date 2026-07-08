<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Requests\Comment\UpdateCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Task;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function __construct(
        private readonly CommentService $comments,
    ) {}

    public function index(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $comments = $task->comments()->with('user')->latest()->get();

        return CommentResource::collection($comments)->response();
    }

    public function store(StoreCommentRequest $request, Task $task): JsonResponse
    {
        $comment = $this->comments->create($task, $request->validated(), $request->user());

        return CommentResource::make($comment)->response()->setStatusCode(201);
    }

    public function update(UpdateCommentRequest $request, Comment $comment): JsonResponse
    {
        $comment = $this->comments->update($comment, $request->validated());

        return CommentResource::make($comment)->response();
    }

    public function destroy(Comment $comment): JsonResponse
    {
        Gate::authorize('delete', $comment);

        $this->comments->delete($comment);

        return response()->json(['message' => 'Comment deleted.']);
    }
}

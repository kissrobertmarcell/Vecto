<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Board\ReorderColumnsRequest;
use App\Http\Requests\Board\StoreColumnRequest;
use App\Http\Requests\Board\UpdateBoardRequest;
use App\Http\Requests\Board\UpdateColumnRequest;
use App\Http\Resources\BoardColumnResource;
use App\Http\Resources\BoardResource;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Services\BoardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class BoardController extends Controller
{
    public function __construct(
        private readonly BoardService $boards,
    ) {}

    public function show(Board $board): JsonResponse
    {
        Gate::authorize('view', $board);

        $board->load(['columns.tasks.assignee', 'columns.tasks.sprint']);

        return BoardResource::make($board)->response();
    }

    public function update(UpdateBoardRequest $request, Board $board): JsonResponse
    {
        $board = $this->boards->update($board, $request->validated());

        return BoardResource::make($board)->response();
    }

    public function storeColumn(StoreColumnRequest $request, Board $board): JsonResponse
    {
        $column = $this->boards->createColumn($board, $request->validated());

        return BoardColumnResource::make($column)->response()->setStatusCode(201);
    }

    public function updateColumn(UpdateColumnRequest $request, BoardColumn $column): JsonResponse
    {
        $column = $this->boards->updateColumn($column, $request->validated());

        return BoardColumnResource::make($column)->response();
    }

    public function destroyColumn(BoardColumn $column): JsonResponse
    {
        Gate::authorize('update', $column->board);

        $this->boards->deleteColumn($column);

        return response()->json(['message' => 'Column deleted.']);
    }

    public function reorderColumns(ReorderColumnsRequest $request, Board $board): JsonResponse
    {
        $this->boards->reorderColumns($board, $request->validated('column_ids'));

        return BoardResource::make($board->fresh(['columns']))->response();
    }
}

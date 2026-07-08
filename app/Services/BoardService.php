<?php

namespace App\Services;

use App\Models\Board;
use App\Models\BoardColumn;
use Illuminate\Support\Facades\DB;

class BoardService
{
    public function update(Board $board, array $data): Board
    {
        $board->update(array_filter([
            'name' => $data['name'] ?? null,
        ], fn ($value) => $value !== null));

        return $board->fresh();
    }

    /**
     * @param  array{name: string}  $data
     */
    public function createColumn(Board $board, array $data): BoardColumn
    {
        $position = (int) $board->columns()->max('position') + 1;

        return $board->columns()->create([
            'name' => $data['name'],
            'position' => $position,
            'is_done_column' => false,
        ]);
    }

    /**
     * @param  array{name?: string}  $data
     */
    public function updateColumn(BoardColumn $column, array $data): BoardColumn
    {
        $column->update(array_filter([
            'name' => $data['name'] ?? null,
        ], fn ($value) => $value !== null));

        return $column->fresh();
    }

    public function deleteColumn(BoardColumn $column): void
    {
        $column->delete();
    }

    /**
     * @param  list<int>  $orderedColumnIds
     */
    public function reorderColumns(Board $board, array $orderedColumnIds): void
    {
        DB::transaction(function () use ($board, $orderedColumnIds) {
            foreach ($orderedColumnIds as $position => $columnId) {
                $board->columns()->whereKey($columnId)->update(['position' => $position]);
            }
        });
    }
}

<?php

namespace App\Events;

use App\Models\BoardColumn;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskMoved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Task $task,
        public User $causer,
        public BoardColumn $from,
        public BoardColumn $to,
    ) {}
}

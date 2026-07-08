<?php

namespace App\Events;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  list<string>  $changedFields
     */
    public function __construct(
        public Task $task,
        public User $causer,
        public array $changedFields,
    ) {}
}

<?php

namespace Database\Factories;

use App\Enums\PokerSessionStatus;
use App\Models\PokerSession;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PokerSession>
 */
class PokerSessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'created_by' => User::factory(),
            'status' => PokerSessionStatus::Voting,
        ];
    }
}

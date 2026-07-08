<?php

namespace Database\Factories;

use App\Enums\PokerVoteValue;
use App\Models\PokerSession;
use App\Models\PokerVote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PokerVote>
 */
class PokerVoteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'poker_session_id' => PokerSession::factory(),
            'user_id' => User::factory(),
            'value' => fake()->randomElement(PokerVoteValue::values()),
        ];
    }
}

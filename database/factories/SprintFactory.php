<?php

namespace Database\Factories;

use App\Enums\SprintStatus;
use App\Models\Board;
use App\Models\Sprint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sprint>
 */
class SprintFactory extends Factory
{
    public function definition(): array
    {
        $board = Board::factory();

        return [
            'board_id' => $board,
            'project_id' => fn (array $attributes) => Board::find($attributes['board_id'])?->project_id
                ?? \App\Models\Project::factory(),
            'name' => 'Sprint '.fake()->numberBetween(1, 50),
            'goal' => fake()->optional()->sentence(10),
            'status' => SprintStatus::Planned,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addWeeks(2)->toDateString(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => SprintStatus::Active,
            'started_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => SprintStatus::Completed,
            'started_at' => now()->subWeeks(2),
            'completed_at' => now(),
        ]);
    }
}

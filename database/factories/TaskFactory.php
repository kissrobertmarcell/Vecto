<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'board_id' => Board::factory(),
            'column_id' => BoardColumn::factory(),
            'sprint_id' => null,
            'assignee_id' => null,
            'created_by' => User::factory(),
            'title' => fake()->sentence(6),
            'description' => fake()->optional()->paragraphs(2, true),
            'priority' => fake()->randomElement(TaskPriority::cases()),
            'story_points' => fake()->optional()->randomElement([1, 2, 3, 5, 8, 13]),
            'due_date' => fake()->optional()->dateTimeBetween('now', '+3 weeks'),
            'position' => 0,
        ];
    }
}

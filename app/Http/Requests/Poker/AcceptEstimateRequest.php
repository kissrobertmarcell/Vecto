<?php

namespace App\Http\Requests\Poker;

use Illuminate\Foundation\Http\FormRequest;

class AcceptEstimateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('pokerSession'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'story_points' => ['required', 'integer', 'min:0', 'max:1000'],
        ];
    }
}

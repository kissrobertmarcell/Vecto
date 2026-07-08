<?php

namespace App\Http\Requests\Poker;

use App\Enums\PokerVoteValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('vote', $this->route('pokerSession'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'value' => ['required', Rule::in(PokerVoteValue::values())],
        ];
    }
}

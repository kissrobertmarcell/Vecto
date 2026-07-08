<?php

namespace App\Http\Resources;

use App\Enums\PokerVoteValue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PokerSession
 */
class PokerSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isRevealed = $this->status->value !== 'voting';

        $numericVotes = $isRevealed
            ? $this->votes
                ->map(fn ($vote) => PokerVoteValue::tryFrom($vote->value)?->numericValue())
                ->filter(fn ($value) => $value !== null)
            : collect();

        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'status' => $this->status,
            'final_estimate' => $this->final_estimate,
            'average' => $numericVotes->isNotEmpty() ? round($numericVotes->avg(), 1) : null,
            'creator' => UserResource::make($this->whenLoaded('creator')),
            'votes' => PokerVoteResource::collection($this->whenLoaded('votes')),
            'revealed_at' => $this->revealed_at,
            'accepted_at' => $this->accepted_at,
            'created_at' => $this->created_at,
        ];
    }
}

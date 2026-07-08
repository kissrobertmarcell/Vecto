<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PokerVote
 */
class PokerVoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reveal = $this->resource->pokerSession->status->value !== 'voting';

        return [
            'id' => $this->id,
            'user' => UserResource::make($this->whenLoaded('user')),
            'value' => $reveal ? $this->value : null,
            'has_voted' => true,
        ];
    }
}

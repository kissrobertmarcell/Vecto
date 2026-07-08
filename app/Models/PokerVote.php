<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PokerVote extends Model
{
    /** @use HasFactory<\Database\Factories\PokerVoteFactory> */
    use HasFactory;

    protected $fillable = [
        'poker_session_id',
        'user_id',
        'value',
    ];

    public function pokerSession(): BelongsTo
    {
        return $this->belongsTo(PokerSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

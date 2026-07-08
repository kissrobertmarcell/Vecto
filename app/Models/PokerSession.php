<?php

namespace App\Models;

use App\Enums\PokerSessionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PokerSession extends Model
{
    /** @use HasFactory<\Database\Factories\PokerSessionFactory> */
    use HasFactory;

    protected $fillable = [
        'task_id',
        'created_by',
        'status',
        'final_estimate',
        'revealed_at',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PokerSessionStatus::class,
            'revealed_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PokerVote::class);
    }
}

<?php

namespace App\Events;

use App\Models\PokerSession;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PokerSessionStarted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public PokerSession $pokerSession,
        public User $causer,
    ) {}
}

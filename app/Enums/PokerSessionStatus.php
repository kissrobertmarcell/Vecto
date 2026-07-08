<?php

namespace App\Enums;

enum PokerSessionStatus: string
{
    case Voting = 'voting';
    case Revealed = 'revealed';
    case Accepted = 'accepted';
}

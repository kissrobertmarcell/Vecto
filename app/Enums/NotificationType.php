<?php

namespace App\Enums;

enum NotificationType: string
{
    case Assigned = 'assigned';
    case Comment = 'comment';
    case PokerStarted = 'poker_started';
}

<?php

namespace App\Enums;

enum ActivityType: string
{
    case Created = 'created';
    case Updated = 'updated';
    case Moved = 'moved';
    case Assigned = 'assigned';
    case Commented = 'commented';
    case Estimated = 'estimated';
    case Completed = 'completed';
}

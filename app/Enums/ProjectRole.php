<?php

namespace App\Enums;

enum ProjectRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Member = 'member';
    case Viewer = 'viewer';

    /**
     * Determine if this role can manage project members, boards, and sprints.
     */
    public function canManageProject(): bool
    {
        return match ($this) {
            self::Owner, self::Admin => true,
            default => false,
        };
    }

    /**
     * Determine if this role can create, edit, move, or comment on tasks.
     */
    public function canEditContent(): bool
    {
        return match ($this) {
            self::Owner, self::Admin, self::Member => true,
            default => false,
        };
    }

    /**
     * Determine if this role can remove the project itself.
     */
    public function isOwner(): bool
    {
        return $this === self::Owner;
    }
}

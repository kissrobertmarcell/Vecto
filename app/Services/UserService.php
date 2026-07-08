<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * @param  array{name?: string, email?: string, password?: string}  $data
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->update(array_filter([
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
        ], fn ($value) => $value !== null));

        if (! empty($data['password'])) {
            $user->update(['password' => Hash::make($data['password'])]);
        }

        return $user->fresh();
    }

    /**
     * @return Collection<int, User>
     */
    public function search(string $query, ?int $excludeProjectId = null): Collection
    {
        $search = mb_strtolower($query);

        return User::where(
            fn ($q) => $q->whereRaw('LOWER(name) LIKE ?', ['%'.$search.'%'])
                ->orWhereRaw('LOWER(email) LIKE ?', ['%'.$search.'%'])
        )
            ->limit(10)
            ->get();
    }
}

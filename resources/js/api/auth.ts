import { LoginInput, RegisterInput, User } from '../types/auth';

export async function fetchCurrentUser(): Promise<User | null> {
    const response = await fetch('/api/auth/me', {
        credentials: 'include',
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.data || null;
}

export async function login(input: LoginInput): Promise<User> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    return data.data;
}

export async function register(input: RegisterInput): Promise<User> {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    return data.data;
}

export async function logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Logout failed');
    }
}

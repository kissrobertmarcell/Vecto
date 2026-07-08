import { PokerSession } from '../types/board';

const xsrf = () =>
    decodeURIComponent(
        document.cookie
            .split('; ')
            .find((r) => r.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? '',
    );

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf(), ...(options.headers ?? {}) },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null as T;
    const data = await res.json();
    return data.data !== undefined ? data.data : data;
}

export async function startPokerSession(taskId: number): Promise<PokerSession> {
    return api<PokerSession>(`/api/tasks/${taskId}/poker-sessions`, { method: 'POST' });
}

export async function getActivePokerSession(taskId: number): Promise<PokerSession | null> {
    try {
        return await api<PokerSession>(`/api/tasks/${taskId}/poker-sessions/active`);
    } catch {
        return null;
    }
}

export async function getPokerSession(pokerSessionId: number): Promise<PokerSession> {
    return api<PokerSession>(`/api/poker-sessions/${pokerSessionId}`);
}

export async function votePokerSession(
    pokerSessionId: number,
    vote: string,
): Promise<PokerSession> {
    return api<PokerSession>(`/api/poker-sessions/${pokerSessionId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ value: vote }),
    });
}

export async function revealPokerSession(pokerSessionId: number): Promise<PokerSession> {
    return api<PokerSession>(`/api/poker-sessions/${pokerSessionId}/reveal`, {
        method: 'POST',
    });
}

export async function acceptPokerSession(
    pokerSessionId: number,
    storyPoints: number,
): Promise<PokerSession> {
    return api<PokerSession>(`/api/poker-sessions/${pokerSessionId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ story_points: storyPoints }),
    });
}

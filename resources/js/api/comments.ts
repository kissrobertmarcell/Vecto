import { Comment } from '../types/board';

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

export async function getComments(taskId: number): Promise<Comment[]> {
    return api<Comment[]>(`/api/tasks/${taskId}/comments`);
}

export async function createComment(taskId: number, content: string): Promise<Comment> {
    return api<Comment>(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
}

export async function deleteComment(commentId: number): Promise<void> {
    return api<void>(`/api/comments/${commentId}`, { method: 'DELETE' });
}

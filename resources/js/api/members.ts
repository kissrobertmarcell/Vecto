import { Member } from '../types/board';

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

export async function getMembers(projectId: number): Promise<Member[]> {
    return api<Member[]>(`/api/projects/${projectId}/members`);
}

export async function inviteMember(
    projectId: number,
    email: string,
    role: string,
): Promise<Member> {
    return api<Member>(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
    });
}

export async function updateMemberRole(
    projectId: number,
    memberId: number,
    role: string,
): Promise<Member> {
    return api<Member>(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
    });
}

export async function removeMember(projectId: number, memberId: number): Promise<void> {
    return api<void>(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
    });
}

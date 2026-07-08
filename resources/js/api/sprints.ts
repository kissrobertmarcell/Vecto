import { Sprint } from '../types/board';

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

export async function getSprints(projectId: number): Promise<Sprint[]> {
    return api<Sprint[]>(`/api/projects/${projectId}/sprints`);
}

export async function getSprint(sprintId: number): Promise<Sprint> {
    return api<Sprint>(`/api/sprints/${sprintId}`);
}

export async function createSprint(
    projectId: number,
    input: { name: string; goal?: string; starts_at?: string; ends_at?: string },
): Promise<Sprint> {
    return api<Sprint>(`/api/projects/${projectId}/sprints`, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function updateSprint(
    sprintId: number,
    input: { name?: string; goal?: string; starts_at?: string; ends_at?: string },
): Promise<Sprint> {
    return api<Sprint>(`/api/sprints/${sprintId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

export async function deleteSprint(sprintId: number): Promise<void> {
    return api<void>(`/api/sprints/${sprintId}`, { method: 'DELETE' });
}

export async function startSprint(sprintId: number): Promise<Sprint> {
    return api<Sprint>(`/api/sprints/${sprintId}/start`, { method: 'POST' });
}

export async function completeSprint(sprintId: number): Promise<Sprint> {
    return api<Sprint>(`/api/sprints/${sprintId}/complete`, { method: 'POST' });
}

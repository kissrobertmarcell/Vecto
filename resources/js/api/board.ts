import { Board, Column, Task } from '../types/board';
import { Project } from '../types/project';

const XSRF = () =>
    document.cookie
        .split('; ')
        .find((r) => r.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]
        ?.replace(/%3D/g, '=') ?? '';

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(XSRF()),
            ...(options.headers ?? {}),
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Request failed: ${response.status}`);
    }

    if (response.status === 204) return null as T;
    const data = await response.json();
    return data.data !== undefined ? data.data : data;
}

/** GET /api/projects/:projectId — returns the project with its boards */
export async function getProject(projectId: number): Promise<Project> {
    return api<Project>(`/api/projects/${projectId}`);
}

/** GET /api/boards/:boardId — returns board with columns + tasks */
export async function getBoard(boardId: number): Promise<Board> {
    return api<Board>(`/api/boards/${boardId}`);
}

/** GET /api/boards/:boardId (show) — columns with tasks eager-loaded */
export async function getBoardFull(boardId: number): Promise<Board> {
    return api<Board>(`/api/boards/${boardId}`);
}

export async function getBoardColumns(boardId: number): Promise<Column[]> {
    const board = await api<Board>(`/api/boards/${boardId}`);
    return board.columns ?? [];
}

export async function getColumnTasks(columnId: number): Promise<Task[]> {
    // tasks are nested inside the board column; we fetch by task index filter
    const response = await fetch(`/api/columns/${columnId}/tasks`, {
        credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    const data = await response.json();
    return data.data ?? [];
}

export async function createTask(
    projectId: number,
    input: {
        column_id?: number;
        title: string;
        description?: string;
        priority?: string;
        story_points?: number;
        due_date?: string;
        assignee_id?: number;
        sprint_id?: number;
    },
): Promise<Task> {
    return api<Task>(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function updateTask(taskId: number, input: Partial<Task>): Promise<Task> {
    return api<Task>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

export async function deleteTask(taskId: number): Promise<void> {
    return api<void>(`/api/tasks/${taskId}`, { method: 'DELETE' });
}

export async function getTask(taskId: number): Promise<Task> {
    return api<Task>(`/api/tasks/${taskId}`);
}

export async function moveTask(
    taskId: number,
    columnId: number,
    position: number,
): Promise<Task> {
    return api<Task>(`/api/tasks/${taskId}/move`, {
        method: 'POST',
        body: JSON.stringify({ column_id: columnId, position }),
    });
}

export async function assignTaskSprint(
    taskId: number,
    sprintId: number | null,
): Promise<Task> {
    return api<Task>(`/api/tasks/${taskId}/assign-sprint`, {
        method: 'POST',
        body: JSON.stringify({ sprint_id: sprintId }),
    });
}

export async function reorderBacklog(
    projectId: number,
    taskIds: number[],
): Promise<void> {
    return api<void>(`/api/projects/${projectId}/backlog/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ task_ids: taskIds }),
    });
}

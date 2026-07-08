import { Board, Column, Task } from '../types/board';

export async function getBoard(projectId: number): Promise<Board> {
    const response = await fetch(`/api/projects/${projectId}/boards`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch board');
    }

    const data = await response.json();
    return data.data;
}

export async function getBoardColumns(boardId: number): Promise<Column[]> {
    const response = await fetch(`/api/boards/${boardId}/columns`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch columns');
    }

    const data = await response.json();
    return data.data || [];
}

export async function getColumnTasks(columnId: number): Promise<Task[]> {
    const response = await fetch(`/api/columns/${columnId}/tasks`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch tasks');
    }

    const data = await response.json();
    return data.data || [];
}

export async function createTask(input: { column_id: number; project_id: number; title: string; description?: string }): Promise<Task> {
    const response = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create task');
    }

    const data = await response.json();
    return data.data;
}

export async function updateTask(taskId: number, input: Partial<Task>): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
    }

    const data = await response.json();
    return data.data;
}

export async function moveTask(taskId: number, columnId: number): Promise<Task> {
    return updateTask(taskId, { column_id: columnId });
}

import { Project } from '../types/project';

export async function getProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects', {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    return data.data || [];
}

export async function createProject(input: { name: string; description?: string }): Promise<Project> {
    const response = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
    }

    const data = await response.json();
    return data.data;
}

export interface Board {
    id: number;
    project_id: number;
    name: string;
    description?: string;
}

export interface Column {
    id: number;
    board_id: number;
    name: string;
    order: number;
}

export interface Task {
    id: number;
    project_id: number;
    column_id: number;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    story_points?: number;
    due_date?: string;
    assignee_id?: number;
    created_at: string;
    updated_at: string;
}

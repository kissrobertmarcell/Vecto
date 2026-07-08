export interface Sprint {
    id: number;
    board_id: number;
    project_id: number;
    name: string;
    goal?: string;
    status: 'planned' | 'active' | 'completed';
    starts_at?: string;
    ends_at?: string;
    started_at?: string;
    completed_at?: string;
    tasks_count?: number;
    story_points_total?: number;
    tasks?: Task[];
}

export interface Board {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    columns?: Column[];
}

export interface Column {
    id: number;
    board_id: number;
    name: string;
    position: number;
    is_done_column?: boolean;
    tasks?: Task[];
}

export interface Task {
    id: number;
    project_id: number;
    board_id?: number;
    column_id: number;
    sprint_id?: number | null;
    assignee_id?: number | null;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    story_points?: number | null;
    due_date?: string | null;
    position?: number;
    created_at: string;
    updated_at: string;
    assignee?: Member['user'];
    sprint?: Sprint;
}

export interface Member {
    id: number;
    project_id: number;
    user_id: number;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    joined_at?: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar_url?: string;
    };
}

export interface Comment {
    id: number;
    task_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export interface PokerVote {
    id: number;
    user: {
        id: number;
        name: string;
    };
    value: string | null;
    has_voted: boolean;
}

export interface PokerSession {
    id: number;
    task_id: number;
    status: 'voting' | 'revealed' | 'accepted';
    final_estimate?: number | null;
    average?: number | null;
    votes: PokerVote[];
    revealed_at?: string | null;
    accepted_at?: string | null;
    created_at: string;
    creator?: {
        id: number;
        name: string;
    };
}

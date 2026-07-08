export interface Project {
    id: number;
    name: string;
    slug?: string;
    description?: string;
    key?: string;
    my_role?: 'owner' | 'admin' | 'member' | 'viewer';
    members_count?: number;
    tasks_count?: number;
    boards?: { id: number; name: string }[];
    created_at: string;
    updated_at?: string;
}

import { Task } from '../types/board';
import { Project } from '../types/project';

export interface SearchResults {
    projects: Project[];
    tasks: Task[];
}

const xsrf = () =>
    decodeURIComponent(
        document.cookie
            .split('; ')
            .find((r) => r.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? '',
    );

export async function globalSearch(query: string): Promise<SearchResults> {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
        credentials: 'include',
        headers: { 'X-XSRF-TOKEN': xsrf() },
    });
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return {
        projects: data.data?.projects ?? [],
        tasks: data.data?.tasks ?? [],
    };
}

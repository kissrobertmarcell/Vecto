export interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

import {Department} from "@/types/departments.ts";

export interface IUser {
    id: string;
    username: string;
    name: string;
    role: string;
    active: boolean;
    department: Department | null;
}

export interface CreateUserPayload {
    username: string;
    password: string;
    name: string;
    role: string;
    department_id?: string;
}


export interface UserQuery {
    username?: string;
    department_id?: string;
    role?: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | null | undefined;
    active?: boolean;
    page?: number;
    size?: number;
}

export interface UpdateUserPayload {
    username: string;
    name: string;
    password: string | undefined;
    role: string;
    department_id: string;
    active: boolean;
}

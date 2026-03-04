export interface Department {
    id?: string;
    name?: string;
    active?: boolean;
    additional_fields?: Record<string, { type: string }>;
}


export interface DepartmentQuery {
    name?: string;
    active?: boolean;
    page?: number;
    size?: number;
}
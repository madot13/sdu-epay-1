import { FieldLabel } from "./additionalFields";

export interface Department {
    id?: string;
    name?: string;
    active?: boolean;
    additional_fields?: Record<string, { type: string; value?: any; label: FieldLabel; required?: boolean }>;
}


export interface DepartmentQuery {
    name?: string;
    active?: boolean;
    page?: number;
    size?: number;
}
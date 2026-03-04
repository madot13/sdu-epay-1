import {api, publicApi} from "@/api/api";
import {Department, DepartmentQuery} from "@/types/departments.ts";

export const getDepartments = async (query?: DepartmentQuery) => {
    const queryString = query
    ? '?' + new URLSearchParams(
        Object.entries(query).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
                acc[key] = String(value);
            }
            return acc;
        }, {} as Record<string, string>)
    ).toString()
        : '';

    const {data} = await api.get(`/departments${queryString}`);
    return data;
}

export const getDepartmentById = async (id:string) => {
    const {data} = await api.get(`/departments/${id}`);

    return data;
}

export const getPublicDepartments = async () => {
    const {data} = await publicApi.get('/departments/public');

    return data;
}

export const addDepartment = async (department: Department) => {
    const {data} = await api.post('/departments', department);
    return data;
}

export const updateDepartment = async (id: string, department: Department) => {
    const {data} = await api.put(`/departments/${id}`, department);

    return data;
}

export const deleteDepartment = async (id: string) => {
    const {data} = await api.delete(`/departments/${id}`);
    return data;
}
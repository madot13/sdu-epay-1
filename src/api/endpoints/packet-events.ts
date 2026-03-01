import { api } from "@/api/api";
import { IEventRecord, CreateEventPayload } from "@/types/packetevents";

export const packetEventsApi = {
    getAll: async (params?: any) => {
    const response = await api.get<IEventRecord[]>('/event-payment-types', { params });
    return response.data;},
    create: (data: CreateEventPayload) => api.post('/event-payment-types', data),
    delete: (id: string) => api.delete(`/event-payment-types/${id}`),
    update: async (id: string, data: Partial<IEventRecord>) => {
        const response = await api.put(`/event-payment-types/${id}`, data);
        return response.data;
    },
};
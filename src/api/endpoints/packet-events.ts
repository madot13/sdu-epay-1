import { api } from "../api";
import { IEventRecord, CreateEventPayload } from "../../types/packetevents";

export const packetEventsApi = {
    getAll: async (params?: any) => {
    const response = await api.get<IEventRecord[]>('/packet-events', { params });
    return response.data;},
    create: (data: CreateEventPayload) => api.post('/packet-events', data),
    delete: (id: string) => api.delete(`/packet-events/${id}`),
    update: async (id: string, data: Partial<IEventRecord>) => {
        const response = await api.put(`/packet-events/${id}`, data);
        return response.data;
    },
};
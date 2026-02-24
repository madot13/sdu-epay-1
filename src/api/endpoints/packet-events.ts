import { api } from "../api";
import { IEventRecord, CreateEventPayload } from "../../types/packetevents";

export const packetEventsApi = {
    getAll: () => api.get<IEventRecord[]>('/packet-events').then(res => res.data),
    create: (data: CreateEventPayload) => api.post('/packet-events', data),
    delete: (id: string) => api.delete(`/packet-events/${id}`)
};
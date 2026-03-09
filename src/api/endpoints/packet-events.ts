import { api, publicApi } from "@/api/api";
import { IEventRecord, CreateEventPayload } from "@/types/packetevents";

export const packetEventsApi = {
    getAll: async (params?: any) => {
        // Убираем null/undefined параметры чтобы не мешали запросу
        const cleanParams: any = {};
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    cleanParams[key] = value;
                }
            });
        }

        const response = await api.get<IEventRecord[]>('event-payment-types', { params: cleanParams });
        return response.data;
    },

    create: (data: CreateEventPayload) => api.post('event-payment-types', data),

    delete: (id: string) => api.delete(`event-payment-types/${id}`),

    update: async (id: string, data: Partial<IEventRecord>) => {
        const response = await api.patch(`event-payment-types/${id}`, data);
        return response.data;
    },

    clearMainFlag: async (eventId: string, excludeId: string) => {
        try {
            const allTypesResponse = await publicApi.get<IEventRecord[]>(`event-payment-types?event_id=${eventId}`);

            let types: IEventRecord[] = [];
            if (Array.isArray(allTypesResponse)) {
                types = allTypesResponse;
            } else if (allTypesResponse && Array.isArray((allTypesResponse as any).data)) {
                types = (allTypesResponse as any).data;
            } else if (allTypesResponse && (allTypesResponse as any).data && Array.isArray((allTypesResponse as any).data.data)) {
                types = (allTypesResponse as any).data.data;
            }

            const updatePromises = types
                .filter(type => type.id !== excludeId && type.is_main === true)
                .map(type => api.patch(`event-payment-types/${type.id}`, { is_main: false }));

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error clearing main flag:', error);
            throw error;
        }
    },
};
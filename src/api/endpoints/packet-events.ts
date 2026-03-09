import { api, publicApi } from "@/api/api";
import { IEventRecord, CreateEventPayload } from "@/types/packetevents";

export const packetEventsApi = {
    getAll: async (params?: any) => {
        console.log("🔍 API Call packetEventsApi.getAll with params:", params);
        
        // Если active === null или undefined, удаляем его из параметров
        const cleanParams = { ...params };
        if (cleanParams.active === null || cleanParams.active === undefined) {
            delete cleanParams.active;
        }
        
        console.log("🔍 Cleaned params:", cleanParams);
        const response = await api.get<IEventRecord[]>('event-payment-types', { params: cleanParams });
        console.log("🔍 API Response:", response.data);
        return response.data;
    },
    create: (data: CreateEventPayload) => api.post('event-payment-types', data),
    delete: (id: string) => api.delete(`event-payment-types/${id}`),
    update: async (id: string, data: Partial<IEventRecord>) => {
        const response = await api.patch(`event-payment-types/${id}`, data);
        return response.data;
    },
    // Функция для снятия флага main с других типов оплаты события
    clearMainFlag: async (eventId: string, excludeId: string) => {
        try {
            // Получаем все типы оплаты для события
            const allTypesResponse = await publicApi.get<IEventRecord[]>(`event-payment-types?event_id=${eventId}`);
            console.log("🔍 All types response for clearMainFlag:", allTypesResponse);
            
            // Проверяем структуру ответа
            let types: IEventRecord[] = [];
            if (Array.isArray(allTypesResponse)) {
                types = allTypesResponse;
            } else if (allTypesResponse && Array.isArray((allTypesResponse as any).data)) {
                types = (allTypesResponse as any).data;
            } else if (allTypesResponse && (allTypesResponse as any).data && Array.isArray((allTypesResponse as any).data.data)) {
                types = (allTypesResponse as any).data.data;
            }
            
            console.log("🔍 Processed types for clearMainFlag:", types);
            
            // Снимаем флаг main со всех типов, кроме исключаемого
            const updatePromises = types
                .filter(type => type.id !== excludeId && type.is_main === true)
                .map(type => api.patch(`event-payment-types/${type.id}`, { is_main: false }));
            
            await Promise.all(updatePromises);
            console.log(`Cleared main flag from ${updatePromises.length} payment types for event ${eventId}`);
        } catch (error) {
            console.error('Error clearing main flag:', error);
            throw error;
        }
    },
};
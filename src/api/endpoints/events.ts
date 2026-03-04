import {api, publicApi} from "@/api/api.ts";
import {EventQuery, IEvent, UpdateEventPayload} from "@/types/events.ts";

export const getEvents = async (query?: EventQuery) => {
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

    const {data} = await api.get(`/events${queryString}`);
    return data;
}

export const addEvent = async (event: IEvent): Promise<IEvent> => {
    const {data} = await api.post('/events', event);
    return data;
}




export const getEventById = async (id: string) => {
    const { data } = await api.get(`/events/${id}`);
    return data;
}

export const getPublicEventsById = async (id: string): Promise<IEvent[]> => {
    const { data } = await publicApi.get(`/events/public?department_id=${id}`);

    return data;
}

export const updateEvent = async (id: string, payload: UpdateEventPayload): Promise<IEvent> => {
    const {data} = await api.patch(`/events/${id}`, payload);
    return data;
}

export const deleteEvent = async (id: string)=> {
    const {data} = await api.delete(`/events/${id}`);
    return data;
}
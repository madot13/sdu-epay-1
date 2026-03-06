import {create} from "zustand/react";
import {CreateEventPayload, EventQuery, IEvent, UpdateEventPayload} from "@/types/events.ts";
import {addEvent, deleteEvent, getEvents, updateEvent} from "@/api/endpoints/events.ts";

interface EventsState {
    events: IEvent[];
    total: number;
    page: number;
    size: number;
    loading: boolean;
    error: string | null;
    fetchEvents: (query?:EventQuery) => Promise<void>;
    addEvent: (event: CreateEventPayload) => Promise<void>;
    updateEvent: (id: string, payload: UpdateEventPayload) => Promise<IEvent>;
    deleteEvent: (id: string) => Promise<void>;
}


export const useEventsStore = create<EventsState>((set) => ({
    events: [],
    total: 0,
    page: 1,
    size: 10,
    loading: false,
    error: null,

    fetchEvents: async (query?: EventQuery) => {
        set({loading: true, error: null});

        try{
            const events = await getEvents(query);
            set({
                events: events.data,
                total: events.total,
                page: query?.page ?? 0,
                size: query?.size ?? 10,
                loading:false,
            });
        }catch (err){
            const message = err instanceof Error ? err.message : String(err);
            set({ error: message, loading: false });
            throw err;
        }
    },

    addEvent: async (event) => {
        set({loading:true, error: null});

        try{
            await addEvent(event);
        }catch (err){
            const message = err instanceof Error ? err.message : String(err);
            set({ error: message, loading: false });
            throw err;
        }
    },
    updateEvent: async (id, payload) => {
        set({loading:true, error: null});
        try{
            const response = await updateEvent(id, payload);
            return response;
        }catch (err){
            const message = err instanceof Error ? err.message : String(err);
            set({ error: message, loading: false });
            throw err;
        }
    },
    deleteEvent: async (id: string) => {
        set({loading:true, error: null});
        try{
            await deleteEvent(id);
            set({loading: false});
        }catch (err){
            const message = err instanceof Error ? err.message : String(err);
            set({ error: message, loading: false });
            throw err;
        }
    }
}));
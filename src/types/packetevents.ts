export interface IEventRecord {
    id?: string;
    event_name: string;
    event_id?: string;
    department: string;
    email: string;
    category: string;
    price: number;
    price_usd: number;
    active?: boolean;
}

export type CreateEventPayload = Omit<IEventRecord, 'id'>;

export interface UpdateEventPayload extends IEventRecord {
    id: string;
}
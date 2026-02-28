export interface IEventRecord {
    id?: string;
    event_name: string;
    event_id?: string;
    department: string;
    email: string;
    period_from: string;
    period_to: string;
    payment_category: string;
    amount_kzt: number;
    amount_usd: number;
}

export type CreateEventPayload = Omit<IEventRecord, 'id'>;

export interface UpdateEventPayload extends IEventRecord {
    id: string;
}
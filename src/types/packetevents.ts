export interface CustomField {
    id: string;
    name: string;
    value: string;
    type: 'text' | 'number' | 'email';
}

export interface IEventRecord {
    id?: string;
    event_name?: string;
    title?: string; // API может возвращать title вместо event_name
    event_id?: string;
    department?: string;
    department_name?: string; // API может возвращать department_name
    department_id?: string;
    email: string;
    category?: string;
    price?: number;
    price_usd?: number;
    active?: boolean;
    event_active?: boolean; // API может возвращать event_active
    period_from?: string;
    period_till?: string; // API может возвращать period_till
    without_period?: boolean;
    custom_fields?: CustomField[]; // Дополнительные поля
}

export type CreateEventPayload = Omit<IEventRecord, 'id'>;

export interface UpdateEventPayload extends IEventRecord {
    id: string;
}
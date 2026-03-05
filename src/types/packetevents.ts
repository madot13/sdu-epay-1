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
    priced?: boolean;
    active?: boolean;
    event_active?: boolean; // API может возвращать event_active
    is_main?: boolean; // Главный тип оплаты для события (соответствует бэкенду)
    period_from?: string;
    period_till?: string; // API может возвращать period_till
    without_period?: boolean;
    additional_fields?: Record<string, any>; // ← Добавляем дополнительные поля
}

export type CreateEventPayload = Omit<IEventRecord, 'id'>;

export interface UpdateEventPayload extends IEventRecord {
    id: string;
}
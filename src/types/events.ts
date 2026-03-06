export interface IEvent {
    title?: string;
    id?: string
    manager_email?: string;
    priced?: boolean;
    price?: number;
    price_usd?: number;
    without_period?: boolean;
    period_from?: string,
    period_till?: string,
    department_id?: string;
    active?: boolean;
    additional_fields?: Record<string, any>;
}

export type CreateEventPayload = IEvent & {
    priced: boolean; // Обязательно указываем priced при создании
};

export type EventQuery = {
    title?: string | null;
    page?: number;
    size?: number;
    department_id?: string | null;
    period_from?: string | null;
    period_to?: string | null;
    active?: boolean;
};

export interface UpdateEventPayload {
    title: string;
    manager_email: string;
    priced: boolean;
    without_period: boolean;
    period_from?: string | null;
    period_till?: string | null;
    department_id: string;
    additional_fields?: Record<string, any>;
}

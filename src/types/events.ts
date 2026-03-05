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
    additional_fields?: Record<string, any>;
}

export type EventQuery = {
    title?: string | null;
    page?: number;
    size?: number;
    department_id?: string | null;
    period_from?: string | null;
    period_to?: string | null;
};


export type CreateEventPayload = IEvent

export interface UpdateEventPayload {
    title: string;
    manager_email: string;
    without_period: boolean;
    period_from?: string | null;
    period_till?: string | null;
    department_id: string;
    additional_fields?: Record<string, any>;
}

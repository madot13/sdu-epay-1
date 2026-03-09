export interface Order {
    id: number;
    fullname: string;
    email: string;
    cellphone: string;
    additional: string;
    additional_fields: Record<string, any>;
    type: "KASPI" | "EPAY";
    status: "PENDING" | "SUCCESS" | "FAILURE";
    amount: number;
    final_amount: number;
    currency?: "KZT" | "USD";
    department_id?: string;
    event_id?: string;
    promo_code_id?: string;
    created_at: string;
    updated_at?: string;
}

export interface OrderDetails {
    id: number;
    fullname: string;
    email: string;
    cellphone: string;
    additional: string;
    additional_fields: Record<string, any>;
    type: "KASPI" | "EPAY";
    status: "PENDING" | "SUCCESS" | "FAILURE";
    amount: number;
    final_amount: number;
    currency?: "KZT" | "USD";
    event_payment_type_id: string | null;
    created_at: string;
    department: {
        name: string;
        additional_fields: Record<string, any>;
        id: string;
        type: "EVENT_BASED" | "SELF_PAY";
    } | null;
    event: {
        title: string;
        manager_email: string;
        priced: boolean;
        price: number;
        price_usd?: number;
        without_period: boolean;
        period_from: string;
        period_till: string;
        id: string;
        event_payment_type_id: string | null;
    } | null;
    promo_code: {
        id: string;
        code: string;
        discount: number;
    } | null;
}

export interface OrdersResponse {
    total: number;
    page: number;
    size: number;
    data: Order[];
}

export interface OrderQuery {
    id?: number | null;
    type?: "KASPI" | "EPAY" | null;
    status?: "PENDING" | "SUCCESS" | "FAILURE" | null;
    department?: string | null;
    event?: string | null;
    promo_code?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    page?: number;
    size?: number;
}

export interface PaymentResponseKaspi {
    redirect_url: string;
    order: Order;
    terminal_id?: string;
    auth?: any;
}

export interface IOrder {
    event_id?: string;
    promo_code?: string | null;
    fullname?: string;
    email?: string;
    cellphone?: string;
    additional?: string;
    additional_fields?: Record<string, any> | null;
    amount?: number;
    currency?: "KZT" | "USD";
    event_payment_type_id?: string;
}

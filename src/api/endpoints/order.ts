import {publicApi} from "@/api/api.ts";
import { PaymentResponseKaspi} from "@/types/orders.ts";

export const orderKaspi = async (order: Omit<{
    fullname: string;
    email: string;
    cellphone: string;
    promo_code: string | null;
    department_id: string;
    event_id: string | null;
    event_payment_type_id?: string | null;
    additional: string;
    paymentMethod: string;
    amount?: number | null;
    currency?: "KZT" | "USD";
    additional_fields: Record<string, string | boolean>
}, "paymentMethod" | "department_id">): Promise<PaymentResponseKaspi> => {
    const {data} = await publicApi.post("/orders/public/kaspi", order);

    return data;
}

export const orderHalyk = async (order: Omit<{
    fullname: string;
    email: string;
    cellphone: string;
    promo_code: string | null;
    department_id: string;
    event_id: string | null;
    event_payment_type_id?: string | null;
    additional: string;
    paymentMethod: string;
    amount?: number | null;
    currency?: "KZT" | "USD";
    additional_fields: Record<string, string | boolean>
}, "paymentMethod" | "department_id">): Promise<PaymentResponseKaspi> => {
    const {data} = await publicApi.post("/orders/public/epay", order);

    return data;
}

export const orderSelfKaspi = async (order: Omit<{
    fullname: string;
    email: string;
    cellphone: string;
    promo_code: string | null;
    department_id: string;
    event_id: string | null;
    additional: string;
    paymentMethod: string;
    amount: number | null;
    currency?: "KZT" | "USD";
    additional_fields: Record<string, string | boolean>
}, "paymentMethod" | "promo_code" | "event_id">): Promise<PaymentResponseKaspi> => {
    const {data} = await publicApi.post("/orders/public/kaspi/self-pay", order);

    return data;
}

export const orderSelfHalyk = async (order: Omit<{
    fullname: string;
    email: string;
    cellphone: string;
    promo_code: string | null;
    department_id: string;
    event_id: string | null;
    additional: string;
    paymentMethod: string;
    amount: number | null;
    currency?: "KZT" | "USD";
    additional_fields: Record<string, string | boolean>
}, "paymentMethod" | "promo_code" | "event_id">): Promise<PaymentResponseKaspi> => {
    const {data} = await publicApi.post("/orders/public/epay/self-pay", order);

    return data;
}

export const orderKaspiCustomPrice = async (order: {
    event_id: string;
    event_payment_type_id?: string | null;
    fullname: string;
    email: string;
    cellphone: string;
    additional: string;
    additional_fields: Record<string, string | boolean>;
    amount: number;
    currency?: "KZT" | "USD";
}): Promise<PaymentResponseKaspi> => {
    const {data} = await publicApi.post("/orders/public/kaspi/event-custom-price", order);

    return data;
}

export const orderHalykCustomPrice = async (order: {
    event_id: string;
    event_payment_type_id?: string | null;
    fullname: string;
    email: string;
    cellphone: string;
    additional: string;
    additional_fields: Record<string, string | boolean>;
    amount: number;
    currency?: "KZT" | "USD";
}): Promise<PaymentResponseKaspi> => {
    const {data} = await publicApi.post("/orders/public/epay/event-custom-price", order);

    return data;
}
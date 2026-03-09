import {
    CreatePromocodePayload,
    PromocodeQuery, UpdatePromocodePayload, VerifyPromocodePayload,
    VerifyPromocodeResponse
} from "@/types/promocodes.ts";
import {api} from "@/api/api.ts";

export const getPromocodes = async (query?:PromocodeQuery) => {
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

    const {data} = await api.get(`/promo-codes${queryString}`);
    return data;
};

export const addPromocode = async (promocode: CreatePromocodePayload) => {
    const {data} = await api.post('/promo-codes', promocode);
    return data;
}

export const verifyPromocode = async (payload: VerifyPromocodePayload): Promise<VerifyPromocodeResponse> => {
    const {data} = await api.post('/promo-codes/public/verify', payload);

    return data;
}

export const updatePromocode = async (id: string, payload: UpdatePromocodePayload) => {
    const {data} = await api.patch(`/promo-codes/${id}`, payload);

    return data;
}

export const getPromocodeById = async (id: string) => {
    const {data} = await api.get(`/promo-codes/${id}`);
    return data;
}

export const deletePromoCode = async (id: string) => {
    const {data} = await api.delete(`/promo-codes/${id}`);
    return data;
}
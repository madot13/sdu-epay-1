import {
    CreatePromocodePayload,
    PromocodeQuery, UpdatePromocodePayload, VerifyPromocodePayload,
    VerifyPromocodeResponse
} from "@/types/promocodes.ts";
import {api, publicApi} from "@/api/api.ts";

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
    try {
        // Try public API first (for guests)
        const {data} = await publicApi.post('/promo-codes/public/verify', payload);
        return data;
    } catch (error: any) {
        // If public API fails (because backend requires auth), try with authenticated API
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log("🔍 Public API requires auth, falling back to authenticated API");
            try {
                const {data} = await api.post('/promo-codes/public/verify', payload);
                return data;
            } catch (authError: any) {
                console.log("🔍 Authenticated API error:", authError.response?.data);
                console.log("🔍 Authenticated API status:", authError.response?.status);
                throw authError;
            }
        }
        console.log("🔍 Public API error:", error.response?.data);
        console.log("🔍 Public API status:", error.response?.status);
        throw error;
    }
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
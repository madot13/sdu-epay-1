import {IOrder} from "@/types/orders.ts";
import {create} from "zustand/react";
import {VerifyPromocodePayload} from "@/types/promocodes.ts";
import {verifyPromocode} from "@/api/endpoints/promocodes.ts";

interface PaymentState {
    order: IOrder;
    price: number;
    discount: number;
    loading: boolean;
    finalPrice: number;
    currency: "KZT" | "USD";
    error: string | null;
    setOrderField: <K extends keyof IOrder>(key: K, value: IOrder[K]) => void;
    setPrice: (price: number) => void;
    setCurrency: (currency: "KZT" | "USD") => void;
    verifyPromo: (payload: VerifyPromocodePayload) => Promise<string | null>;
    applyPromo: (promoCode: string) => void;
    resetPromo: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    resetOrder: () => void;
}

const initialOrder: IOrder = {
    event_id: '',
    promo_code: '',
    fullname: '',
    email: '',
    cellphone: '',
    additional: '',
    additional_fields: null
}


export const usePaymentStore = create<PaymentState>((set) => ({
    order: { ...initialOrder },
    price: 0,
    discount: 0,
    finalPrice: 0,
    currency: "KZT",
    loading: false,
    error: null,

    setOrderField: (key, value) =>
        set((state) => ({
            order: {
                ...state.order,
                [key]: value,
            },
        })),

    setPrice: (price) => set((state) => {
        // при изменении цены пересчитываем finalPrice с текущей скидкой
        const finalPrice = Math.max(0, price - (price * (state.discount / 100)));
        return {
            price,
            finalPrice,
        };
    }),

    setCurrency: (currency) => set({ currency }),

    verifyPromo: async (payload) => {
        set({ loading: true, error: null });
        try {
            const promo = await verifyPromocode(payload);
            set((state) => {
                const discount = promo.discount ?? 0;
                const finalPrice = Math.max(0, state.price - (state.price * (discount / 100)));

                return {
                    discount,
                    finalPrice,
                    order: {
                        ...state.order,
                        promo_code: promo.code,
                    },
                    loading: false,
                };
            });
            return null; // 👈 нет ошибки
        } catch (err: any) {
            let message = 'Something went wrong';
            if (err.response?.status === 400) {
                message = 'Invalid promo code';
            } else if (err instanceof Error) {
                message = err.message;
            }
            set({ error: message, loading: false });
            return message; // 👈 вернули ошибку
        }
    },

    applyPromo: (promoCode) =>
        set((state) => ({
            order: {
                ...state.order,
                promo_code: promoCode,
            },
        })),

    resetPromo: () =>
        set((state) => ({
            discount: 0,
            finalPrice: state.price,
            order: {
                ...state.order,
                promo_code: '',
            },
        })),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    resetOrder: () =>
        set({
            order: { ...initialOrder },
            price: 0,
            discount: 0,
            finalPrice: 0,
            currency: "KZT",
            loading: false,
            error: null,
        }),
}));

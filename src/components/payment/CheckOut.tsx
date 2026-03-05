import { FC } from "react";
import { usePaymentStore } from "@/store/usePaymentStore.ts";
import {useTranslation} from "react-i18next";

export const CheckOut: FC = () => {
    const { price, discount, order, finalPrice, currency } = usePaymentStore();
    const { t } = useTranslation();

    const discountAmount = Math.round(price * (discount / 100));
    const currencySymbol = currency === "USD" ? "$" : "₸";

    return (
        <div>
            <hr className="border-1 border-[#006799]" />
            <div className="mx-[12px] flex text-[16px] flex-col gap-[20px] my-[16px]">
                <div className="flex justify-between">
                    <p>{t('paymentPage.check.summ')}</p>
                    <p>{price} {currencySymbol}</p>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <p>{t('paymentPage.check.promo')} ({order.promo_code})</p>
                        <p>-{discountAmount} {currencySymbol} ({discount}%)</p>
                    </div>
                )}
            </div>
            <hr className="border-1 border-[#006799]" />
            <div className="mx-[12px] my-[19px]">
                <div className="flex justify-between text-[20px] font-bold">
                    <p>{t('paymentPage.check.total')}</p>
                    <p>{finalPrice} {currencySymbol}</p>
                </div>
            </div>
        </div>
    );
};

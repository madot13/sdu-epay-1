import { FC, useEffect, useState } from "react";
import { PaymentMethodItem } from "./PaymentMethodItem.tsx";
import {useTranslation} from "react-i18next";

export interface PaymentMethodProps {
    error?: string;
    onChange: (value: string) => void;
    disableKaspi?: boolean; // Optional prop to disable KaspiBank
    disableHalyk?: boolean; // Optional prop to disable HalykBank
}

export const PaymentMethod: FC<PaymentMethodProps> = ({ error, onChange, disableKaspi, disableHalyk }) => {
    const {t} = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const handleSelectMethod = (method: string) => {
        if (method === "KaspiBank" && disableKaspi) return; // Prevent selection if Kaspi is disabled
        if (method === "HalykBank" && disableHalyk) return; // Prevent selection if Halyk is disabled
        setSelectedMethod(method);
        onChange(method);
    };

    useEffect(() => {
        if (disableKaspi && selectedMethod === "KaspiBank") {
            setSelectedMethod("HalykBank"); // Automatically switch to HalykBank if Kaspi is disabled
            onChange("HalykBank");
        }
        if (disableHalyk && selectedMethod === "HalykBank") {
            setSelectedMethod("KaspiBank"); // Automatically switch to KaspiBank if Halyk is disabled
            onChange("KaspiBank");
        }
    }, [disableKaspi, disableHalyk]);

    return (
        <div>
            <p className="text-[24px] font-medium mt-[26px] mb-[12px]">{t('paymentPage.paymentMethod')}</p>
            <div className="flex justify-between gap-[16px]">
                <PaymentMethodItem
                    icon="/icons/HalykBank.svg"
                    name="HalykBank"
                    selected={selectedMethod === "HalykBank"}
                    onClick={() => handleSelectMethod("HalykBank")}
                    error={error}
                    disabled={disableHalyk} // Pass disabled state to the component
                />
                <PaymentMethodItem
                    icon="/icons/KaspiBank.svg"
                    name="KaspiBank"
                    selected={selectedMethod === "KaspiBank"}
                    onClick={() => handleSelectMethod("KaspiBank")}
                    error={error}
                    disabled={disableKaspi} // Pass disabled state to the component
                />
            </div>

        </div>
    );
};

import { FC, useEffect, useState } from "react";
import EpayPaymentWidget from "epay-payment-widget";
import { toast } from "react-hot-toast";

interface PaymentHalykProps {
    showWidget: boolean;
    amount: number;
    terminalId: string;
    orderId: string;
    successUrl: string;
    currency: string
    failUrl: string;
    email: string;
    oauthData: {
        access_token: string;
        token_type: string;
        expires_in?: number;
        scope?: string;
    };
    description?: string;
    onClose?: () => void;
}

export const PaymentHalyk: FC<PaymentHalykProps> = ({
                                                        showWidget,
                                                        amount,
                                                        terminalId,
                                                        orderId,
                                                        successUrl,
                                                        currency,
                                                        failUrl,
                                                        email,
                                                        oauthData,
                                                        description = "Оплата заказа",
                                                        onClose,
                                                    }) => {
    const [widgetError, setWidgetError] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    useEffect(() => {
        if (showWidget) {
            console.log("🔍 Opening Halyk payment widget...");
            setWidgetError(false);
            setLoadingTimeout(false);

            // Set timeout for widget loading
            const timeoutId = setTimeout(() => {
                console.warn("⚠️ Halyk widget loading timeout - possible iframe issues");
                setLoadingTimeout(true);
                toast.error("Платежная форма загружается дольше обычного. Если проблема сохранится, попробуйте другой способ оплаты.");
            }, 15000); // 15 seconds timeout

            // Listen for console errors related to iframe
            const originalConsoleError = console.error;
            console.error = (...args) => {
                const errorString = args.join(' ');
                if (errorString.includes('X-Frame-Options') || 
                    errorString.includes('Content-Security-Policy') ||
                    errorString.includes('epay.homebank.kz')) {
                    console.warn("🔍 Halyk widget iframe/security issue detected:", errorString);
                    setWidgetError(true);
                    toast.error("Возникли проблемы с загрузкой платежной формы. Попробуйте обновить страницу или выбрать другой способ оплаты.");
                }
                originalConsoleError.apply(console, args);
            };

            return () => {
                clearTimeout(timeoutId);
                console.error = originalConsoleError;
                if (onClose) onClose();
            };
        }
    }, [showWidget, onClose]);

    if (widgetError || loadingTimeout) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md mx-4">
                    <h3 className="text-lg font-semibold mb-4">Проблемы с загрузкой платежной формы</h3>
                    <p className="text-gray-600 mb-4">
                        {loadingTimeout 
                            ? "Платежная форма загружается дольше обычного. Это может быть связано с проблемами на стороне банка."
                            : "Возникли технические проблемы с загрузкой платежной формы HalykBank."}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Обновить страницу
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <EpayPaymentWidget
            visible={showWidget}
            terminalId={terminalId}
            amount={amount}
            invoiceId={orderId}
            oauthData={oauthData}
            currency={currency}
            paymentData={{
                backLink: successUrl,
                failureBackLink: failUrl,
                postLink: `${successUrl}/post`,
                failurePostLink: `${failUrl}/post`,
                description: description,
                accountId: email,
                language: "RUS",
            }}
            onWidgetClose={onClose}
        />
    );
};

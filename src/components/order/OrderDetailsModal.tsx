import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { Order, OrderDetails } from "@/types/orders.ts";
import { getOrderById } from "@/api/endpoints/orders.ts";
import { PulseLoader } from "react-spinners";

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export const OrderDetailsModal: FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!order || !isOpen) return;
            
            setLoading(true);
            try {
                const details = await getOrderById(order.id);
                setOrderDetails(details);
            } catch (error) {
                console.error("Failed to fetch order details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [order, isOpen]);

    if (!order) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return "text-green-600";
            case "FAILURE":
                return "text-red-600";
            case "PENDING":
                return "text-yellow-600";
            default:
                return "";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return "Успешно";
            case "FAILURE":
                return "Ошибка";
            case "PENDING":
                return "В ожидании";
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <CustomModal
                title={`Детали заказа #${order.id}`}
                isOpen={isOpen}
                className="max-w-2xl w-full"
                onClose={onClose}
            >
                <div className="flex justify-center items-center py-8">
                    <PulseLoader size={10} color="#006799" />
                </div>
            </CustomModal>
        );
    }

    if (!orderDetails) {
        return (
            <CustomModal
                title={`Детали заказа #${order.id}`}
                isOpen={isOpen}
                className="max-w-2xl w-full"
                onClose={onClose}
            >
                <div className="text-center py-8 text-gray-500">
                    Не удалось загрузить детали заказа
                </div>
            </CustomModal>
        );
    }

    return (
        <CustomModal
            title={`Детали заказа #${order.id}`}
            isOpen={isOpen}
            className="max-w-2xl w-full max-h-[90vh]"
            onClose={onClose}
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Имя клиента</p>
                        <p className="font-semibold">{orderDetails.fullname}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold">{orderDetails.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Телефон</p>
                        <p className="font-semibold">{orderDetails.cellphone}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Тип оплаты</p>
                        <p className="font-semibold">
                            {orderDetails.type === "KASPI" ? "Kaspi" : "Halyk"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Статус</p>
                        <p className={`font-semibold ${getStatusColor(orderDetails.status)}`}>
                            {getStatusText(orderDetails.status)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Сумма</p>
                        <p className="font-semibold">{orderDetails.amount} ₸</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Итоговая сумма</p>
                        <p className="font-semibold text-lg text-blue-600">{orderDetails.final_amount} ₸</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Скидка</p>
                        <p className="font-semibold text-green-600">
                            {orderDetails.amount - orderDetails.final_amount > 0
                                ? `${orderDetails.amount - orderDetails.final_amount} ₸`
                                : "Нет"}
                        </p>
                    </div>
                </div>

                {/* Department Info */}
                <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="font-semibold text-blue-900 mb-2">Департамент</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-sm text-gray-600">Название</p>
                            <p className="font-semibold">{orderDetails.department?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Тип</p>
                            <p className="font-semibold">
                                {orderDetails.department?.type === "EVENT_BASED" ? "На основе событий" : "Самостоятельная оплата"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Event Info */}
                {orderDetails.event && (
                    <div className="bg-green-50 p-4 rounded-md">
                        <h3 className="font-semibold text-green-900 mb-2">Событие</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-sm text-gray-600">Название</p>
                                <p className="font-semibold">{orderDetails.event.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email менеджера</p>
                                <p className="font-semibold text-sm">{orderDetails.event.manager_email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Цена</p>
                                <p className="font-semibold">
                                    {orderDetails.event.priced ? `${orderDetails.event.price} ₸` : "Произвольная"}
                                </p>
                            </div>
                            {!orderDetails.event.without_period && (
                                <div>
                                    <p className="text-sm text-gray-600">Период</p>
                                    <p className="font-semibold text-sm">
                                        {orderDetails.event.period_from} - {orderDetails.event.period_till}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Promo Code Info */}
                {orderDetails.promo_code && (
                    <div className="bg-purple-50 p-4 rounded-md">
                        <h3 className="font-semibold text-purple-900 mb-2">Промокод</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-sm text-gray-600">Код</p>
                                <p className="font-semibold">{orderDetails.promo_code.code}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Скидка</p>
                                <p className="font-semibold text-purple-600">{orderDetails.promo_code.discount}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {orderDetails.additional && (
                    <div>
                        <p className="text-sm text-gray-500">Дополнительная информация</p>
                        <p className="font-semibold">{orderDetails.additional}</p>
                    </div>
                )}

                {orderDetails.additional_fields && Object.keys(orderDetails.additional_fields).length > 0 && (
                    <div>
                        <p className="text-sm text-gray-500 mb-3">Дополнительные поля</p>
                        <div className="bg-gray-50 p-4 rounded-md">
                            <div className="flex flex-col gap-3">
                                {Object.entries(orderDetails.additional_fields).map(([key, value]) => {
                                    const isFile = typeof value === "string" && (
                                        value.includes("http") || 
                                        value.includes("https") || 
                                        value.includes("www") || 
                                        value.includes("C:\\fakepath") ||
                                        value.includes("fakepath") ||
                                        value.includes("blob:")
                                    );
                                    
                                    return (
                                        <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-3 border-b border-gray-200 last:border-0">
                                            <span className="text-gray-600 font-medium min-w-[120px]">{key}:</span>
                                            
                                            {isFile ? (
                                                <button
                                                    onClick={() => {
                                                        const url = value;
                                                        console.log("Attempting to download file from:", url);
                                                        
                                                        if (url.includes("http") || url.includes("https")) {
                                                            // Для веб-URL открываем в новой вкладке
                                                            window.open(url, '_blank');
                                                        } else if (url.includes("blob:")) {
                                                            // Для blob URL создаем временную ссылку
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `file_${Date.now()}`;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                        } else {
                                                            // Для локальных файлов или других случаев
                                                            console.log("Cannot download file from this URL:", url);
                                                            alert("Не удалось скачать файл. Свяжитесь с администратором.");
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Скачать файл
                                                </button>
                                            ) : (
                                                <span className="font-semibold text-gray-800 break-all">
                                                    {typeof value === "boolean"
                                                        ? value
                                                            ? "Да"
                                                            : "Нет"
                                                        : String(value)}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">Дата создания</p>
                    <p className="font-semibold text-sm">{formatDate(orderDetails.created_at)}</p>
                </div>
            </div>
        </CustomModal>
    );
};


import { FC, useState } from "react";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { useOrdersStore } from "@/store/useOrdersStore.ts";
import { Calendar } from "primereact/calendar";
import { exportOrders } from "@/api/endpoints/orders.ts";
import { toast } from "react-hot-toast";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export const OrdersFilters: FC = () => {
    const [orderId, setOrderId] = useState("");
    const [type, setType] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const { fetchOrders } = useOrdersStore();

    const typeOptions = [
        { label: "Все типы", value: "" },
        { label: "Kaspi", value: "KASPI" },
        { label: "Halyk", value: "EPAY" },
    ];

    const statusOptions = [
        { label: "Все статусы", value: "" },
        { label: "В ожидании", value: "PENDING" },
        { label: "Успешно", value: "SUCCESS" },
        { label: "Ошибка", value: "FAILURE" },
    ];

    const formatDate = (date: Date | null) => {
        if (!date) return null;
        return date.toISOString().split('T')[0];
    };

    const handleSearch = async () => {
        await fetchOrders({
            id: orderId ? Number(orderId) : null,
            type: (type as "KASPI" | "EPAY") || null,
            status: (status as "PENDING" | "SUCCESS" | "FAILURE") || null,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            page: 0,
            size: 10,
        });
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await exportOrders({
                id: orderId ? Number(orderId) : null,
                type: (type as "KASPI" | "EPAY") || null,
                status: (status as "PENDING" | "SUCCESS" | "FAILURE") || null,
                start_date: formatDate(startDate),
                end_date: formatDate(endDate),
            });

            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Формируем имя файла с датой
            const date = new Date().toISOString().split('T')[0];
            link.download = `orders_export_${date}.xlsx`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Файл успешно скачан");
        } catch (error) {
            console.error("Failed to export orders:", error);
            toast.error("Ошибка при экспорте заказов");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-6 lg:mb-[31px]">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-[22px] w-full flex-wrap">
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">ID заказа</label>
                    <input
                        type="number"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="bg-[#FFFFFF] h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
                        placeholder="Введите ID"
                    />
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Тип оплаты</label>
                    <CustomSelect
                        options={typeOptions}
                        value={type}
                        onChange={setType}
                        triggerClassName="bg-white w-full sm:min-w-[200px] h-[37px] text-black text-sm"
                        dropdownClassName="bg-gray-100"
                        optionClassName="text-sm"
                        activeOptionClassName="bg-blue-200"
                    />
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Статус</label>
                    <CustomSelect
                        options={statusOptions}
                        value={status}
                        onChange={setStatus}
                        triggerClassName="bg-white w-full sm:min-w-[200px] h-[37px] text-black text-sm"
                        dropdownClassName="bg-gray-100"
                        optionClassName="text-sm"
                        activeOptionClassName="bg-blue-200"
                    />
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Дата от</label>
                    <Calendar
                        value={startDate}
                        onChange={(e) => setStartDate(e.value as Date | null)}
                        dateFormat="yy-mm-dd"
                        placeholder="Выберите дату"
                        className="w-full sm:min-w-[200px]"
                        inputStyle={{ 
                            height: '37px', 
                            fontSize: '14px',
                            border: '1px solid #6B9AB0',
                            borderRadius: '4px'
                        }}
                        showIcon={false}
                    />
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Дата до</label>
                    <Calendar
                        value={endDate}
                        onChange={(e) => setEndDate(e.value as Date | null)}
                        dateFormat="yy-mm-dd"
                        placeholder="Выберите дату"
                        className="w-full sm:min-w-[200px]"
                        inputStyle={{ 
                            height: '37px', 
                            fontSize: '14px',
                            border: '1px solid #6B9AB0',
                            borderRadius: '4px'
                        }}
                        showIcon={false}
                    />
                </div>
                <CustomButton
                    onClick={handleSearch}
                    className="h-[37px] px-4 mt-auto text-white rounded-[4px] transition w-full sm:w-auto"
                >
                    Поиск
                </CustomButton>
                <CustomButton
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="default"
                    className="h-[37px] px-4 justify-center mt-auto rounded-[4px] transition w-full sm:w-auto flex items-center gap-2"
                >
                    {isExporting ? (
                        <>Загрузка...</>
                    ) : (
                        <>
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Скачать
                        </>
                    )}
                </CustomButton>
            </div>
        </div>
    );
};


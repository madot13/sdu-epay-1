import { FC, useEffect, useState } from "react";
import { CustomButton } from "@/ui/CustomButton.tsx";
import {
    InformationCircleIcon,
    PlusIcon,
    ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { Calendar } from "primereact/calendar";
import { CustomSelect } from "@/ui/CustomSelect.tsx";

import { HashIcon } from "lucide-react";
import { getEvents } from "@/api/endpoints/events.ts";
import { IEvent } from "@/types/events.ts";
import { usePromoCodesStore } from "@/store/usePromoCodesStore.ts";
import { toast } from "react-hot-toast";
import {formatLocalDate} from "@/utils/formatLocalDate.ts";

export const AddPromoCodeModal: FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [code, setCode] = useState("");
    const [limit, setLimit] = useState("");
    const [discount, setDiscount] = useState("");
    const [dates, setDates] = useState<Date[] | null>(null);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [active, setActive] = useState(true);
    const [events, setEvents] = useState<{ label: string; value: string }[]>([]);

    const [errors, setErrors] = useState({
        code: false,
        limit: false,
        discount: false,
        discountTooHigh: false,
        dates: false,
        event: false,
    });

    const { addPromoCode, fetchPromoCodes } = usePromoCodesStore();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await getEvents({ active: true });
                const formatted = response.data.map((event: IEvent) => ({
                    label: event.title,
                    value: event.id,
                }));
                setEvents(formatted);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };

        fetchEvents();
    }, []);

    const handleSubmit = async () => {

        const periodFrom = Array.isArray(dates) && dates[0] ? formatLocalDate(dates[0]) : null;
        const periodTo = Array.isArray(dates) && dates[1] ? formatLocalDate(dates[1]) : null;

        const discountNum = Number(discount);
        const limitNum = Number(limit);

        const newErrors = {
            code: !code || code.length<3,
            limit: !limit || limitNum <= 0,
            discount: !discount || discountNum <= 0,
            discountTooHigh: discountNum >= 100,
            dates: !periodFrom || !periodTo,
            event: !selectedEvent,
        };

        setErrors(newErrors);

        const messages: string[] = [];
        if (newErrors.code) messages.push("Промокод обязателен");
        if (newErrors.limit) messages.push("Лимит использования должен быть положительным числом");
        if (newErrors.discount) messages.push("Скидка должна быть положительным числом");
        if (newErrors.discountTooHigh) messages.push("Скидка должна быть меньше 100%");
        if (newErrors.dates) messages.push("Необходимо указать период действия промокода");
        if (newErrors.event) messages.push("Необходимо выбрать мероприятие");


        if (messages.length > 0) {
            messages.forEach((msg) => toast.error(msg));
            return;
        }

        try {
            await addPromoCode({
                code: code,
                limit: limitNum,
                discount: discountNum,
                period_from: periodFrom!,
                period_till: periodTo!,
                event_id: selectedEvent,
                active: active,
            });

            await fetchPromoCodes();

            toast.success("Промо-код удален, промо-код успешно добавлен!");
            setIsModalOpen(false);
            // Очистка формы
            setCode("");
            setLimit("");
            setDiscount("");
            setDates(null);
            setSelectedEvent("");
            setActive(true);
            setErrors({
                code: false,
                limit: false,
                discount: false,
                discountTooHigh: false,
                dates: false,
                event: false,
            });
        } catch (err: any) {
            console.error("Failed to add promo code:", err.response.data.detail[0].msg);
            toast.error( err.response.data.detail[0].msg || "Ошибка при добавлении промо-кода.");
        }
    };

    return (
        <>
            <CustomButton
                variant="submit"
                className="h-[38px] font-bold gap-[5px] px-[20px] flex rounded-[4px]"
                onClick={() => setIsModalOpen(true)}
            >
                <PlusIcon />
                Добавить
            </CustomButton>
            <CustomModal className={"max-w-md w-full"} title={"Добавить промо-код"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className={"flex flex-col gap-[21px]"}>
                    <CustomInput
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        icon={<HashIcon className={`text-[#6B9AB0] ${errors.code ? "text-red-500" : ""}`} />}
                        placeholder={"Введите название"}
                        className={errors.code ? "border border-red-500" : ""}
                    />

                    <CustomSelect
                        placeholder="Выберите событие"
                        options={events}
                        value={selectedEvent}
                        onChange={setSelectedEvent}
                        triggerClassName={`bg-white h-[50px] text-black ${errors.event ? "border border-red-500" : ""}`}
                        dropdownClassName="bg-gray-100"
                        optionClassName="text-sm"
                        activeOptionClassName="bg-blue-200"
                    />

                    <CustomInput
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        icon={<InformationCircleIcon className={`text-[#6B9AB0] ${errors.limit ? "text-red-500" : ""}`} />}
                        placeholder={"Введите лимит использования"}
                        className={errors.limit ? "border border-red-500" : ""}
                        type="number"

                    />

                    <CustomInput
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        icon={<ReceiptPercentIcon className={`text-[#6B9AB0] ${errors.discount || errors.discountTooHigh ? "text-red-500" : ""}`} />}
                        placeholder={"Введите процент скидки"}
                        className={errors.discount || errors.discountTooHigh ? "border border-red-500" : ""}
                        type="number"
                    />

                    <div className={`card flex justify-content-center ${errors.dates ? "border border-red-500 rounded-md" : ""}`}>
                        <Calendar
                            className="w-full rounded-md shadow-sm"
                            placeholder="Период действия промо-кода"
                            value={dates}
                            onChange={(e) => setDates(e.value as Date[])}
                            selectionMode="range"
                            readOnlyInput
                            hideOnRangeSelection
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="active"
                            checked={active}
                            onChange={(e) => setActive(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-gray-700">
                            Активен
                        </label>
                    </div>

                    <CustomButton onClick={handleSubmit} className="w-full">
                        Добавить
                    </CustomButton>
                </div>
            </CustomModal>
        </>
    );
};

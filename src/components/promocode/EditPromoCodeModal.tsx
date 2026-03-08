import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { Calendar } from "primereact/calendar";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { getEvents } from "@/api/endpoints/events.ts";
import { IEvent } from "@/types/events.ts";
import { usePromoCodesStore } from "@/store/usePromoCodesStore.ts";
import {
    InformationCircleIcon,
    ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import { HashIcon } from "lucide-react";
import { toast } from "react-hot-toast";

interface EditPromoCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    promoData: {
        id: string;
        code: string;
        limit: number;
        discount: number;
        period_from: string;
        period_till: string;
        already_used: number;
        event: {
            id: string;
            title: string;
            manager_email: string;
            price: string;
            period_from: string;
            period_till: string;
        };
    };
}

export const EditPromoCodeModal: FC<EditPromoCodeModalProps> = ({
                                                                    isOpen,
                                                                    onClose,
                                                                    promoData,
                                                                }) => {
    const [code, setCode] = useState(promoData.code);
    const [limit, setLimit] = useState(promoData.limit);
    const [discount, setDiscount] = useState(promoData.discount);
    const [selectedEvent, setSelectedEvent] = useState(promoData.event.id);
    const [dates, setDates] = useState<Date[] | null>([
        new Date(promoData.period_from),
        new Date(promoData.period_till),
    ]);
    const [events, setEvents] = useState<{ label: string; value: string }[]>([]);

    const [errors, setErrors] = useState({
        code: false,
        limit: false,
        discount: false,
        event: false,
        dates: false,
    });

    const { updatePromoCode, fetchPromoCodes } = usePromoCodesStore();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await getEvents({ active: true });
                const formatted = response.data.map((event: IEvent) => ({
                    label: event.title,
                    value: event.id,
                }));
                setEvents(formatted);

                if (isOpen) {
                    setCode(promoData.code);
                    setLimit(promoData.limit);
                    setDiscount(promoData.discount);
                    setDates([
                        new Date(promoData.period_from),
                        new Date(promoData.period_till),
                    ]);
                    setSelectedEvent(promoData.event.id);

                    setErrors({
                        code: false,
                        limit: false,
                        discount: false,
                        event: false,
                        dates: false,
                    });
                }
            } catch (error: any) {
                console.error("Failed to fetch events:", error);
                toast.error(error.response.data.detail[0].msg)
            }
        };

        fetchEvents();
    }, [isOpen]);

    const handleUpdate = async () => {
        const periodFromFormat =
            Array.isArray(dates) && dates[0]
                ? dates[0].toISOString().split("T")[0]
                : null;
        const periodTillFormat =
            Array.isArray(dates) && dates[1]
                ? dates[1].toISOString().split("T")[0]
                : null;

        const newErrors = {
            code: !code.trim() || code.length<3,
            limit: !limit || limit < 1,
            discount: !discount || discount < 1 || discount > 100,
            event: !selectedEvent,
            dates: !periodFromFormat || !periodTillFormat,
        };

        setErrors(newErrors);

        const messages: string[] = [];

        if (newErrors.code) messages.push("Промокод обязателен.");
        if (newErrors.limit) messages.push("Лимит должен быть не менее 1.");
        if (newErrors.discount)
            messages.push("Скидка должна быть от 1 до 100%.");
        if (newErrors.event) messages.push("Пожалуйста, выберите мероприятие.");
        if (newErrors.dates) messages.push("Пожалуйста, укажите корректный период действия.");


        try {
            await updatePromoCode(promoData.id, {
                code,
                limit,
                discount,
                event_id: selectedEvent,
                period_from: periodFromFormat!,
                period_till: periodTillFormat!,
            });

            await fetchPromoCodes();
            toast.success("Промокод успешно обновлен.");
            onClose();
        } catch (err: any) {
            toast.error(err.response.data.detail[0].msg)
        }
    };

    return (
        <CustomModal className={"max-w-md w-full"} title="Редактировать Промо-код" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-[21px]">
                <CustomInput
                    icon={
                        <HashIcon className={errors.code ? "text-red-500" : "text-[#6B9AB0]"} />
                    }
                    placeholder="Введите промо-код"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <CustomSelect
                    placeholder="Выберите событие"
                    options={events}
                    value={selectedEvent}
                    onChange={setSelectedEvent}
                    triggerClassName={`bg-white h-[50px] text-black ${
                        errors.event ? "border border-red-500" : ""
                    }`}
                    dropdownClassName="bg-gray-100"
                    optionClassName="text-sm"
                    activeOptionClassName="bg-blue-200"
                />
                <CustomInput
                    icon={
                        <InformationCircleIcon
                            className={errors.limit ? "text-red-500" : "text-[#6B9AB0]"}
                        />
                    }
                    placeholder="Введите лимит использования"
                    type="number"
                    value={String(limit)}
                    onChange={(e) => setLimit(Number(e.target.value))}
                />
                <CustomInput
                    placeholder="Введите скидку %"
                    type="number"
                    icon={
                        <ReceiptPercentIcon
                            className={errors.discount ? "text-red-500" : "text-[#6B9AB0]"}
                        />
                    }
                    value={String(discount)}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                />

                <Calendar
                    className={`w-full border ${
                        errors.dates ? "border-red-500" : "border-[#6B9AB0]"
                    } rounded-md shadow-sm`}
                    placeholder="Выберите диапазон дат"
                    value={dates}
                    onChange={(e) => setDates(e.value as Date[])}
                    selectionMode="range"
                    readOnlyInput
                    hideOnRangeSelection
                />
                <CustomButton onClick={handleUpdate} className="w-full">
                    Сохранить
                </CustomButton>
            </div>
        </CustomModal>
    );
};

import {FC, useEffect, useState} from "react";
import {getDepartments} from "@/api/endpoints/departments.ts";
import {Department} from "@/types/departments.ts";
import {useEventsStore} from "@/store/useEventsStore.ts";
import {CustomInput} from "@/ui/CustomInput.tsx";
import {
    CurrencyDollarIcon,
    EnvelopeIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {CustomModal} from "@/ui/CustomModal.tsx";
import {Calendar} from "primereact/calendar";
import {CustomSelect} from "@/ui/CustomSelect.tsx";
import { toast } from "react-hot-toast";

interface EditEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: {
        id: string;
        title: string;
        manager_email: string;
        priced: boolean;
        price: number;
        without_period: boolean;
        period_from: string;
        period_till: string;
        department: {
            id: string;
            name: string;
        }
    };
}

export const EditEventsModal: FC<EditEventsModalProps> = ({isOpen, onClose, eventData}) => {
    const [title, setTitle] = useState(eventData.title);
    const [email, setEmail] = useState(eventData.manager_email);
    const [price, setPrice] = useState(eventData.price);
    const [priced, setPriced] = useState(eventData.priced);
    const [withoutPeriod, setWithoutPeriod] = useState(eventData.without_period);
    const [selectedDepartment, setSelectedDepartment] = useState(eventData.department.id);
    const [dates, setDates] = useState<Date[] | null>(
        eventData.without_period 
            ? null 
            : [new Date(eventData.period_from), new Date(eventData.period_till)]
    );
    const [errors, setErrors] = useState({
        title: false,
        email: false,
        department: false,
        price: false,
        dates: false,
    });
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);

    const {updateEvent, fetchEvents} = useEventsStore();

    useEffect(() => {
        if (isOpen) {
            setTitle(eventData.title);
            setEmail(eventData.manager_email);
            setPrice(eventData.price);
            setPriced(eventData.priced);
            setWithoutPeriod(eventData.without_period);
            setSelectedDepartment(eventData.department.id);
            setDates(
                eventData.without_period
                    ? null
                    : [new Date(eventData.period_from), new Date(eventData.period_till)]
            );
        }
    }, [isOpen, eventData]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await getDepartments();
                const formatted = response.data.map((dept: Department) => ({
                    label: dept.name,
                    value: dept.id,
                }));
                setDepartments(formatted);
            } catch (error) {
                console.error("Failed to fetch departments:", error);
            }
        };

        fetchDepartments();
    }, []);


    const handleSubmit = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const from = Array.isArray(dates) && dates[0]
            ? dates[0].toISOString().split("T")[0]
            : null;

        const till = Array.isArray(dates) && dates[1]
            ? dates[1].toISOString().split("T")[0]
            : null;

        const newErrors = {
            title: !title.trim(),
            email: !email.trim() || !emailRegex.test(email),
            department: !selectedDepartment,
            price: priced && (!price || price <= 0),
            dates: !withoutPeriod && (!from || !till),
        };

        setErrors(newErrors);

        const messages: string[] = [];

        if (newErrors.title) messages.push("Название мероприятия обязательно.");
        if (!email.trim()) {
            messages.push("Email менеджера обязателен.");
        } else if (!emailRegex.test(email)) {
            messages.push("Неверный формат email.");
        }
        if (newErrors.department) messages.push("Необходимо выбрать департамент.");
        if (newErrors.price) messages.push("Укажите корректную цену.");
        if (newErrors.dates) messages.push("Укажите период проведения мероприятия.");


        if (messages.length > 0) {
            messages.forEach((msg) => toast.error(msg));
            return;
        }

        try {
            await updateEvent(eventData.id, {
                title,
                manager_email: email,
                department_id: selectedDepartment,
                priced: priced,
                price: priced ? price : 0,
                without_period: withoutPeriod,
                ...(withoutPeriod 
                    ? {} 
                    : { period_from: from!, period_till: till! }
                ),
            });

            await fetchEvents();

            toast.success("Событие успешно обновлено!");
            onClose();
        } catch (err: any) {
            console.error("Failed to update event:", err);
            toast.error(err.response.data.detail[0].msg)
        }
    };

    return (
        <CustomModal title="Редактировать событие" isOpen={isOpen} className={"max-w-md w-full"} onClose={onClose}>
            <div className="flex flex-col gap-[21px]">
                <CustomInput
                    icon={<InformationCircleIcon className={errors.title ? " text-red-500" : "text-[#6B9AB0]"} />}
                    placeholder="Введите название"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <CustomInput
                    icon={<EnvelopeIcon className={errors.email ? " text-red-500" : "text-[#6B9AB0]"} />}
                    placeholder="Введите email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <CustomSelect
                    placeholder="Выберите департамент"
                    options={departments}
                    value={selectedDepartment}
                    onChange={setSelectedDepartment}
                    triggerClassName={`bg-white h-[50px] text-black ${errors.department ? "border border-red-500" : ""}`}
                    dropdownClassName="bg-gray-100"
                    optionClassName="text-sm"
                    activeOptionClassName="bg-blue-200"
                />
                
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="priced-edit"
                        checked={priced}
                        onChange={(e) => setPriced(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="priced-edit" className="text-sm text-gray-700">
                        Фиксированная цена
                    </label>
                </div>

                {priced && (
                    <CustomInput
                        icon={<CurrencyDollarIcon className={errors.price ? " text-red-500" : "text-[#6B9AB0]"} />}
                        placeholder="Введите сумму"
                        type="number"
                        value={String(price)}
                        onChange={(e) => setPrice(Number(e.target.value))}
                    />
                )}

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="withoutPeriod-edit"
                        checked={withoutPeriod}
                        onChange={(e) => setWithoutPeriod(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="withoutPeriod-edit" className="text-sm text-gray-700">
                        Без периода
                    </label>
                </div>

                {!withoutPeriod && (
                    <Calendar
                        className={`w-full border ${errors.dates ? " border-red-500" : "border-[#6B9AB0]"} rounded-md shadow-sm`}
                        placeholder="Выберите диапазон дат"
                        value={dates}
                        onChange={(e) => setDates(e.value as Date[])}
                        selectionMode="range"
                        readOnlyInput
                        hideOnRangeSelection
                    />
                )}

                <CustomButton onClick={handleSubmit} className="w-full">
                    Сохранить
                </CustomButton>
            </div>
        </CustomModal>
    );
};

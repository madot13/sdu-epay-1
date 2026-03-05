import { FC, useEffect, useState } from "react";
import { CustomButton } from "@/ui/CustomButton.tsx";
import {
    EnvelopeIcon,
    PlusIcon,
    UserCircleIcon,
    CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { Calendar } from "primereact/calendar";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { getDepartments } from "@/api/endpoints/departments.ts";
import { Department } from "@/types/departments.ts";
import { useEventsStore } from "@/store/useEventsStore.ts";
import { toast } from "react-hot-toast";
import {formatLocalDate} from "@/utils/formatLocalDate.ts";
import {TengeIcon} from "@/assets/TengeIcon.tsx";
import { AddAdditionalFields } from "@/components/department/AddAdditionalFields.tsx";

export const AddEventModal: FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dates, setDates] = useState<Date[] | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [price, setPrice] = useState(0);
    const [priceUsd, setPriceUsd] = useState(0);
    const [priced, setPriced] = useState(true);
    const [withoutPeriod, setWithoutPeriod] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [additionalFields, setAdditionalFields] = useState<{name:string; type:string; value?: any}[]>([]);
    const [errors, setErrors] = useState({
        name: false,
        email: false,
        department: false,
        price: false,
        priceUsd: false,
        dates: false,
    });

    const { addEvent, fetchEvents } = useEventsStore();

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await getDepartments({ active: true });
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

        const periodFrom = Array.isArray(dates) && dates[0] ? formatLocalDate(dates[0]) : null;
        const periodTo = Array.isArray(dates) && dates[1] ? formatLocalDate(dates[1]) : null;

        const newErrors = {
            name: !name,
            email: !email || !emailRegex.test(email),
            department: !selectedDepartment,
            price: priced && (!price || price <= 0),
            priceUsd: priced && priceUsd < 0,
            dates: !withoutPeriod && (!periodFrom || !periodTo),
        };

        setErrors(newErrors);

        const messages: string[] = [];

        if (newErrors.name) messages.push("Название мероприятия обязательно");
        if (!email) {
            messages.push("Email администратора обязателен");
        } else if (!emailRegex.test(email)) {
            messages.push("Неверный формат email");
        }
        if (newErrors.department) messages.push("Необходимо выбрать департамент");
        if (newErrors.price) messages.push("Укажите корректную цену в KZT");
        if (newErrors.priceUsd) messages.push("Цена в USD не может быть отрицательной");
        if (newErrors.dates) messages.push("Необходимо указать период проведения");

        if (messages.length > 0) {
            messages.forEach((msg) => toast.error(msg));
            return;
        }


        try {
            // Подготавливаем additional_fields
            const additional_fields: Record<string, any> = {};
            additionalFields.forEach((field) => {
                if (field.type === 'file' && field.value) {
                    // Для файлов копируем весь объект с value
                    additional_fields[field.name] = {
                        type: field.type,
                        value: field.value
                    };
                } else {
                    // Для других типов только type
                    additional_fields[field.name] = { type: field.type };
                }
            });

            await addEvent({
                title: name,
                manager_email: email,
                department_id: selectedDepartment,
                priced: priced,
                price: priced ? price : 0,
                price_usd: priced && priceUsd > 0 ? priceUsd : undefined,
                without_period: withoutPeriod,
                additional_fields: Object.keys(additional_fields).length > 0 ? additional_fields : undefined,
                ...(withoutPeriod
                    ? {}
                    : { period_from: periodFrom!, period_till: periodTo! }
                ),
            });

            await fetchEvents()

            toast.success("Событие успешно создано!");
            setIsModalOpen(false);
            setName("");
            setEmail("");
            setPrice(0);
            setPriceUsd(0);
            setPriced(true);
            setWithoutPeriod(false);
            setSelectedDepartment("");
            setDates(null);
            setAdditionalFields([]);
            setErrors({
                name: false,
                email: false,
                department: false,
                price: false,
                priceUsd: false,
                dates: false,
            });
        } catch (err:any) {
            console.error("Failed to add event:", err);
            toast.error("Что-то пошло не так при добавлении события.");
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

            <CustomModal title={"Добавить событие"} isOpen={isModalOpen} className={"max-w-md w-full"} onClose={() => setIsModalOpen(false)}>
                <div className="flex flex-col gap-[21px]">
                    <CustomInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={<UserCircleIcon className={errors.name ? "text-red-500" : "text-[#6B9AB0]"} />}
                        placeholder="Название события"
                        className={errors.name ? "border border-red-500" : ""}
                    />

                    <CustomInput
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<EnvelopeIcon className={errors.email ? "text-red-500" : "text-[#6B9AB0]"} />}
                        placeholder="Email менеджера"
                        className={errors.email ? "border border-red-500" : ""}
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
                            id="priced"
                            checked={priced}
                            onChange={(e) => setPriced(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="priced" className="text-sm text-gray-700">
                            Фиксированная цена
                        </label>
                    </div>

                    {priced && (
                        <>
                            <CustomInput
                                value={String(price)}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                icon={<TengeIcon  color={errors.price ? "#fb2c36" : "#6B9AB0"} />}
                                placeholder="Введите цену в KZT (обязательно)"
                                type="number"
                                className={errors.price ? "border border-red-500" : ""}
                            />
                            <CustomInput
                                value={String(priceUsd)}
                                onChange={(e) => setPriceUsd(Number(e.target.value))}
                                icon={<CurrencyDollarIcon className={errors.priceUsd ? "text-red-500" : "text-[#6B9AB0]"} />}
                                placeholder="Введите цену в USD (опционально)"
                                type="number"
                                className={errors.priceUsd ? "border border-red-500" : ""}
                            />
                        </>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="withoutPeriod"
                            checked={withoutPeriod}
                            onChange={(e) => setWithoutPeriod(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="withoutPeriod" className="text-sm text-gray-700">
                            Без периода
                        </label>
                    </div>

                    {!withoutPeriod && (
                        <div className={`card flex justify-content-center ${errors.dates ? "border border-red-500 rounded-md" : ""}`}>
                            <Calendar
                                className="w-full rounded-md shadow-sm"
                                placeholder="Выберите диапазон дат"
                                value={dates}
                                onChange={(e) => setDates(e.value as Date[])}
                                selectionMode="range"
                                readOnlyInput
                                hideOnRangeSelection
                            />
                        </div>
                    )}

                    {/* Дополнительные поля */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Дополнительные поля</label>
                        <AddAdditionalFields 
                            value={additionalFields} 
                            onChange={setAdditionalFields} 
                        />
                    </div>

                    <CustomButton onClick={handleSubmit} className="w-full">
                        Добавить
                    </CustomButton>
                </div>
            </CustomModal>
        </>
    );
};

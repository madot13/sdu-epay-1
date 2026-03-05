import {FC, useEffect, useState} from "react";
import {getDepartments} from "@/api/endpoints/departments.ts";
import {Department} from "@/types/departments.ts";
import {CustomModal} from "@/ui/CustomModal.tsx";
import {CustomSelect} from "@/ui/CustomSelect.tsx";
import {CustomInput} from "@/ui/CustomInput.tsx";
import {useEventsStore} from "@/store/useEventsStore.ts";
import {toast} from "react-hot-toast";
import {
    InformationCircleIcon,
    TrashIcon,
    PlusIcon
} from "@heroicons/react/24/outline";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {Calendar} from "primereact/calendar";
import { getUsers } from "@/api/endpoints/users.ts";
import { IUser } from "@/types/users.ts";

interface CustomField {
    value: string;
}

interface EditEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: {
        id: string;
        title: string;
        manager_email: string;
        without_period: boolean;
        period_from: string;
        period_till: string;
        department: {
            id: string;
            name: string;
        };
        additional_fields?: Record<string, { type: string }>;
    };
}

export const EditEventsModal: FC<EditEventsModalProps> = ({isOpen, onClose, eventData}) => {
    const [title, setTitle] = useState(eventData.title);
    const [selectedManager, setSelectedManager] = useState(eventData.manager_email);
    const [withoutPeriod, setWithoutPeriod] = useState(eventData.without_period);
    const [selectedDepartment, setSelectedDepartment] = useState(eventData.department.id);
    const [dates, setDates] = useState<Date[] | null>(
        eventData.period_from && eventData.period_till
            ? [new Date(eventData.period_from), new Date(eventData.period_till)]
            : null
    );
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [errors, setErrors] = useState({
        title: false,
        manager: false,
        department: false,
        dates: false,
    });
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [managers, setManagers] = useState<{ label: string; value: string }[]>([]);

    const {updateEvent, fetchEvents} = useEventsStore();

    // Функции для управления дополнительными полями
    const addCustomField = () => {
        setCustomFields([...customFields, { value: "" }]);
    };

    const removeCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const updateCustomField = (index: number, field: 'value', value: string) => {
        const updatedFields = [...customFields];
        updatedFields[index][field] = value;
        setCustomFields(updatedFields);
    };

    useEffect(() => {
        if (isOpen) {
            setTitle(eventData.title);
            setSelectedManager(eventData.manager_email);
            setWithoutPeriod(eventData.without_period);
            setSelectedDepartment(eventData.department.id);
            setDates(
                eventData.period_from && eventData.period_till
                    ? [new Date(eventData.period_from), new Date(eventData.period_till)]
                    : null
            );
            const fields = eventData.additional_fields
                ? Object.entries(eventData.additional_fields).map(([, value]) => ({
                    value: (value as any).value || ''
                }))
                : [];
            setCustomFields(fields);
        }
    }, [isOpen, eventData]);

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

        const fetchManagers = async () => {
            try {
                const allUsersResponse = await getUsers();
                console.log("All users response:", allUsersResponse);
                
                const managers = allUsersResponse.data.filter((user: IUser) => 
                    user.role === "MANAGER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                );
                console.log("Filtered managers:", managers);
                
                const formatted = managers.map((user: IUser) => ({
                    label: `${user.name} (${user.username})`,
                    value: user.username,
                }));
                setManagers(formatted);
            } catch (error) {
                console.error("Failed to fetch managers:", error);
            }
        };

        fetchDepartments();
        fetchManagers();
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
            manager: !selectedManager || !emailRegex.test(selectedManager),
            department: !selectedDepartment,
            dates: !withoutPeriod && (!from || !till),
        };

        setErrors(newErrors);

        const messages: string[] = [];

        if (newErrors.title) messages.push("Название мероприятия обязательно.");
        if (newErrors.manager) messages.push("Email менеджера обязателен");
        if (newErrors.department) messages.push("Необходимо выбрать департамент");
        if (newErrors.dates) messages.push("Укажите период проведения мероприятия.");

        if (messages.length > 0) {
            messages.forEach((msg) => toast.error(msg));
            return;
        }

        try {
            // Подготавливаем additional_fields из customFields
            const additional_fields: Record<string, any> = {};
            customFields.forEach((field, index) => {
                if (field.value.trim()) {
                    additional_fields[`field_${index}`] = {
                        type: "text",
                        value: field.value
                    };
                }
            });

            const updatePayload = {
                title,
                manager_email: selectedManager,
                department_id: selectedDepartment,
                without_period: withoutPeriod,
                priced: false, // Добавляем чтобы бэкенд не требовал цену
                additional_fields: Object.keys(additional_fields).length > 0 ? additional_fields : undefined,
                ...(withoutPeriod
                    ? {}
                    : { period_from: from!, period_till: till! }
                ),
            };

            console.log("Full update payload:", updatePayload);

            await updateEvent(eventData.id, updatePayload);

            await fetchEvents();

            toast.success("Событие успешно обновлено!");
            onClose();
        } catch (err: any) {
            console.error("Failed to update event:", err);
            toast.error(err.response.data.detail?.[0]?.msg || "Ошибка при обновлении события");
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
                    className={errors.title ? "border border-red-500" : ""}
                />
                
                <CustomSelect
                        placeholder="Выберите менеджера"
                        options={managers}
                        value={selectedManager}
                        onChange={(value) => {
                            console.log("Selected manager:", value);
                            setSelectedManager(value);
                        }}
                        triggerClassName={`bg-white h-[50px] text-black ${errors.manager ? "border border-red-500" : ""}`}
                        dropdownClassName="bg-gray-100"
                        optionClassName="text-sm"
                        activeOptionClassName="bg-blue-200"
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
                    />
                )}

                {/* Дополнительные поля */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-start">
                        <CustomButton
                            variant="default"
                            className="h-[38px] font-bold gap-[5px] px-[20px] flex rounded-[4px]"
                            onClick={addCustomField}
                        >
                            <PlusIcon />
                            Добавить
                        </CustomButton>
                    </div>
                    
                    {customFields.map((field, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <CustomInput
                                placeholder="Значение"
                                value={field.value}
                                onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                                className="flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => removeCustomField(index)}
                                className="p-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <CustomButton onClick={handleSubmit} className="w-full">
                    Сохранить
                </CustomButton>
            </div>
        </CustomModal>
    );
};

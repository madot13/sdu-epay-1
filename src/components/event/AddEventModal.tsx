import { FC, useEffect, useState } from "react";
import { CustomButton } from "@/ui/CustomButton.tsx";
import {
    PlusIcon,
    UserCircleIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { Calendar } from "primereact/calendar";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { getDepartments } from "@/api/endpoints/departments.ts";
import { Department } from "@/types/departments.ts";
import { useEventsStore } from "@/store/useEventsStore.ts";
import { toast } from "react-hot-toast";
import { formatLocalDate } from "@/utils/formatLocalDate.ts";
import { getUsers } from "@/api/endpoints/users.ts";
import { IUser } from "@/types/users.ts";

interface CustomField {
    key: string;
    value: string;
}

export const AddEventModal: FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dates, setDates] = useState<Date[] | null>(null);
    const [name, setName] = useState("");
    const [selectedManager, setSelectedManager] = useState("");
    const [withoutPeriod, setWithoutPeriod] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [managers, setManagers] = useState<{ label: string; value: string }[]>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [errors, setErrors] = useState({
        name: false,
        manager: false,
        department: false,
        dates: false,
    });

    const { addEvent, fetchEvents } = useEventsStore();

    // Функции для управления дополнительными полями
    const addCustomField = () => {
        setCustomFields([...customFields, { key: "", value: "" }]);
    };

    const removeCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
        const updatedFields = [...customFields];
        updatedFields[index][field] = value;
        setCustomFields(updatedFields);
    };

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
                // Сначала пробуем получить всех пользователей
                const allUsersResponse = await getUsers();
                console.log("All users response:", allUsersResponse);
                
                // Затем фильтруем менеджеров
                const managers = allUsersResponse.data.filter((user: IUser) => 
                    user.role === "MANAGER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                );
                console.log("Filtered managers:", managers);
                
                const formatted = managers.map((user: IUser) => ({
                    label: `${user.name} (${user.username})`,
                    value: user.username, // Используем username как email
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

        const periodFrom = Array.isArray(dates) && dates[0] ? formatLocalDate(dates[0]) : null;
        const periodTo = Array.isArray(dates) && dates[1] ? formatLocalDate(dates[1]) : null;

        const newErrors = {
            name: !name,
            manager: !selectedManager || !emailRegex.test(selectedManager),
            department: !selectedDepartment,
            dates: !withoutPeriod && (!periodFrom || !periodTo),
        };

        setErrors(newErrors);

        const messages: string[] = [];

        if (newErrors.name) messages.push("Название мероприятия обязательно");
        if (newErrors.manager) messages.push("Email менеджера обязателен");
        if (newErrors.department) messages.push("Необходимо выбрать департамент");
        if (newErrors.dates) messages.push("Необходимо указать период проведения");

        if (messages.length > 0) {
            messages.forEach((msg) => toast.error(msg));
            return;
        }

        try {
            // Подготавливаем additional_fields из customFields
            const additional_fields: Record<string, any> = {};
            customFields.forEach((field) => {
                if (field.key.trim() && field.value.trim()) {
                    additional_fields[field.key] = {
                        type: "text",
                        value: field.value
                    };
                }
            });

            await addEvent({
                title: name,
                manager_email: selectedManager,
                department_id: selectedDepartment,
                without_period: withoutPeriod,
                additional_fields: Object.keys(additional_fields).length > 0 ? additional_fields : undefined,
                ...(withoutPeriod
                    ? {}
                    : { period_from: periodFrom!, period_till: periodTo! }
                ),
            });

            await fetchEvents();

            toast.success("Событие успешно создано!");
            setIsModalOpen(false);
            setName("");
            setSelectedManager("");
            setWithoutPeriod(false);
            setSelectedDepartment("");
            setDates(null);
            setCustomFields([]);
            setErrors({
                name: false,
                manager: false,
                department: false,
                dates: false,
            });
        } catch (err: any) {
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
                                    placeholder="Название поля"
                                    value={field.key}
                                    onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                                    className="flex-1"
                                />
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
                        Добавить
                    </CustomButton>
                </div>
            </CustomModal>
        </>
    );
};

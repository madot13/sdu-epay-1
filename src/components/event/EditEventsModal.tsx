import {FC, useEffect, useState} from "react";
import {getDepartments} from "@/api/endpoints/departments.ts";
import {Department} from "@/types/departments.ts";
import {CustomModal} from "@/ui/CustomModal.tsx";
import {CustomSelect} from "@/ui/CustomSelect.tsx";
import {CustomInput} from "@/ui/CustomInput.tsx";
import {useEventsStore} from "@/store/useEventsStore.ts";
import {toast} from "react-hot-toast";
import { AddAdditionalFields } from "@/components/department/AddAdditionalFields.tsx";
import {
    InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {Calendar} from "primereact/calendar";
import { getUsers } from "@/api/endpoints/users.ts";
import { IUser } from "@/types/users.ts";
import { FieldLabel } from "@/types/additionalFields.ts";

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
        active: boolean;
        department: {
            id: string;
            name: string;
            active: boolean;
        };
        additional_fields?: Record<string, { type: string; value?: any; label?: FieldLabel }>;
    };
}

export const EditEventsModal: FC<EditEventsModalProps> = ({isOpen, onClose, eventData}) => {
    const [title, setTitle] = useState(eventData.title);
    const [selectedManager, setSelectedManager] = useState(eventData.manager_email);
    const [withoutPeriod, setWithoutPeriod] = useState(eventData.without_period);
    const [selectedDepartment, setSelectedDepartment] = useState(eventData.department.id);
    const [isActive, setIsActive] = useState(eventData.active);
    const [dates, setDates] = useState<Date[] | null>(
        eventData.period_from && eventData.period_till
            ? [new Date(eventData.period_from), new Date(eventData.period_till)]
            : null
    );
    const [additionalFields, setAdditionalFields] = useState<{ name: string; type: string; value?: any; label?: FieldLabel }[]>([]);
    const [departments, setDepartments] = useState<{ label: string; value: string; active: boolean }[]>([]);
    const [errors, setErrors] = useState({
        title: false,
        manager: false,
        department: false,
        dates: false,
    });
    const [managers, setManagers] = useState<{ label: string; value: string }[]>([]);

    const {updateEvent, fetchEvents} = useEventsStore();

    useEffect(() => {
        if (isOpen) {
            setTitle(eventData.title);
            setSelectedManager(eventData.manager_email);
            setWithoutPeriod(eventData.without_period);
            setSelectedDepartment(eventData.department.id);
            setIsActive(eventData.active);
            console.log("Event data:", eventData);
            console.log("Department active:", eventData.department?.active);
            setDates(
                eventData.period_from && eventData.period_till
                    ? [new Date(eventData.period_from), new Date(eventData.period_till)]
                    : null
            );
            setErrors({
                title: false,
                manager: false,
                department: false,
                dates: false,
            });
            const fields = eventData.additional_fields && eventData.additional_fields !== null
                ? Object.entries(eventData.additional_fields).map(([key, value]) => ({
                    name: key,
                    type: value.type,
                    value: (value as any).value,
                    label: (value as any).label
                }))
                : [];
            setAdditionalFields(fields);
        }
    }, [isOpen, eventData]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await getDepartments({ active: true });
                const formatted = response.data.map((dept: Department) => ({
                    label: dept.name,
                    value: dept.id,
                    active: dept.active,
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
                
                // Фильтруем только активных менеджеров
                const managers = allUsersResponse.data.filter((user: IUser) => 
                    (user.role === "MANAGER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") && user.active === true
                );
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
            // Подготавливаем additional_fields
            const additional_fields: Record<string, any> = {};
            additionalFields.forEach((field) => {
                if (field.name.trim() && field.type) {
                    if (field.type === 'file') {
                        // Для file типа всегда включаем value, даже если пустое
                        additional_fields[field.name] = {
                            type: field.type,
                            label: field.label,
                            value: field.value || {
                                url: "",
                                key: "",
                                bucket: "",
                                filename: "",
                                content_type: "",
                                size: 0
                            }
                        };
                    } else {
                        // Для остальных типов включаем value только если оно есть
                        additional_fields[field.name] = {
                            type: field.type,
                            label: field.label,
                            ...(field.value && { value: field.value })
                        };
                    }
                }
            });

            const updatePayload: any = {
                title,
                manager_email: selectedManager,
                department_id: selectedDepartment,
                without_period: withoutPeriod,
                active: isActive,
                priced: false, // Добавляем чтобы бэкенд не требовал цену
                ...(withoutPeriod
                    ? {}
                    : { period_from: from!, period_till: till! }
                ),
            };

            // Only add additional_fields if it has content
            if (Object.keys(additional_fields).length > 0) {
                updatePayload.additional_fields = additional_fields;
            }

            await updateEvent(eventData.id, updatePayload);

            await fetchEvents();

            toast.success("Событие успешно обновлено!");
            onClose();
        } catch (err: any) {
            console.error("Failed to update event:", err);
            toast.error(err.response.data.detail?.[0]?.msg || "Ошибка при обновлении события");
            setAdditionalFields([]);
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

                <AddAdditionalFields value={additionalFields} onChange={setAdditionalFields} />

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={!eventData.department?.active}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                        Активное событие
                        {!eventData.department?.active && (
                            <span className="ml-2 text-xs text-orange-600">
                                (Департамент неактивен)
                            </span>
                        )}
                    </label>
                </div>

                <CustomButton onClick={handleSubmit} className="w-full">
                    Сохранить
                </CustomButton>
            </div>
        </CustomModal>
    );
};

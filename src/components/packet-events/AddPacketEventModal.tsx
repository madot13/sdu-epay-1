import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { PlusIcon, EnvelopeIcon, UserCircleIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { getDepartments } from "@/api/endpoints/departments.ts";
import { getPublicEventsById } from "@/api/endpoints/events.ts";
import { Department } from "@/types/departments.ts";
import { IEvent } from "@/types/events.ts";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { PaymentFormAdditionalFields } from "./PaymentFormAdditionalFields.tsx";
import { AddAdditionalFields } from "@/components/department/AddAdditionalFields.tsx";

export const AddPacketEventModal: FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Обязательные поля
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [price, setPrice] = useState(0);
    const [priceUsd, setPriceUsd] = useState(0);
    const [showInUsd, setShowInUsd] = useState(false);
    const [active] = useState(true);

    // Дополнительные поля на каждом уровне
    const [departmentFields, setDepartmentFields] = useState<Record<string, { type: string }>>({});
    const [departmentFieldsValues, setDepartmentFieldsValues] = useState<Record<string, any>>({});
    
    const [eventFields, setEventFields] = useState<Record<string, { type: string }>>({});
    const [eventFieldsValues, setEventFieldsValues] = useState<Record<string, any>>({});
    
    const [category, setCategory] = useState("");
    const [categoryFields, setCategoryFields] = useState<Record<string, { type: string }>>({});
    const [categoryFieldsValues, setCategoryFieldsValues] = useState<Record<string, any>>({});

    // Данные для селектов
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [events, setEvents] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await getDepartments();
                setDepartments(res.data.map((d: Department) => ({ label: d.name, value: d.id })));
            } catch (e) { console.error(e); }
        };
        if (isOpen) fetchDepts();
    }, [isOpen]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (department) {
                try {
                    const eventsData = await getPublicEventsById(department);
                    setEvents(eventsData
                        .filter((event: IEvent) => event.title && event.id)
                        .map((event: IEvent) => ({ 
                            label: event.title!, 
                            value: event.id! 
                        })));
                } catch (e) { 
                    console.error(e); 
                    setEvents([]);
                }
            } else {
                setEvents([]);
            }
        };
        fetchEvents();
    }, [department]);

    useEffect(() => {
        // Загружаем поля события
        if (selectedEvent) {
            // Здесь нужно будет загрузить данные события включая additional_fields
            // Временно заглушка
            setEventFields({});
            setEventFieldsValues({});
        } else {
            setEventFields({});
            setEventFieldsValues({});
        }
    }, [selectedEvent]);

    useEffect(() => {
        // Загружаем категории если у события есть категории
        if (selectedEvent && eventFields) {
            // Здесь нужно будет загрузить категории для события
            // Временно заглушка - категории пока не реализованы
            console.log("Categories for event will be loaded here");
        }
    }, [selectedEvent, eventFields]);

    useEffect(() => {
        // Загружаем поля категории
        if (category) {
            // Здесь нужно будет загрузить поля категории
            // Временно заглушка
            setCategoryFields({});
            setCategoryFieldsValues({});
        } else {
            setCategoryFields({});
            setCategoryFieldsValues({});
        }
    }, [category]);

    const handleSubmit = async () => {
        if (!email || !department || !selectedEvent) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            return;
        }

        if (price < 0) {
            toast.error("Цена в KZT не может быть отрицательной");
            return;
        }

        if (priceUsd < 0) {
            toast.error("Цена в USD не может быть отрицательной");
            return;
        }

        try {
            // Объединяем все дополнительные поля
            const allAdditionalFields: Record<string, any> = {};
            
            // Поля департамента
            Object.entries(departmentFieldsValues).forEach(([key, value]) => {
                const fieldType = departmentFields[key]?.type || 'text';
                if (fieldType === 'file' && value && typeof value === 'object' && (value as any).file) {
                    allAdditionalFields[key] = {
                        type: 'file',
                        value: {
                            name: (value as any).file.name,
                            size: (value as any).file.size,
                            type: (value as any).file.type,
                            url: (value as any).url
                        }
                    };
                } else {
                    allAdditionalFields[key] = {
                        type: fieldType,
                        value: value
                    };
                }
            });
            
            // Поля события
            Object.entries(eventFieldsValues).forEach(([key, value]) => {
                const fieldType = eventFields[key]?.type || 'text';
                if (fieldType === 'file' && value && typeof value === 'object' && (value as any).file) {
                    allAdditionalFields[key] = {
                        type: 'file',
                        value: {
                            name: (value as any).file.name,
                            size: (value as any).file.size,
                            type: (value as any).file.type,
                            url: (value as any).url
                        }
                    };
                } else {
                    allAdditionalFields[key] = {
                        type: fieldType,
                        value: value
                    };
                }
            });
            
            // Поля категории
            Object.entries(categoryFieldsValues).forEach(([key, value]) => {
                const fieldType = categoryFields[key]?.type || 'text';
                if (fieldType === 'file' && value && typeof value === 'object' && (value as any).file) {
                    allAdditionalFields[key] = {
                        type: 'file',
                        value: {
                            name: (value as any).file.name,
                            size: (value as any).file.size,
                            type: (value as any).file.type,
                            url: (value as any).url
                        }
                    };
                } else {
                    allAdditionalFields[key] = {
                        type: fieldType,
                        value: value
                    };
                }
            });

            await packetEventsApi.create({
                event_id: selectedEvent,
                email: email,
                category: category || undefined,
                price: price,
                price_usd: showInUsd ? priceUsd : undefined,
                active: active,
                additional_fields: Object.keys(allAdditionalFields).length > 0 ? allAdditionalFields : undefined
            });

            toast.success("Запись успешно добавлена");
            setIsOpen(false);
            onRefresh(); // Обновляем таблицу
            // Очистка полей
            setEmail(""); 
            setDepartment(""); 
            setSelectedEvent(""); 
            setPrice(0); 
            setPriceUsd(0); 
            setCategory(""); 
            setShowInUsd(false);
            setDepartmentFieldsValues({});
            setEventFieldsValues({});
            setCategoryFieldsValues({});
        } catch (error) {
            toast.error("Ошибка при создании");
        }
    };

    return (
        <>
            <CustomButton 
                variant="submit" 
                className="h-[38px] font-bold gap-[5px] px-[20px] flex rounded-[4px]"
                onClick={() => setIsOpen(true)}
            >
                <PlusIcon />
                Добавить
            </CustomButton>

            <CustomModal title="Добавить тип оплаты" isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md w-full">
                <div className="flex flex-col gap-5">
                    <CustomInput 
                        placeholder="Email ответственного" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<EnvelopeIcon className="text-[#6B9AB0]" />} 
                    />

                    <CustomSelect
                        placeholder="Выберите департамент"
                        options={departments}
                        value={department}
                        onChange={(value) => {
                            setDepartment(value);
                            setSelectedEvent(""); // Reset event on department change
                        }}
                        triggerClassName="bg-white border-[#6B9AB0] h-[45px]"
                    />

                    {department && (
                        <CustomSelect 
                            placeholder="Выберите событие"
                            options={events}
                            value={selectedEvent}
                            onChange={setSelectedEvent}
                            triggerClassName="bg-white border-[#6B9AB0] h-[45px]"
                        />
                    )}

                    <CustomInput 
                        placeholder="Категория платежа" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        icon={<UserCircleIcon className="text-[#6B9AB0]" />} 
                    />

                    {/* Дополнительные поля департамента */}
                    <PaymentFormAdditionalFields
                        departmentId={department}
                        values={departmentFieldsValues}
                        onChange={setDepartmentFieldsValues}
                        onFieldsLoad={setDepartmentFields}
                    />

                    {/* Кастомные дополнительные поля */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Дополнительные поля события</label>
                        <AddAdditionalFields 
                            value={[]} 
                            onChange={() => {}} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <CustomInput 
                            type="number" 
                            placeholder="Сумма KZT" 
                            value={String(price)} 
                            onChange={(e) => setPrice(Number(e.target.value))}
                            icon={<span className="text-[#6B9AB0]">₸</span>} 
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showInUsd"
                                checked={showInUsd}
                                onChange={(e) => setShowInUsd(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="showInUsd" className="text-sm text-gray-700">
                                Показать в USD
                            </label>
                        </div>
                    </div>

                    {showInUsd && (
                        <CustomInput 
                            type="number" 
                            placeholder="Сумма USD" 
                            value={String(priceUsd)} 
                            onChange={(e) => setPriceUsd(Number(e.target.value))}
                            icon={<CurrencyDollarIcon className="text-[#6B9AB0]" />} 
                        />
                    )}
                    <CustomButton onClick={handleSubmit} className="w-full mt-2">
                        Создать запись
                    </CustomButton>
                </div>
            </CustomModal>
        </>
    );
};

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
import { AddAdditionalFields } from "@/components/department/AddAdditionalFields.tsx";

export const AddPacketEventModal: FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Обязательные поля
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [price, setPrice] = useState(0);
    const [priceUsd, setPriceUsd] = useState(0);
    const [withoutFixedPrice, setWithoutFixedPrice] = useState(false);

    // Дополнительные поля на каждом уровне
    const [paymentTypeCustomFields, setPaymentTypeCustomFields] = useState<{name:string; type:string; value?: any}[]>([]);
    
    const [category, setCategory] = useState("");

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
            
            // Кастомные поля типа платежа
            paymentTypeCustomFields.forEach((field) => {
                if (field.type === 'file' && field.value) {
                    // Для файлов копируем весь объект с value
                    allAdditionalFields[field.name] = {
                        type: field.type,
                        value: field.value
                    };
                } else {
                    // Для других типов только type
                    allAdditionalFields[field.name] = { type: field.type };
                }
            });

            await packetEventsApi.create({
                event_id: selectedEvent,
                email: email,
                category: category || undefined,
                priced: !withoutFixedPrice,
                price: withoutFixedPrice ? 0 : price,
                price_usd: withoutFixedPrice ? 0 : (priceUsd > 0 ? priceUsd : undefined),
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
            setWithoutFixedPrice(false);
            setPaymentTypeCustomFields([]);
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

            <CustomModal title="Добавить тип оплаты" isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex flex-col gap-5 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
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

                    {/* Дополнительные поля типа платежа */}
                    {selectedEvent && (
                        <>
                            <CustomInput 
                                placeholder="Категория платежа" 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                icon={<UserCircleIcon className="text-[#6B9AB0]" />} 
                            />
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">Дополнительные поля типа платежа</label>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {paymentTypeCustomFields.length} полей
                                    </span>
                                </div>
                                <AddAdditionalFields 
                                    value={paymentTypeCustomFields} 
                                    onChange={setPaymentTypeCustomFields} 
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="withoutFixedPrice"
                            checked={withoutFixedPrice}
                            onChange={(e) => setWithoutFixedPrice(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="withoutFixedPrice" className="text-sm text-gray-700">
                            Без фиксированной цены
                        </label>
                    </div>

                    {!withoutFixedPrice && (
                        <div className="flex flex-col gap-4">
                            <CustomInput 
                                type="number" 
                                placeholder="Сумма KZT" 
                                value={String(price)} 
                                onChange={(e) => setPrice(Number(e.target.value))}
                                icon={<span className="text-[#6B9AB0]">₸</span>} 
                            />
                            <CustomInput 
                                type="number" 
                                placeholder="Сумма USD" 
                                value={String(priceUsd)} 
                                onChange={(e) => setPriceUsd(Number(e.target.value))}
                                icon={<CurrencyDollarIcon className="text-[#6B9AB0]" />} 
                            />
                        </div>
                    )}
                    
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 mt-4">
                        <CustomButton onClick={handleSubmit} className="w-full">
                            Создать запись
                        </CustomButton>
                    </div>
                </div>
            </CustomModal>
        </>
    );
};

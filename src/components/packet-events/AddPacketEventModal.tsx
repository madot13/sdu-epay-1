import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { EnvelopeIcon, UserCircleIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { getDepartments } from "@/api/endpoints/departments.ts";
import { getPublicEventsById } from "@/api/endpoints/events.ts";
import { Department } from "@/types/departments.ts";
import { IEvent } from "@/types/events.ts";
import { packetEventsApi } from "@/api/endpoints/packet-events";

export const AddPacketEventModal: FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Поля на основе твоего IEventRecord
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [price, setPrice] = useState(1000); // ← По умолчанию > 0
    const [priceUsd, setPriceUsd] = useState(5); // ← По умолчанию > 0
    const [category, setCategory] = useState("");
    const [active] = useState(true); // ← Убрали setActive, оставили по умолчанию true

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

        if (price <= 0) {
            toast.error("Цена в KZT должна быть больше 0");
            return;
        }

        if (priceUsd <= 0) {
            toast.error("Цена в USD должна быть больше 0");
            return;
        }

        try {
            await packetEventsApi.create({
                event_id: selectedEvent,
                email: email,
                category: category,
                price: price,
                price_usd: priceUsd,
                active: active
            });

            toast.success("Запись успешно добавлена");
            setIsOpen(false);
            onRefresh(); // Обновляем таблицу
            // Очистка полей
            setEmail(""); setDepartment(""); setSelectedEvent(""); setPrice(1000); setPriceUsd(5); setCategory("");
        } catch (error) {
            toast.error("Ошибка при создании");
        }
    };

    return (
        <>
            <CustomButton 
                variant="submit" 
                className="h-[38px] font-bold gap-2 px-4 flex items-center"
                onClick={() => setIsOpen(true)}
            >
                <PlusIcon width={18}/> Добавить
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

                    <div className="grid grid-cols-2 gap-4">
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
                    <CustomButton onClick={handleSubmit} className="w-full mt-2">
                        Создать запись
                    </CustomButton>
                </div>
            </CustomModal>
        </>
    );
};

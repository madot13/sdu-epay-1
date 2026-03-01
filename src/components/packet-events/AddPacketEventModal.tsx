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
import { toast } from "react-hot-toast";
import { TengeIcon } from "@/assets/TengeIcon.tsx";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { getPublicEventsById } from "@/api/endpoints/events.ts";
import { IEvent } from "@/types/events.ts";

export const AddPacketEventModal: FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Поля на основе твоего IEventRecord
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [price, setPrice] = useState(0);
    const [priceUsd, setPriceUsd] = useState(0);
    const [category, setCategory] = useState("");
    const [dates, setDates] = useState<Date[] | null>(null);

    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [events, setEvents] = useState<{ label: string; value: string }[]>([]);
    const [eventsData, setEventsData] = useState<IEvent[]>([]);

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
                    setEventsData(eventsData);
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
                setEventsData([]);
            }
        };
        fetchEvents();
    }, [department]);

    const handleSubmit = async () => {
        if (!email || !department || !selectedEvent || !dates || dates.length < 2) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            return;
        }

        try {
            const selectedEventData = eventsData.find(event => event.id === selectedEvent);
            await packetEventsApi.create({
                event_name: selectedEventData?.title || '',
                event_id: selectedEvent,
                department: department,
                email: email,
                period_from: dates[0].toISOString().split('T')[0],
                period_to: dates[1].toISOString().split('T')[0],
                category: category,
                price: price,
                price_usd: priceUsd
            });

            toast.success("Запись успешно добавлена");
            setIsOpen(false);
            onRefresh(); // Обновляем таблицу
            // Очистка полей
            setEmail(""); setDepartment(""); setSelectedEvent(""); setPrice(0); setPriceUsd(0); setCategory(""); setDates(null);
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
                            setSelectedEvent(""); // Сбрасываем выбранное событие при смене департамента
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
                            icon={<TengeIcon color="#6B9AB0" />} 
                        />
                        <CustomInput 
                            type="number" 
                            placeholder="Сумма USD" 
                            value={String(priceUsd)} 
                            onChange={(e) => setPriceUsd(Number(e.target.value))}
                            icon={<CurrencyDollarIcon className="text-[#6B9AB0]" />} 
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Период проведения:</label>
                        <Calendar 
                            value={dates} 
                            onChange={(e) => setDates(e.value as Date[])} 
                            selectionMode="range" 
                            readOnlyInput 
                            className="w-full h-[40px] border border-[#6B9AB0] rounded-md"
                            placeholder="Выберите даты"
                        />
                    </div>

                    <CustomButton onClick={handleSubmit} className="w-full mt-2">
                        Создать запись
                    </CustomButton>
                </div>
            </CustomModal>
        </>
    );
};

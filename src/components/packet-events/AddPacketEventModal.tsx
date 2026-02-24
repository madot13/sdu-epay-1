import { FC, useEffect, useState } from "react";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { 
    EnvelopeIcon, 
    PlusIcon, 
    UserCircleIcon, 
    CurrencyDollarIcon,
    InformationCircleIcon 
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

export const AddPacketEventModal: FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Поля на основе твоего IEventRecord
    const [eventName, setEventName] = useState("");
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState("");
    const [amountKzt, setAmountKzt] = useState(0);
    const [amountUsd, setAmountUsd] = useState(0);
    const [paymentCategory, setPaymentCategory] = useState("");
    const [dates, setDates] = useState<Date[] | null>(null);

    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await getDepartments();
                setDepartments(res.data.map((d: Department) => ({ label: d.name, value: d.name })));
            } catch (e) { console.error(e); }
        };
        if (isOpen) fetchDepts();
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!eventName || !email || !department || !dates || dates.length < 2) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            return;
        }

        try {
            await packetEventsApi.create({
                event_name: eventName,
                department: department,
                email: email,
                period_from: dates[0].toISOString().split('T')[0],
                period_to: dates[1].toISOString().split('T')[0],
                payment_category: paymentCategory,
                amount_kzt: amountKzt,
                amount_usd: amountUsd
            });

            toast.success("Запись успешно добавлена");
            setIsOpen(false);
            onRefresh(); // Обновляем таблицу
            // Очистка полей
            setEventName(""); setEmail(""); setAmountKzt(0); setDates(null);
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
                <PlusIcon width={18}/> Добавить пакет
            </CustomButton>

            <CustomModal title="Добавить пакетное событие" isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md w-full">
                <div className="flex flex-col gap-5">
                    <CustomInput 
                        placeholder="Название события" 
                        value={eventName} 
                        onChange={(e) => setEventName(e.target.value)}
                        icon={<InformationCircleIcon className="text-[#6B9AB0]" />} 
                    />
                    
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
                        onChange={setDepartment}
                        triggerClassName="bg-white border-[#6B9AB0] h-[45px]"
                    />

                    <CustomInput 
                        placeholder="Категория платежа" 
                        value={paymentCategory} 
                        onChange={(e) => setPaymentCategory(e.target.value)}
                        icon={<UserCircleIcon className="text-[#6B9AB0]" />} 
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <CustomInput 
                            type="number" 
                            placeholder="Сумма KZT" 
                            value={String(amountKzt)} 
                            onChange={(e) => setAmountKzt(Number(e.target.value))}
                            icon={<TengeIcon color="#6B9AB0" />} 
                        />
                        <CustomInput 
                            type="number" 
                            placeholder="Сумма USD" 
                            value={String(amountUsd)} 
                            onChange={(e) => setAmountUsd(Number(e.target.value))}
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
                            placeholder="Выберите даты"
                            className="w-full border border-[#6B9AB0] rounded-md"
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
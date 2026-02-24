import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { IEventRecord } from "@/types/packetevents";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { toast } from "react-hot-toast";
import { Calendar } from "primereact/calendar";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    eventData: IEventRecord;
    onSuccess: () => void;
}

export const EditPacketEventsModal: FC<Props> = ({ isOpen, onClose, eventData, onSuccess }) => {
    const [form, setForm] = useState<IEventRecord>({ ...eventData });
    const [dates, setDates] = useState<Date[] | null>(null);

    useEffect(() => {
        setForm({ ...eventData });
        if (eventData.period_from && eventData.period_to) {
            setDates([new Date(eventData.period_from), new Date(eventData.period_to)]);
        }
    }, [eventData, isOpen]);

    const handleSave = async () => {
        // Проверка на наличие ID (решает ошибку 2345)
        if (!eventData.id) {
            toast.error("ID события не найден");
            return;
        }

        try {
            const payload = {
                ...form,
                period_from: dates?.[0]?.toISOString().split('T')[0] || form.period_from,
                period_to: dates?.[1]?.toISOString().split('T')[0] || form.period_to,
            };
            
            await packetEventsApi.update(eventData.id, payload);
            toast.success("Данные успешно обновлены");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Ошибка обновления");
        }
    };

    return (
        <CustomModal title="Редактировать пакет" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-5 mt-2">
                {/* Исправляем ошибку 2322: выносим label наружу */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Название</label>
                    <CustomInput 
                        value={form.event_name} 
                        onChange={(e) => setForm({...form, event_name: e.target.value})} 
                        placeholder="Введите название..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <CustomInput 
                        value={form.email} 
                        onChange={(e) => setForm({...form, email: e.target.value})} 
                        placeholder="example@mail.com"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Период</label>
                    <Calendar 
                        value={dates} 
                        onChange={(e) => setDates(e.value as Date[])} 
                        selectionMode="range" 
                        readOnlyInput 
                        className="w-full h-[40px] border border-[#6B9AB0] rounded-md"
                        placeholder="Выберите даты"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <CustomButton onClick={handleSave} className="flex-1">
                        Сохранить
                    </CustomButton>
                    <CustomButton variant="cancel" onClick={onClose} className="flex-1">
                        Отмена
                    </CustomButton>
                </div>
            </div>
        </CustomModal>
    );
};
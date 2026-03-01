import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { IEventRecord } from "@/types/packetevents";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { toast } from "react-hot-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    eventData: IEventRecord;
    onSuccess: () => void;
}

export const EditPacketEventsModal: FC<Props> = ({ isOpen, onClose, eventData, onSuccess }) => {
    const [form, setForm] = useState<IEventRecord>({} as IEventRecord);
    const [withoutFixedPrice, setWithoutFixedPrice] = useState(false);

    useEffect(() => {
        setForm({ ...eventData });
        // Устанавливаем чекбокс если цены 0 или не заданы
        setWithoutFixedPrice((eventData.price || 0) === 0 && (eventData.price_usd || 0) === 0);
    }, [eventData, isOpen]);

    const handleSave = async () => {
        // Проверка на наличие ID (решает ошибку 2345)
        if (!eventData.id) {
            toast.error("ID события не найден");
            return;
        }

        // Валидация цен только если не выбран "без фиксированной цены"
        if (!withoutFixedPrice) {
            if ((form.price || 0) <= 0) {
                toast.error("Цена в KZT должна быть больше 0");
                return;
            }

            if ((form.price_usd || 0) <= 0) {
                toast.error("Цена в USD должна быть больше 0");
                return;
            }
        }

        try {
            await packetEventsApi.update(eventData.id, {
                ...form,
                price: withoutFixedPrice ? 0 : (form.price || 0),
                price_usd: withoutFixedPrice ? 0 : (form.price_usd || 0)
            });
            toast.success("Данные успешно обновлены");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Ошибка обновления");
        }
    };

    return (
        <CustomModal title="Редактировать тип оплаты" isOpen={isOpen} onClose={onClose}>
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
                    <label className="text-sm font-medium">Категория</label>
                    <CustomInput 
                        value={form.category} 
                        onChange={(e) => setForm({...form, category: e.target.value})} 
                        placeholder="Категория платежа"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Цена KZT</label>
                        <CustomInput 
                            type="number"
                            value={String(form.price)} 
                            onChange={(e) => setForm({...form, price: Number(e.target.value)})} 
                            placeholder="0"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Цена USD</label>
                        <CustomInput 
                            type="number"
                            value={String(form.price_usd)} 
                            onChange={(e) => setForm({...form, price_usd: Number(e.target.value)})} 
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="without-fixed-price-edit"
                        checked={withoutFixedPrice}
                        onChange={(e) => setWithoutFixedPrice(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#6B9AB0]"
                    />
                    <label htmlFor="without-fixed-price-edit" className="text-sm font-medium text-gray-700">
                        Без фиксированной цены
                    </label>
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

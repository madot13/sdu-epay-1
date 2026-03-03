import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { EnvelopeIcon, UserCircleIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { getPublicEventsById } from "@/api/endpoints/events.ts";
import { IEvent } from "@/types/events.ts";
import { IEventRecord } from "@/types/packetevents";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    eventData: IEventRecord;
    onSuccess: () => void;
}

export const EditPacketEventsModal: FC<Props> = ({ isOpen, onClose, eventData, onSuccess }) => {
    const [form, setForm] = useState<IEventRecord>({} as IEventRecord);
    const [events, setEvents] = useState<{ label: string; value: string }[]>([]);
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
        <CustomModal title="Редактировать тип оплаты" isOpen={isOpen} className={"max-w-md w-full"} onClose={onClose}>
            <div className="flex flex-col gap-[21px]">
                <CustomInput
                    icon={<EnvelopeIcon className="text-[#6B9AB0]" />}
                    placeholder="Email ответственного"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                />
                
                <CustomSelect
                    placeholder="Выберите событие"
                    options={events}
                    value={form.event_id || ""}
                    onChange={(value: string) => setForm({...form, event_id: value})}
                    triggerClassName="bg-white h-[50px] text-black"
                    dropdownClassName="bg-gray-100"
                    optionClassName="text-sm"
                    activeOptionClassName="bg-blue-200"
                />
                
                <CustomInput
                    icon={<UserCircleIcon className="text-[#6B9AB0]" />}
                    placeholder="Категория платежа"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                />
                
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="without-fixed-price-edit"
                        checked={withoutFixedPrice}
                        onChange={(e) => setWithoutFixedPrice(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="without-fixed-price-edit" className="text-sm text-gray-700">
                        Без фиксированной цены
                    </label>
                </div>

                {!withoutFixedPrice && (
                    <>
                        <CustomInput
                            icon={<span className="text-[#6B9AB0]">₸</span>}
                            placeholder="Цена в KZT"
                            type="number"
                            value={String(form.price)}
                            onChange={(e) => setForm({...form, price: Number(e.target.value)})}
                        />
                        <CustomInput
                            icon={<CurrencyDollarIcon className="text-[#6B9AB0]" />}
                            placeholder="Цена в USD"
                            type="number"
                            value={String(form.price_usd)}
                            onChange={(e) => setForm({...form, price_usd: Number(e.target.value)})}
                        />
                    </>
                )}

                <CustomButton onClick={handleSave} className="w-full">
                    Сохранить
                </CustomButton>
            </div>
        </CustomModal>
    );
};

import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { EnvelopeIcon, UserCircleIcon, CurrencyDollarIcon, TagIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { IEventRecord } from "@/types/packetevents";
import { AddAdditionalFields } from "@/components/department/AddAdditionalFields.tsx";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    eventData: IEventRecord;
    onSuccess: () => void;
}

export const EditPacketEventsModal: FC<Props> = ({ isOpen, onClose, eventData, onSuccess }) => {
    const [form, setForm] = useState<IEventRecord>({} as IEventRecord);
    const [withoutFixedPrice, setWithoutFixedPrice] = useState(false);
    const [customFields, setCustomFields] = useState<{name:string; type:string; value?: any}[]>([]);

    useEffect(() => {
        setForm({ ...eventData });
        // Устанавливаем чекбокс если цены 0 или не заданы
        setWithoutFixedPrice((eventData.price || 0) === 0 && (eventData.price_usd || 0) === 0);
        
        // Загружаем дополнительные поля если они есть
        if (eventData.additional_fields) {
            const fields = Object.entries(eventData.additional_fields).map(([name, config]) => ({
                name,
                type: config.type,
                value: config.value || ''
            }));
            setCustomFields(fields);
        }
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
            // Объединяем все дополнительные поля
            const allAdditionalFields: Record<string, any> = {};
            
            // Кастомные поля типа платежа
            customFields.forEach((field) => {
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

            await packetEventsApi.update(eventData.id, {
                ...form,
                price: withoutFixedPrice ? 0 : (form.price || 0),
                price_usd: withoutFixedPrice ? 0 : (form.price_usd || 0),
                additional_fields: Object.keys(allAdditionalFields).length > 0 ? allAdditionalFields : undefined
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
        <CustomModal title="Редактировать тип платежа" isOpen={isOpen} className={"max-w-md w-full"} onClose={onClose}>
            <div className="flex flex-col gap-[21px]">
                <CustomInput
                    icon={<EnvelopeIcon className="text-[#6B9AB0]" />}
                    placeholder="Email ответственного"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                />
                
                <CustomInput
                    icon={<UserCircleIcon className="text-[#6B9AB0]" />}
                    placeholder="Событие"
                    value={form.title || ""}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                />
                
                <CustomInput
                    icon={<TagIcon className="text-[#6B9AB0]" />}
                    placeholder="Категория платежа"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                />
                
                {/* Дополнительные поля типа платежа */}
                <div className="flex flex-col gap-2">
                    <AddAdditionalFields 
                        value={customFields} 
                        onChange={setCustomFields} 
                    />
                </div>
                
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

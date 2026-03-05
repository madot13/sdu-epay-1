import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { UserCircleIcon, CurrencyDollarIcon, TagIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { IEventRecord } from "@/types/packetevents";
import { AddAdditionalFields } from "@/components/department/AddAdditionalFields.tsx";
import { getUsers } from "@/api/endpoints/users.ts";
import { IUser } from "@/types/users.ts";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    eventData: IEventRecord;
    onSuccess: () => void;
}

export const EditPacketEventsModal: FC<Props> = ({ isOpen, onClose, eventData, onSuccess }) => {
    const [form, setForm] = useState<IEventRecord>({} as IEventRecord);
    const [withoutFixedPrice, setWithoutFixedPrice] = useState(false);
    const [isMain, setIsMain] = useState(false); // Добавляем состояние для главного типа оплаты
    const [customFields, setCustomFields] = useState<{name:string; type:string; value?: any}[]>([]);
    const [managers, setManagers] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        setForm({ ...eventData });
        // Устанавливаем чекбокс если цены 0 или не заданы
        setWithoutFixedPrice((eventData.price || 0) === 0 && (eventData.price_usd || 0) === 0);
        // Устанавливаем главный тип оплаты
        setIsMain(eventData.main || false);
        
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

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const allUsersResponse = await getUsers();
                console.log("All users response:", allUsersResponse);
                
                // Фильтруем только активных менеджеров
                const managers = allUsersResponse.data.filter((user: IUser) => 
                    (user.role === "MANAGER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") && user.active === true
                );
                console.log("Filtered managers:", managers);
                
                const formatted = managers.map((user: IUser) => ({
                    label: `${user.name} (${user.username})`,
                    value: user.username,
                }));
                setManagers(formatted);
            } catch (error) {
                console.error("Failed to fetch managers:", error);
            }
        };

        fetchManagers();
    }, []);

    const handleSave = async () => {
        // Проверка на наличие ID (решает ошибку 2345)
        if (!eventData.id) {
            toast.error("ID события не найден");
            return;
        }

        // Валидация цен: хотя бы одно поле должно быть >= 0
        if (!withoutFixedPrice && (form.price || 0) < 0 && (form.price_usd || 0) < 0) {
            toast.error("Хотя бы одна цена должна быть больше или равна 0");
            return;
        }

        // Валидация цен только если не выбран "без фиксированной цены"
        if (!withoutFixedPrice) {
            if ((form.price || 0) < 0) {
                toast.error("Цена в KZT должна быть больше 0");
                return;
            }

            if ((form.price_usd || 0) < 0) {
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

            // Сначала обновляем текущий тип оплаты
            await packetEventsApi.update(eventData.id, {
                ...form,
                price: withoutFixedPrice ? 0 : (form.price || 0),
                price_usd: withoutFixedPrice ? 0 : (form.price_usd || 0),
                main: isMain, // Добавляем главный тип оплаты
                additional_fields: Object.keys(allAdditionalFields).length > 0 ? allAdditionalFields : undefined
            });

            // Затем, если этот тип оплаты отмечен как Main, снимаем флаг с других типов
            if (isMain) {
                await packetEventsApi.clearMainFlag(eventData.event_id!, eventData.id!);
                console.log("🔍 Cleared main flag from other payment types for event:", eventData.event_id);
            }

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
                <CustomSelect
                    placeholder="Выберите менеджера"
                    options={managers}
                    value={form.email}
                    onChange={(value) => setForm({...form, email: value})}
                    triggerClassName="bg-white h-[50px] text-black"
                    dropdownClassName="bg-gray-100"
                    optionClassName="text-sm"
                    activeOptionClassName="bg-blue-200"
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

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is-main-edit"
                        checked={isMain}
                        onChange={(e) => setIsMain(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is-main-edit" className="text-sm text-gray-700">
                        Главный тип оплаты (Main)
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

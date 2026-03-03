import { FC, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { toast } from "react-hot-toast";
import { addEvent } from "@/api/endpoints/events.ts"; // ← Исправляем на addEvent

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (event: { label: string; value: string }) => void;
    departmentId: string;
}

export const AddEventModal: FC<Props> = ({ isOpen, onClose, onSuccess, departmentId }) => {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Введите название события");
            return;
        }

        if (!departmentId) {
            toast.error("Сначала выберите департамент");
            return;
        }

        setLoading(true);
        try {
            const response = await addEvent({ title, department_id: departmentId });
            
            const newEvent = {
                label: title,
                value: response.id || Date.now().toString()
            };
            
            onSuccess(newEvent);
            toast.success("Событие успешно добавлено");
            onClose();
            setTitle("");
        } catch (error) {
            toast.error("Ошибка при создании события");
        } finally {
            setLoading(false);
        }
    };

    return (
        <CustomModal title="Добавить событие" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-5">
                <CustomInput
                    placeholder="Название события"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                
                <div className="flex gap-3 pt-2">
                    <CustomButton onClick={handleSubmit} className="flex-1" disabled={loading}>
                        {loading ? "Создание..." : "Создать"}
                    </CustomButton>
                    <CustomButton variant="cancel" onClick={onClose} className="flex-1">
                        Отмена
                    </CustomButton>
                </div>
            </div>
        </CustomModal>
    );
};

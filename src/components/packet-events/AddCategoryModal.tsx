import { FC, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { toast } from "react-hot-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (category: string) => void;
}

export const AddCategoryModal: FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Введите название категории");
            return;
        }

        setLoading(true);
        try {
            // TODO: Добавить API вызов для создания категории
            // const response = await categoriesApi.create({ name });
            
            onSuccess(name);
            toast.success("Категория успешно добавлена");
            onClose();
            setName("");
        } catch (error) {
            toast.error("Ошибка при создании категории");
        } finally {
            setLoading(false);
        }
    };

    return (
        <CustomModal title="Добавить категорию платежа" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-5">
                <CustomInput
                    placeholder="Название категории"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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

import { FC, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface CustomField {
    id: string;
    name: string;
    value: string;
    type: 'text' | 'number' | 'email';
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fields: CustomField[]) => void;
    initialFields?: CustomField[];
}

export const CustomFieldsModal: FC<Props> = ({ isOpen, onClose, onSave, initialFields = [] }) => {
    const [fields, setFields] = useState<CustomField[]>(initialFields);

    const addField = () => {
        const newField: CustomField = {
            id: Date.now().toString(),
            name: '',
            value: '',
            type: 'text'
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(field => field.id !== id));
    };

    const updateField = (id: string, updates: Partial<CustomField>) => {
        setFields(fields.map(field => 
            field.id === id ? { ...field, ...updates } : field
        ));
    };

    const handleSave = () => {
        const validFields = fields.filter(field => field.name.trim() && field.value.trim());
        if (validFields.length === 0) {
            toast.error("Добавьте хотя бы одно поле");
            return;
        }
        onSave(validFields);
        onClose();
    };

    return (
        <CustomModal title="Дополнительные поля" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
                {fields.map((field) => (
                    <div key={field.id} className="flex gap-2 items-center">
                        <CustomInput
                            placeholder="Название поля"
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            className="flex-1"
                        />
                        <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as 'text' | 'number' | 'email' })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="text">Текст</option>
                            <option value="number">Число</option>
                            <option value="email">Email</option>
                        </select>
                        <CustomInput
                            placeholder="Значение"
                            value={field.value}
                            onChange={(e) => updateField(field.id, { value: e.target.value })}
                            className="flex-1"
                        />
                        <button
                            onClick={() => removeField(field.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                
                <button
                    onClick={addField}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Добавить поле
                </button>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
                <CustomButton onClick={handleSave} className="flex-1">
                    Сохранить
                </CustomButton>
                <CustomButton variant="cancel" onClick={onClose} className="flex-1">
                    Отмена
                </CustomButton>
            </div>
        </CustomModal>
    );
};

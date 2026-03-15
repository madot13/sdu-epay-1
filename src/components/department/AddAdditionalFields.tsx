import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { FieldLabel } from "@/types/additionalFields.ts";

const fieldTypes = ["text", "number", "date", "checkbox", "file"];

interface AddAdditionalFieldsProps {
    value: { name: string; type: string; value?: any; label?: FieldLabel }[];
    onChange: (fields: { name: string; type: string; value?: any; label?: FieldLabel }[]) => void;
}

export const AddAdditionalFields: FC<AddAdditionalFieldsProps> = ({ value, onChange }) => {
    const addField = () => {
        onChange([...value, { 
            name: "", 
            type: "text", 
            label: { 
                kz: "", 
                ru: "Название поля", 
                en: "Field name" 
            } 
        }]);
    };

    const updateField = (index: number, key: "name" | "type" | "label", val: string | FieldLabel) => {
        const updated = [...value];
        updated[index] = { ...updated[index], [key]: val };
        
        // Если тип file, добавляем обязательное value поле
        if (key === "type" && val === "file") {
            updated[index] = { ...updated[index], value: {
                url: "",
                key: "",
                bucket: "",
                filename: "",
                content_type: "",
                size: 0
            }};
        } else if (key === "type" && val !== "file") {
            // Если меняем с file на другой тип, убираем value
            const { value: _, ...rest } = updated[index];
            updated[index] = { ...rest };
        }
        
        onChange(updated);
    };

    const updateLabel = (index: number, lang: "kz" | "ru" | "en", text: string) => {
        const updated = [...value];
        const currentLabel = updated[index].label || { kz: "", ru: "", en: "" };
        updated[index] = { 
            ...updated[index], 
            label: { 
                ...currentLabel, 
                [lang]: text 
            } 
        };
        onChange(updated);
    };

    const removeField = (index: number) => {
        const updated = value.filter((_, i) => i !== index);
        onChange(updated);
    };

    return (
        <div className="flex items-center flex-col">
            <div className="flex flex-col gap-5 mb-[20px]">
                <AnimatePresence>
                    {value.map((field, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 w-full"
                        >
                            {/* Название поля */}
                            <div className="text-sm font-medium text-gray-700">Название поля</div>
                            
                            {/* Поля для ввода на трех языках */}
                            <div className="grid grid-cols-3 gap-3">
                                <CustomInput
                                    value={field.label?.kz || ""}
                                    placeholder="Атауын (казахский)"
                                    icon={<InformationCircleIcon className="text-[#6B9AB0]" />}
                                    onChange={(e) => updateLabel(index, "kz", e.target.value)}
                                />
                                <CustomInput
                                    value={field.label?.ru || ""}
                                    placeholder="Название поля (русский)"
                                    icon={<InformationCircleIcon className="text-[#6B9AB0]" />}
                                    onChange={(e) => updateLabel(index, "ru", e.target.value)}
                                />
                                <CustomInput
                                    value={field.label?.en || ""}
                                    placeholder="Field name (english)"
                                    icon={<InformationCircleIcon className="text-[#6B9AB0]" />}
                                    onChange={(e) => updateLabel(index, "en", e.target.value)}
                                />
                            </div>

                            {/* Тип поля и кнопка удаления */}
                            <div className="flex gap-2 items-end">
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(index, "type", e.target.value)}
                                    className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm bg-white flex-1"
                                >
                                    {fieldTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                <CustomButton
                                    onClick={() => removeField(index)}
                                    variant="cancel"
                                    className="text-white hover:underline"
                                >
                                    Удалить
                                </CustomButton>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <button
                onClick={addField}
                className="px-4 py-2 cursor-pointer rounded-md text-white bg-[#4c96ba] hover:bg-[#3b7ca0] transition"
            >
                + Добавить поле
            </button>
        </div>
    );
};

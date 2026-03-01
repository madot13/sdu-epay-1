import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { CustomField } from "@/types/packetevents";

const fieldTypes = ["text", "number", "email"];

interface AddAdditionalFieldsProps {
    value: CustomField[];
    onChange: (fields: CustomField[]) => void;
}

export const AddAdditionalFields: FC<AddAdditionalFieldsProps> = ({ value, onChange }) => {
    const addField = () => {
        const newField: CustomField = {
            id: Date.now().toString(),
            name: "",
            value: "",
            type: "text"
        };
        onChange([...value, newField]);
    };

    const updateField = (index: number, key: keyof CustomField, val: string) => {
        const updated = [...value];
        updated[index] = { ...updated[index], [key]: val };
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
                            key={field.id}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex gap-2 w-full"
                        >
                            <CustomInput
                                value={field.name}
                                placeholder="Название поля"
                                icon={<InformationCircleIcon className="text-[#6B9AB0]" />}
                                onChange={(e) => updateField(index, "name", e.target.value)}
                            />
                            <select
                                value={field.type}
                                onChange={(e) => updateField(index, "type", e.target.value as "text" | "number" | "email")}
                                className="px-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm bg-white"
                            >
                                {fieldTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            <CustomInput
                                value={field.value}
                                placeholder="Значение"
                                onChange={(e) => updateField(index, "value", e.target.value)}
                            />
                            <CustomButton
                                onClick={() => removeField(index)}
                                variant="cancel"
                                className="text-white hover:underline"
                            >
                                Отмена
                            </CustomButton>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <button
                onClick={addField}
                className="px-4 py-2 cursor-pointer rounded-md text-white bg-[#4c96ba] hover:bg-[#3b7ca0] transition"
            >
                + Дополнительные поля
            </button>
        </div>
    );
};

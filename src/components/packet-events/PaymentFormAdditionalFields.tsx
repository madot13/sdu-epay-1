import { FC, useEffect, useState } from "react";
import { CustomInput } from "@/ui/CustomInput.tsx";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { getDepartmentById } from "@/api/endpoints/departments.ts";

interface PaymentFormAdditionalFieldsProps {
    departmentId: string;
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
}

export const PaymentFormAdditionalFields: FC<PaymentFormAdditionalFieldsProps> = ({
    departmentId,
    values,
    onChange
}) => {
    const [additionalFields, setAdditionalFields] = useState<Record<string, { type: string }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDepartmentFields = async () => {
            if (!departmentId) {
                setAdditionalFields({});
                setLoading(false);
                return;
            }

            try {
                // Получаем департамент по ID с дополнительными полями
                const department = await getDepartmentById(departmentId);
                console.log("Department data:", department); // ← Логируем для отладки
                setAdditionalFields(department?.additional_fields || {});
            } catch (error) {
                console.error("Failed to fetch department fields:", error);
                setAdditionalFields({});
            } finally {
                setLoading(false);
            }
        };

        fetchDepartmentFields();
    }, [departmentId]);

    const handleFieldChange = (fieldName: string, fieldType: string, value: any) => {
        const newValues = { ...values };
        
        // Конвертируем значение в зависимости от типа поля
        if (fieldType === "number") {
            newValues[fieldName] = value ? Number(value) : "";
        } else if (fieldType === "date") {
            newValues[fieldName] = value;
        } else if (fieldType === "checkbox") {
            newValues[fieldName] = value;
        } else {
            newValues[fieldName] = value;
        }
        
        onChange(newValues);
    };

    const renderField = (fieldName: string, fieldConfig: { type: string }) => {
        const currentValue = values[fieldName] || "";

        switch (fieldConfig.type) {
            case "text":
                return (
                    <CustomInput
                        key={fieldName}
                        icon={<InformationCircleIcon className="text-[#6B9AB0]" />}
                        placeholder={`Введите ${fieldName}`}
                        value={currentValue}
                        onChange={(e) => handleFieldChange(fieldName, fieldConfig.type, e.target.value)}
                    />
                );
            
            case "number":
                return (
                    <CustomInput
                        key={fieldName}
                        icon={<InformationCircleIcon className="text-[#6B9AB0]" />}
                        placeholder={`Введите ${fieldName}`}
                        type="number"
                        value={String(currentValue)}
                        onChange={(e) => handleFieldChange(fieldName, fieldConfig.type, e.target.value)}
                    />
                );
            
            case "date":
                return (
                    <div key={fieldName} className="flex flex-col gap-[10px]">
                        <label className="text-sm font-medium">{fieldName}</label>
                        <input
                            type="date"
                            value={currentValue || ""}
                            onChange={(e) => handleFieldChange(fieldName, fieldConfig.type, e.target.value)}
                            className="bg-white h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
                        />
                    </div>
                );
            
            case "checkbox":
                return (
                    <div key={fieldName} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={fieldName}
                            checked={currentValue || false}
                            onChange={(e) => handleFieldChange(fieldName, fieldConfig.type, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={fieldName} className="text-sm text-gray-700">
                            {fieldName}
                        </label>
                    </div>
                );
            
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Загрузка дополнительных полей...</div>;
    }

    const fieldsEntries = Object.entries(additionalFields);

    if (fieldsEntries.length === 0) {
        return null; // Не показываем ничего если нет дополнительных полей
    }

    return (
        <div className="flex flex-col gap-[21px]">
            <div className="text-sm font-medium text-gray-700 border-t pt-4">
                Дополнительные поля
            </div>
            {fieldsEntries.map(([fieldName, fieldConfig]) => 
                renderField(fieldName, fieldConfig)
            )}
        </div>
    );
};

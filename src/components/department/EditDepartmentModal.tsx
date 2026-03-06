import {FC, useEffect, useState} from "react";
import {useDepartmentsStore} from "@/store/useDepartmentsStore.ts";
import {CustomInput} from "@/ui/CustomInput.tsx";
import {EnvelopeIcon, } from "@heroicons/react/24/outline";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {CustomModal} from "@/ui/CustomModal.tsx";
import {toast} from "react-hot-toast";
import { AddAdditionalFields } from "@/components/department/AddAdditionalFields";


interface EditDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentData: {
        id:string;
        name: string;
        active?: boolean;
        additional_fields?: Record<string, { type: string; value?: any }>;
    },
}


export const EditDepartmentModal: FC<EditDepartmentModalProps> = ({isOpen, onClose, departmentData}) => {
    const [additionalFields, setAdditionalFields] = useState<{ name: string; type: string; value?: any }[]>([]);
    const [name, setName] = useState(departmentData.name);
    const [active, setActive] = useState(departmentData.active !== false);

    const {updateDepartment} = useDepartmentsStore();

    useEffect(() => {
        if (isOpen) {
            setName(departmentData.name);
            setActive(departmentData.active !== false);
            const fields = departmentData.additional_fields
                ? Object.entries(departmentData.additional_fields).map(([key, value]) => {
                    const field: { name: string; type: string; value?: any } = {
                        name: key,
                        type: value.type,
                    };
                    
                    // If it's a file type and value doesn't exist, create empty value object
                    if (value.type === 'file' && !value.value) {
                        field.value = {
                            url: "",
                            key: "",
                            bucket: "",
                            filename: "",
                            content_type: "",
                            size: 0
                        };
                    } else if (value.value !== undefined) {
                        field.value = value.value;
                    }
                    
                    return field;
                })
                : [];
            setAdditionalFields(fields);
        }
    }, [isOpen, departmentData]);

    const handleUpdate = async () => {
        const additional_fields: Record<string, { type: string; value?: any }> = {};
        additionalFields.forEach((field) => {
            const fieldData: { type: string; value?: any } = { type: field.type };
            
            if (field.type === 'file') {
                // For file types, always include a value object (even if empty)
                fieldData.value = field.value || {
                    url: "",
                    key: "",
                    bucket: "",
                    filename: "",
                    content_type: "",
                    size: 0
                };
            } else if (field.value !== undefined) {
                // For other types, include value only if it exists
                fieldData.value = field.value;
            }
            
            additional_fields[field.name] = fieldData;
        });

        try {
            await updateDepartment(departmentData.id, {
                name,
                active,
                additional_fields,
            });
            onClose();
            toast.success("Департамент успешно изменен");
        } catch (error: any) {
            console.error("Failed to update department:", error);
            toast.error(error.response.data.detail?.[0]?.msg || "Ошибка с редактированием");
        }
    };

    return (
        <CustomModal
            title="Редактирование департамента"
            className="max-w-md w-full"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="flex flex-col gap-[21px]">
                <CustomInput
                    icon={<EnvelopeIcon className="text-[#6B9AB0]" />}
                    placeholder="Введите название"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="active-status"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="active-status" className="text-sm text-gray-700">
                        Активный
                    </label>
                </div>

                <AddAdditionalFields value={additionalFields} onChange={setAdditionalFields} />

                <CustomButton onClick={handleUpdate} className="w-full">
                    Save Changes
                </CustomButton>
            </div>
        </CustomModal>
    );

}
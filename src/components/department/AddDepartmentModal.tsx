import {FC, useState} from "react";
import {useDepartmentsStore} from "@/store/useDepartmentsStore.ts";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {PlusIcon, UserCircleIcon} from "@heroicons/react/24/outline";
import {CustomModal} from "@/ui/CustomModal.tsx";
import {CustomInput} from "@/ui/CustomInput.tsx";
import {toast} from "react-hot-toast";
import {AddAdditionalFields} from "@/components/department/AddAdditionalFields.tsx";


export const AddDepartmentModal:FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [additionalFields, setAdditionalFields] = useState<{name:string; type:string; value?: any}[]>([]);
    const [name, setName] = useState("");

    const {addDepartment} = useDepartmentsStore();

    const handleSubmit = async () => {
        const additional_fields: Record<string, any> = {};
        console.log("additionalFields before processing:", additionalFields);
        
        additionalFields.forEach((field) => {
            if (field.type === 'file' && field.value) {
                // Для файлов копируем весь объект с value
                additional_fields[field.name] = {
                    type: field.type,
                    value: field.value
                };
            } else {
                // Для других типов только type
                additional_fields[field.name] = { type: field.type };
            }
        });
        
        console.log("additional_fields being sent:", additional_fields);

        try{
            await addDepartment({
                name: name,
                additional_fields
            });
            setIsModalOpen(false);
            toast.success("Департамент успешно добавлен")
        }catch (err:any){
            console.log(err)
           toast.error(err.response.data.detail[0].msg)
        }
    }

    return (
        <>
            <CustomButton variant="submit" className="h-[38px] font-bold gap-[5px] px-[20px] flex rounded-[4px]" onClick={() => setIsModalOpen(true)}>
                <PlusIcon />
                Добавить
            </CustomButton>
            <CustomModal className={"w-[600px]"} title={"Добавить департамент"}  isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className={"flex flex-col gap-[21px]"}>
                    <CustomInput
                        onChange={(e) => setName(e.target.value)}
                        icon={<UserCircleIcon className={`text-[#6B9AB0]`} />}
                        placeholder={"Введите название"}
                    />
                    <AddAdditionalFields value={additionalFields} onChange={setAdditionalFields} />
                    <CustomButton
                        onClick={handleSubmit}
                        className="w-full"

                    >
                        Добавить
                    </CustomButton>
                </div>
            </CustomModal>
        </>
    )
}
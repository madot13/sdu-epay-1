import { FC, useEffect, useState } from "react";
import { CustomModal } from "@/ui/CustomModal.tsx";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { CustomInput } from "@/ui/CustomInput.tsx";
import {
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { getDepartments } from "@/api/endpoints/departments.ts";
import { useUsersStore } from "@/store/useUsersStore.ts";
import { Department } from "@/types/departments.ts";
import { toast } from "react-hot-toast";

interface EditAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminData: {
        id: string;
        username: string;
        name: string;
        role: string;
        active: boolean;
        department: {
            id: string;
            name: string;
        };
    };
}

export const EditAdminModal: FC<EditAdminModalProps> = ({ isOpen, onClose, adminData }) => {
    const [username, setUsername] = useState(adminData.username);
    const [name, setName] = useState(adminData.name);
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState(adminData.role);
    const [selectedDepartment, setSelectedDepartment] = useState(adminData.department.id);
    const [isActive, setIsActive] = useState(adminData.active);
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [errors, setErrors] = useState({
        username: false,
        name: false,
        department: false,
        role: false,
    });

    const { updateUser, fetchUsers } = useUsersStore();

    useEffect(() => {
        if (isOpen) {
            setUsername(adminData.username);
            setName(adminData.name);
            setPassword("");
            setSelectedRole(adminData.role);
            setSelectedDepartment(adminData.department.id);
            setIsActive(adminData.active);
            setErrors({
                username: false,
                name: false,
                department: false,
                role: false,
            });
        }
    }, [isOpen, adminData]);

    const roleOptions = [
        { label: "Super Admin", value: "SUPER_ADMIN" },
        { label: "Admin", value: "ADMIN" },
        { label: "Manager", value: "MANAGER" },
    ];

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await getDepartments({ active: true });
                const formatted = response.data.map((dept: Department) => ({
                    label: dept.name,
                    value: dept.id,
                }));
                setDepartments(formatted);
            } catch (error) {
                console.error("Failed to fetch departments:", error);
            }
        };

        fetchDepartments();
    }, []);
        const handleUpdate = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const newErrors = {
            username: !username.trim() || !emailRegex.test(username.trim()),
            name: !name.trim(),
            department: !selectedDepartment,
            role: !selectedRole,
        };

        setErrors(newErrors);

        const messages: string[] = [];

            if (!username) {
                messages.push("Email обязателен");
            } else if (!emailRegex.test(username.trim())) {
                messages.push("Некорректный формат email");
            }

            if (newErrors.name) messages.push("Имя обязательно");
            if (newErrors.department) messages.push("Выберите департамент");
            if (newErrors.role) messages.push("Выберите роль");

            if (password && password.length < 6) {
                messages.push("Пароль должен содержать минимум 6 символов");
            }

            if (messages.length > 0) {
                messages.forEach((msg) => toast.error(msg));
                return;
            }


            try {
            await updateUser(adminData.id, {
                username,
                name,
                password: password || undefined,
                role: selectedRole,
                department_id: selectedDepartment,
                active: isActive,
            });

            await fetchUsers();
            toast.success("Пользователь успешно обновлен");
            onClose();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update admin.";
            toast.error(message);
        }
    };


    return (
        <CustomModal className={"max-w-md w-full"} title="Редактировать Пользователя" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-[21px]">
                <CustomInput
                    icon={<EnvelopeIcon className={errors.username ? "text-red-500" : "text-[#6B9AB0]"} />}
                    placeholder="Введите email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <CustomInput
                    icon={<UserIcon className={errors.name ? "text-red-500" : "text-[#6B9AB0]"} />}
                    placeholder="Введите имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <CustomInput
                    icon={<LockClosedIcon className="text-[#6B9AB0]" />}
                    placeholder="Введите новый пароль (необязательно)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <CustomSelect
                    placeholder="Выберите департамент"
                    options={departments}
                    value={selectedDepartment}
                    onChange={setSelectedDepartment}
                    triggerClassName={`bg-white h-[50px] text-black ${errors.department ? "border border-red-500" : ""}`}
                    dropdownClassName="bg-gray-100"
                    optionClassName="text-sm"
                    activeOptionClassName="bg-blue-200"
                />
                <CustomSelect
                    options={roleOptions}
                    value={selectedRole}
                    onChange={setSelectedRole}
                    placeholder="Выберите роль"
                    triggerClassName={`bg-white h-[50px] text-black ${errors.role ? "border border-red-500" : ""}`}
                    dropdownClassName="bg-gray-100"
                    optionClassName="text-sm"
                    activeOptionClassName="bg-blue-200"
                />
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                        Активный пользователь
                    </label>
                </div>
                <CustomButton onClick={handleUpdate} className="w-full">
                    Сохранить изменения
                </CustomButton>
            </div>
        </CustomModal>

    );
};

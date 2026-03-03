import { FC, useEffect, useState } from "react";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { AddAdminModal } from "@/components/admin/AddAdminModal.tsx";
import { useUsersStore } from "@/store/useUsersStore.ts";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { AnimatePresence, motion } from "framer-motion";
import { getUsers } from "@/api/endpoints/users.ts";
import {toast} from "react-hot-toast";

const roleOptions = [
    { label: "Все", value: "" },
    { label: "Super Admin", value: "SUPER_ADMIN" },
    { label: "Admin", value: "ADMIN" },
    { label: "Manager", value: "MANAGER" },
];

export const AdminFilters: FC = () => {
    const [email, setEmail] = useState("");
    const [mailSuggestions, setMailSuggestions] = useState<{ username: string; id: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedRole, setSelectedRole] = useState<"SUPER_ADMIN" | "ADMIN" | "MANAGER" | "">("");

    const { fetchUsers } = useUsersStore();

    const handleSearch = async () => {
        await fetchUsers({
            username: email || undefined,
            role: selectedRole !== "" ? selectedRole : undefined,
        });
    };

    const handleSelectEvent = (mail: { username: string; id: string }) => {
        setEmail(mail.username);
        setShowSuggestions(false);
    };

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (email.trim() === "") {
                setMailSuggestions([]);
                return;
            }

            try {
                const response: any = await getUsers({ username: email });
                const filtered = response.data.filter((user: { active: boolean }) => user.active);
                setMailSuggestions(filtered);
                setShowSuggestions(true);
            } catch (err:any) {
                console.error(err);
                toast.error(err.response.data.detail[0].msg)
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [email]);


    return (
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 lg:mb-[31px]">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-[22px] w-full lg:w-auto">
                <div className="flex relative flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Почта</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#FFFFFF] h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
                        placeholder="Введите email"
                    />
                    {showSuggestions && mailSuggestions.length > 0 && (
                        <AnimatePresence>
                            <motion.ul
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-10 top-[70px] left-0 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-[200px] overflow-y-auto"
                            >
                                {mailSuggestions.map((mail) => (
                                    <li
                                        key={mail.id}
                                        className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                                        onClick={() => handleSelectEvent(mail)}
                                    >
                                        {mail.username}
                                    </li>
                                ))}
                            </motion.ul>
                        </AnimatePresence>
                    )}
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Роли</label>
                    <CustomSelect
                        options={roleOptions}
                        value={selectedRole}
                        onChange={(value: string) => setSelectedRole(value as any)}
                        placeholder="Choose role"
                        triggerClassName="bg-white w-full sm:w-[150px] h-[37px] text-black text-sm"
                        dropdownClassName="bg-gray-100"
                        optionClassName="text-sm"
                        activeOptionClassName="bg-blue-200"
                    />
                </div>

                <CustomButton
                    variant="submit"
                    onClick={handleSearch}
                    className="h-[37px] px-6 mt-auto"
                >
                    Поиск
                </CustomButton>
            </div>
            <div className="flex items-center gap-5 justify-end lg:justify-start">
                <AddAdminModal />
            </div>
        </div>
    );
};

import {FC, useEffect, useState} from "react";
import {useDepartmentsStore} from "@/store/useDepartmentsStore.ts";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {AddDepartmentModal} from "@/components/department/AddDepartmentModal.tsx";
import {getDepartments} from "@/api/endpoints/departments.ts";
import {AnimatePresence, motion} from "framer-motion";

export const DepartmentsFilters:FC = () => {
    const [name, setName] = useState("");
    const [depSuggestions, setDepSuggestions] = useState<{name: string, id: string}[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);


    const {fetchDepartments } = useDepartmentsStore();
    const handleSearch = async () => {
        await fetchDepartments({
            name: name || undefined,
            page: 0,
        });
    }


    const handleSelectEvent = (dep: {name:string, id: string}) => {
        setName(dep.name);
        setShowSuggestions(false);
    }

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (name.trim() === "") {
                setDepSuggestions([]);
                return;
            }
            try {
                const response = await getDepartments({
                    name: name
                });
                setDepSuggestions(response.data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Failed to fetch event suggestions:", error);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [name]);



    return (
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 lg:mb-[31px]">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-[22px] w-full lg:w-auto">
                <div className="flex relative flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Название</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#FFFFFF] h-[37px] p-2 border-1 rounded-[4px] border-[#6B9AB0] text-sm"
                    placeholder="Название департамента"
                        />
                    {showSuggestions && depSuggestions.length > 0 && (
                        <AnimatePresence>
                            <motion.ul
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-10 top-[70px] left-0 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-[200px] overflow-y-auto"
                            >
                                {depSuggestions.map((dep) => (
                                    <li
                                        key={dep.id}
                                        className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                                        onClick={() => handleSelectEvent(dep)}
                                    >
                                        {dep.name}
                                    </li>
                                ))}
                            </motion.ul>
                        </AnimatePresence>
                    )}
                </div>
                <CustomButton
                    onClick={handleSearch}
                    className="h-[37px] px-6 mt-auto"
                >
                    Поиск
                </CustomButton>
            </div>
            <div className="flex items-center gap-5 justify-end lg:justify-start">
                <AddDepartmentModal />
            </div>
        </div>
    )
}
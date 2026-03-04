import { FC, useState, useEffect } from "react";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { CustomSelect } from "@/ui/CustomSelect.tsx";
import { getDepartments } from "@/api/endpoints/departments.ts";
import { getPublicEventsById } from "@/api/endpoints/events.ts";
import { Department } from "@/types/departments.ts";
import { AddPacketEventModal } from "./AddPacketEventModal"; 

interface PacketEventsFilterProps {
    onSearch: (params: any) => void;
}

export const PacketEventsFilter: FC<PacketEventsFilterProps> = ({ onSearch }) => {
    const [name, setName] = useState("");
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await getDepartments();
                const formatted = response.data.map((dept: Department) => ({
                    label: dept.name,
                    value: dept.id,
                }));
                setDepartments([{ label: "Все", value: "" }, ...formatted]);
            } catch (error) {
                console.error("Failed to fetch departments:", error);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (selectedDepartment) {
            const fetchEvents = async () => {
                try {
                    const eventsData = await getPublicEventsById(selectedDepartment);
                    console.log("Events loaded for department:", selectedDepartment, eventsData);
                } catch (error) {
                    console.error("Failed to fetch events:", error);
                }
            };
            fetchEvents();
        }
    }, [selectedDepartment]);

    // ✅ ИСПРАВЛЕНИЕ: принимаем актуальные значения как аргументы,
    // чтобы не зависеть от стейта который мог не успеть обновиться
    const handleSearch = (
        overrides: {
            name?: string;
            department?: string;
        } = {}
    ) => {
        const currentName = overrides.name !== undefined ? overrides.name : name;
        const currentDepartment = overrides.department !== undefined ? overrides.department : selectedDepartment;

        const filters: any = {};

        if (currentName && currentName.trim()) {
            filters.category = currentName.trim();
        }

        if (currentDepartment && currentDepartment.trim()) {
            filters.department_id = currentDepartment.trim();
        }

        console.log("🔍 Prepared filters:", filters);
        onSearch(filters);
    };

    return (
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 lg:mb-[31px]">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-[22px] w-full lg:w-auto">
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm font-medium">Название</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
                        placeholder="Название оплаты"
                    />
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm font-medium">Департамент</label>
                    <CustomSelect
                        options={departments}
                        value={selectedDepartment}
                        onChange={(val) => {
                            setSelectedDepartment(val);
                        }}
                        triggerClassName="bg-white w-full sm:min-w-[200px] h-[37px] text-black text-sm border-[#6B9AB0]"
                    />
                </div>
                <CustomButton
                    variant="submit"
                    onClick={() => handleSearch({ name, department: selectedDepartment })}
                    className="h-[37px] px-6 mt-auto"
                >
                    Поиск
                </CustomButton>
            </div>

            <div className="flex items-center gap-5 justify-end lg:justify-start">
                <AddPacketEventModal onRefresh={() => handleSearch()} />
            </div>
        </div>
    );
};
import {FC, useEffect, useState} from "react";
import {AddEventModal} from "@/components/event/AddEventModal.tsx";
import {useEventsStore} from "@/store/useEventsStore.ts";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {getDepartments} from "@/api/endpoints/departments.ts";
import {Department} from "@/types/departments.ts";
import {CustomSelect} from "@/ui/CustomSelect.tsx";
import {getEvents} from "@/api/endpoints/events.ts";
import {AnimatePresence, motion} from "framer-motion";

export const EventFilters:FC = () => {
    const [name, setName] = useState("");
    const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [periodFrom, setPeriodFrom] = useState("");
    const [periodTo, setPeriodTo] = useState("");
    const [eventSuggestions, setEventSuggestions] = useState<{title: string, id: string}[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const {fetchEvents} = useEventsStore();

    const handleSearch = async () => {
        await fetchEvents({
            title: name || undefined,
            department_id: selectedDepartment !== "" ? selectedDepartment : undefined,
            period_from: periodFrom || undefined,
            period_to: periodTo || undefined,
            page: 0,
        })
    }

    const handleSelectEvent = (event: {title:string, id: string}) => {
        setName(event.title);
        setShowSuggestions(false);
    };

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
        const timeout = setTimeout(async () => {
            if (name.trim() === "") {
                setEventSuggestions([]);
                return;
            }
            try {
                const response = await getEvents({
                    title: name
                });
                setEventSuggestions(response.data);
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
                <div className="flex flex-col relative gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Название</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        className="bg-[#FFFFFF] h-[37px] p-2 border-1 rounded-[4px] border-[#6B9AB0] text-sm"
                        placeholder="Название события"
                    />
                    {showSuggestions && eventSuggestions.length > 0 && (
                        <AnimatePresence>
                            <motion.ul
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-10 top-[70px] left-0 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-[200px] overflow-y-auto"
                            >
                                {eventSuggestions.map((event) => (
                                    <li
                                        key={event.id}
                                        className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                                        onClick={() => handleSelectEvent(event)}
                                    >
                                        {event.title}
                                    </li>
                                ))}
                            </motion.ul>
                        </AnimatePresence>
                    )}
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Департамент</label>
                    <CustomSelect
                        options={departments}
                        value={selectedDepartment}
                        onChange={setSelectedDepartment}
                        triggerClassName="bg-white w-full sm:min-w-[200px] h-[37px] text-black text-sm"
                        dropdownClassName="bg-gray-100"
                        optionClassName="text-sm"
                        activeOptionClassName="bg-blue-200"
                    />
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Период с</label>
                    <input
                        type="date"
                        value={periodFrom}
                        onChange={(e) => setPeriodFrom(e.target.value)}
                        className="bg-white h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
                    />
                </div>
                <div className="flex flex-col gap-[10px] flex-1 sm:flex-none">
                    <label className="text-sm">Период по</label>
                    <input
                        type="date"
                        value={periodTo}
                        onChange={(e) => setPeriodTo(e.target.value)}
                        className="bg-white h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
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
                <AddEventModal />
            </div>
        </div>
    )
}
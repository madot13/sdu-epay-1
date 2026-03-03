import {FC, useEffect, useState} from "react";
import {usePromoCodesStore} from "@/store/usePromoCodesStore.ts";
import {CustomButton} from "@/ui/CustomButton.tsx";
import {AddPromoCodeModal} from "@/components/promocode/AddPromoCodeModal.tsx";
import {getEvents} from "@/api/endpoints/events.ts";
import {AnimatePresence, motion} from "framer-motion";
export const PromoCodeFilters: FC = () => {
    const [promo, setPromo] = useState("");
    const [eventName, setEventName] = useState("");
    const [eventSuggestions, setEventSuggestions] = useState<{title: string, id: string}[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const {fetchPromoCodes} = usePromoCodesStore();

    const handleSearch = async () => {
        await fetchPromoCodes({
            code: promo || undefined,
            event_id: selectedEventId || undefined,
        });
        setShowSuggestions(false);
    };


    const handleSelectEvent = (event: {title:string, id: string}) => {
        setEventName(event.title);
        setSelectedEventId(event.id);
        setShowSuggestions(false);
    };

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (eventName.trim() === "") {
                setEventSuggestions([]);
                return;
            }
            try {
                const response = await getEvents({
                    title: eventName
                });
                setEventSuggestions(response.data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Failed to fetch event suggestions:", error);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [eventName]);


    return (
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 lg:mb-[31px] relative">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-[22px] w-full lg:w-auto relative">
                <div className="flex flex-col gap-[10px] relative flex-1 sm:flex-none">
                    <label className="text-sm">Название события</label>
                    <input
                        type="text"
                        value={eventName}
                        onChange={(e) => {
                            setEventName(e.target.value);
                            setSelectedEventId(undefined);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="bg-[#FFFFFF] h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
                        placeholder="Введите Название события"
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
                    <label className="text-sm">Промо-код</label>
                    <input
                        type="text"
                        onChange={(e) => setPromo(e.target.value)}
                        className="bg-[#FFFFFF] h-[37px] p-2 border border-[#6B9AB0] rounded-[4px] text-sm"
                        placeholder="Введите промо-код"
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
                <AddPromoCodeModal />
            </div>
        </div>
    );
};

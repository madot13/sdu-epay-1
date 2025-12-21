import {FC, useEffect, useState} from "react";
import {AdminLayout} from "@/layouts/AdminLayout.tsx";
import {PencilIcon, TrashIcon} from "lucide-react";
import {CustomTable} from "@/ui/CustomTable.tsx";
import {EventFilters} from "@/components/event/EventsFilters.tsx";
import {useEventsStore} from "@/store/useEventsStore.ts";
import {EditEventsModal} from "@/components/event/EditEventsModal.tsx";
import {DeleteModal} from "@/ui/DeleteModal.tsx";
import {toast} from "react-hot-toast";
import {Paginator} from "primereact/paginator";

export const EventsPage:FC = () => {
    const {events, fetchEvents, deleteEvent, total} = useEventsStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);


    const columns = [
        { header: "Событие", accessor: "title" },
        { header: "Департамент", accessor: "department" },
        { header: "Email", accessor: "manager_email" },
        { header: "Период с", accessor: "period_from" },
        { header: "Период по", accessor: "period_till" },
        { header: "Цена", accessor: "price_display" },
    ];


    useEffect(() => {
        fetchEvents();
    }, []);


    const onPageChange = async (event: any) => {
        setFirst(event.first);
        setRows(event.rows);

        await fetchEvents({
            page: event.first / event.rows,
            size: event.rows,
        });
    };


    const handleEditClick = (event: any) => {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (event: any) => {
        setSelectedEvent(event);
        setIsDeleteModalOpen(true)
    }

    useEffect(() => {
        const load = async () => {
            await fetchEvents({
                page: first / rows,
                size: rows,
            });
        };

        load();
    }, [first, rows]);

    const handleConfirmDelete = async () => {
        if (selectedEvent) {
            try{
                await deleteEvent(selectedEvent.id);
                await fetchEvents();
                setIsDeleteModalOpen(false);
                setSelectedEvent(null);
                toast.success("Событие успешно удалилось")
            }catch (err:any){
                toast.error(err.response.data.detail[0].msg)
            }
        }
    };


    return (
        <AdminLayout>
            <div className="w-full max-w-full">
                <h1 className="text-2xl lg:text-[32px] font-bold mb-4 lg:mb-6">Информация о событиях</h1>
                <EventFilters />
                <div className="overflow-x-auto">
                <CustomTable
                    columns={columns}
                    data={events.map((event: any) => ({
                        ...event,
                        price_display: event.priced ? `${event.price} ₸` : "Произвольная"
                    }))}
                    actions={(row) => (
                        <div className="flex gap-2">
                            <button onClick={() => handleEditClick(row)} className="text-blue-600 hover:text-blue-800">
                                <PencilIcon className="w-4 cursor-pointer h-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(row)} className="text-red-600 hover:text-red-800">
                                <TrashIcon className="w-4 cursor-pointer h-4" />
                            </button>
                        </div>
                    )}
                />
                </div>
                <div className="mt-4">
                <Paginator
                    first={first}
                    rows={rows}
                    totalRecords={total}
                    rowsPerPageOptions={[10, 20, 30]}
                    onPageChange={onPageChange}
                    className="custom-paginator"
                />
                </div>
            </div>

            {selectedEvent && (
                <>
                    <EditEventsModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        eventData={selectedEvent}
                    />
                    <DeleteModal isOpen={isDeleteModalOpen} onDeleteClick={handleConfirmDelete} onClose={() => setIsDeleteModalOpen(false)} />
                </>
            )}
        </AdminLayout>
    )
}
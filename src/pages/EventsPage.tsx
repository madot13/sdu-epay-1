import {FC, useEffect, useState} from "react";
import {AdminLayout} from "@/layouts/AdminLayout.tsx";
import {PencilIcon, TrashIcon} from "lucide-react";
import {CustomTable} from "@/ui/CustomTable.tsx";
import {EventFilters} from "@/components/event/EventsFilters.tsx";
import {useEventsStore} from "@/store/useEventsStore.ts";
import {useDepartmentsStore} from "@/store/useDepartmentsStore.ts";
import {EditEventsModal} from "@/components/event/EditEventsModal.tsx";
import {DeleteModal} from "@/ui/DeleteModal.tsx";
import {toast} from "react-hot-toast";
import {Paginator} from "primereact/paginator";

export const EventsPage:FC = () => {
    const {events, fetchEvents, deleteEvent, total} = useEventsStore();
    const {departments, fetchDepartments} = useDepartmentsStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const [sortedEvents, setSortedEvents] = useState<any[]>([]);

    const columns = [
        { header: "Событие", accessor: "title", sortable: true },
        { 
            header: "Департамент", 
            accessor: (row: any) => {
                const dept = departments.find(d => d.id === row.department_id);
                return dept?.name || 'Неизвестный департамент';
            }, 
            sortable: true 
        },
        { header: "Email", accessor: "manager_email", sortable: true },
        { header: "Период с", accessor: "period_from", sortable: true },
        { header: "Период по", accessor: "period_till", sortable: true },
        { header: "Цена KZT", accessor: "price_kzt_display", sortable: true },
        { header: "Цена USD", accessor: "price_usd_display", sortable: true },
    ];

    useEffect(() => {
        fetchEvents();
        fetchDepartments();
    }, []);

    // Update sorted events when original events or sort changes
    useEffect(() => {
        const eventsWithDisplay = events.map((event: any) => {
            const dept = departments.find(d => d.id === event.department_id);
            return {
                ...event,
                department_name: dept?.name || 'Неизвестный департамент',
                price_kzt_display: event.priced ? `${event.price} ₸` : "Произвольная",
                price_usd_display: event.priced
                    ? (event.price_usd ? `$${event.price_usd}` : "—")
                    : "Произвольная"
            };
        });

        if (!sort) {
            setSortedEvents(eventsWithDisplay);
            return;
        }

        const sorted = [...eventsWithDisplay].sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            // Handle department with custom accessor
            if (sort.column === 'custom-1') { // Index of department column
                aValue = a.department_name || '';
                bValue = b.department_name || '';
            } else {
                aValue = a[sort.column as keyof typeof eventsWithDisplay[0]];
                bValue = b[sort.column as keyof typeof eventsWithDisplay[0]];
            }
            
            // Handle numeric values for prices - use original numeric values
            if (sort.column === 'price_kzt_display') {
                aValue = a.priced ? (a.price || 0) : -1; // "Произвольная" gets -1
                bValue = b.priced ? (b.price || 0) : -1;
            } else if (sort.column === 'price_usd_display') {
                aValue = a.priced && a.price_usd ? a.price_usd : -1;
                bValue = b.priced && b.price_usd ? b.price_usd : -1;
            } else if (sort.column === 'period_from' || sort.column === 'period_till') {
                // Use original date values for sorting
                aValue = a[sort.column] ? new Date(a[sort.column]).getTime() : 0;
                bValue = b[sort.column] ? new Date(b[sort.column]).getTime() : 0;
            }
            
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';
            
            if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        setSortedEvents(sorted);
    }, [events, departments, sort]);

    const handleSort = (column: string, direction: 'asc' | 'desc') => {
        const newSort = { column, direction };
        setSort(newSort);
    };


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
                    data={sortedEvents}
                    onSort={handleSort}
                    currentSort={sort || undefined}
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
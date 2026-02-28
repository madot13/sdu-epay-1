import { FC, useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout.tsx";
import { CustomTable } from "@/ui/CustomTable.tsx";
import { PacketEventsFilter } from "@/components/packet-events/PacketEventsFilter";
import { packetEventsApi } from "@/api/endpoints/packet-events";
import { IEventRecord } from "@/types/packetevents";
import { Paginator } from "primereact/paginator";
import { PencilIcon, TrashIcon, Loader2 } from "lucide-react"; 
import { DeleteModal } from "@/ui/DeleteModal.tsx";
import { toast } from "react-hot-toast";
import { EditPacketEventsModal } from "@/components/packet-events/EditPacketEventsModal.tsx";

export const PacketEventsPage: FC = () => {
    const [data, setData] = useState<IEventRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IEventRecord | null>(null);
    const [filters, setFilters] = useState({});

    const columns = [
        { header: "Событие", accessor: "event_name" },
        { header: "Департамент", accessor: "department" },
        { header: "Email", accessor: "email" },
        { header: "Период с", accessor: "period_from" },
        { header: "Период по", accessor: "period_to" },
        { header: "Категория", accessor: "payment_category" },
        { header: "Цена (KZT)", accessor: "amount_kzt_display" },
        { header: "Цена (USD)", accessor: "amount_usd_display" },
    ];

    const loadData = async (currentFilters = filters, page = first / rows, size = rows) => {
        setLoading(true);
        try {
            const result = await packetEventsApi.getAll({ ...currentFilters, page, size });
            setData(Array.isArray(result) ? result : (result as any).data || []);
            setTotal((result as any).total || (Array.isArray(result) ? result.length : 0));
        } catch (err) {
            console.error("Ошибка загрузки:", err);
            toast.error("Не удалось загрузить данные");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [first, rows]);

    const handleSearch = (newFilters: any) => {
        setFilters(newFilters);
        setFirst(0);
        loadData(newFilters, 0, rows);
    };

    const onPageChange = (event: any) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const handleEditClick = (item: any) => {
        setSelectedItem(item as IEventRecord);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (item: any) => {
        setSelectedItem(item as IEventRecord);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        // ИСПРАВЛЕНО: проверяем наличие ID и удаляем return
        if (selectedItem?.id) {
            try {
                await packetEventsApi.delete(selectedItem.id);
                toast.success("Запись успешно удалена");
                loadData();
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
            } catch (err) {
                toast.error("Ошибка при удалении");
            }
        }
    };

    return (
        <AdminLayout>
            <div className="w-full max-w-full px-4 lg:px-0">
                <div className="flex items-center gap-4 mb-4 lg:mb-6">
                    <h1 className="text-2xl lg:text-[32px] font-bold text-[#1A1A1A]">
                        Информация о типах оплаты
                    </h1>
                    {/* Используем loading, чтобы убрать Warning */}
                    {loading && <Loader2 className="w-6 h-6 animate-spin text-blue-500" />}
                </div>
                
                <PacketEventsFilter onSearch={handleSearch} />

                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100 mt-4">
                    <CustomTable
                        columns={columns}
                        data={data.map((item) => ({
                            ...item,
                            amount_kzt_display: `${item.amount_kzt?.toLocaleString() || 0} ₸`,
                            amount_usd_display: item.amount_usd ? `$${item.amount_usd}` : "—",
                            payment_category: item.payment_category || "—"
                        }))}
                        actions={(row: any) => (
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleEditClick(row)} 
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(row)} 
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    />
                </div>

                <div className="mt-6 flex justify-center">
                    <Paginator
                        first={first}
                        rows={rows}
                        totalRecords={total}
                        rowsPerPageOptions={[10, 20, 30]}
                        onPageChange={onPageChange}
                        className="custom-paginator border-none bg-transparent"
                    />
                </div>
            </div>

            {isEditModalOpen && selectedItem && (
                <EditPacketEventsModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedItem(null);
                    }}
                    eventData={selectedItem}
                    onSuccess={() => loadData()}
                />
            )}

            <DeleteModal 
                isOpen={isDeleteModalOpen} 
                onDeleteClick={handleConfirmDelete} 
                onClose={() => setIsDeleteModalOpen(false)} 
            />
        </AdminLayout>
    );
};
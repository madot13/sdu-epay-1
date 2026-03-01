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

    const columns = [
        { header: "Событие", accessor: "event_name" },
        { header: "Департамент", accessor: "department" },
        { header: "Email", accessor: "email" },
        { header: "Категория", accessor: "category" },
        { header: "Цена (KZT)", accessor: "price_display" },
        { header: "Цена (USD)", accessor: "price_usd_display" },
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await packetEventsApi.getAll({});
            if (result && typeof result === 'object' && 'detail' in result) {
                // Бэкенд еще не готов - показывает ошибку API
                toast.error(`Ошибка API: ${result.detail}`);
                setData([]);
                setTotal(0);
                return;
            }
            
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

    const handleSearch = () => {
        loadData();
    };

    const onPageChange = (event: any) => {
        setFirst(event.first);
        setRows(event.rows);
        loadData();
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
                            event_name: item.title || item.event_name || '',
                            price_display: `${item.price?.toLocaleString() || 0} ₸`,
                            price_usd_display: item.price_usd ? `$${item.price_usd}` : "—",
                            category: item.category || "—",
                            department: item.department_name || item.department || ''
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
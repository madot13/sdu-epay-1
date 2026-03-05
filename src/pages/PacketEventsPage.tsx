import { FC, useEffect, useState, useCallback, useMemo } from "react";
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
import { ReactNode } from "react";

export const PacketEventsPage: FC = () => {
    const [data, setData] = useState<IEventRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IEventRecord | null>(null);
    const [filters, setFilters] = useState<any>({});
    // ✅ ДОБАВЛЕНО: стейт сортировки
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

    const columns = [
        { header: "Событие", accessor: "event_name", sortable: true },
        { header: "Департамент", accessor: "department", sortable: true },
        { header: "Email", accessor: "email", sortable: true },
        { header: "Категория", accessor: "category", sortable: true },
        { 
            header: "Цена KZT", 
            accessor: (item: Record<string, any>): ReactNode => {
                const price = item.price;
                const priceUsd = item.price_usd;
                const priced = item.priced !== false; // По умолчанию priced=true
                
                if (!priced) return "—";
                
                // "Произвольная" только если обе цены равны 0
                if (price === 0 && priceUsd === 0) {
                    return <span className="text-gray-500">Произвольная</span>;
                }
                
                if (price !== null && price !== undefined && price > 0) {
                    return Number(price) + " ₸";
                }
                
                return "—"; // Если цена KZT не указана или равна 0 (но USD > 0)
            }
        },
        { 
            header: "Цена USD", 
            accessor: (item: Record<string, any>): ReactNode => {
                const price = item.price;
                const priceUsd = item.price_usd;
                const priced = item.priced !== false; // По умолчанию priced=true
                
                if (!priced) return "—";
                
                // "Произвольная" только если обе цены равны 0
                if (price === 0 && priceUsd === 0) {
                    return <span className="text-gray-500">Произвольная</span>;
                }
                
                if (priceUsd !== null && priceUsd !== undefined && priceUsd > 0) {
                    return Number(priceUsd) + " $";
                }
                
                return "—"; // Если цена USD не указана или равна 0 (но KZT > 0)
            }
        },
    ];

    const loadData = useCallback(async (currentFilters: any = filters) => {
        setLoading(true);
        try {
            const result = await packetEventsApi.getAll(currentFilters);

            let items: any[] = [];
            if (result && typeof result === 'object') {
                items = Array.isArray(result) ? result : (result as any).data || [];
            }

            // Логирование для отладки структуры данных
            console.log("API Response:", result);
            console.log("Items:", items);
            if (items.length > 0) {
                console.log("First item structure:", items[0]);
                console.log("Price fields:", {
                    price: items[0].price,
                    price_usd: items[0].price_usd,
                    priced: items[0].priced
                });
            }

            if (result && typeof result === 'object' && 'detail' in result) {
                toast.error(`Ошибка API: ${result.detail}`);
                setData([]);
                setTotal(0);
                return;
            }

            setData(items);
            setTotal((result as any).total || items.length);
        } catch (err) {
            console.error("Ошибка загрузки:", err);
            toast.error("Не удалось загрузить данные");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(filters);
    }, [first, rows, filters]);

    // ✅ ДОБАВЛЕНО: обработчик сортировки
    const handleSort = (column: string, direction: 'asc' | 'desc') => {
        setSort({ column, direction });
    };

    // ✅ ДОБАВЛЕНО: маппинг + клиентская сортировка через useMemo
    const mappedData = useMemo(() => {
        const mapped = data.map((item) => ({
            ...item,
            event_name: item.title || item.event_name || '',
            category: item.category || "—",
            department: item.department_name || item.department || ''
        }));

        if (!sort) return mapped;

        return [...mapped].sort((a: any, b: any) => {
            let aValue = a[sort.column] ?? '';
            let bValue = b[sort.column] ?? '';

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const cmp = aValue.localeCompare(bValue, 'ru');
                return sort.direction === 'asc' ? cmp : -cmp;
            }

            if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sort]);

    const handleSearch = (params: any) => {
        setFirst(0);
        setFilters(params);
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
        if (selectedItem?.id) {
            try {
                await packetEventsApi.delete(selectedItem.id);
                toast.success("Запись успешно удалена");
                loadData(filters);
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
                    {loading && <Loader2 className="w-6 h-6 animate-spin text-blue-500" />}
                </div>
                <PacketEventsFilter onSearch={handleSearch} />
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100 mt-4">
                    <CustomTable
                        columns={columns}
                        data={mappedData}
                        onSort={handleSort}
                        currentSort={sort || undefined}
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
                    onSuccess={() => loadData(filters)}
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
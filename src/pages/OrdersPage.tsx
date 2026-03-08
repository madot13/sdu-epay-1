import { FC, useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout.tsx";
import { CustomTable } from "@/ui/CustomTable.tsx";
import { OrdersFilters } from "@/components/order/OrdersFilters.tsx";
import { useOrdersStore } from "@/store/useOrdersStore.ts";
import { Paginator } from "primereact/paginator";
import { OrderDetailsModal } from "@/components/order/OrderDetailsModal.tsx";
import { OrderTransactionsModal } from "@/components/order/OrderTransactionsModal.tsx";
import { Order, OrderQuery } from "@/types/orders.ts";
import { CustomButton } from "@/ui/CustomButton.tsx";
import { ReactNode } from "react";

export const OrdersPage: FC = () => {
    const { orders, fetchOrders, total } = useOrdersStore();
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const [sortedOrders, setSortedOrders] = useState<any[]>([]);
    const [currentFilters, setCurrentFilters] = useState<OrderQuery>({ page: 0, size: 10 });

    const columns = [
        { header: "ID", accessor: "id", sortable: true },
        { header: "Имя", accessor: "fullname", sortable: true },
        { header: "Email", accessor: "email", sortable: true },
        { header: "Телефон", accessor: "cellphone", sortable: true },
        { header: "Тип", accessor: "type_display", sortable: true },
        { 
            header: "Статус", 
            accessor: (item: Record<string, any>): ReactNode => {
                const status = item.status;
                let bgColor = "bg-gray-100";
                let textColor = "text-gray-800";
                let statusText = getStatusText(status);
                
                switch (status) {
                    case "SUCCESS":
                        bgColor = "bg-green-100";
                        textColor = "text-green-800";
                        break;
                    case "FAILURE":
                        bgColor = "bg-red-100";
                        textColor = "text-red-800";
                        break;
                    case "PENDING":
                        bgColor = "bg-yellow-100";
                        textColor = "text-yellow-800";
                        break;
                }
                
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                        {statusText}
                    </span>
                );
            },
            sortable: true
        },
        { header: "Сумма", accessor: "amount_display", sortable: true },
        { header: "Итого", accessor: "final_amount_display", sortable: true },
        { header: "Дата создания", accessor: "created_at_display", sortable: true },
    ];

    const handleUpdateFilters = (filters: OrderQuery) => {
        const newFilters = { ...filters, page: 0, size: rows };
        setCurrentFilters(newFilters);
        setFirst(0); // Reset to first page when filters change
        fetchOrders(newFilters);
    };

    useEffect(() => {
        fetchOrders({ page: 0, size: 10 });
    }, []);

    // Update sorted orders when original orders or sort changes
    useEffect(() => {
        const ordersWithDisplay = orders.map((order: any) => {
            console.log('Order type:', order.type, 'type_display:', getTypeText(order.type));
            return {
                ...order,
                type_display: getTypeText(order.type),
                status_display: getStatusText(order.status),
                amount_display: `${order.amount} ₸`,
                final_amount_display: `${order.final_amount} ₸`,
                created_at_display: formatDate(order.created_at),
            };
        });

        console.log('Orders with display:', ordersWithDisplay);

        if (!sort) {
            setSortedOrders(ordersWithDisplay);
            return;
        }

        const sorted = [...ordersWithDisplay].sort((a, b) => {
            let aValue: any = a[sort.column as keyof typeof ordersWithDisplay[0]];
            let bValue: any = b[sort.column as keyof typeof ordersWithDisplay[0]];
            
            console.log('Sorting by:', sort.column, 'aValue:', aValue, 'bValue:', bValue);
            
            // Handle numeric values for amounts - use original numeric values
            if (sort.column === 'amount_display' || sort.column === 'final_amount_display') {
                aValue = a.amount || 0;
                bValue = b.amount || 0;
            } else if (sort.column === 'created_at_display') {
                // Use original date values for sorting
                aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
                bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
            }
            
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';
            
            // Use localeCompare for proper string sorting (including Cyrillic)
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const cmp = aValue.localeCompare(bValue, 'ru');
                return sort.direction === 'asc' ? cmp : -cmp;
            }
            
            if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        setSortedOrders(sorted);
    }, [orders, sort]);

    useEffect(() => {
        const load = async () => {
            await fetchOrders({
                page: first / rows,
                size: rows,
            });
        };

        load();
    }, [first, rows]);

    const onPageChange = async (event: any) => {
        setFirst(event.first);
        setRows(event.rows);

        const newFilters = { ...currentFilters, page: event.first / event.rows, size: event.rows };
        setCurrentFilters(newFilters);
        await fetchOrders(newFilters);
    };

    const handleSort = (column: string, direction: 'asc' | 'desc') => {
        setSort({ column, direction });
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return "Успешно";
            case "FAILURE":
                return "Ошибка";
            case "PENDING":
                return "В ожидании";
            default:
                return status;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case "KASPI":
                return "Kaspi";
            case "EPAY":
                return "Halyk";
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleViewTransactions = (order: Order) => {
        setSelectedOrder(order);
        setIsTransactionsModalOpen(true);
    };

    return (
        <AdminLayout>
            <div className="w-full max-w-full">
                <h1 className="text-2xl lg:text-[32px] font-bold mb-4 lg:mb-6">
                    Заказы
                </h1>
                <OrdersFilters onFiltersChange={handleUpdateFilters} />
                <div className="overflow-x-auto">
                    <CustomTable
                        columns={columns}
                        data={sortedOrders}
                        onSort={handleSort}
                        currentSort={sort || undefined}
                        actions={(row) => (
                            <div className="flex gap-2 flex-wrap">
                                <CustomButton
                                    onClick={() => handleViewDetails(row as Order)}
                                    variant="submit"
                                    className="text-xs px-3 py-1 h-auto"
                                >
                                    Посмотреть
                                </CustomButton>
                                <CustomButton
                                    onClick={() => handleViewTransactions(row as Order)}
                                    variant="default"
                                    className="text-xs px-3 py-1 h-auto"
                                >
                                    Транзакции
                                </CustomButton>
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

            <OrderDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                order={selectedOrder}
            />

            <OrderTransactionsModal
                isOpen={isTransactionsModalOpen}
                onClose={() => setIsTransactionsModalOpen(false)}
                order={selectedOrder}
            />
        </AdminLayout>
    );
};


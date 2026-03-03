import { FC, useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout.tsx";
import { CustomTable } from "@/ui/CustomTable.tsx";
import { OrdersFilters } from "@/components/order/OrdersFilters.tsx";
import { useOrdersStore } from "@/store/useOrdersStore.ts";
import { Paginator } from "primereact/paginator";
import { OrderDetailsModal } from "@/components/order/OrderDetailsModal.tsx";
import { OrderTransactionsModal } from "@/components/order/OrderTransactionsModal.tsx";
import { Order } from "@/types/orders.ts";
import { CustomButton } from "@/ui/CustomButton.tsx";

export const OrdersPage: FC = () => {
    const { orders, fetchOrders, total } = useOrdersStore();
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const [sortedOrders, setSortedOrders] = useState<any[]>([]);

    const columns = [
        { header: "ID", accessor: "id", sortable: true },
        { header: "Имя", accessor: "fullname", sortable: true },
        { header: "Email", accessor: "email", sortable: true },
        { header: "Телефон", accessor: "cellphone", sortable: true },
        { header: "Тип", accessor: "type_display", sortable: true },
        { 
            header: "Статус", 
            accessor: "status_display",
            sortable: true,
            cellClassName: (_value: any, row: any) => {
                return `font-semibold ${getStatusColor(row.status)}`;
            }
        },
        { header: "Сумма", accessor: "amount_display", sortable: true },
        { header: "Итого", accessor: "final_amount_display", sortable: true },
        { header: "Дата создания", accessor: "created_at_display", sortable: true },
    ];

    useEffect(() => {
        fetchOrders({ page: 0, size: 10 });
    }, []);

    // Update sorted orders when original orders or sort changes
    useEffect(() => {
        const ordersWithDisplay = orders.map((order: any) => ({
            ...order,
            type_display: getTypeText(order.type),
            status_display: getStatusText(order.status),
            amount_display: `${order.amount} ₸`,
            final_amount_display: `${order.final_amount} ₸`,
            created_at_display: formatDate(order.created_at),
        }));

        if (!sort) {
            setSortedOrders(ordersWithDisplay);
            return;
        }

        const sorted = [...ordersWithDisplay].sort((a, b) => {
            let aValue: any = a[sort.column as keyof typeof ordersWithDisplay[0]];
            let bValue: any = b[sort.column as keyof typeof ordersWithDisplay[0]];
            
            // Handle numeric values for amounts and ID
            if (sort.column === 'id' || sort.column === 'amount' || sort.column === 'final_amount') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else if (sort.column === 'created_at') {
                // Handle date sorting
                aValue = aValue ? new Date(aValue).getTime() : 0;
                bValue = bValue ? new Date(bValue).getTime() : 0;
            }
            
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';
            
            // Use localeCompare for string sorting (supports Cyrillic)
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

    const handleSort = (column: string, direction: 'asc' | 'desc') => {
        setSort({ column, direction });
    };

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

        await fetchOrders({
            page: event.first / event.rows,
            size: event.rows,
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return "text-green-600 font-semibold";
            case "FAILURE":
                return "text-red-600 font-semibold";
            case "PENDING":
                return "text-yellow-600 font-semibold";
            default:
                return "";
        }
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
                <OrdersFilters />
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


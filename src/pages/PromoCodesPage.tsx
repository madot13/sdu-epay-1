import {FC, useEffect, useState} from "react";
import {AdminLayout} from "@/layouts/AdminLayout.tsx";
import {CustomTable} from "@/ui/CustomTable.tsx";
import {PencilIcon, TrashIcon} from "lucide-react";
import {PromoCodeFilters} from "@/components/promocode/PromoCodeFilters.tsx";
import {usePromoCodesStore} from "@/store/usePromoCodesStore.ts";
import {EditPromoCodeModal} from "@/components/promocode/EditPromoCodeModal.tsx";
import {DeleteModal} from "@/ui/DeleteModal.tsx";
import {toast} from "react-hot-toast";
import {Paginator} from "primereact/paginator";

export const PromoCodesPage:FC = () => {
    const {promoCodes, fetchPromoCodes, deletePromoCode, total} = usePromoCodesStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const columns = [
        { header: "Промокод", accessor: "code" },
        { header: "Название мероприятия", accessor: "eventName" },
        { header: "Период с", accessor: "period_from" },
        { header: "Период по", accessor: "period_till" },
        { header: "Уже использовано", accessor: "already_used" },
        { header: "Лимит использования", accessor: "limit" },
        { header: "Скидка", accessor: "discount" },
    ];


    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const onPageChange = async (event: any) => {
        setFirst(event.first);
        setRows(event.rows);

        await fetchPromoCodes({
            page: event.first / event.rows,
            size: event.rows,
        });
    };

    const handleEditClick = (promo: any) => {
        setSelectedPromo(promo);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (promo: any) => {
        setSelectedPromo(promo);
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (selectedPromo) {
            try{
                await deletePromoCode(selectedPromo.id);
                await fetchPromoCodes();
                setIsDeleteModalOpen(false);
                setSelectedPromo(null);
                toast.success("Промо-код удален")
            }catch (err:any){
                toast.error(err.response.data.detail[0].msg)
            }
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchPromoCodes({
                page: first / rows,
                size: rows,
            });
        };

        load();
    }, [first, rows]);

    const formattedData = promoCodes.map((promo) => ({
        ...promo,
        eventName: promo.event?.title || "—",
    }));



    return (
        <AdminLayout>
            <div className="flex-1 w-full min-w-0">
                <h1 className="text-2xl lg:text-[32px] font-bold mb-4 lg:mb-6">Информация о промо-кодах</h1>
                <PromoCodeFilters/>
                <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
                    <CustomTable
                        columns={columns}
                        data={formattedData}
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
                <div className="mt-4 overflow-x-auto">
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

            {selectedPromo && (
                <>
                    <EditPromoCodeModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        promoData={selectedPromo}
                    />
                    <DeleteModal isOpen={isDeleteModalOpen} onDeleteClick={handleConfirmDelete} onClose={() => setIsDeleteModalOpen(false)} />
                </>
            )}
        </AdminLayout>
    )
}
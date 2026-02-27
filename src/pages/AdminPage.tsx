import { FC, useEffect, useState } from "react";
import { CustomTable } from "@/ui/CustomTable.tsx";
import { PencilIcon, TrashIcon } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout.tsx";
import { AdminFilters } from "@/components/admin/AdminFilters.tsx";
import { useUsersStore } from "@/store/useUsersStore.ts";
import { EditAdminModal } from "@/components/admin/EditAdminModal.tsx";
import {DeleteModal} from "@/ui/DeleteModal.tsx";
import {Paginator} from "primereact/paginator";
import {toast} from "react-hot-toast";

export const AdminPage: FC = () => {
    const { fetchUsers, users, deleteUser, total} = useUsersStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onPageChange = async (event: any) => {
        setFirst(event.first);
        setRows(event.rows);

        await fetchUsers({
            page: event.first / event.rows,
            size: event.rows,
        });
    };

    const handleEditClick = (admin: any) => {
        setSelectedAdmin(admin);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (admin: any) => {
        setSelectedAdmin(admin);
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (selectedAdmin) {
            try{
                await deleteUser(selectedAdmin.id);
                setIsDeleteModalOpen(false);
                setSelectedAdmin(null);
                toast.success("Пользователь удален")
            }catch (err:any){
                toast.error(err.response.data.detail[0].msg)

            }
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchUsers({
                page: first / rows,
                size: rows,
            });
        };

        load();
    }, [first, rows]);


    const columns = [
        { header: "Почта", accessor: "username" },
        { header: "Департамент", accessor: "department" },
        { header: "Роль", accessor: "role" },
    ];


    return (
        <AdminLayout>
            <div className="flex-1 w-full">
                <h1 className="text-2xl lg:text-[32px] font-bold mb-4 lg:mb-6">Информация о пользователях</h1>
                <AdminFilters />
                <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                    <CustomTable
                        columns={columns}
                        data={users.filter((user) => user.active)}
                        actions={(row) => (
                            <div className="flex gap-2">
                                <button
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={() => handleEditClick(row)}
                                >
                                    <PencilIcon className="w-4 h-4 cursor-pointer" />
                                </button>
                                <button onClick={() => handleDeleteClick(row)} className="text-red-600 hover:text-red-800">
                                    <TrashIcon className="w-4 h-4 cursor-pointer" />
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

            {selectedAdmin && (
                <>
                    <EditAdminModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        adminData={selectedAdmin}
                    />
                    <DeleteModal isOpen={isDeleteModalOpen} onDeleteClick={handleConfirmDelete} onClose={() => setIsDeleteModalOpen(false)} />
                </>
            )}

        </AdminLayout>
    );
};
import {FC, useEffect, useState} from "react";
import {useDepartmentsStore} from "@/store/useDepartmentsStore.ts";
import {AdminLayout} from "@/layouts/AdminLayout.tsx";
import {CustomTable} from "@/ui/CustomTable.tsx";
import {PencilIcon, TrashIcon} from "lucide-react";
import {DepartmentsFilters} from "@/components/department/DepartmentsFilters.tsx";
import {EditDepartmentModal} from "@/components/department/EditDepartmentModal.tsx";
import {DeleteModal} from "@/ui/DeleteModal.tsx";
import {Paginator} from "primereact/paginator";
import {toast} from "react-hot-toast";

export const DepartmentsPage:FC = () => {
    const {departments, fetchDepartments, deleteDepartment, total} = useDepartmentsStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const [sortedDepartments, setSortedDepartments] = useState<any[]>([]);

    const columns = [
        {header: "Департамент", accessor: "name", sortable: true}
    ]

    useEffect(() => {
        fetchDepartments()
    }, []);

    // Update sorted departments when original departments or sort changes
    useEffect(() => {
        if (!sort) {
            setSortedDepartments(departments);
            return;
        }

        const sorted = [...departments].sort((a, b) => {
            const aValue = a[sort.column as keyof typeof departments[0]] || '';
            const bValue = b[sort.column as keyof typeof departments[0]] || '';
            
            if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        setSortedDepartments(sorted);
    }, [departments, sort]);

    const onPageChange = async (event: any) => {
        setFirst(event.first);
        setRows(event.rows);

        await fetchDepartments({
            page: event.first / event.rows,
            size: event.rows,
        });
    };

    const handleSort = (column: string, direction: 'asc' | 'desc') => {
        const newSort = { column, direction };
        setSort(newSort);
    };

    const handleEditClick = (dep: any) => {
        setSelectedDepartment(dep);
        setIsEditModalOpen(true);
    };
    const handleDeleteClick = (event: any) => {
        setSelectedDepartment(event);
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (selectedDepartment) {
            try{
                await deleteDepartment(selectedDepartment.id);
                await fetchDepartments();
                setIsDeleteModalOpen(false);
                setSelectedDepartment(null);
                toast.success("Департамент успешно удален")
            }catch (err:any){
                toast.error(err.response.data.detail[0].msg)
            }
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchDepartments({
                page: first / rows,
                size: rows,
            });
        };

        load();
    }, [first, rows]);


    return(
        <AdminLayout>
            <div className="flex-1 w-full">
                <h1 className="text-2xl lg:text-[32px] font-bold mb-4 lg:mb-6">Информация о департаментах</h1>
                <DepartmentsFilters />
                <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                    <CustomTable
                        columns={columns}
                        data={sortedDepartments}
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
            {selectedDepartment && (
                <>
                    <EditDepartmentModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        departmentData={selectedDepartment}
                    />
                    <DeleteModal isOpen={isDeleteModalOpen} onDeleteClick={handleConfirmDelete} onClose={() => setIsDeleteModalOpen(false)} />
                </>
            )}
        </AdminLayout>
    )
}
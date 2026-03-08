import {FC, useState, useEffect} from "react";
import {useDepartmentsStore} from "@/store/useDepartmentsStore.ts";
import {AdminLayout} from "@/layouts/AdminLayout.tsx";
import {CustomTable} from "@/ui/CustomTable.tsx";
import {PencilIcon} from "lucide-react";
import {DepartmentsFilters} from "@/components/department/DepartmentsFilters.tsx";
import {EditDepartmentModal} from "@/components/department/EditDepartmentModal.tsx";
import {Paginator} from "primereact/paginator";
import {ReactNode} from "react";

export const DepartmentsPage:FC = () => {
    const {departments, fetchDepartments, total} = useDepartmentsStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const [sortedDepartments, setSortedDepartments] = useState<any[]>([]);

    const columns = [
        {header: "Департамент", accessor: "name", sortable: true},
        { 
            header: "Активный", 
            accessor: (item: Record<string, any>): ReactNode => {
                const isActive = item.active !== false;
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {isActive ? 'Да' : 'Нет'}
                    </span>
                );
            },
            sortable: true
        }
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
            let aValue: any = a[sort.column as keyof typeof departments[0]] || '';
            let bValue: any = b[sort.column as keyof typeof departments[0]] || '';

            // Handle Active column sorting (custom-1 for Active column)
            if (sort.column === 'custom-1') {
                aValue = a.active !== false;
                bValue = b.active !== false;
            }

            // For boolean values (Active column)
            if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                return sort.direction === 'asc' 
                    ? (aValue ? 1 : -1) - (bValue ? 1 : -1)
                    : (bValue ? 1 : -1) - (aValue ? 1 : -1);
            }
            
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
                </>
            )}
        </AdminLayout>
    )
}
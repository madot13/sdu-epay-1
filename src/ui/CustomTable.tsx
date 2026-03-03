import { FC, ReactNode } from "react";

interface Column {
    header: string;
    accessor: string | ((row: Record<string, any>) => ReactNode);
    cellClassName?: (value: any, row: Record<string, any>) => string;
    sortable?: boolean;
}

interface CustomTableProps {
    columns: Column[];
    data: Record<string, any>[];
    actions?: (row: Record<string, any>) => ReactNode;
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
    currentSort?: { column: string; direction: 'asc' | 'desc' };
}

export const CustomTable: FC<CustomTableProps> = ({ columns, data, actions, onSort, currentSort }) => {
    const handleSort = (column: string) => {
        if (!onSort) return;
        
        let direction: 'asc' | 'desc' = 'asc';
        
        // If clicking the same column, toggle direction
        if (currentSort?.column === column) {
            direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        }
        
        onSort(column, direction);
    };

    const getSortIcon = (column: string) => {
        if (!currentSort || currentSort.column !== column) {
            return <span className="text-xs text-gray-400">⇅</span>;
        }
        return currentSort.direction === 'asc' 
            ? <span className="text-xs text-blue-600">↑</span>
            : <span className="text-xs text-blue-600">↓</span>;
    };

    return (
        <div className="w-full overflow-x-auto rounded-[4px] shadow-md border border-gray-200">
            <table className="w-full divide-y divide-gray-200 bg-white text-sm lg:text-[16px]">
                <thead className="bg-blue-50 text-gray-700 uppercase text-sm lg:text-[16px] font-semibold">
                <tr>
                    {columns.map((col, index) => {
                        const columnKey = typeof col.accessor === 'function' ? `custom-${index}` : col.accessor as string;
                        const isSortable = col.sortable !== false;
                        
                        return (
                            <th key={columnKey} className="px-3 lg:px-6 py-2 lg:py-3 text-left">
                                <div 
                                    className={`whitespace-nowrap flex items-center gap-1 ${isSortable ? 'cursor-pointer hover:text-blue-600' : ''}`}
                                    title={col.header}
                                    onClick={() => isSortable && handleSort(columnKey)}
                                >
                                    {col.header}
                                    {isSortable && getSortIcon(columnKey)}
                                </div>
                            </th>
                        );
                    })}
                    {actions && <th className="px-3 lg:px-6 py-2 lg:py-3 text-left whitespace-nowrap w-24">Действия</th>}
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm lg:text-[16px]">
                {data.map((row, idx) => (
                    <tr
                        key={idx}
                        className="transition-all hover:bg-blue-50"
                    >
                        {columns.map((col, colIndex) => {
                            let cellValue: ReactNode;
                            
                            if (typeof col.accessor === 'function') {
                                cellValue = (col.accessor as (row: Record<string, any>) => ReactNode)(row);
                            } else {
                                cellValue = typeof row[col.accessor as string] === "object"
                                    ? row[col.accessor as string]?.name ?? "-"
                                    : row[col.accessor as string] ?? "-";
                            }
                            
                            const customClass = col.cellClassName ? col.cellClassName(cellValue, row) : "";
                            
                            return (
                                <td key={typeof col.accessor === 'function' ? `custom-${colIndex}` : col.accessor as string} className="px-3 lg:px-6 py-3 lg:py-4 text-gray-800">
                                    <div className={`truncate ${customClass}`} title={typeof cellValue === 'object' ? (cellValue as any)?.name ?? "-" : String(cellValue ?? "")}>
                                        {cellValue}
                                    </div>
                                </td>
                            );
                        })}

                        {actions && (
                            <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                {actions(row)}
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

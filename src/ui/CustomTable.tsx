import { FC, ReactNode } from "react";

interface Column {
    header: string;
    accessor: string | ((row: Record<string, any>) => ReactNode);
    cellClassName?: (value: any, row: Record<string, any>) => string;
}

interface CustomTableProps {
    columns: Column[];
    data: Record<string, any>[];
    actions?: (row: Record<string, any>) => ReactNode;
}

export const CustomTable: FC<CustomTableProps> = ({ columns, data, actions }) => {
    return (
        <div className="w-full overflow-x-auto rounded-[4px] shadow-md border border-gray-200">
            <table className="w-full divide-y divide-gray-200 bg-white text-sm lg:text-[16px]">
                <thead className="bg-blue-50 text-gray-700 uppercase text-sm lg:text-[16px] font-semibold">
                <tr>
                    {columns.map((col, index) => (
                        <th key={typeof col.accessor === 'function' ? `custom-${index}` : col.accessor as string} className="px-3 lg:px-6 py-2 lg:py-3 text-left">
                            <div className="whitespace-nowrap" title={col.header}>{col.header}</div>
                        </th>
                    ))}
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

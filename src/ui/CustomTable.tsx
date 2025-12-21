import { FC, ReactNode } from "react";

interface Column {
    header: string;
    accessor: string;
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
                    {columns.map(col => (
                        <th key={col.accessor} className="px-3 lg:px-6 py-2 lg:py-3 text-left">
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
                        {columns.map(col => {
                            const cellValue = typeof row[col.accessor] === "object"
                                ? row[col.accessor]?.name ?? "-"
                                : row[col.accessor] ?? "-";
                            const customClass = col.cellClassName ? col.cellClassName(row[col.accessor], row) : "";
                            
                            return (
                                <td key={col.accessor} className="px-3 lg:px-6 py-3 lg:py-4 text-gray-800">
                                    <div className={`truncate ${customClass}`} title={typeof row[col.accessor] === "object" ? row[col.accessor]?.name ?? "-" : String(row[col.accessor] ?? "")}>
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

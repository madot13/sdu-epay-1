import { FC, ReactNode, useState } from "react";

interface Column {
    header: string;
    accessor: string;
}

interface CustomTableProps {
    columns: Column[];
    data: Record<string, any>[];
    actions?: (row: Record<string, any>) => ReactNode;
}

export const CustomTable: FC<CustomTableProps> = ({ columns, data, actions }) => {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const isAllSelected = selectedRows.length === data.length;

    const toggleRow = (index: number) => {
        setSelectedRows(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedRows([]);
        } else {
            setSelectedRows(data.map((_, i) => i));
        }
    };

    return (
        <div className="w-full overflow-x-auto rounded-[4px] shadow-md border border-gray-200">
            <table className="w-full divide-y divide-gray-200 bg-white text-sm lg:text-[16px]">
                <thead className="bg-blue-50 text-gray-700 uppercase text-sm lg:text-[16px] font-semibold">
                <tr>
                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-left w-10">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleAll}
                            className="accent-blue-600"
                        />
                    </th>
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
                        className={`transition-all hover:bg-blue-50 ${selectedRows.includes(idx) ? "bg-blue-100" : ""}`}
                    >
                        <td className="px-2 lg:px-4 py-3 lg:py-4">
                            <input
                                type="checkbox"
                                checked={selectedRows.includes(idx)}
                                onChange={() => toggleRow(idx)}
                                className="accent-blue-600"
                            />
                        </td>
                        {columns.map(col => (
                            <td key={col.accessor} className="px-3 lg:px-6 py-3 lg:py-4 text-gray-800">
                                <div className="truncate" title={typeof row[col.accessor] === "object" ? row[col.accessor]?.name ?? "-" : String(row[col.accessor] ?? "")}>
                                    {typeof row[col.accessor] === "object"
                                        ? row[col.accessor]?.name ?? "-"
                                        : row[col.accessor] ?? "-"}
                                </div>
                            </td>
                        ))}

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

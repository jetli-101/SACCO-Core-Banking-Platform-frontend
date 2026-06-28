import { Key, ReactNode } from 'react';

export interface TableColumn<T> {
    header: ReactNode;
    accessor: keyof T | ((row: T) => ReactNode);
    className?: string;
}

interface TableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    rowKey: (row: T) => Key;
    emptyMessage?: string;
    hover?: boolean;
    striped?: boolean;
    className?: string;
}

const Table = <T,>({ columns, data, rowKey, emptyMessage = 'No records found', hover = true, striped = false, className = '' }: TableProps<T>) => {
    const getCellValue = (row: T, column: TableColumn<T>) => (typeof column.accessor === 'function' ? column.accessor(row) : (row[column.accessor] as ReactNode));

    return (
        <div className={`table-responsive ${className}`.trim()}>
            <table className={`${hover ? 'table-hover' : ''} ${striped ? 'table-striped' : ''}`.trim()}>
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index} className={`whitespace-nowrap text-xs font-bold uppercase tracking-wide text-white-dark ${column.className || ''}`.trim()}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center text-white-dark">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => (
                            <tr key={rowKey(row)}>
                                {columns.map((column, index) => (
                                    <td key={index} className={column.className}>
                                        {getCellValue(row, column)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;

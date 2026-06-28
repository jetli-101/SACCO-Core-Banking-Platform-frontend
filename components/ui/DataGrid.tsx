import { Key, ReactNode, useEffect, useMemo, useState } from 'react';
import Table, { TableColumn } from './Table';
import Pagination from './Pagination';
import IconSearch from '@/components/Icon/IconSearch';

export type { TableColumn } from './Table';

interface DataGridProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    rowKey: (row: T) => Key;
    searchKeys?: (keyof T)[];
    searchPlaceholder?: string;
    pageSizeOptions?: number[];
    defaultPageSize?: number;
    emptyMessage?: string;
    loading?: boolean;
    toolbarActions?: ReactNode;
    hover?: boolean;
    striped?: boolean;
    className?: string;
}

const matchesSearch = <T,>(row: T, term: string, searchKeys?: (keyof T)[]) => {
    const values = searchKeys ? searchKeys.map((key) => row[key]) : Object.values(row as Record<string, unknown>);
    return values.some((value) => value !== null && value !== undefined && String(value).toLowerCase().includes(term));
};

// Generic search + paginated table for any list view in the app — wraps the existing
// Table/Pagination primitives instead of reimplementing rendering, so it stays in sync
// with their styling automatically. Import and pass columns/data/rowKey like Table,
// the grid owns search term, page, and page size itself.
const DataGrid = <T,>({
    columns,
    data,
    rowKey,
    searchKeys,
    searchPlaceholder = 'Search...',
    pageSizeOptions = [5, 10, 20, 50],
    defaultPageSize = 5,
    emptyMessage,
    loading = false,
    toolbarActions,
    hover = true,
    striped = true,
    className = '',
}: DataGridProps<T>) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return data;
        return data.filter((row) => matchesSearch(row, term, searchKeys));
    }, [data, search, searchKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    useEffect(() => {
        setPage(1);
    }, [search, pageSize, data.length]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, filtered.length);

    return (
        <div className={className}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <select
                        className="form-select form-select-sm w-auto"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        aria-label="Rows per page"
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>

                    <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white-dark">
                            <IconSearch className="h-4 w-4" />
                        </span>
                        <input type="text" className="form-input form-input-sm pl-9" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                {toolbarActions && <div className="flex items-center gap-3">{toolbarActions}</div>}
            </div>

            {loading ? (
                <div className="panel flex min-h-[200px] items-center justify-center">
                    <span className="text-white-dark">Loading…</span>
                </div>
            ) : (
                <Table columns={columns} data={paginated} rowKey={rowKey} emptyMessage={search ? 'No matching records found' : emptyMessage} hover={hover} striped={striped} />
            )}

            {!loading && filtered.length > 0 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <p className="text-sm text-white-dark">
                        Showing {rangeStart}-{rangeEnd} of {filtered.length}
                    </p>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
};

export default DataGrid;

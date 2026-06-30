import { Key, ReactNode, useEffect, useMemo, useState } from 'react';
import Table, { TableColumn } from './Table';
import Pagination from './Pagination';
import Button from './Button';
import IconSearch from '@/components/Icon/IconSearch';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconPrinter from '@/components/Icon/IconPrinter';
import Spinner from './Spinner';

export type { TableColumn } from './Table';

interface DataGridProps<T> {
    title?: ReactNode;
    count?: number;
    columns: TableColumn<T>[];
    data: T[];
    rowKey: (row: T) => Key;
    searchKeys?: (keyof T)[];
    searchPlaceholder?: string;
    pageSize?: number;
    emptyMessage?: string;
    loading?: boolean;
    onRefresh?: () => unknown;
    toolbarActions?: ReactNode;
    hover?: boolean;
    striped?: boolean;
    panel?: boolean;
    className?: string;
}

const matchesSearch = <T,>(row: T, term: string, searchKeys?: (keyof T)[]) => {
    const values = searchKeys ? searchKeys.map((key) => row[key]) : Object.values(row as Record<string, unknown>);
    return values.some((value) => value !== null && value !== undefined && String(value).toLowerCase().includes(term));
};

// Generic search + paginated table for any list view in the app — wraps the existing
// Table/Pagination primitives instead of reimplementing rendering. Owns its own panel
// wrapper and single-row header (title + count + search on the left, action buttons on
// the right) so every list page in the app shares one layout instead of each page
// hand-rolling its own header row above a bare table. Pass panel={false} for embedded
// usage (e.g. inside a tab body that's already inside a panel).
const DataGrid = <T,>({
    title,
    count,
    columns,
    data,
    rowKey,
    searchKeys,
    searchPlaceholder = 'Search...',
    pageSize = 5,
    emptyMessage,
    loading = false,
    onRefresh,
    toolbarActions,
    hover = true,
    striped = false,
    panel = true,
    className = '',
}: DataGridProps<T>) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);

    const MIN_REFRESH_DISPLAY_MS = 4000;

    const handleRefresh = () => {
        if (!onRefresh || refreshing) return;
        const result = onRefresh();
        if (result instanceof Promise) {
            setRefreshing(true);
            const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_DISPLAY_MS));
            Promise.all([result, minDelay]).finally(() => setRefreshing(false));
        }
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return data;
        return data.filter((row) => matchesSearch(row, term, searchKeys));
    }, [data, search, searchKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    useEffect(() => {
        setPage(1);
    }, [search, data.length]);

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
        <div className={`${panel ? 'panel' : ''} ${className}`.trim()}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                    {title && (
                        <h5 className="text-lg font-semibold">
                            {title} {count !== undefined && <span className="text-white-dark">{count}</span>}
                        </h5>
                    )}
                    <div className="relative w-full sm:w-64">
                        <input type="text" className="form-input form-input-sm pr-10" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white-dark">
                            <IconSearch className="h-4 w-4" />
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <Button variant="outline-primary" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            {refreshing ? (
                                <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            ) : (
                                <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            )}
                            Refresh
                        </Button>
                    )}
                    <Button variant="outline-primary" size="sm" onClick={() => window.print()}>
                        <IconPrinter className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Print
                    </Button>
                    {toolbarActions}
                </div>
            </div>

            {loading || refreshing ? (
                <div className="flex min-h-[100px] items-center justify-center gap-2">
                    <Spinner className="h-5 w-5 text-primary" />
                    <span className="text-white-dark">{refreshing ? 'Refreshing…' : 'Loading…'}</span>
                </div>
            ) : (
                <Table columns={columns} data={paginated} rowKey={rowKey} emptyMessage={search ? 'No matching records found' : emptyMessage} hover={hover} striped={striped} />
            )}

            {!loading && !refreshing && filtered.length > 0 && totalPages > 1 && (
                <div className="mt-3 flex flex-col items-center gap-1">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    <p className="text-xs text-white-dark">
                        Showing {rangeStart}-{rangeEnd} of {filtered.length}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DataGrid;

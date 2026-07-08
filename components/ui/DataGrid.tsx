import { Fragment, isValidElement, Key, ReactNode, useEffect, useMemo, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Table, { TableColumn } from './Table';
import Pagination from './Pagination';
import Button from './Button';
import Spinner from './Spinner';
import Dropdown from '@/components/Dropdown';
import IconSearch from '@/components/Icon/IconSearch';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconPrinter from '@/components/Icon/IconPrinter';
import IconDownload from '@/components/Icon/IconDownload';
import IconFile from '@/components/Icon/IconFile';
import IconCode from '@/components/Icon/IconCode';
import IconCaretDown from '@/components/Icon/IconCaretDown';

export type { TableColumn } from './Table';

// Letterhead used on the branded print/PDF output — keep in sync with components/Home/Footer.tsx.
const ORG = {
    name: 'SmoothSurf Sacco',
    address: 'Westlands, Nairobi, Kenya',
    email: 'hello@smoothsurfsacco.co.ke',
    phone: '+254 700 000 000',
    logo: '/assets/images/smoothsurf-logo.png',
};

export interface GroupConfig<T> {
    /** Field to group rows by (e.g. 'moduleId'). */
    groupByKey: keyof T;
    /** Field holding the human label for a group (e.g. 'moduleName'). */
    groupLabelKey: keyof T;
    /** Columns to render for the expanded child rows — defaults to the top-level `columns`. */
    childColumns?: TableColumn<T>[];
}

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
    /** Adds an Export menu (CSV / Excel / PDF / JSON) — the PDF carries the SmoothSurf Sacco letterhead. */
    exportable?: boolean;
    exportFileName?: string;
    /** Shows a "Filter" button next to Print/Export — omit unless a filter panel is actually wired up. */
    onFilterClick?: () => void;
    /** Renders rows as collapsible groups (e.g. by module) instead of a flat list. */
    groupConfig?: GroupConfig<T>;
    groupsPerPage?: number;
}

const isActionsColumn = (header: ReactNode) => extractText(header).trim().toLowerCase() === 'actions';

// Flattens a cell's rendered React output (badges, links, nested divs, …) down to plain
// text so search/export/print all read from the same source of truth as what's on screen.
const extractText = (node: ReactNode): string => {
    if (node === null || node === undefined) return '';
    if (isValidElement(node)) {
        const html = ReactDOMServer.renderToStaticMarkup(node);
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || '';
    }
    if (Array.isArray(node)) return node.map(extractText).join(', ');
    return String(node);
};

const getCellValue = <T,>(row: T, column: TableColumn<T>): ReactNode => (typeof column.accessor === 'function' ? column.accessor(row) : (row[column.accessor] as ReactNode));

const matchesSearch = <T,>(row: T, term: string, columns: TableColumn<T>[], searchKeys?: (keyof T)[]) => {
    if (searchKeys) return searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(term));
    return columns.some((column) => extractText(getCellValue(row, column)).toLowerCase().includes(term));
};

const loadImageDataUrl = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
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
    exportable = false,
    exportFileName,
    onFilterClick,
    groupConfig,
    groupsPerPage = 10,
}: DataGridProps<T>) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
        return data.filter((row) => matchesSearch(row, term, columns, searchKeys));
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Grouped/collapsible mode — buckets rows by groupConfig.groupByKey.
    const groups = useMemo(() => {
        if (!groupConfig) return null;
        const buckets = new Map<string, { id: string; label: string; items: T[] }>();
        data.forEach((row) => {
            const id = String(row[groupConfig.groupByKey] ?? 'uncategorized');
            const label = String(row[groupConfig.groupLabelKey] ?? 'Uncategorized');
            if (!buckets.has(id)) buckets.set(id, { id, label, items: [] });
            buckets.get(id)!.items.push(row);
        });
        return Array.from(buckets.values());
    }, [data, groupConfig]);

    const filteredGroups = useMemo(() => {
        if (!groups) return null;
        const term = search.trim().toLowerCase();
        if (!term) return groups;
        const childColumns = groupConfig?.childColumns || columns;
        return groups
            .map((group) => ({ ...group, items: group.items.filter((item) => matchesSearch(item, term, childColumns, searchKeys)) }))
            .filter((group) => group.label.toLowerCase().includes(term) || group.items.length > 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groups, search, searchKeys]);

    const totalGroupPages = filteredGroups ? Math.max(1, Math.ceil(filteredGroups.length / groupsPerPage)) : 1;
    const paginatedGroups = filteredGroups ? filteredGroups.slice((page - 1) * groupsPerPage, page * groupsPerPage) : null;

    const toggleGroup = (id: string) => setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

    // Rows that feed export/print — always the full filtered set, not just the current page.
    const exportColumns = (groupConfig ? groupConfig.childColumns || columns : columns).filter((column) => !isActionsColumn(column.header));
    const exportRows = groupConfig ? (filteredGroups?.flatMap((group) => group.items) ?? []) : filtered;
    const fileBase = (exportFileName || extractText(title) || 'export').replace(/[^a-z0-9\-_]/gi, '_').toLowerCase();
    const reportTitle = extractText(title) || 'Data Report';

    const buildExportRows = () =>
        exportRows.map((row) => {
            const record: Record<string, string> = {};
            exportColumns.forEach((column) => {
                record[extractText(column.header)] = extractText(getCellValue(row, column));
            });
            return record;
        });

    const exportToCSV = () => {
        const rows = buildExportRows();
        const headers = Object.keys(rows[0] || {});
        const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => `"${(row[header] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileBase}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportToExcel = () => {
        const rows = buildExportRows();
        const headers = Object.keys(rows[0] || {});
        const sheetRows = [
            [ORG.name],
            [ORG.address],
            [`${ORG.email} | ${ORG.phone}`],
            [],
            [reportTitle],
            [`Generated on: ${new Date().toLocaleString()}`, `Total Records: ${rows.length}`],
            [],
            headers,
            ...rows.map((row) => headers.map((header) => row[header] ?? '')),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
        worksheet['!cols'] = headers.map(() => ({ wch: 26 }));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `${fileBase}.xlsx`);
    };

    const exportToJSON = () => {
        const blob = new Blob([JSON.stringify(buildExportRows(), null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileBase}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportToPDF = async () => {
        const rows = buildExportRows();
        const headers = Object.keys(rows[0] || {});
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 14;

        const logoData = await loadImageDataUrl(ORG.logo);
        if (logoData) {
            try {
                doc.addImage(logoData, 'PNG', 14, y, 16, 16);
            } catch {
                // Logo failed to decode — continue without it rather than aborting the export.
            }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.text(ORG.name, logoData ? 34 : 14, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(ORG.address, logoData ? 34 : 14, y + 11);
        doc.text(`${ORG.email} | ${ORG.phone}`, logoData ? 34 : 14, y + 16);
        y += 24;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 58, 138);
        doc.text(reportTitle, pageWidth / 2, y, { align: 'center' });
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, y);
        doc.text(`Total Records: ${rows.length}`, pageWidth - 14, y, { align: 'right' });

        autoTable(doc, {
            head: [headers],
            body: rows.map((row) => headers.map((header) => row[header] ?? '')),
            startY: y + 5,
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', valign: 'middle' },
            headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
        }

        doc.save(`${fileBase}.pdf`);
    };

    const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'json') => {
        if (exportRows.length === 0) return;
        setExporting(true);
        try {
            if (format === 'csv') exportToCSV();
            else if (format === 'excel') exportToExcel();
            else if (format === 'json') exportToJSON();
            else await exportToPDF();
        } finally {
            setExporting(false);
        }
    };

    // Branded print — renders just the (filtered) dataset with the SmoothSurf Sacco
    // letterhead, instead of the browser printing whatever else is on the page.
    const handlePrint = async () => {
        if (exportRows.length === 0) return;

        document.getElementById('datagrid-print-content')?.remove();
        document.getElementById('datagrid-print-style')?.remove();

        const rows = buildExportRows();
        const headers = Object.keys(rows[0] || {});
        const logoData = await loadImageDataUrl(ORG.logo);

        const container = document.createElement('div');
        container.id = 'datagrid-print-content';
        container.innerHTML = `
            <div class="dg-print-header">
                ${logoData ? `<img src="${logoData}" class="dg-print-logo" />` : ''}
                <div>
                    <div class="dg-print-org">${ORG.name}</div>
                    <div class="dg-print-meta">${ORG.address}</div>
                    <div class="dg-print-meta">${ORG.email} | ${ORG.phone}</div>
                </div>
            </div>
            <div class="dg-print-title">${reportTitle}</div>
            <div class="dg-print-summary">
                <span>Total Records: ${rows.length}</span>
                <span>Generated: ${new Date().toLocaleString()}</span>
            </div>
            <table class="dg-print-table">
                <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
                <tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${row[header] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
        `;

        const style = document.createElement('style');
        style.id = 'datagrid-print-style';
        style.textContent = `
            @media print {
                body * { visibility: hidden; }
                #datagrid-print-content, #datagrid-print-content * { visibility: visible; }
                #datagrid-print-content { position: absolute; inset: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; }
                @page { size: A4 landscape; margin: 1.2cm; }
                .dg-print-header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 14px; }
                .dg-print-logo { width: 48px; height: 48px; object-fit: contain; }
                .dg-print-org { font-size: 16px; font-weight: 700; color: #1e3a8a; }
                .dg-print-meta { font-size: 9pt; color: #4b5563; }
                .dg-print-title { text-align: center; font-size: 14px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
                .dg-print-summary { display: flex; justify-content: space-between; font-size: 9pt; color: #4b5563; margin-bottom: 12px; }
                .dg-print-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                .dg-print-table th, .dg-print-table td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
                .dg-print-table th { background: #1e3a8a; color: white; }
                .dg-print-table tr:nth-child(even) { background: #f8fafc; }
            }
        `;

        document.body.appendChild(container);
        document.head.appendChild(style);
        window.print();

        const cleanup = () => {
            container.remove();
            style.remove();
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        setTimeout(cleanup, 10000);
    };

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
                    {onFilterClick && (
                        <Button variant="outline-primary" size="sm" onClick={onFilterClick}>
                            Filter
                        </Button>
                    )}
                    <Button variant="outline-primary" size="sm" onClick={handlePrint}>
                        <IconPrinter className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Print
                    </Button>
                    {exportable && (
                        <div className="dropdown">
                            <Dropdown
                                placement="bottom-end"
                                btnClassName="btn btn-outline-primary btn-sm"
                                button={
                                    <>
                                        {exporting ? (
                                            <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                                        ) : (
                                            <IconDownload className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                                        )}
                                        {exporting ? 'Exporting…' : 'Export'}
                                    </>
                                }
                            >
                                <ul className="w-44 !py-1 text-dark dark:text-white-dark">
                                    <li>
                                        <button type="button" onClick={() => handleExport('pdf')}>
                                            <IconFile className="h-4.5 w-4.5 shrink-0 text-danger ltr:mr-2 rtl:ml-2" />
                                            Export as PDF
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => handleExport('excel')}>
                                            <IconFile className="h-4.5 w-4.5 shrink-0 text-success ltr:mr-2 rtl:ml-2" />
                                            Export as Excel
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => handleExport('csv')}>
                                            <IconFile className="h-4.5 w-4.5 shrink-0 text-white-dark ltr:mr-2 rtl:ml-2" />
                                            Export as CSV
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => handleExport('json')}>
                                            <IconCode className="h-4.5 w-4.5 shrink-0 text-warning ltr:mr-2 rtl:ml-2" />
                                            Export as JSON
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    )}
                    {toolbarActions}
                </div>
            </div>

            {loading || refreshing ? (
                <div className="flex min-h-[100px] items-center justify-center gap-2">
                    <Spinner className="h-5 w-5 text-primary" />
                    <span className="text-white-dark">{refreshing ? 'Refreshing…' : 'Loading…'}</span>
                </div>
            ) : groupConfig ? (
                <div className="table-responsive">
                    <table className={hover ? 'table-hover' : ''}>
                        <thead>
                            <tr>
                                <th className="w-10" />
                                <th className="text-sm font-semibold text-dark dark:text-white-light">{String(groupConfig.groupLabelKey)}</th>
                                <th className="text-sm font-semibold text-dark dark:text-white-light">Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!paginatedGroups || paginatedGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center text-white-dark">
                                        {search ? 'No matching records found' : emptyMessage || 'No records found'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedGroups.map((group) => {
                                    const childColumns = groupConfig.childColumns || columns;
                                    const isOpen = !!expandedGroups[group.id];
                                    return (
                                        <Fragment key={group.id}>
                                            <tr className="cursor-pointer hover:bg-primary-light/40 dark:hover:bg-white/5" onClick={() => toggleGroup(group.id)}>
                                                <td className="text-center">
                                                    <IconCaretDown className={`inline-block h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                </td>
                                                <td className="font-semibold">{group.label}</td>
                                                <td>
                                                    <span className="badge badge-outline-primary">
                                                        {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isOpen &&
                                                group.items.map((item, itemIndex) => (
                                                    <tr key={`${group.id}-${rowKey(item) ?? itemIndex}`} className="border-l-4 border-primary bg-primary-light/20 dark:bg-white/5">
                                                        <td />
                                                        {childColumns.map((column, colIndex) => (
                                                            <td key={colIndex} className={column.className}>
                                                                {getCellValue(item, column)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Table columns={columns} data={paginated} rowKey={rowKey} emptyMessage={search ? 'No matching records found' : emptyMessage} hover={hover} striped={striped} />
            )}

            {!loading && !refreshing && groupConfig && filteredGroups && filteredGroups.length > 0 && totalGroupPages > 1 && (
                <div className="mt-3 flex flex-col items-center gap-1">
                    <Pagination currentPage={page} totalPages={totalGroupPages} onPageChange={setPage} />
                    <p className="text-xs text-white-dark">
                        Showing {paginatedGroups?.length ?? 0} of {filteredGroups.length} groups
                    </p>
                </div>
            )}

            {!loading && !refreshing && !groupConfig && filtered.length > 0 && totalPages > 1 && (
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

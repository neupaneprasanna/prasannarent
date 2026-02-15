import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Filter, MoreHorizontal, Download, ChevronsUpDown } from 'lucide-react';

interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (item: T) => React.ReactNode;
    width?: string;
}

interface AdminTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onSearchChange?: (search: string) => void;
    onRowClick?: (item: T) => void;
    searchPlaceholder?: string;
    actions?: (item: T) => React.ReactNode;
    density?: 'comfortable' | 'compact';
    hideSearch?: boolean;
}

export const AdminTable = <T extends { id?: string | number }>({
    data,
    columns,
    loading = false,
    total = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    onSearchChange,
    onRowClick,
    searchPlaceholder = 'Search...',
    actions,
    density = 'comfortable',
    hideSearch = false
}: AdminTableProps<T>) => {
    // Search handler
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onSearchChange) onSearchChange(e.target.value);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-4" data-density={density}>
            {/* Toolbar */}
            {!hideSearch && (
                <div className="flex items-center justify-between gap-4 bg-white/[0.02] p-2 rounded-2xl border border-white/[0.04]">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-tertiary)] group-focus-within:text-[var(--admin-accent)] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            onChange={handleSearch}
                            className="w-full bg-transparent border-0 text-sm text-[var(--admin-text-primary)] pl-10 pr-4 py-2 focus:ring-0 placeholder:text-[var(--admin-text-muted)] h-10"
                        />
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all admin-focus-ring">
                            <Filter size={18} />
                        </button>
                        <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all admin-focus-ring">
                            <Download size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="admin-glass-panel rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Loader Overlay */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
                        >
                            <div className="w-8 h-8 border-2 border-[var(--admin-accent-glow)] border-t-[var(--admin-accent)] rounded-full animate-spin" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="overflow-x-auto scrollbar-thin admin-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className="px-3 md:px-[var(--admin-p-md)] py-[var(--admin-p-sm)] text-[10px] uppercase font-bold text-[var(--admin-text-tertiary)] tracking-wider whitespace-nowrap first:pl-4 md:first:pl-6 last:pr-4 md:last:pr-6"
                                    >
                                        <div className="flex items-center gap-2 cursor-pointer hover:text-white/60 transition-colors group">
                                            {col.header}
                                            <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </th>
                                ))}
                                {actions && <th className="px-[var(--admin-p-md)] py-[var(--admin-p-sm)] w-[50px]"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {data.map((row, rowIdx) => (
                                <motion.tr
                                    key={row.id || rowIdx}
                                    layoutId={row.id ? String(row.id) : undefined}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: rowIdx * 0.03 }}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`group hover:bg-white/[0.02] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className="px-3 md:px-[var(--admin-p-md)] py-[var(--admin-p-sm)] text-sm text-[var(--admin-text-secondary)] first:pl-4 md:first:pl-6 last:pr-4 md:last:pr-6 whitespace-nowrap"
                                        >
                                            {col.cell ? col.cell(row) : ((row as any)[col.accessorKey] || '—')}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-3 md:px-[var(--admin-p-md)] py-[var(--admin-p-sm)] text-right pr-4 md:pr-6">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                {actions(row)}
                                            </div>
                                        </td>
                                    )}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {!loading && data.length === 0 && (
                    <div className="p-12 text-center text-white/30 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                            <Filter size={24} className="opacity-50" />
                        </div>
                        <p className="text-sm font-medium">No results found</p>
                    </div>
                )}

                {/* Pagination */}
                <div className="border-t border-white/[0.06] bg-white/[0.02] px-6 py-3 flex items-center justify-between">
                    <p className="text-xs text-[var(--admin-text-tertiary)]">
                        Showing <span className="text-white font-bold">{data.length}</span> of <span className="text-white font-bold">{total}</span> items
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => onPageChange && onPageChange(page - 1)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent transition-all admin-focus-ring"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-mono text-white/60">
                            Page {page} / {totalPages || 1}
                        </span>
                        <button
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => onPageChange && onPageChange(page + 1)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent transition-all admin-focus-ring"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Building2,
    DollarSign,
    MoreVertical
} from 'lucide-react';
import { useAdminBookingsStore } from '@/store/admin/admin-data-stores';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';

export default function BookingsPage() {
    const router = useRouter();
    const { token } = useAdminAuthStore();
    const {
        items, total, loading, page, pageSize, filters,
        fetch, setPage, setFilters
    } = useAdminBookingsStore();

    useEffect(() => {
        if (token) fetch(token);
    }, [token, page, filters, fetch]);

    const handleRowClick = (booking: any) => {
        router.push(`/admin/bookings/${booking.id}`);
    };

    const columns = [
        {
            header: 'Booking ID',
            accessorKey: 'id',
            cell: (booking: any) => (
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-tighter">
                    #{booking.id.slice(-8)}
                </span>
            )
        },
        {
            header: 'Listing',
            accessorKey: 'listing',
            cell: (booking: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center overflow-hidden">
                        {(() => {
                            const mainImage = booking.listing?.media?.find((m: any) => m.type === 'IMAGE' || m.type === 'image')?.url ||
                                (booking.listing?.images && booking.listing.images.length > 0 ? booking.listing.images[0] : null);
                            return mainImage ? (
                                <img src={mainImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={14} className="text-white/20" />
                            );
                        })()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white line-clamp-1">{booking.listing?.title}</p>
                        <p className="text-[10px] text-white/30 truncate">{booking.listing?.location}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Customer',
            accessorKey: 'renter',
            cell: (booking: any) => (
                <div className="flex flex-col">
                    <span className="text-sm text-white/80">{booking.renter?.firstName} {booking.renter?.lastName}</span>
                    <span className="text-[10px] text-white/20">{booking.renter?.email}</span>
                </div>
            )
        },
        {
            header: 'Dates',
            accessorKey: 'startDate',
            cell: (booking: any) => (
                <div className="flex flex-col text-[11px] text-white/50">
                    <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                    <span className="text-[10px] opacity-50">to {new Date(booking.endDate).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            header: 'Amount',
            accessorKey: 'totalPrice',
            cell: (booking: any) => (
                <div className="font-bold text-white flex items-center">
                    <DollarSign size={12} className="text-emerald-400" />
                    {booking.totalPrice}
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (booking: any) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' :
                    booking.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400' :
                        booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                            'bg-white/10 text-white/40'
                    }`}>
                    {booking.status}
                </span>
            )
        }
    ];

    const stats = [
        { label: 'All Bookings', value: total, icon: Calendar },
        { label: 'Revenue', value: `$${items.reduce((acc, b) => acc + (b.totalPrice || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
        { label: 'Confirmed', value: items.filter(b => b.status === 'CONFIRMED').length, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Disputed', value: items.filter(b => b.status === 'CANCELLED').length, icon: AlertCircle, color: 'text-red-400' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Booking Management</h1>
                    <p className="text-sm text-white/40">Monitor transactions, handle disputes, and track performance.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetch(token!)}
                        className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                        Refresh Data
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                        <CreditCard size={18} />
                        Process Payouts
                    </button>
                </div>
            </div>

            {/* Business Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s: any, idx: number) => (
                    <AdminStatsCard
                        key={idx}
                        title={s.label}
                        value={s.value}
                        icon={s.icon}
                        loading={loading}
                    />
                ))}
            </div>

            {/* Bookings Table */}
            <AdminTable
                data={items}
                columns={columns}
                loading={loading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onSearchChange={() => { }} // No search in backend for bookings yet
                onRowClick={handleRowClick}
                searchPlaceholder="Search bookings (Coming soon...)"
                actions={(booking: any) => (
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                            <MoreVertical size={16} />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}

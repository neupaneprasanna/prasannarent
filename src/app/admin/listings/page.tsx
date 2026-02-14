'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    CheckCircle2,
    Clock,
    Trash2,
    Eye,
    DollarSign,
    MapPin,
    AlertTriangle,
    Check
} from 'lucide-react';
import { useAdminListingsStore } from '@/store/admin/admin-data-stores';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';

export default function ListingsPage() {
    const router = useRouter();
    const { token } = useAdminAuthStore();
    const {
        items, total, loading, page, pageSize, search, filters,
        fetch, setPage, setSearch, setFilters, approveListing, deleteListing
    } = useAdminListingsStore();

    useEffect(() => {
        if (token) fetch(token);
    }, [token, page, search, filters, fetch]);

    const handleRowClick = (listing: any) => {
        router.push(`/admin/listings/${listing.id}`);
    };

    const handleApprove = async (id: string) => {
        if (token) {
            await approveListing(token, id);
        }
    };

    const handleDelete = async (id: string) => {
        if (token && window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            await deleteListing(token, id);
        }
    };

    const columns = [
        {
            header: 'Listing',
            accessorKey: 'title',
            cell: (listing: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.06]">
                        {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                                <Building2 size={16} />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-white line-clamp-1">{listing.title}</p>
                        <p className="text-[10px] text-white/30 flex items-center gap-1">
                            <MapPin size={10} />
                            {listing.location || 'N/A'}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: 'Owner',
            accessorKey: 'owner',
            cell: (listing: any) => (
                <div className="flex flex-col">
                    <span className="text-sm text-white/80">{listing.owner?.firstName} {listing.owner?.lastName}</span>
                    <span className="text-[10px] text-white/20">{listing.owner?.email}</span>
                </div>
            )
        },
        {
            header: 'Price',
            accessorKey: 'price',
            cell: (listing: any) => (
                <div className="font-semibold text-white">
                    ${listing.price} <span className="text-[10px] text-white/30 font-normal">/day</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (listing: any) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${listing.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                    listing.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400' :
                        listing.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                            'bg-white/10 text-white/40'
                    }`}>
                    {listing.status}
                </span>
            )
        },
        {
            header: 'Stats',
            accessorKey: 'id',
            cell: (listing: any) => (
                <div className="flex items-center gap-3 text-white/40">
                    <div className="flex items-center gap-1" title="Views">
                        <Eye size={12} />
                        <span className="text-[10px] font-medium">{listing._count?.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Bookings">
                        <DollarSign size={12} />
                        <span className="text-[10px] font-medium">{listing._count?.bookings || 0}</span>
                    </div>
                </div>
            )
        }
    ];

    const stats = [
        { label: 'Total Listings', value: total, icon: Building2 },
        { label: 'Active', value: items.filter(l => l.status === 'ACTIVE').length, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Pending', value: items.filter(l => l.status === 'PENDING').length, icon: Clock, color: 'text-orange-400' },
        { label: 'Flagged', value: items.filter(l => l.status === 'REJECTED').length, icon: AlertTriangle, color: 'text-red-400' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Listing Management</h1>
                    <p className="text-sm text-white/40">Moderation and management of platform rental inventory.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setFilters({ status: 'PENDING' })}
                        className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition-all flex items-center gap-2"
                    >
                        Review Pending
                        <span className="bg-orange-500 text-white px-1.5 rounded-md text-[10px]">{items.filter(l => l.status === 'PENDING').length}</span>
                    </button>
                    <button
                        onClick={() => setFilters({})}
                        className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs font-bold text-white/60 hover:bg-white/[0.06] transition-all"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, idx) => (
                    <AdminStatsCard
                        key={idx}
                        title={s.label}
                        value={s.value}
                        icon={s.icon}
                        loading={loading}
                    />
                ))}
            </div>

            {/* Listings Table */}
            <AdminTable
                data={items}
                columns={columns}
                loading={loading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onSearchChange={setSearch}
                onRowClick={handleRowClick}
                searchPlaceholder="Search listings by title..."
                actions={(listing) => (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(listing.id); }}
                            className="p-1.5 rounded-lg text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            title="Quick Approve"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(listing.id); }}
                            className="p-1.5 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}

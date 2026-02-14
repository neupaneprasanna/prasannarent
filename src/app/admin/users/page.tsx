'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users as UsersIcon,
    UserPlus,
    ShieldAlert,
    Ban,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    MoreVertical,
    Activity
} from 'lucide-react';
import { useAdminUsersStore } from '@/store/admin/admin-data-stores';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';

export default function UsersPage() {
    const router = useRouter();
    const { token } = useAdminAuthStore();
    const {
        items, total, loading, page, pageSize, search,
        fetch, setPage, setSearch
    } = useAdminUsersStore();

    useEffect(() => {
        if (token) fetch(token);
    }, [token, page, search, fetch]);

    const handleRowClick = (user: any) => {
        router.push(`/admin/users/${user.id}`);
    };

    const columns = [
        {
            header: 'User',
            accessorKey: 'email',
            cell: (user: any) => {
                const isOnline = user.lastSeenAt && new Date(user.lastSeenAt).getTime() > Date.now() - 15 * 60 * 1000;
                return (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            {isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0a0a0f] rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                                {isOnline && <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-tighter">Online</span>}
                            </div>
                            <p className="text-xs text-white/30">{user.email}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Role',
            accessorKey: 'role',
            cell: (user: any) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' :
                        user.role === 'USER' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-white/10 text-white/40'
                    }`}>
                    {user.role}
                </span>
            )
        },
        {
            header: 'Account Status',
            accessorKey: 'banned',
            cell: (user: any) => (
                <div className="flex items-center gap-1.5">
                    {user.banned ? (
                        <>
                            <XCircle size={14} className="text-red-400" />
                            <span className="text-xs text-red-400/80 font-medium">Banned Account</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span className="text-xs text-emerald-400/80 font-medium">Good Standing</span>
                        </>
                    )}
                </div>
            )
        },
        {
            header: 'Verified',
            accessorKey: 'verified',
            cell: (user: any) => (
                user.verified ? (
                    <ShieldCheck size={16} className="text-cyan-400" />
                ) : (
                    <ShieldAlert size={16} className="text-white/20" />
                )
            )
        },
        {
            header: 'Joined',
            accessorKey: 'createdAt',
            cell: (user: any) => (
                <span className="text-xs text-white/40">
                    {new Date(user.createdAt).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-sm text-white/40">Manage platform users, roles, and access controls.</p>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all">
                    <UserPlus size={18} />
                    Add User
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatsCard
                    title="Total Users"
                    value={total}
                    icon={UsersIcon}
                    description="Total registered accounts"
                />
                <AdminStatsCard
                    title="Real-time Active"
                    value={items.filter(u => u.lastSeenAt && new Date(u.lastSeenAt).getTime() > Date.now() - 15 * 60 * 1000).length}
                    icon={Activity}
                    description="Online in last 15m"
                    change={12}
                    changeType="increase"
                />
                <AdminStatsCard
                    title="Banned"
                    value={items.filter(u => u.banned).length}
                    icon={Ban}
                    description="Restricted accounts"
                />
                <AdminStatsCard
                    title="Unverified"
                    value={items.filter(u => !u.verified).length}
                    icon={ShieldAlert}
                    description="Pending verification"
                />
            </div>

            {/* User Table */}
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
                searchPlaceholder="Search users by name or email..."
                actions={(user) => (
                    <button className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all">
                        <MoreVertical size={16} />
                    </button>
                )}
            />
        </div>
    );
}

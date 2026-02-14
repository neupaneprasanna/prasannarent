'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, Mail, Calendar, MapPin,
    ShieldCheck, ShieldAlert, Ban, Undo2,
    CheckCircle2, XCircle, CreditCard, Activity
} from 'lucide-react';
import { useAdminUsersStore } from '@/store/admin/admin-data-stores';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminModal } from '@/components/admin/ui/AdminModal';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAdminAuthStore();
    const { items, fetch, banUser, unbanUser } = useAdminUsersStore();

    const userId = params.id as string;
    const user = items.find(u => u.id === userId);

    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        if (token && !user) {
            fetch(token);
        }
    }, [token, user, fetch]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleBan = async () => {
        if (!token) return;
        setLoadingAction(true);
        try {
            await banUser(token, user.id, banReason);
            setIsBanModalOpen(false);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleUnban = async () => {
        if (!token) return;
        setLoadingAction(true);
        try {
            await unbanUser(token, user.id);
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg bg-[var(--admin-surface)] border border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)] transition-colors text-[var(--admin-text-secondary)]"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-cyan-500/20">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">{user.firstName} {user.lastName}</h1>
                            <div className="flex items-center gap-2 text-sm text-[var(--admin-text-tertiary)]">
                                <Mail size={12} />
                                {user.email}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {user.banned ? (
                        <button
                            onClick={handleUnban}
                            disabled={loadingAction}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-success)]/10 text-[var(--admin-success)] border border-[var(--admin-success)]/20 rounded-xl text-sm font-bold hover:bg-[var(--admin-success)]/20 transition-all"
                        >
                            <Undo2 size={16} />
                            Unban User
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsBanModalOpen(true)}
                            disabled={loadingAction}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-danger)]/10 text-[var(--admin-danger)] border border-[var(--admin-danger)]/20 rounded-xl text-sm font-bold hover:bg-[var(--admin-danger)]/20 transition-all"
                        >
                            <Ban size={16} />
                            Ban User
                        </button>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                            <p className="text-[10px] text-[var(--admin-text-tertiary)] uppercase font-bold tracking-widest mb-1">Account Role</p>
                            <p className="text-lg font-bold text-[var(--admin-text-primary)]">{user.role}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                            <p className="text-[10px] text-[var(--admin-text-tertiary)] uppercase font-bold tracking-widest mb-1">Verification</p>
                            <div className="flex items-center gap-2">
                                {user.verified ? (
                                    <>
                                        <ShieldCheck size={18} className="text-[var(--admin-success)]" />
                                        <span className="font-bold text-[var(--admin-success)]">Verified</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldAlert size={18} className="text-[var(--admin-warning)]" />
                                        <span className="font-bold text-[var(--admin-warning)]">Unverified</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                            <p className="text-[10px] text-[var(--admin-text-tertiary)] uppercase font-bold tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                {user.banned ? (
                                    <>
                                        <XCircle size={18} className="text-[var(--admin-danger)]" />
                                        <span className="font-bold text-[var(--admin-danger)]">Banned</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} className="text-[var(--admin-success)]" />
                                        <span className="font-bold text-[var(--admin-success)]">Active</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ban Info Block */}
                    {user.banned && (
                        <div className="p-6 rounded-2xl bg-[var(--admin-danger)]/5 border border-[var(--admin-danger)]/20 flex items-start gap-4">
                            <div className="p-3 rounded-full bg-[var(--admin-danger)]/10 text-[var(--admin-danger)]">
                                <Ban size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--admin-danger)]">Account Suspended</h3>
                                <p className="text-[var(--admin-danger)]/80 mt-1">
                                    This user was banned on {new Date(user.bannedAt).toLocaleDateString()}.
                                </p>
                                <div className="mt-3 p-3 rounded-lg bg-black/20 border border-[var(--admin-danger)]/10">
                                    <p className="text-xs font-bold text-[var(--admin-danger)]/60 uppercase mb-1">Reason</p>
                                    <p className="text-sm text-[var(--admin-text-secondary)] italic">
                                        "{user.bannedReason || 'No specific reason provided.'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Timeline (Mock) */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">User Journey</h3>
                            <button className="text-xs font-bold text-[var(--admin-accent)] hover:text-white transition-colors">View All Logs</button>
                        </div>
                        <div className="space-y-6 relative pl-4 border-l-2 border-[var(--admin-border)]">
                            {[
                                { action: 'Account Created', date: user.createdAt, icon: CheckCircle2, color: 'text-emerald-400' },
                                { action: 'Email Verified', date: user.createdAt, icon: ShieldCheck, color: 'text-cyan-400' },
                                { action: 'Profile Updated', date: new Date().toISOString(), icon: Activity, color: 'text-blue-400' }
                            ].map((event, i) => (
                                <div key={i} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--admin-bg)] border-2 border-[var(--admin-surface-active)] ${event.color} flex items-center justify-center`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    </div>
                                    <p className="text-sm font-bold text-[var(--admin-text-primary)]">{event.action}</p>
                                    <p className="text-xs text-[var(--admin-text-tertiary)]">{new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact & Details */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-4">
                        <h3 className="text-xs font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest">Contact Information</h3>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--admin-surface-active)]">
                            <Mail size={16} className="text-[var(--admin-text-secondary)]" />
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-[var(--admin-text-tertiary)] font-bold">EMAIL ADDRESS</p>
                                <p className="text-sm text-[var(--admin-text-primary)] truncate" title={user.email}>{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--admin-surface-active)]">
                            <Calendar size={16} className="text-[var(--admin-text-secondary)]" />
                            <div>
                                <p className="text-[10px] text-[var(--admin-text-tertiary)] font-bold">JOIN DATE</p>
                                <p className="text-sm text-[var(--admin-text-primary)]">{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ban Modal */}
            <AdminModal
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                title="Restrict User Access"
                size="md"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <button
                            onClick={() => setIsBanModalOpen(false)}
                            className="px-4 py-2 text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)] text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBan}
                            className="px-6 py-2 bg-[var(--admin-danger)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--admin-danger)]/20 hover:scale-105 transition-all"
                        >
                            Confirm Ban
                        </button>
                    </div>
                }
            >
                <p className="text-sm text-[var(--admin-text-secondary)] mb-4">
                    This action will revoke the user's access to the platform immediately. They will receive a notification explaining the reason.
                </p>
                <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Enter reason for ban (e.g. Violation of terms, fraudulent activity)..."
                    className="w-full bg-[var(--admin-surface-active)] border border-[var(--admin-border)] rounded-xl p-3 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)] min-h-[100px]"
                />
            </AdminModal>
        </div>
    );
}

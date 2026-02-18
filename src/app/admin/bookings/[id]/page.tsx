'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, Calendar, Building2, User, DollarSign,
    CheckCircle2, XCircle, AlertCircle, Clock, CreditCard,
    MoreHorizontal, Mail, MapPin, Shield
} from 'lucide-react';
import { useAdminBookingsStore } from '@/store/admin/admin-data-stores';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminModal } from '@/components/admin/ui/AdminModal';

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAdminAuthStore();
    const { items, fetch, updateStatus } = useAdminBookingsStore();

    const bookingId = params.id as string;
    const booking = items.find(b => b.id === bookingId);

    const [loadingAction, setLoadingAction] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    useEffect(() => {
        if (token && !booking) {
            fetch(token);
        }
    }, [token, booking, fetch]);

    if (!booking) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const duration = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));

    const handleStatusChange = async (newStatus: string) => {
        if (!token) return;
        setLoadingAction(true);
        try {
            await updateStatus(token, booking.id, newStatus);
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
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Booking #{booking.id.slice(-8).toUpperCase()}</h1>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'CONFIRMED' ? 'bg-[var(--admin-success)]/20 text-[var(--admin-success)]' :
                                booking.status === 'PENDING' ? 'bg-[var(--admin-warning)]/20 text-[var(--admin-warning)]' :
                                    'bg-[var(--admin-danger)]/20 text-[var(--admin-danger)]'
                                }`}>
                                {booking.status}
                            </span>
                        </div>
                        <p className="text-sm text-[var(--admin-text-tertiary)] font-mono mt-1">Transaction ID: {booking.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {booking.status === 'CONFIRMED' && (
                        <button
                            onClick={() => setIsRefundModalOpen(true)}
                            disabled={loadingAction}
                            className="px-4 py-2 bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-secondary)] rounded-xl text-sm font-bold hover:bg-[var(--admin-surface-hover)] transition-all flex items-center gap-2"
                        >
                            <CreditCard size={16} />
                            Refund
                        </button>
                    )}

                    {booking.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => handleStatusChange('CANCELLED')}
                                disabled={loadingAction}
                                className="px-4 py-2 rounded-xl border border-[var(--admin-danger)]/30 text-[var(--admin-danger)] font-bold text-sm hover:bg-[var(--admin-danger)]/10 transition-colors"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleStatusChange('CONFIRMED')}
                                disabled={loadingAction}
                                className="px-4 py-2 rounded-xl bg-[var(--admin-success)] text-white font-bold text-sm shadow-lg shadow-[var(--admin-success)]/20 hover:scale-105 transition-transform"
                            >
                                Confirm Booking
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Transaction & Property */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial Summary Card */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-[var(--admin-accent)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest">Total Transaction Value</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-4xl font-bold text-[var(--admin-text-primary)] font-display">${booking.totalAmount?.toLocaleString()}</span>
                                    <span className="text-sm text-[var(--admin-text-secondary)]">USD</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[var(--admin-accent)]/10 flex items-center justify-center text-[var(--admin-accent)]">
                                <DollarSign size={24} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-[var(--admin-border)] pt-6">
                            <div>
                                <p className="text-[10px] text-[var(--admin-text-tertiary)] uppercase font-bold tracking-widest mb-1">Payment Method</p>
                                <div className="flex items-center gap-2 text-[var(--admin-text-primary)] font-medium text-sm">
                                    <CreditCard size={14} className="text-[var(--admin-text-secondary)]" />
                                    <span>Credit Card</span> <span className="text-[var(--admin-text-tertiary)] text-xs">•••• 4242</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-[var(--admin-text-tertiary)] uppercase font-bold tracking-widest mb-1">Date Paid</p>
                                <p className="text-sm font-medium text-[var(--admin-text-primary)]">{new Date(booking.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-[var(--admin-text-tertiary)] uppercase font-bold tracking-widest mb-1">Status</p>
                                <div className="flex items-center gap-1.5 text-[var(--admin-success)] text-sm font-bold">
                                    <CheckCircle2 size={14} />
                                    Paid
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Property Card */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest">Rented Property</h3>
                            <button
                                onClick={() => router.push(`/admin/listings/${booking.listing?.id}`)}
                                className="text-xs font-bold text-[var(--admin-accent)] hover:underline"
                            >
                                View Listing
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-xl bg-[var(--admin-surface-active)] overflow-hidden flex-shrink-0">
                                {(booking.listing as any)?.media?.[0]?.url || booking.listing?.images?.[0] ? (
                                    <img src={(booking.listing as any)?.media?.[0]?.url || booking.listing?.images?.[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--admin-text-muted)]">
                                        <Building2 size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-[var(--admin-text-primary)] mb-1 truncate">{booking.listing?.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-[var(--admin-text-secondary)] mb-3">
                                    <MapPin size={14} />
                                    <span>{booking.listing?.location}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 rounded-md bg-[var(--admin-surface-active)] border border-[var(--admin-border)] text-xs font-medium text-[var(--admin-text-secondary)]">ID: {booking.listingID}</span>
                                    <span className="px-2 py-1 rounded-md bg-[var(--admin-surface-active)] border border-[var(--admin-border)] text-xs font-medium text-[var(--admin-text-secondary)]">Residential</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Key Details */}
                <div className="space-y-6">
                    {/* User Info */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest">Customer</h3>
                            <button
                                onClick={() => router.push(`/admin/users/${booking.user?.id}`)}
                                className="text-xs font-bold text-[var(--admin-accent)] hover:underline"
                            >
                                View Profile
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-lg font-bold text-blue-400">
                                {booking.user?.firstName?.[0]}{booking.user?.lastName?.[0]}
                            </div>
                            <div>
                                <p className="font-bold text-[var(--admin-text-primary)]">{booking.user?.firstName} {booking.user?.lastName}</p>
                                <p className="text-xs text-[var(--admin-text-tertiary)]">{booking.user?.email}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[var(--admin-surface-active)] flex items-center gap-3">
                            <Shield size={16} className="text-[var(--admin-success)]" />
                            <div>
                                <p className="text-[10px] font-bold text-[var(--admin-text-tertiary)]">VERIFICATION LEVEL</p>
                                <p className="text-xs font-bold text-[var(--admin-text-primary)]">Identity Verified</p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <h3 className="text-xs font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest mb-4">Rental Period</h3>

                        <div className="space-y-6 relative pl-2">
                            <div className="absolute top-2 bottom-10 left-[7px] w-0.5 bg-[var(--admin-border)]" />

                            <div className="relative pl-6">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[var(--admin-bg)] border-2 border-[var(--admin-accent)]" />
                                <p className="text-[10px] font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest mb-0.5">Check In</p>
                                <p className="text-sm font-bold text-[var(--admin-text-primary)]">{new Date(booking.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</p>
                                <p className="text-xs text-[var(--admin-text-secondary)]">3:00 PM</p>
                            </div>

                            <div className="relative pl-6">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[var(--admin-bg)] border-2 border-[var(--admin-text-tertiary)]" />
                                <p className="text-[10px] font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest mb-0.5">Check Out</p>
                                <p className="text-sm font-bold text-[var(--admin-text-primary)]">{new Date(booking.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</p>
                                <p className="text-xs text-[var(--admin-text-secondary)]">11:00 AM</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[var(--admin-border)] flex items-center justify-between">
                            <span className="text-xs text-[var(--admin-text-secondary)] font-medium">Total Duration</span>
                            <span className="text-sm font-bold text-[var(--admin-text-primary)]">{duration} Nights</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refund Modal placeholder */}
            <AdminModal
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                title="Process Refund"
                footer={<div />}
            >
                <div className="text-center py-8 text-[var(--admin-text-secondary)]">
                    <p>Refund functionality would integrate with Stripe/Payment Gateway API here.</p>
                </div>
            </AdminModal>
        </div>
    );
}

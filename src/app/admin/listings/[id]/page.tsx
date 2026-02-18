'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Store, MapPin, DollarSign, Calendar,
    CheckCircle2, XCircle, AlertTriangle, MessageSquare,
    MoreHorizontal, Trash2, ShieldCheck, Eye
} from 'lucide-react';
import { useAdminListingsStore } from '@/store/admin/admin-data-stores';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminModal } from '@/components/admin/ui/AdminModal';

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAdminAuthStore();
    const { items, approveListing, rejectListing, deleteListing, fetch } = useAdminListingsStore();

    // Find listing from store or fetch if needed
    // Ideally we'd have a fetchOne method, but for now we filter from items
    const listingId = params.id as string;
    const listing = items.find(l => l.id === listingId);

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        if (token && !listing) {
            fetch(token); // Fallback if direct link
        }
    }, [token, listing, fetch]);

    if (!listing) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleApprove = async () => {
        if (!token) return;
        setLoadingAction(true);
        try {
            await approveListing(token, listing.id);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleReject = async () => {
        if (!token) return;
        setLoadingAction(true);
        try {
            await rejectListing(token, listing.id, rejectReason);
            setIsRejectModalOpen(false);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDelete = async () => {
        if (!token || !window.confirm('Delete this listing permanently?')) return;
        setLoadingAction(true);
        try {
            await deleteListing(token, listing.id);
            router.push('/admin/listings');
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
                            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Listing Details</h1>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${listing.status === 'ACTIVE' ? 'bg-[var(--admin-success)]/20 text-[var(--admin-success)]' :
                                listing.status === 'PENDING' ? 'bg-[var(--admin-warning)]/20 text-[var(--admin-warning)]' :
                                    'bg-[var(--admin-danger)]/20 text-[var(--admin-danger)]'
                                }`}>
                                {listing.status}
                            </span>
                        </div>
                        <p className="text-sm text-[var(--admin-text-tertiary)] font-mono mt-1">ID: {listing.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={loadingAction}
                        className="p-2 rounded-xl text-[var(--admin-danger)] hover:bg-[var(--admin-danger)]/10 transition-colors"
                        title="Delete Listing"
                    >
                        <Trash2 size={20} />
                    </button>

                    {listing.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => setIsRejectModalOpen(true)}
                                disabled={loadingAction}
                                className="px-4 py-2 rounded-xl border border-[var(--admin-danger)]/30 text-[var(--admin-danger)] font-bold text-sm hover:bg-[var(--admin-danger)]/10 transition-colors"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={loadingAction}
                                className="px-4 py-2 rounded-xl bg-[var(--admin-success)] text-white font-bold text-sm shadow-lg shadow-[var(--admin-success)]/20 hover:scale-105 transition-transform"
                            >
                                Approve Listing
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Images & Key Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Hero Image */}
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[var(--admin-surface)] border border-[var(--admin-border)] relative group">
                        {(() => {
                            const mainImage = (listing as any).media?.find((m: any) => m.type === 'IMAGE')?.url ||
                                (listing.images && listing.images.length > 0 ? listing.images[0] : null);
                            return mainImage ? (
                                <img src={mainImage} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--admin-text-muted)]">
                                    <Store size={48} className="opacity-20" />
                                </div>
                            );
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <h2 className="text-3xl font-bold text-white mb-2">{listing.title}</h2>
                            <div className="flex items-center gap-4 text-white/80 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} />
                                    {listing.location}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <DollarSign size={16} />
                                    <span className="font-bold text-white">${listing.price}</span> / night
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-4">Description via Host</h3>
                        <p className="text-[var(--admin-text-secondary)] leading-relaxed whitespace-pre-wrap">
                            {listing.description}
                        </p>
                    </div>

                    {/* Amenities / Features (Mock) */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <h3 className="text-lg font-bold text-[var(--admin-text-primary)] mb-4">Features & Amenities</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {['WiFi', 'Parking', 'Pool', 'Kitchen', 'Gym', 'AC', 'Heating', 'Washer'].map(feature => (
                                <div key={feature} className="px-3 py-2 rounded-lg bg-[var(--admin-surface-active)] border border-[var(--admin-border)] text-xs font-medium text-[var(--admin-text-secondary)] flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-[var(--admin-success)]" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Owner & Stats */}
                <div className="space-y-6">
                    {/* Owner Card */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <h3 className="text-xs font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest mb-4">Listing Owner</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-lg font-bold text-purple-400">
                                {listing.owner?.firstName?.[0]}{listing.owner?.lastName?.[0]}
                            </div>
                            <div>
                                <p className="font-bold text-[var(--admin-text-primary)]">{listing.owner?.firstName} {listing.owner?.lastName}</p>
                                <p className="text-xs text-[var(--admin-text-tertiary)]">{listing.owner?.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-[var(--admin-surface-active)] text-center">
                                <p className="text-[var(--admin-text-tertiary)] text-[10px] uppercase font-bold">Joined</p>
                                <p className="text-[var(--admin-text-primary)] font-mono text-sm">2023</p>
                            </div>
                            <div className="p-3 rounded-xl bg-[var(--admin-surface-active)] text-center">
                                <p className="text-[var(--admin-text-tertiary)] text-[10px] uppercase font-bold">Listings</p>
                                <p className="text-[var(--admin-text-primary)] font-mono text-sm">3</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(`/messages?startWith=${listing.ownerId}&listing=${listingId}`)}
                            className="w-full py-2.5 rounded-xl border border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)] text-xs font-bold text-[var(--admin-text-secondary)] transition-all flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={14} />
                            Contact Host
                        </button>
                    </div>

                    {/* Analytics Card */}
                    <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <h3 className="text-xs font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest mb-4">Performance</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface-active)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
                                        <Eye size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-[var(--admin-text-secondary)]">Total Views</span>
                                </div>
                                <span className="font-bold text-[var(--admin-text-primary)]">{listing._count?.views || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface-active)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--admin-success)]/10 text-[var(--admin-success)]">
                                        <DollarSign size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-[var(--admin-text-secondary)]">Bookings</span>
                                </div>
                                <span className="font-bold text-[var(--admin-text-primary)]">{listing._count?.bookings || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            <AdminModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                title="Reject Listing"
                size="md"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <button
                            onClick={() => setIsRejectModalOpen(false)}
                            className="px-4 py-2 text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)] text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            className="px-6 py-2 bg-[var(--admin-danger)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--admin-danger)]/20 hover:scale-105 transition-all"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                }
            >
                <p className="text-sm text-[var(--admin-text-secondary)] mb-4">
                    Provide a reason for rejection. This will be sent to the host.
                </p>
                <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Terms violation, low quality images..."
                    className="w-full bg-[var(--admin-surface-active)] border border-[var(--admin-border)] rounded-xl p-3 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)] min-h-[100px]"
                />
            </AdminModal>
        </div>
    );
}

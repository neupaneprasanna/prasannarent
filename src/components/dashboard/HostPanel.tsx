'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
    Home, Package, DollarSign, Clock, CheckCircle2, XCircle,
    Loader2, Star, Calendar, MessageCircle, Send, ChevronDown
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
    CONFIRMED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Confirmed' },
    ACTIVE: { color: 'text-[#a29bfe]', bg: 'bg-[#6c5ce7]/10', label: 'Active' },
    COMPLETED: { color: 'text-[#00cec9]', bg: 'bg-[#00cec9]/10', label: 'Completed' },
    CANCELLED: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelled' },
};

type FilterStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function HostPanel() {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
    const [responseNote, setResponseNote] = useState('');
    const [toast, setToast] = useState({ msg: '', type: '' });

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<{ bookings: any[] }>('/bookings/owner');
            setBookings(data.bookings || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleAction = async (bookingId: string, action: 'approve' | 'reject') => {
        setActionLoading(bookingId);
        try {
            await apiClient.patch(`/bookings/${bookingId}/owner-action`, { action, ownerNote: responseNote || null });
            setToast({ msg: `Booking ${action === 'approve' ? 'approved' : 'declined'}!`, type: action === 'approve' ? 'success' : 'error' });
            setResponseNote(''); setExpandedBooking(null);
            fetchBookings();
            setTimeout(() => setToast({ msg: '', type: '' }), 3000);
        } catch (err: any) {
            setToast({ msg: err.message || 'Failed', type: 'error' });
            setTimeout(() => setToast({ msg: '', type: '' }), 3000);
        } finally { setActionLoading(null); }
    };

    const stats = {
        pending: bookings.filter(b => b.status === 'PENDING').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        revenue: bookings.filter(b => ['CONFIRMED','ACTIVE','COMPLETED'].includes(b.status)).reduce((a: number, b: any) => a + b.totalPrice, 0),
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
    };

    const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

    if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-[#6c5ce7]" /></div>;

    return (
        <div className="space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast.msg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/15 text-red-300 border border-red-500/20'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, color: 'text-emerald-400' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
                    { label: 'Confirmed', value: stats.confirmed, color: 'text-[#a29bfe]' },
                    { label: 'Completed', value: stats.completed, color: 'text-[#00cec9]' },
                ].map(s => (
                    <div key={s.label} className="glass-card rounded-xl p-4 border border-white/5">
                        <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {(['ALL','PENDING','CONFIRMED','ACTIVE','COMPLETED','CANCELLED'] as FilterStatus[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-[#6c5ce7]/15 text-[#a29bfe] border border-[#6c5ce7]/25' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                        {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Bookings */}
            {filtered.length === 0 ? (
                <div className="text-center py-12"><Package size={36} className="mx-auto text-white/10 mb-3" /><p className="text-sm text-white/30">No bookings found</p></div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((booking: any) => {
                        const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                        const isPending = booking.status === 'PENDING';
                        const isExp = expandedBooking === booking.id;
                        const days = Math.max(1, Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86400000));
                        return (
                            <div key={booking.id} className={`glass-card rounded-xl border ${isPending ? 'border-amber-500/15' : 'border-white/5'} p-4`}>
                                <div className="flex gap-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                        {booking.listing.images?.[0] ? <img src={booking.listing.images[0]} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-white/10 m-auto" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="text-xs font-bold text-white truncate">{booking.listing.title}</h4>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center text-[8px] font-bold text-white">
                                                {booking.renter?.avatar ? <img src={booking.renter.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : booking.renter?.firstName?.[0]}
                                            </div>
                                            <span className="text-[10px] text-white/50">{booking.renter?.firstName} {booking.renter?.lastName}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-[9px] text-white/30">
                                            <span className="flex items-center gap-1"><Calendar size={9} />{format(new Date(booking.startDate), 'MMM d')} — {format(new Date(booking.endDate), 'MMM d')}</span>
                                            <span>{days}d</span>
                                            <span className="font-bold text-white/50">${booking.totalPrice}</span>
                                        </div>
                                    </div>
                                </div>

                                {isPending && !isExp && (
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleAction(booking.id, 'approve')} disabled={actionLoading === booking.id}
                                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50">
                                            {actionLoading === booking.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Accept
                                        </button>
                                        <button onClick={() => setExpandedBooking(booking.id)}
                                            className="flex-1 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold text-red-400 flex items-center justify-center gap-1">
                                            <XCircle size={12} /> Decline
                                        </button>
                                    </div>
                                )}

                                {isPending && isExp && (
                                    <div className="mt-3 space-y-2">
                                        <textarea value={responseNote} onChange={e => setResponseNote(e.target.value)} placeholder="Add a note (optional)..."
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/15 focus:outline-none focus:ring-1 focus:ring-[#6c5ce7]/50 resize-none" rows={2} />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(booking.id, 'approve')} disabled={actionLoading === booking.id}
                                                className="flex-1 py-2 bg-emerald-600 rounded-lg text-[10px] font-bold text-white disabled:opacity-50">Accept</button>
                                            <button onClick={() => handleAction(booking.id, 'reject')} disabled={actionLoading === booking.id}
                                                className="flex-1 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold text-red-400 disabled:opacity-50">Decline</button>
                                            <button onClick={() => { setExpandedBooking(null); setResponseNote(''); }}
                                                className="px-3 py-2 bg-white/5 rounded-lg text-[10px] text-white/30">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

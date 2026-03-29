'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Home, Package, DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle,
    Loader2, Star, MapPin, Calendar, User, Eye, TrendingUp,
    ChevronRight, MessageCircle, ArrowRight, ShieldCheck, Briefcase,
    BarChart3, Filter, Check, X, Send, ChevronDown
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface OwnerBooking {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    ownerNote: string | null;
    renterNote: string | null;
    createdAt: string;
    listing: {
        id: string;
        title: string;
        images: string[];
        price: number;
        priceUnit: string;
    };
    renter: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string | null;
        phone: string | null;
    };
}

interface HostStats {
    totalListings: number;
    activeListings: number;
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    totalRevenue: number;
    avgRating: number;
}

type FilterStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
    PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock, label: 'Pending' },
    CONFIRMED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Confirmed' },
    ACTIVE: { color: 'text-[#a29bfe]', bg: 'bg-[#6c5ce7]/10', icon: Package, label: 'Active' },
    COMPLETED: { color: 'text-[#00cec9]', bg: 'bg-[#00cec9]/10', icon: Check, label: 'Completed' },
    CANCELLED: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle, label: 'Cancelled' },
    COUNTER_OFFERED: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Send, label: 'Counter Offered' },
    EXPIRED: { color: 'text-white/30', bg: 'bg-white/5', icon: Clock, label: 'Expired' },
    DISPUTED: { color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle, label: 'Disputed' },
};

export default function HostDashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [bookings, setBookings] = useState<OwnerBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
    const [responseNote, setResponseNote] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthenticated) fetchOwnerBookings();
    }, [isAuthenticated]);

    const fetchOwnerBookings = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<{ bookings: OwnerBooking[] }>('/bookings/owner');
            setBookings(data.bookings || []);
        } catch (err) {
            console.error('Failed to fetch owner bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
        setActionLoading(bookingId);
        setError('');
        try {
            await apiClient.patch(`/bookings/${bookingId}/owner-action`, {
                action,
                ownerNote: responseNote || null,
            });
            setSuccess(`Booking ${action === 'approve' ? 'approved' : 'declined'} successfully!`);
            setResponseNote('');
            setExpandedBooking(null);
            fetchOwnerBookings();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.message || `Failed to ${action} booking`);
            setTimeout(() => setError(''), 4000);
        } finally {
            setActionLoading(null);
        }
    };

    // Compute stats
    const stats: HostStats = {
        totalListings: new Set(bookings.map(b => b.listing.id)).size,
        activeListings: new Set(bookings.filter(b => b.status === 'ACTIVE').map(b => b.listing.id)).size,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
        confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
        completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
        totalRevenue: bookings.filter(b => ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status)).reduce((acc, b) => acc + b.totalPrice, 0),
        avgRating: 0,
    };

    const filteredBookings = filter === 'ALL'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
        { key: 'ALL', label: 'All', count: bookings.length },
        { key: 'PENDING', label: 'Pending', count: stats.pendingBookings },
        { key: 'CONFIRMED', label: 'Confirmed', count: stats.confirmedBookings },
        { key: 'ACTIVE', label: 'Active', count: bookings.filter(b => b.status === 'ACTIVE').length },
        { key: 'COMPLETED', label: 'Completed', count: stats.completedBookings },
        { key: 'CANCELLED', label: 'Cancelled', count: bookings.filter(b => b.status === 'CANCELLED').length },
    ];

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#030304]">
                <Navbar />
                <div className="text-center px-6">
                    <Home size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Host Dashboard</h2>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">Sign in to manage your listings and booking requests</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">
                        Sign In
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 relative"
                >
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#6c5ce7]/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center">
                                    <Home size={22} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                                        Host Dashboard
                                    </h1>
                                    <p className="text-sm text-white/40">Manage your listings and booking requests</p>
                                </div>
                            </div>
                        </div>
                        <Link href="/listings/new">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-bold text-white shadow-lg shadow-[#6c5ce7]/20"
                            >
                                <Package size={16} /> New Listing
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Success / Error Toasts */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-28 right-6 z-[200] px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm text-emerald-300 backdrop-blur-xl flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} /> {success}
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-28 right-6 z-[200] px-5 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-300 backdrop-blur-xl flex items-center gap-2"
                        >
                            <AlertTriangle size={16} /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    {[
                        { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', glow: 'rgba(52,211,153,0.1)' },
                        { label: 'Pending Requests', value: stats.pendingBookings, icon: Clock, color: 'text-amber-400', glow: 'rgba(251,191,36,0.1)' },
                        { label: 'Active Bookings', value: stats.confirmedBookings + bookings.filter(b => b.status === 'ACTIVE').length, icon: Package, color: 'text-[#a29bfe]', glow: 'rgba(162,155,254,0.1)' },
                        { label: 'Completed', value: stats.completedBookings, icon: CheckCircle2, color: 'text-[#00cec9]', glow: 'rgba(0,206,201,0.1)' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30 pointer-events-none" style={{ background: stat.glow }} />
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color} bg-white/5`}>
                                <stat.icon size={18} />
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                            <p className="text-[10px] text-white/35 font-medium uppercase tracking-wider">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar"
                >
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                                filter === tab.key
                                    ? 'bg-[#6c5ce7]/15 text-[#a29bfe] border border-[#6c5ce7]/25'
                                    : 'bg-white/5 text-white/40 hover:text-white/60 border border-white/5 hover:border-white/10'
                            }`}
                        >
                            {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                                filter === tab.key ? 'bg-[#6c5ce7]/20 text-[#a29bfe]' : 'bg-white/5 text-white/30'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </motion.div>

                {/* Booking Requests */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card rounded-2xl p-12 text-center"
                    >
                        <Package size={48} className="mx-auto text-white/10 mb-4" />
                        <h3 className="text-lg font-bold text-white/60 mb-2">
                            {filter === 'ALL' ? 'No bookings yet' : `No ${filter.toLowerCase()} bookings`}
                        </h3>
                        <p className="text-sm text-white/30 mb-6">
                            {filter === 'ALL'
                                ? 'When someone requests to rent your items, they\'ll appear here'
                                : 'Try selecting a different filter'}
                        </p>
                        {filter === 'ALL' && (
                            <Link href="/listings/new" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm inline-block">
                                Create a Listing
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking, idx) => {
                            const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                            const StatusIcon = statusConf.icon;
                            const isPending = booking.status === 'PENDING';
                            const isExpanded = expandedBooking === booking.id;
                            const days = Math.max(1, Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                            const listingImg = booking.listing.images?.[0];

                            return (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={`glass-card rounded-2xl border transition-all ${
                                        isPending ? 'border-amber-500/20 hover:border-amber-500/30' : 'border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <div className="p-5">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Listing Image */}
                                            <div className="w-full sm:w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                                {listingImg ? (
                                                    <img src={listingImg} alt={booking.listing.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package size={20} className="text-white/10" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white truncate">{booking.listing.title}</h4>
                                                        <p className="text-[10px] text-white/30 mt-0.5">
                                                            Requested {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    <span className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusConf.bg} ${statusConf.color}`}>
                                                        <StatusIcon size={12} /> {statusConf.label}
                                                    </span>
                                                </div>

                                                {/* Renter Info */}
                                                <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6c5ce7]/40 to-[#a29bfe]/40 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                                                        {booking.renter.avatar ? (
                                                            <img src={booking.renter.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{booking.renter.firstName[0]}{booking.renter.lastName[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-white/80 truncate">
                                                            {booking.renter.firstName} {booking.renter.lastName}
                                                        </p>
                                                        <p className="text-[10px] text-white/30 truncate">{booking.renter.email}</p>
                                                    </div>
                                                    {booking.renter.phone && (
                                                        <span className="text-[9px] text-white/20 hidden sm:block">{booking.renter.phone}</span>
                                                    )}
                                                </div>

                                                {/* Booking Details */}
                                                <div className="flex flex-wrap gap-4 text-[10px] text-white/40">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {format(new Date(booking.startDate), 'MMM d')} — {format(new Date(booking.endDate), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} /> {days} {days === 1 ? 'day' : 'days'}
                                                    </span>
                                                    <span className="flex items-center gap-1 font-bold text-white/60">
                                                        <DollarSign size={11} /> ${booking.totalPrice.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons for PENDING bookings */}
                                        {isPending && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                {!isExpanded ? (
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <button
                                                            onClick={() => handleBookingAction(booking.id, 'approve')}
                                                            disabled={actionLoading === booking.id}
                                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                                        >
                                                            {actionLoading === booking.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                            Accept Booking
                                                        </button>
                                                        <button
                                                            onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all"
                                                        >
                                                            <XCircle size={16} /> Decline
                                                        </button>
                                                        <button
                                                            onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                                                            className="sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                                        >
                                                            <MessageCircle size={14} /> Add Note
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="space-y-3"
                                                    >
                                                        <textarea
                                                            value={responseNote}
                                                            onChange={(e) => setResponseNote(e.target.value)}
                                                            placeholder="Add a note for the renter (optional)..."
                                                            rows={2}
                                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:border-transparent transition-all resize-none"
                                                        />
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            <button
                                                                onClick={() => handleBookingAction(booking.id, 'approve')}
                                                                disabled={actionLoading === booking.id}
                                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                                                            >
                                                                {actionLoading === booking.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                                Accept with Note
                                                            </button>
                                                            <button
                                                                onClick={() => handleBookingAction(booking.id, 'reject')}
                                                                disabled={actionLoading === booking.id}
                                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 disabled:opacity-50"
                                                            >
                                                                <XCircle size={14} /> Decline with Note
                                                            </button>
                                                            <button
                                                                onClick={() => { setExpandedBooking(null); setResponseNote(''); }}
                                                                className="px-4 py-2.5 bg-white/5 rounded-xl text-xs text-white/40 hover:text-white transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        {/* Owner Note */}
                                        {booking.ownerNote && (
                                            <div className="mt-3 p-3 rounded-xl bg-[#6c5ce7]/5 border border-[#6c5ce7]/10">
                                                <p className="text-[10px] text-[#a29bfe] font-bold uppercase tracking-wider mb-1">Your Note</p>
                                                <p className="text-xs text-white/60">{booking.ownerNote}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                    {[
                        { href: '/listings/new', icon: Package, label: 'Create Listing', desc: 'List a new item for rent', color: 'text-[#a29bfe]' },
                        { href: '/settings', icon: Briefcase, label: 'Manage Listings', desc: 'Edit or pause your listings', color: 'text-emerald-400' },
                        { href: '/messages', icon: MessageCircle, label: 'Messages', desc: 'Chat with renters', color: 'text-[#00cec9]' },
                    ].map(link => (
                        <Link key={link.href} href={link.href}>
                            <div className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${link.color}`}>
                                        <link.icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white group-hover:text-[#a29bfe] transition-colors">{link.label}</p>
                                        <p className="text-[10px] text-white/30">{link.desc}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-white/10 group-hover:text-white/30 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </motion.div>
            </div>
        </main>
    );
}

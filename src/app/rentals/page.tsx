'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { useRenterDashboardStore, useRecentlyViewedStore } from '@/store/engagement-store';
import Link from 'next/link';
import {
    ShoppingBag, Clock, CheckCircle, XCircle, DollarSign, TrendingUp,
    Loader2, MapPin, Calendar, ArrowRight, Eye, Star, ChevronLeft, ChevronRight, Package
} from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Pending' },
    COUNTER_OFFERED: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Counter Offered' },
    CONFIRMED: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Confirmed' },
    ACTIVE: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Active' },
    EXTENSION_REQUESTED: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Extension Req.' },
    EARLY_RETURN_REQUESTED: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', label: 'Early Return Req.' },
    COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
    CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
    EXPIRED: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Expired' },
    DISPUTED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Disputed' },
};

const tabs = [
    { id: 'active' as const, label: 'Active', icon: <ShoppingBag size={14} /> },
    { id: 'upcoming' as const, label: 'Upcoming', icon: <Clock size={14} /> },
    { id: 'past' as const, label: 'Past', icon: <CheckCircle size={14} /> },
];

export default function RenterDashboardPage() {
    const { isAuthenticated, user } = useAuthStore();
    const {
        stats, bookings, totalBookings, totalPages, currentTab, loading,
        fetchStats, fetchBookings, setTab
    } = useRenterDashboardStore();
    const { items: recentlyViewed, fetchRecentlyViewed } = useRecentlyViewedStore();
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchBookings(currentTab, 1);
            fetchRecentlyViewed();
        }
    }, [isAuthenticated]);

    const handleTabChange = (tab: 'active' | 'upcoming' | 'past') => {
        setTab(tab);
        setPage(1);
        fetchBookings(tab, 1);
    };

    const handlePage = (p: number) => {
        setPage(p);
        fetchBookings(currentTab, p);
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center">
                <Navbar />
                <div className="text-center px-6">
                    <ShoppingBag size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3">Your Rentals</h2>
                    <p className="text-white/40 mb-6">Sign in to manage your rental bookings</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">Sign In</Link>
                </div>
            </main>
        );
    }

    const statCards = stats ? [
        { label: 'Active Rentals', value: stats.active, icon: <ShoppingBag size={18} />, color: 'from-green-500/20 to-emerald-500/20', textColor: 'text-green-400' },
        { label: 'Upcoming', value: stats.upcoming, icon: <Clock size={18} />, color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-400' },
        { label: 'Completed', value: stats.completed, icon: <CheckCircle size={18} />, color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-400' },
        { label: 'Total Spent', value: `$${stats.totalSpent.toLocaleString()}`, icon: <DollarSign size={18} />, color: 'from-[#6c5ce7]/20 to-[#a29bfe]/20', textColor: 'text-[#a29bfe]' },
    ] : [];

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Rentals</h1>
                    <p className="text-sm text-white/40">
                        Welcome back, {user?.firstName}. Here&apos;s your rental activity.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8"
                >
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className="relative z-10">
                                <div className={`p-2 rounded-lg bg-white/5 w-fit mb-3 ${stat.textColor}`}>
                                    {stat.icon}
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-[10px] md:text-xs text-white/40 font-medium">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Tabs + Bookings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${currentTab === tab.id
                                        ? 'bg-[#6c5ce7]/10 text-white border border-[#6c5ce7]/20'
                                        : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="glass-card rounded-2xl p-12 text-center">
                                <Package size={48} className="mx-auto text-white/10 mb-4" />
                                <h3 className="text-lg font-bold text-white/60 mb-2">No {currentTab} bookings</h3>
                                <p className="text-sm text-white/30 mb-6">
                                    {currentTab === 'active' && 'You don\'t have any active rentals right now'}
                                    {currentTab === 'upcoming' && 'No upcoming rentals scheduled'}
                                    {currentTab === 'past' && 'You haven\'t completed any rentals yet'}
                                </p>
                                <Link href="/explore" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm">
                                    Explore Items
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {bookings.map((booking, i) => {
                                        const status = statusColors[booking.status] || statusColors.PENDING;
                                        return (
                                            <motion.div
                                                key={booking.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <Link href={`/items/${booking.listing.id}`}>
                                                    <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-white/10 transition-all">
                                                        <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                            {booking.listing.media?.[0]?.url || booking.listing.images?.[0] ? (
                                                                <img src={booking.listing.media?.[0]?.url || booking.listing.images[0]} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                                                                    <Package size={20} className="text-white/10" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                <h3 className="text-sm font-bold text-white truncate">{booking.listing.title}</h3>
                                                                <span className={`${status.bg} ${status.text} px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0`}>
                                                                    {status.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-white/30 flex items-center gap-1 mb-2">
                                                                <MapPin size={10} />{booking.listing.location}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-[10px] text-white/40">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={10} />
                                                                    {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                                                                </span>
                                                                <span className="font-bold text-white/60">${booking.totalPrice}</span>
                                                            </div>
                                                        </div>

                                                        <ArrowRight size={16} className="text-white/10 group-hover:text-white/40 transition-colors hidden sm:block" />
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-4">
                                        <button
                                            onClick={() => handlePage(page - 1)}
                                            disabled={page <= 1}
                                            className="p-2 rounded-lg bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-xs text-white/40">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePage(page + 1)}
                                            disabled={page >= totalPages}
                                            className="p-2 rounded-lg bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recently Viewed Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden sticky top-28">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Eye size={14} className="text-white/40" /> Recently Viewed
                                </h3>
                            </div>

                            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {recentlyViewed.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Eye size={24} className="mx-auto text-white/10 mb-2" />
                                        <p className="text-[10px] text-white/20">No items viewed recently</p>
                                    </div>
                                ) : (
                                    recentlyViewed.slice(0, 8).map(item => (
                                        <Link key={item.id} href={`/items/${item.id}`}>
                                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                    {item.media?.[0]?.url || item.images?.[0] ? (
                                                        <img src={item.media?.[0]?.url || item.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02]" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white/70 truncate group-hover:text-white transition-colors">{item.title}</p>
                                                    <p className="text-[10px] text-white/30">${item.price}/{item.priceUnit?.toLowerCase()}</p>
                                                </div>
                                                <div className="flex items-center gap-0.5 text-[#fdcb6e]">
                                                    <Star size={10} className="fill-current" />
                                                    <span className="text-[10px] font-bold">{item.rating?.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}

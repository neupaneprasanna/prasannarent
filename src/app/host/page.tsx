'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { useHostDashboardStore } from '@/store/engagement-store';
import Link from 'next/link';
import {
    Package, Eye, TrendingUp, DollarSign, Star, BarChart3,
    Loader2, ArrowUpRight, Plus, Calendar, Users
} from 'lucide-react';
import {

    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import AvailabilityCalendar from '@/components/host/AvailabilityCalendar';
import { AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

export default function HostDashboardPage() {
    const { isAuthenticated, user } = useAuthStore();
    const { stats, listings, earnings, loading, fetchStats, fetchListingPerformance, fetchEarnings } = useHostDashboardStore();
    const [earningsPeriod, setEarningsPeriod] = useState<number>(30);
    const [calendarListingId, setCalendarListingId] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchListingPerformance();
            fetchEarnings(30);
        }
    }, [isAuthenticated]);

    const handlePeriodChange = (days: number) => {
        setEarningsPeriod(days);
        fetchEarnings(days);
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center">
                <Navbar />
                <div className="text-center px-6">
                    <BarChart3 size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3">Host Dashboard</h2>
                    <p className="text-white/40 mb-6">Sign in to view your host analytics</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">
                        Sign In
                    </Link>
                </div>
            </main>
        );
    }

    const statCards = stats ? [
        { label: 'Active Listings', value: stats.activeListings, total: stats.totalListings, icon: <Package size={18} />, color: 'from-[#6c5ce7]/20 to-[#a29bfe]/20', accent: 'text-[#a29bfe]' },
        { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: <Eye size={18} />, color: 'from-[#00cec9]/20 to-[#00b894]/20', accent: 'text-[#00cec9]' },
        { label: 'Conversion Rate', value: stats.conversionRate, icon: <TrendingUp size={18} />, color: 'from-[#fdcb6e]/20 to-[#f39c12]/20', accent: 'text-[#fdcb6e]' },
        { label: 'Total Earnings', value: `$${stats.totalEarnings.toLocaleString()}`, icon: <DollarSign size={18} />, color: 'from-[#fd79a8]/20 to-[#e17055]/20', accent: 'text-[#fd79a8]' },
        { label: 'Average Rating', value: stats.avgRating, icon: <Star size={18} />, color: 'from-amber-500/20 to-orange-500/20', accent: 'text-amber-400' },
        { label: 'Bookings', value: `${stats.completedBookings}/${stats.totalBookings}`, icon: <Calendar size={18} />, color: 'from-indigo-500/20 to-violet-500/20', accent: 'text-indigo-400' },
    ] : [];

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Host Dashboard</h1>
                        <p className="text-sm text-white/40">
                            Welcome back, {user?.firstName}. Here&apos;s how your listings are performing.
                        </p>
                    </div>
                    <Link href="/listings/new">
                        <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-[#6c5ce7]/20">
                            <Plus size={16} /> New Listing
                        </button>
                    </Link>
                </motion.div>

                {loading && !stats ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loader2 className="w-10 h-10 animate-spin text-[#6c5ce7]" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
                        >
                            {statCards.map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    className="glass-card rounded-xl p-4 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                    <div className="relative z-10">
                                        <div className={`${stat.accent} mb-2`}>{stat.icon}</div>
                                        <div className="text-xl font-bold text-white mb-0.5">{stat.value}</div>
                                        <div className="text-[10px] text-white/40 font-medium">{stat.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Earnings Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card rounded-2xl p-6 border border-white/5"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Earnings Overview</h3>
                                    <p className="text-xs text-white/30">Revenue from completed bookings</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {[
                                        { days: 7, label: '7D' },
                                        { days: 30, label: '30D' },
                                        { days: 90, label: '3M' },
                                    ].map(p => (
                                        <button
                                            key={p.days}
                                            onClick={() => handlePeriodChange(p.days)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${earningsPeriod === p.days
                                                ? 'bg-[#6c5ce7]/20 text-[#a29bfe] border border-[#6c5ce7]/30'
                                                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[250px] md:h-[300px] w-full">
                                {earnings.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={earnings}>
                                            <defs>
                                                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="rgba(255,255,255,0.2)"
                                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                            />
                                            <YAxis
                                                stroke="rgba(255,255,255,0.2)"
                                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `$${v}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                                labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                formatter={(value: any) => [`$${value}`, 'Earnings']}
                                            />
                                            <Area type="monotone" dataKey="earnings" stroke="#6c5ce7" strokeWidth={2} fillOpacity={1} fill="url(#earningsGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-white/20 text-sm">
                                        No earnings data for this period
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Listing Performance Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card rounded-2xl border border-white/5 overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Listing Performance</h3>
                                    <p className="text-xs text-white/30">Analytics for each of your listings</p>
                                </div>
                            </div>

                            {listings.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Package size={48} className="mx-auto text-white/10 mb-4" />
                                    <h3 className="text-lg font-bold text-white/60 mb-2">No listings yet</h3>
                                    <p className="text-sm text-white/30 mb-6">Create your first listing to start tracking performance</p>
                                    <Link href="/listings/new" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm">
                                        Create Listing
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="text-left text-[10px] text-white/30 font-semibold uppercase tracking-wider px-6 py-3">Listing</th>
                                                    <th className="text-center text-[10px] text-white/30 font-semibold uppercase tracking-wider px-3 py-3">Views</th>
                                                    <th className="text-center text-[10px] text-white/30 font-semibold uppercase tracking-wider px-3 py-3">Bookings</th>
                                                    <th className="text-center text-[10px] text-white/30 font-semibold uppercase tracking-wider px-3 py-3">Conversion</th>
                                                    <th className="text-center text-[10px] text-white/30 font-semibold uppercase tracking-wider px-3 py-3">Rating</th>
                                                    <th className="text-right text-[10px] text-white/30 font-semibold uppercase tracking-wider px-6 py-3">Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {listings.map((l, i) => (
                                                    <tr key={l.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <Link href={`/items/${l.id}`} className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                                    {l.image ? (
                                                                        <img src={l.image} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center"><Package size={14} className="text-white/10" /></div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate max-w-[200px] group-hover:text-[#a29bfe] transition-colors">{l.title}</p>
                                                                    <p className="text-[10px] text-white/30">${l.price}/{l.priceUnit?.toLowerCase()}</p>
                                                                </div>
                                                                <ArrowUpRight size={14} className="text-white/10 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                                            </Link>
                                                        </td>
                                                        <td className="text-center px-3 py-4">
                                                            <span className="text-sm font-medium text-white/70">{l.views.toLocaleString()}</span>
                                                        </td>
                                                        <td className="text-center px-3 py-4">
                                                            <span className="text-sm font-medium text-white/70">{l.completedBookings}/{l.totalBookings}</span>
                                                        </td>
                                                        <td className="text-center px-3 py-4">
                                                            <span className="text-sm font-medium text-[#00cec9]">{l.conversionRate}</span>
                                                        </td>
                                                        <td className="text-center px-3 py-4">
                                                            <div className="flex items-center justify-center gap-1 text-amber-400">
                                                                <Star size={12} className="fill-current" />
                                                                <span className="text-sm font-medium">{l.rating?.toFixed(1) || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-right px-6 py-4">
                                                            <div className="flex items-center justify-end gap-4">
                                                                <span className="text-sm font-bold text-white">${l.revenue.toLocaleString()}</span>
                                                                <button
                                                                    onClick={() => setCalendarListingId(l.id)}
                                                                    className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                                                    title="Manage Availability"
                                                                >
                                                                    <Calendar size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden p-3 space-y-2">
                                        {listings.map(l => (
                                            <div key={l.id}>
                                                <Link href={`/items/${l.id}`}>
                                                    <div className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                                {l.image ? <img src={l.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02]" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-white truncate">{l.title}</p>
                                                                <p className="text-[10px] text-white/30">${l.price}/{l.priceUnit?.toLowerCase()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2 text-center">
                                                            <div>
                                                                <p className="text-xs font-bold text-white/70">{l.views}</p>
                                                                <p className="text-[9px] text-white/30">Views</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-[#00cec9]">{l.conversionRate}</p>
                                                                <p className="text-[9px] text-white/30">Conv.</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-amber-400 flex items-center justify-center gap-0.5"><Star size={8} className="fill-current" />{l.rating?.toFixed(1)}</p>
                                                                <p className="text-[9px] text-white/30">Rating</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white">${l.revenue}</p>
                                                                <p className="text-[9px] text-white/30">Revenue</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className="flex justify-end px-2 pb-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCalendarListingId(l.id);
                                                        }}
                                                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white/60 hover:text-white flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <Calendar size={14} /> Manage Availability
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Calendar Modal */}
                <AnimatePresence>
                    {calendarListingId && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setCalendarListingId(null)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">Manage Availability</h3>
                                    <button
                                        onClick={() => setCalendarListingId(null)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <Plus size={24} className="rotate-45 text-white/40" />
                                    </button>
                                </div>

                                <AvailabilityCalendar listingId={calendarListingId} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </main >
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
    DollarSign, TrendingUp, Package, Loader2, ArrowUpRight,
    Wallet, PiggyBank, Clock, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface EarningsData {
    totalEarnings: number;
    completedEarnings: number;
    pendingEarnings: number;
    totalBookings: number;
    monthlyChart: { month: string; label: string; amount: number }[];
    listingBreakdown: { id: string; title: string; image: string | null; total: number; bookings: number }[];
    recentTransactions: { id: string; amount: number; status: string; date: string; listingTitle: string; renterName: string }[];
}

const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: 'text-blue-400',
    ACTIVE: 'text-[#a29bfe]',
    COMPLETED: 'text-emerald-400',
};

export default function EarningsPage() {
    const { isAuthenticated } = useAuthStore();
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) fetchEarnings();
    }, [isAuthenticated]);

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<EarningsData>('/earnings');
            setData(res);
        } catch (err) {
            console.error('Failed to fetch earnings:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#030304]">
                <Navbar />
                <div className="text-center px-6">
                    <Wallet size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Earnings</h2>
                    <p className="text-white/40 mb-6">Sign in to view your earnings</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white">Sign In</Link>
                </div>
            </main>
        );
    }

    const maxMonthly = data ? Math.max(...data.monthlyChart.map(m => m.amount), 1) : 1;

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />
            <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative">
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#00cec9] flex items-center justify-center">
                            <Wallet size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                                Earnings
                            </h1>
                            <p className="text-sm text-white/40">Your financial overview</p>
                        </div>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" /></div>
                ) : data ? (
                    <>
                        {/* Revenue Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            {[
                                { label: 'Total Earnings', value: data.totalEarnings, icon: DollarSign, color: 'text-emerald-400', glow: '#34d399' },
                                { label: 'Completed', value: data.completedEarnings, icon: CheckCircle2, color: 'text-[#00cec9]', glow: '#00cec9' },
                                { label: 'In Progress', value: data.pendingEarnings, icon: Clock, color: 'text-amber-400', glow: '#fbbf24' },
                            ].map((card, i) => (
                                <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                                    className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: card.glow }} />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color} bg-white/5`}>
                                        <card.icon size={18} />
                                    </div>
                                    <p className="text-3xl font-extrabold text-white mb-1">${card.value.toLocaleString()}</p>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{card.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Monthly Revenue Chart */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="glass-card rounded-2xl p-6 border border-white/5 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <BarChart3 size={14} className="text-[#a29bfe]" /> Monthly Revenue
                                    </h3>
                                    <p className="text-[10px] text-white/25 mt-0.5">Last 12 months</p>
                                </div>
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                    <ArrowUpRight size={12} /> ${data.totalEarnings.toLocaleString()} total
                                </span>
                            </div>
                            <div className="flex items-end gap-2 h-40">
                                {data.monthlyChart.map((month, i) => (
                                    <div key={month.month} className="flex-1 flex flex-col items-center gap-1 group">
                                        <span className="text-[8px] text-white/0 group-hover:text-white/40 transition-colors font-bold">
                                            ${month.amount > 0 ? month.amount.toLocaleString() : ''}
                                        </span>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(2, (month.amount / maxMonthly) * 100)}%` }}
                                            transition={{ delay: 0.2 + i * 0.03, duration: 0.4 }}
                                            className={`w-full rounded-t-md transition-colors ${
                                                month.amount > 0 ? 'bg-gradient-to-t from-emerald-600/50 to-emerald-400/70 group-hover:from-emerald-500 group-hover:to-emerald-300' : 'bg-white/5'
                                            }`}
                                        />
                                        <span className="text-[8px] text-white/20 font-medium">{month.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue by Listing */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                                className="glass-card rounded-2xl p-6 border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Package size={14} className="text-[#a29bfe]" /> Revenue by Listing
                                </h3>
                                {data.listingBreakdown.length === 0 ? (
                                    <p className="text-xs text-white/25 text-center py-6">No revenue yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.listingBreakdown.map((listing, i) => {
                                            const pct = data.totalEarnings > 0 ? (listing.total / data.totalEarnings) * 100 : 0;
                                            return (
                                                <div key={listing.id} className="flex items-center gap-3 group">
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                                        {listing.image ? <img src={listing.image} alt="" className="w-full h-full object-cover" /> : <Package size={12} className="text-white/10 m-auto" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-white/70 truncate">{listing.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                                                                    className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-full" />
                                                            </div>
                                                            <span className="text-[9px] text-white/25 w-8 text-right">{Math.round(pct)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs font-bold text-white/60">${listing.total.toLocaleString()}</p>
                                                        <p className="text-[8px] text-white/20">{listing.bookings} bookings</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>

                            {/* Recent Transactions */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                                className="glass-card rounded-2xl p-6 border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-400" /> Recent Transactions
                                </h3>
                                {data.recentTransactions.length === 0 ? (
                                    <p className="text-xs text-white/25 text-center py-6">No transactions yet</p>
                                ) : (
                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                        {data.recentTransactions.map(tx => (
                                            <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                    <DollarSign size={12} className="text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-white/60 truncate">{tx.listingTitle}</p>
                                                    <p className="text-[9px] text-white/20">{tx.renterName} · {format(new Date(tx.date), 'MMM d, yyyy')}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-bold text-emerald-400">+${tx.amount}</p>
                                                    <p className={`text-[8px] font-bold uppercase ${STATUS_COLORS[tx.status] || 'text-white/20'}`}>{tx.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </>
                ) : null}
            </div>
        </main>
    );
}

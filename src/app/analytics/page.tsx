'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import {
    BarChart3, Eye, DollarSign, Package, Star, Heart, TrendingUp,
    Loader2, Lightbulb, ChevronRight, AlertTriangle, CheckCircle2,
    ArrowUpRight, ArrowDownRight, Target, Sparkles, Filter, Search
} from 'lucide-react';

interface ListingAnalytics {
    id: string;
    title: string;
    image: string | null;
    status: string;
    price: number;
    priceUnit: string;
    totalViews: number;
    totalBookings: number;
    confirmedBookings: number;
    totalReviews: number;
    wishlistSaves: number;
    revenue: number;
    avgRating: number;
    conversionRate: number;
    healthScore: number;
    viewsByDay: Record<string, number>;
    tips: string[];
    createdAt: string;
}

interface AnalyticsSummary {
    totalListings: number;
    totalRevenue: number;
    totalViews: number;
    totalBookings: number;
    avgHealthScore: number;
}

function HealthScoreGauge({ score }: { score: number }) {
    const color = score >= 80 ? '#00cec9' : score >= 60 ? '#fdcb6e' : score >= 40 ? '#e17055' : '#d63031';
    const circumference = 2 * Math.PI * 38;
    const filled = (score / 100) * circumference;

    return (
        <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                <motion.circle
                    cx="40" cy="40" r="38" stroke={color} strokeWidth="4" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${filled} ${circumference - filled}` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-white" style={{ color }}>{score}</span>
                <span className="text-[7px] text-white/25 font-bold uppercase tracking-widest">Score</span>
            </div>
        </div>
    );
}

function MiniViewChart({ viewsByDay }: { viewsByDay: Record<string, number> }) {
    const entries = Object.entries(viewsByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    if (entries.length === 0) return <span className="text-[9px] text-white/15">No data</span>;

    const maxViews = Math.max(...entries.map(([_, v]) => v), 1);

    return (
        <div className="flex items-end gap-[2px] h-6">
            {entries.map(([day, views], i) => (
                <motion.div
                    key={day}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(2, (views / maxViews) * 100)}%` }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                    className="flex-1 min-w-[3px] rounded-full bg-[#6c5ce7]/60 hover:bg-[#a29bfe] transition-colors"
                    title={`${day}: ${views} views`}
                />
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    const { isAuthenticated } = useAuthStore();
    const [listings, setListings] = useState<ListingAnalytics[]>([]);
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'revenue' | 'views' | 'score' | 'rating'>('revenue');

    useEffect(() => {
        if (isAuthenticated) fetchAnalytics();
    }, [isAuthenticated]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<{ listings: ListingAnalytics[]; summary: AnalyticsSummary }>('/analytics/listings');
            setListings(data.listings || []);
            setSummary(data.summary || null);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredListings = listings
        .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            switch (sortBy) {
                case 'revenue': return b.revenue - a.revenue;
                case 'views': return b.totalViews - a.totalViews;
                case 'score': return b.healthScore - a.healthScore;
                case 'rating': return b.avgRating - a.avgRating;
                default: return 0;
            }
        });

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#030304]">
                <Navbar />
                <div className="text-center px-6">
                    <BarChart3 size={64} className="mx-auto text-white/10 mb-6" />
                    <h2 className="text-2xl font-bold mb-3 text-white">Listing Analytics</h2>
                    <p className="text-white/40 mb-6">Sign in to see how your listings perform</p>
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
                    <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#00cec9]/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00cec9] to-[#6c5ce7] flex items-center justify-center">
                                    <BarChart3 size={22} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                                        Analytics
                                    </h1>
                                    <p className="text-sm text-white/40">Track how your listings perform</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
                            >
                                {[
                                    { label: 'Total Revenue', value: `$${summary.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
                                    { label: 'Total Views', value: summary.totalViews.toLocaleString(), icon: Eye, color: 'text-[#a29bfe]' },
                                    { label: 'Total Bookings', value: summary.totalBookings, icon: Package, color: 'text-[#00cec9]' },
                                    { label: 'Listings', value: summary.totalListings, icon: Target, color: 'text-[#fdcb6e]' },
                                    { label: 'Avg Health', value: `${summary.avgHealthScore}/100`, icon: Sparkles, color: summary.avgHealthScore >= 70 ? 'text-[#00cec9]' : 'text-amber-400' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.05 }}
                                        className="glass-card rounded-2xl p-5 border border-white/5"
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color} bg-white/5`}>
                                            <stat.icon size={16} />
                                        </div>
                                        <p className="text-xl font-bold text-white">{stat.value}</p>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Search and Sort */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-3 mb-6"
                        >
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search listings..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#6c5ce7]/50"
                                />
                            </div>
                            <div className="flex gap-2">
                                {(['revenue', 'views', 'score', 'rating'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSortBy(s)}
                                        className={`px-4 py-2.5 rounded-xl text-[10px] font-medium transition-all capitalize ${
                                            sortBy === s
                                                ? 'bg-[#6c5ce7]/15 text-[#a29bfe] border border-[#6c5ce7]/25'
                                                : 'bg-white/5 text-white/30 border border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Listing Cards */}
                        {filteredListings.length === 0 ? (
                            <div className="glass-card rounded-2xl p-12 text-center">
                                <BarChart3 size={48} className="mx-auto text-white/10 mb-4" />
                                <h3 className="text-lg font-bold text-white/60 mb-2">No listings found</h3>
                                <p className="text-sm text-white/30 mb-6">Create your first listing to start tracking performance</p>
                                <Link href="/listings/new" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium text-white text-sm inline-block">
                                    Create Listing
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredListings.map((listing, idx) => (
                                    <motion.div
                                        key={listing.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * idx }}
                                        className="glass-card rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                                    >
                                        <div className="p-5">
                                            <div className="flex flex-col lg:flex-row gap-5">
                                                {/* Image + Health Score */}
                                                <div className="flex gap-4 items-start">
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                                        {listing.image ? (
                                                            <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package size={20} className="text-white/10" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <HealthScoreGauge score={listing.healthScore} />
                                                </div>

                                                {/* Main Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white mb-0.5">{listing.title}</h4>
                                                            <p className="text-[10px] text-white/25">${listing.price}/{listing.priceUnit.toLowerCase()} · {listing.status}</p>
                                                        </div>
                                                        <Link href={`/item/${listing.id}`} className="text-[10px] text-[#a29bfe] hover:text-white transition-colors flex items-center gap-1">
                                                            View <ChevronRight size={12} />
                                                        </Link>
                                                    </div>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                                                        {[
                                                            { label: 'Views', value: listing.totalViews, icon: Eye, color: 'text-[#a29bfe]' },
                                                            { label: 'Bookings', value: listing.confirmedBookings, icon: Package, color: 'text-[#00cec9]' },
                                                            { label: 'Revenue', value: `$${listing.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
                                                            { label: 'Rating', value: listing.avgRating || '—', icon: Star, color: 'text-[#fdcb6e]' },
                                                            { label: 'Saved', value: listing.wishlistSaves, icon: Heart, color: 'text-[#f472b6]' },
                                                            { label: 'Conv.', value: `${listing.conversionRate}%`, icon: TrendingUp, color: 'text-emerald-400' },
                                                        ].map(stat => (
                                                            <div key={stat.label} className="text-center">
                                                                <div className={`flex items-center justify-center gap-1 mb-0.5 ${stat.color}`}>
                                                                    <stat.icon size={10} />
                                                                    <span className="text-xs font-bold">{stat.value}</span>
                                                                </div>
                                                                <p className="text-[8px] text-white/20 font-bold uppercase tracking-wider">{stat.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* View Trend */}
                                                    <div className="mb-3">
                                                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-wider mb-1.5">14-Day View Trend</p>
                                                        <MiniViewChart viewsByDay={listing.viewsByDay} />
                                                    </div>

                                                    {/* Tips */}
                                                    {listing.tips.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {listing.tips.map((tip, i) => (
                                                                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/8 border border-amber-500/10 text-[9px] text-amber-300/70">
                                                                    <Lightbulb size={9} /> {tip}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

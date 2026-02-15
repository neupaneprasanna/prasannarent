'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { useAdminDashboardStore } from '@/store/admin/admin-dashboard-store';
import { useAdminListingsStore } from '@/store/admin/admin-data-stores';
import {
    Users, Building2, Calendar, DollarSign,
    TrendingUp, Activity, Shield, Server,
    ArrowUpRight, ArrowDownRight, Clock, Eye,
    ChevronRight, CheckCircle2, AlertCircle,
    Brain, Zap, ExternalLink, Database
} from 'lucide-react';
import { AdminActivityEvent } from '@/types/admin';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';
import { AdminRevenueChart } from '@/components/admin/dashboard/AdminRevenueChart';
import { AdminUserGrowthChart } from '@/components/admin/dashboard/AdminUserGrowthChart';

// ─── Activity Item ──────────────────────────────────────────────────────────────

function ActivityItem({ action, adminName, timestamp, module }: {
    action: string;
    adminName: string;
    timestamp: string;
    module: string;
}) {
    const timeAgo = getTimeAgo(timestamp);
    const moduleColors: Record<string, string> = {
        users: 'bg-blue-500/20 text-blue-400',
        listings: 'bg-emerald-500/20 text-emerald-400',
        bookings: 'bg-purple-500/20 text-purple-400',
        payments: 'bg-amber-500/20 text-amber-400',
        moderation: 'bg-rose-500/20 text-rose-400',
        auth: 'bg-cyan-500/20 text-cyan-400',
    };

    return (
        <div className="flex items-start gap-4 py-4 border-b border-white/[0.04] last:border-0 group">
            <div className={`w-8 h-8 rounded-lg ${moduleColors[module] || 'bg-white/10 text-white/60'} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {module === 'users' ? <Users size={14} /> :
                    module === 'listings' ? <Building2 size={14} /> :
                        module === 'bookings' ? <Calendar size={14} /> :
                            <Activity size={14} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">{action}</p>
                    <span className="text-[10px] text-white/20 whitespace-nowrap">{timeAgo}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/30 truncate">Administrator: <span className="text-cyan-400/60">{adminName}</span></span>
                </div>
            </div>
        </div>
    );
}

function getTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-[10px] text-white/60 font-medium">Record</span>
                    <span className="text-sm font-bold text-white">
                        {entry.name === 'revenue' ? `$${entry.value?.toLocaleString()}` : entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboardPage() {
    const { token } = useAdminAuthStore();
    const {
        stats, revenueData, activityFeed, systemHealth,
        fetchStats, fetchRevenue, fetchActivity, fetchHealth,
        loading: dashboardLoading
    } = useAdminDashboardStore();
    const { items: pendingListings, fetch: fetchListings } = useAdminListingsStore();

    useEffect(() => {
        if (token) {
            fetchStats(token);
            fetchRevenue(token);
            fetchActivity(token);
            fetchListings(token);
            fetchHealth(token);
        }
    }, [token, fetchStats, fetchRevenue, fetchActivity, fetchListings, fetchHealth]);

    // Refresh telemetry and stats intermittently
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => {
            fetchStats(token);
            fetchHealth(token);
        }, 30000); // 30s for health/stats
        return () => clearInterval(interval);
    }, [token, fetchStats, fetchHealth]);

    interface DashboardStat {
        title: string;
        value: string | number;
        icon: any; // LucideIcon type is imported but used as value
        change?: number;
        type?: 'increase' | 'decrease' | 'neutral';
    }

    const dashboardStats: DashboardStat[] = [
        { title: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, change: 12.5, type: 'increase' },
        { title: 'Active Listings', value: stats?.totalListings ?? '—', icon: Building2, change: 8.2, type: 'increase' },
        { title: 'Global Bookings', value: stats?.totalBookings ?? '—', icon: Calendar, change: 23.4, type: 'increase' },
        { title: 'Total Revenue', value: stats ? `$${stats.totalRevenue.toLocaleString()}` : '—', icon: DollarSign, change: 18.2, type: 'increase' },
        { title: 'Pending Review', value: stats?.pendingApprovals ?? '—', icon: Clock, type: 'neutral' },
        { title: 'System Alerts', value: stats?.moderationQueue ?? '—', icon: Shield, type: 'neutral' },
    ];

    return (
        <div className="space-y-8 pb-8">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                            Live Environment
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-emerald-400/80 font-medium">Synced</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-white tracking-tight">
                        Platform <span className="text-white/40 font-normal italic">Control</span>
                    </h1>
                    <p className="text-sm text-white/30 mt-1 max-w-md">
                        Platform operations, real-time analytics, and system administration oversight.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl"
                >
                    {['24h', '7d', '30d', 'All Time'].map((range) => (
                        <button
                            key={range}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${range === '30d' ? 'bg-white/10 text-white shadow-xl' : 'text-white/30 hover:text-white/50'}`}
                        >
                            {range}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {dashboardStats.map((s, idx) => (
                    <AdminStatsCard
                        key={idx}
                        title={s.title}
                        value={s.value}
                        icon={s.icon}
                        change={s.change}
                        changeType={s.type}
                        loading={dashboardLoading}
                    />
                ))}
            </div>

            {/* Primary Analysis View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Revenue Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 glass shadow-2xl rounded-3xl border border-white/[0.06] overflow-hidden"
                >
                    <div className="p-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Revenue Performance</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Financial trajectory (30 days)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-display font-bold text-emerald-400">+$24,842</p>
                            <p className="text-[10px] text-white/20 uppercase font-bold">Month to date</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <AdminRevenueChart data={revenueData} />
                    </div>
                </motion.div>

                {/* Moderation Queue Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass shadow-2xl rounded-3xl border border-white/[0.06] flex flex-col"
                >
                    <div className="p-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Approval Queue</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Pending moderation</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-white/40">
                            {pendingListings.filter(l => l.status === 'PENDING').length} Items
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                        {pendingListings.filter(l => l.status === 'PENDING').slice(0, 5).map((listing: any, idx: number) => (
                            <div
                                key={listing.id}
                                className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-4 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
                                    <img src={listing.images?.[0]} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{listing.title}</p>
                                    <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">by {listing.owner?.firstName} {listing.owner?.lastName}</p>
                                </div>
                                <ChevronRight size={14} className="text-white/10 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        ))}

                        {pendingListings.filter(l => l.status === 'PENDING').length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
                                <CheckCircle2 size={32} className="mb-2" />
                                <p className="text-xs font-medium">Queue is empty</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/[0.04]">
                        <button className="w-full py-2.5 rounded-xl border border-white/[0.06] text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/[0.04] transition-all">
                            View Complete Queue
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Secondary Operational View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Intelligence / Systems Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass shadow-2xl rounded-3xl border border-white/[0.06] overflow-hidden"
                >
                    <div className="p-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                <Brain size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Live Audit Log</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Recent administrative activity</p>
                            </div>
                        </div>
                        <Activity size={16} className="text-white/20 animate-spin-slow" />
                    </div>
                    <div className="p-6 h-[340px] overflow-y-auto scrollbar-thin">
                        {activityFeed.length > 0 ? (
                            activityFeed.map((event: AdminActivityEvent) => (
                                <ActivityItem
                                    key={event.id}
                                    action={event.action}
                                    adminName={event.adminName}
                                    timestamp={event.timestamp}
                                    module={event.module}
                                />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <Activity size={32} className="mb-2" />
                                <p className="text-xs font-medium">Awaiting audit signals...</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* System Nodes & Health Status */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass shadow-2xl rounded-3xl border border-white/[0.06] overflow-hidden"
                >
                    <div className="p-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Server size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Infrastructure Health</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Node & Network status</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">Operational</span>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {systemHealth?.metrics ? (
                            <>
                                {[
                                    { name: 'Core API Server', status: 'Online', latency: `${systemHealth.metrics.database.latency}`, load: systemHealth.metrics.cpu.usage, icon: <Activity size={14} /> },
                                    { name: 'Database Engine', status: systemHealth.metrics.database.status === 'connected' ? 'Online' : 'Error', latency: 'Local', load: systemHealth.metrics.memory.usage, icon: <Database size={14} /> },
                                    { name: 'Memory Pool', status: 'Healthy', latency: `${Math.round(systemHealth.metrics.memory.free / 1024 / 1024 / 1024)}GB Free`, load: systemHealth.metrics.memory.usage, icon: <Zap size={14} /> },
                                    { name: 'Node Runtime', status: 'Stable', latency: systemHealth.metrics.nodeVersion, load: 10, icon: <Server size={14} /> },
                                ].map((node) => (
                                    <div key={node.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                                                {node.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white/80">{node.name}</p>
                                                <p className="text-[10px] text-white/30 font-medium">Metric: <span className="text-cyan-400">{node.latency}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-white/30 uppercase">Load</p>
                                                <div className="w-20 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full ${node.load > 80 ? 'bg-rose-500' : 'bg-cyan-500/50'}`} style={{ width: `${node.load}%` }} />
                                                </div>
                                            </div>
                                            <div className={`p-1 px-2 rounded-md text-[10px] font-bold ${node.status === 'Online' || node.status === 'Healthy' || node.status === 'Stable' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                {node.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                                <Zap size={24} className="mb-2 animate-pulse" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Telemetry...</p>
                            </div>
                        )}

                        <button className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-bold text-white/60 transition-all uppercase tracking-widest">
                            Comprehensive Diagnostics
                            <ExternalLink size={14} />
                        </button>
                    </div>
                </motion.div>

                {/* New User Growth Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass shadow-2xl rounded-3xl border border-white/[0.06] overflow-hidden"
                >
                    <div className="p-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">User Growth</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">New registrations</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <AdminUserGrowthChart />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// ─── Mock Data Generator ─────────────────────────────────────────────────────────

function generateMockRevenue(): AdminRevenueDataPoint[] {
    const data: AdminRevenueDataPoint[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toISOString().split('T')[0],
            revenue: Math.floor(Math.random() * 5000) + 2000,
            bookings: Math.floor(Math.random() * 20) + 5,
        });
    }
    return data;
}

interface AdminRevenueDataPoint {
    date: string;
    revenue: number;
    bookings: number;
}

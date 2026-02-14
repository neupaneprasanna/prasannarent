'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Package, Calendar, DollarSign, MessageSquare, Bell, Settings, LayoutDashboard, Plus, ExternalLink, Loader2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const sidebarItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', id: 'overview' },
    { icon: <Package size={18} />, label: 'My Listings', id: 'listings' },
    { icon: <Calendar size={18} />, label: 'Bookings', id: 'bookings' },
    { icon: <DollarSign size={18} />, label: 'Earnings', id: 'earnings' },
    { icon: <MessageSquare size={18} />, label: 'Messages', id: 'messages' },
    { icon: <Bell size={18} />, label: 'Notifications', id: 'notifications' },
    { icon: <Settings size={18} />, label: 'Settings', id: 'settings' },
];

const mockChartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 },
    { name: 'Jul', value: 1000 },
];

const mockActivityData = [
    { name: 'Mon', value: 20 },
    { name: 'Tue', value: 45 },
    { name: 'Wed', value: 30 },
    { name: 'Thu', value: 50 },
    { name: 'Fri', value: 70 },
    { name: 'Sat', value: 90 },
    { name: 'Sun', value: 60 },
];

import { Listing, Booking } from '@/types/rental';

export default function DashboardPage() {
    const [activeSidebar, setActiveSidebar] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<Listing[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState({ totalListings: 0, totalEarnings: 0, messageCount: 0, activeBookings: 0 });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [activityData, setActivityData] = useState<any[]>([]);

    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all dashboard data
            const [listingsRes, bookingsRes, statsRes, revenueRes, activityRes] = await Promise.all([
                apiClient.get<{ listings: any[] }>('/listings/me'),
                apiClient.get<{ bookings: any[] }>('/bookings/me'),
                apiClient.get<any>('/dashboard/stats'),
                apiClient.get<any[]>('/dashboard/revenue'),
                apiClient.get<any[]>('/dashboard/activity')
            ]);

            setListings(listingsRes.listings || []);
            setBookings(bookingsRes.bookings || []);
            setStats(statsRes);
            setRevenueData(revenueRes);
            setActivityData(activityRes);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { label: 'Total Listings', value: stats.totalListings.toString(), change: 'Real-time', icon: <Package size={20} />, gradient: 'from-[#6c5ce7]/20 to-[#a29bfe]/20' },
        { label: 'Active Bookings', value: stats.activeBookings.toString(), change: 'Incoming', icon: <Calendar size={20} />, gradient: 'from-[#00cec9]/20 to-[#00b894]/20' },
        { label: 'Total Earnings', value: `$${stats.totalEarnings.toLocaleString()}`, change: 'Confirmed', icon: <DollarSign size={20} />, gradient: 'from-[#fd79a8]/20 to-[#e17055]/20' },
        { label: 'Messages', value: stats.messageCount.toString(), change: 'Total', icon: <MessageSquare size={20} />, gradient: 'from-[#fdcb6e]/20 to-[#f39c12]/20' },
    ];

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center">
                <Navbar />
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
                    <a href="/login" className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium">Log In</a>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#030304]">
            <Navbar />

            <div className="pt-24 flex">
                {/* Sidebar */}
                <motion.aside
                    className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-24 left-0 h-[calc(100vh-6rem)] w-64 glass-card border-r border-white/5 z-50 lg:z-0 transition-transform duration-300 backdrop-blur-xl bg-black/40`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="p-6 h-full flex flex-col">
                        {/* Profile Card */}
                        <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-sm font-bold text-white overflow-hidden shadow-lg">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    user?.firstName?.[0] || 'U'
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</div>
                                <div className="text-[10px] text-[#00cec9] flex items-center gap-1 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00cec9] animate-pulse" />
                                    Verified Pro
                                </div>
                            </div>
                        </div>

                        {/* Nav Items */}
                        <div className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeSidebar === item.id
                                        ? 'bg-[#6c5ce7]/10 text-white border border-[#6c5ce7]/20 shadow-[0_0_20px_rgba(108,92,231,0.1)]'
                                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                                        }`}
                                    onClick={() => { setActiveSidebar(item.id); setSidebarOpen(false); }}
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                >
                                    <span className={`${activeSidebar === item.id ? 'text-[#a29bfe]' : 'text-white/40'}`}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto pt-8">
                            <Link href="/listings/new">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] hover:opacity-90 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-[#6c5ce7]/20">
                                    <Plus size={16} /> Create New Listing
                                </button>
                            </Link>
                        </div>
                    </div>
                </motion.aside>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white shadow-xl shadow-[#6c5ce7]/30"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <LayoutDashboard size={20} />
                </button>

                {/* Main Content */}
                <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-bold mb-1">
                                Dashboard
                            </h1>
                            <p className="text-sm text-white/40 flex items-center gap-2">
                                Last updated: <span className="text-white/60">Just now</span>
                            </p>
                        </motion.div>

                        <div className="flex gap-3">
                            <button className="px-4 py-2 glass rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">
                                Export Data
                            </button>
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-all">
                                Analytics View
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-[60vh]">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-[#6c5ce7]" />
                                <p className="text-sm text-white/30 animate-pulse">Loading secure data...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {statsCards.map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        className={`glass-card rounded-2xl p-6 relative overflow-hidden group`}
                                        variants={fadeInUp}
                                        custom={i}
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/80">{stat.icon}</div>
                                                <div className="flex items-center gap-1 text-[10px] font-medium text-[#00cec9] bg-[#00cec9]/10 px-2 py-1 rounded-full">
                                                    <TrendingUp size={10} />
                                                    {stat.change}
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                                            <div className="text-xs font-medium text-white/40">{stat.label}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Revenue Chart */}
                                <motion.div
                                    className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 bg-black/20"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Revenue Overview</h3>
                                            <p className="text-xs text-white/40">Gross earnings over time</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {['1W', '1M', '3M', '1Y'].map(range => (
                                                <button key={range} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${range === '1Y' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                                                    {range}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="rgba(255,255,255,0.2)"
                                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="rgba(255,255,255,0.2)"
                                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `$${value}`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#6c5ce7"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorValue)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* Activity Chart */}
                                <motion.div
                                    className="glass-card rounded-2xl p-6 border border-white/5 bg-black/20"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h3 className="text-lg font-bold text-white mb-1">Weekly Activity</h3>
                                    <p className="text-xs text-white/40 mb-6">Views & interactions</p>

                                    <div className="h-[200px] w-full mb-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={activityData}>
                                                <Bar
                                                    dataKey="value"
                                                    fill="#00cec9"
                                                    radius={[4, 4, 0, 0]}
                                                    barSize={20}
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="rgba(255,255,255,0.2)"
                                                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">Top Performer</h4>
                                        {listings.length > 0 ? (
                                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                                                <div className="w-10 h-10 rounded bg-[#6c5ce7]/20 flex items-center justify-center text-[#a29bfe] overflow-hidden">
                                                    {listings[0].images?.[0] ? (
                                                        <img src={listings[0].images[0]} alt={listings[0].title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={18} />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white">{listings[0].title}</div>
                                                    <div className="text-[10px] text-white/40">{listings[0].views || 0} views • {listings[0].reviewCount || 0} reviews</div>
                                                </div>
                                                <div className="text-xs text-[#00cec9] font-medium">Active</div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-white/20 italic">No listings yet</p>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

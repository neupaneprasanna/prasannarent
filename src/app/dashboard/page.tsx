'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Calendar, Bell, Settings, LayoutDashboard, Loader2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotificationStore } from '@/store/notification-store';
import { formatDistanceToNow } from 'date-fns';
import { Booking } from '@/types/rental';
import DashboardOverviewSkeleton from '@/components/ui/DashboardOverviewSkeleton';

const sidebarItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', id: 'overview' },
    { icon: <Calendar size={18} />, label: 'Bookings', id: 'bookings' },
    { icon: <Bell size={18} />, label: 'Notifications', id: 'notifications', badge: true },
    { icon: <Settings size={18} />, label: 'Settings', id: 'settings' },
];

export default function DashboardPage() {
    const router = useRouter();
    const [activeSidebar, setActiveSidebar] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState({ activeBookings: 0 });

    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const { user, isAuthenticated } = useAuthStore();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, statsRes] = await Promise.all([
                apiClient.get<{ bookings: any[] }>('/bookings/me'),
                apiClient.get<any>('/dashboard/stats')
            ]);

            setBookings(bookingsRes.bookings || []);
            setStats(statsRes);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };



    const statsCards = [
        { label: 'Active Rentals', value: stats.activeBookings?.toString() || '0', change: 'Confirmed', icon: <Calendar size={20} />, gradient: 'from-[#00cec9]/20 to-[#00b894]/20' },
        { label: 'Upcoming', value: bookings.filter(b => b.status === 'CONFIRMED').length.toString(), change: 'Scheduled', icon: <Package size={20} />, gradient: 'from-[#6c5ce7]/20 to-[#a29bfe]/20' },
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

            <div className="pt-24 flex min-h-[calc(100vh-6rem)]">
                {/* Sidebar */}
                <motion.aside
                    className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-24 left-0 h-[calc(100vh-6rem)] w-64 glass-card border-r border-white/5 z-50 lg:z-0 transition-transform duration-300 backdrop-blur-xl bg-black/40`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="p-6 h-full flex flex-col">
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

                        <div className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeSidebar === item.id
                                        ? 'bg-[#6c5ce7]/10 text-white border border-[#6c5ce7]/20 shadow-[0_0_20px_rgba(108,92,231,0.1)]'
                                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                                        }`}
                                    onClick={() => {
                                        if (item.id === 'settings') {
                                            router.push('/settings');
                                            return;
                                        }
                                        setActiveSidebar(item.id);
                                        setSidebarOpen(false);
                                    }}
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                >
                                    <span className={`${activeSidebar === item.id ? 'text-[#a29bfe]' : 'text-white/40'}`}>{item.icon}</span>
                                    {item.label}
                                    {item.badge && unreadCount > 0 && (
                                        <span className="ml-auto w-5 h-5 rounded-full bg-[#ff7675] text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>


                    </div>
                </motion.aside>

                <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-bold mb-1">Dashboard</h1>
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
                        <DashboardOverviewSkeleton />
                    ) : (
                        <div className="space-y-8">
                            {activeSidebar === 'overview' && (
                                <div className="space-y-8">
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




                                </div>
                            )}



                            {activeSidebar === 'notifications' && (
                                <motion.div
                                    variants={fadeInUp}
                                    initial="hidden"
                                    animate="visible"
                                    className="glass-card rounded-2xl border border-white/5 overflow-hidden"
                                >
                                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Notifications</h3>
                                            <p className="text-xs text-white/40">Manage your recent alerts and activity</p>
                                        </div>
                                        <button onClick={() => markAllAsRead()} className="px-4 py-2 glass rounded-xl text-xs font-bold text-[#6c5ce7] hover:text-[#a29bfe] transition-all">Mark All as Read</button>
                                    </div>
                                    <div className="divide-y divide-white/5 bg-black/20 max-h-[600px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="py-20 text-center">
                                                <Bell size={48} className="mx-auto text-white/5 mb-4" />
                                                <p className="text-white/20 italic">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div key={n.id} className={`p-6 transition-all hover:bg-white/[0.03] flex items-start justify-between group ${!n.read ? 'bg-[#6c5ce7]/5' : ''}`} onClick={() => !n.read && markAsRead(n.id)}>
                                                    <div className="flex gap-4">
                                                        <div className={`p-3 rounded-xl ${!n.read ? 'bg-[#6c5ce7]/20 text-[#a29bfe]' : 'bg-white/5 text-white/20'}`}><Bell size={20} /></div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-sm font-bold text-white/90">{n.title}</h4>
                                                                {!n.read && <span className="w-2 h-2 rounded-full bg-[#6c5ce7] shadow-[0_0_10px_rgba(108,92,231,0.5)]" />}
                                                            </div>
                                                            <p className="text-xs text-white/50 leading-relaxed mb-2">{n.message}</p>
                                                            <span className="text-[10px] text-white/20 font-medium">
                                                                {(() => {
                                                                    try {
                                                                        const d = new Date(n.createdAt);
                                                                        return isNaN(d.getTime()) ? 'Recently' : formatDistanceToNow(d, { addSuffix: true });
                                                                    } catch (e) {
                                                                        return 'Recently';
                                                                    }
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-white transition-all"><ArrowUpRight size={18} /></button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

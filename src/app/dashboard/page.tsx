'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Package, Calendar, DollarSign, MessageSquare, Bell, Settings, LayoutDashboard, Plus, ExternalLink, Loader2 } from 'lucide-react';

const sidebarItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', id: 'overview' },
    { icon: <Package size={18} />, label: 'My Listings', id: 'listings' },
    { icon: <Calendar size={18} />, label: 'Bookings', id: 'bookings' },
    { icon: <DollarSign size={18} />, label: 'Earnings', id: 'earnings' },
    { icon: <MessageSquare size={18} />, label: 'Messages', id: 'messages' },
    { icon: <Bell size={18} />, label: 'Notifications', id: 'notifications' },
    { icon: <Settings size={18} />, label: 'Settings', id: 'settings' },
];

export default function DashboardPage() {
    const [activeSidebar, setActiveSidebar] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);

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
            const [listingsData, bookingsData] = await Promise.all([
                apiClient.get<{ listings: any[] }>('/listings/me'),
                apiClient.get<{ bookings: any[] }>('/bookings/me')
            ]);
            setListings(listingsData.listings);
            setBookings(bookingsData.bookings);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { label: 'Total Listings', value: listings.length.toString(), change: 'Live', icon: <Package size={20} />, gradient: 'from-[#6c5ce7]/20 to-[#a29bfe]/20' },
        { label: 'Active Bookings', value: bookings.length.toString(), change: 'Orders', icon: <Calendar size={20} />, gradient: 'from-[#00cec9]/20 to-[#00b894]/20' },
        { label: 'Total Earnings', value: '$0.00', change: '+0%', icon: <DollarSign size={20} />, gradient: 'from-[#fd79a8]/20 to-[#e17055]/20' },
        { label: 'Messages', value: '0', change: 'New', icon: <MessageSquare size={20} />, gradient: 'from-[#fdcb6e]/20 to-[#f39c12]/20' },
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
        <main className="relative min-h-screen">
            <Navbar />

            <div className="pt-24 flex">
                {/* Sidebar */}
                <motion.aside
                    className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-24 left-0 h-[calc(100vh-6rem)] w-64 glass-card border-r border-white/5 z-50 lg:z-0 transition-transform duration-300`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="p-6 h-full flex flex-col">
                        {/* Profile */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-sm font-semibold text-white overflow-hidden border border-white/10">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    user?.firstName?.[0] || 'U'
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-white/80 truncate">{user?.firstName} {user?.lastName}</div>
                                <div className="text-[10px] text-[#00cec9] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00cec9]" />
                                    {user?.verified ? 'Verified Pro' : 'Online'}
                                </div>
                            </div>
                        </div>

                        {/* Nav items */}
                        <div className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeSidebar === item.id
                                        ? 'bg-[#6c5ce7]/10 text-white border border-[#6c5ce7]/20'
                                        : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                        }`}
                                    onClick={() => { setActiveSidebar(item.id); setSidebarOpen(false); }}
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                >
                                    <span className="text-white/60">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto pt-8">
                            <Link href="/listings/new">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white/60 transition-all border border-white/5">
                                    <Plus size={14} /> Create New Listing
                                </button>
                            </Link>
                        </div>
                    </div>
                </motion.aside>

                {/* Mobile sidebar toggle */}
                <button
                    className="lg:hidden fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white shadow-lg"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <LayoutDashboard size={20} />
                </button>

                {/* Main content */}
                <div className="flex-1 p-6 lg:p-10 max-w-6xl">
                    {/* Header */}
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-2xl md:text-4xl font-bold mb-2">
                            Welcome back, <span className="gradient-text">{user?.firstName}</span>
                        </h1>
                        <p className="text-sm text-white/40">Manage your business and property with ease</p>
                    </motion.div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6c5ce7]" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {statsCards.map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${stat.gradient}`}
                                        variants={fadeInUp}
                                        custom={i}
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-white/80">{stat.icon}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/60 font-medium">
                                                {stat.change}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold text-white/90 mb-1">{stat.value}</div>
                                        <div className="text-xs text-white/40">{stat.label}</div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Listings/Bookings section */}
                                <motion.div
                                    className="lg:col-span-2 glass-card rounded-2xl p-6"
                                    variants={fadeInUp}
                                    initial="hidden"
                                    animate="visible"
                                    custom={5}
                                >
                                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Package size={16} /> Recent Listings</span>
                                        <button className="text-[10px] text-[#6c5ce7] hover:underline">View All</button>
                                    </h3>

                                    {listings.length === 0 ? (
                                        <div className="text-center py-12 glass rounded-2xl border border-white/5">
                                            <Package size={32} className="mx-auto mb-3 text-white/10" />
                                            <p className="text-sm text-white/30">You haven&apos;t listed anything yet.</p>
                                            <button className="mt-4 text-xs text-[#6c5ce7] font-medium">Post your first rental →</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {listings.slice(0, 5).map((item, i) => (
                                                <motion.div
                                                    key={item.id}
                                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * i }}
                                                >
                                                    <div className="w-12 h-12 rounded-lg glass flex items-center justify-center text-xl overflow-hidden">
                                                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : '📦'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-white/80 truncate font-medium">{item.title}</div>
                                                        <div className="text-[10px] text-white/30">{item.category} · ${item.price}/{item.period}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-full bg-[#00cec9]/10 text-[10px] text-[#00cec9] font-medium">
                                                            Active
                                                        </span>
                                                        <Link href={`/item/${item.id}`}>
                                                            <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                                                                <ExternalLink size={14} />
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Notifications/Activity side panel */}
                                <motion.div
                                    className="glass-card rounded-2xl p-6"
                                    variants={fadeInUp}
                                    initial="hidden"
                                    animate="visible"
                                    custom={6}
                                >
                                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                                        <Bell size={16} /> Activity
                                    </h3>
                                    <div className="space-y-4">
                                        {bookings.length === 0 ? (
                                            <p className="text-xs text-white/20 text-center py-8">No recent activity</p>
                                        ) : (
                                            bookings.slice(0, 4).map((booking, i) => (
                                                <div key={booking.id} className="relative pl-4 border-l border-white/5">
                                                    <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-[#6c5ce7]" />
                                                    <p className="text-xs text-white/60 mb-1">New booking for <span className="text-white">{booking.listing?.title}</span></p>
                                                    <span className="text-[10px] text-white/20">Recently</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

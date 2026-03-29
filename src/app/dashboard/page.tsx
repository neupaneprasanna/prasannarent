'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Calendar, Bell, Settings, LayoutDashboard, Loader2, TrendingUp, ArrowUpRight, List, Home, BarChart3, DollarSign, Gift, GripHorizontal, ChevronLeft, ChevronRight, CheckCircle2, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/store/notification-store';
import HostPanel from '@/components/dashboard/HostPanel';
import TrackerPanel from '@/components/dashboard/TrackerPanel';
import AnalyticsPanel from '@/components/dashboard/AnalyticsPanel';
import EarningsPanel from '@/components/dashboard/EarningsPanel';
import ReferralsPanel from '@/components/dashboard/ReferralsPanel';

const STATUS_ICONS: any = { PENDING: Clock, CONFIRMED: CheckCircle2, ACTIVE: Zap, COMPLETED: CheckCircle2 };

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
    { icon: List, label: 'My Listings', id: 'listings' },
    { icon: Calendar, label: 'Bookings', id: 'bookings' },
    { icon: Home, label: 'Host Dashboard', id: 'host' },
    { icon: Package, label: 'Rental Tracker', id: 'tracker' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: DollarSign, label: 'Earnings', id: 'earnings' },
    { icon: Gift, label: 'Invite & Earn', id: 'referrals' },
    { icon: Bell, label: 'Notifications', id: 'notifications', badge: true },
    { icon: Settings, label: 'Settings', id: 'settings' },
];

function BentoWidget({ item, children }: { item: any, children: React.ReactNode }) {
    return (
        <Reorder.Item value={item} id={item.id}
            className="col-span-1 md:col-span-2 lg:col-span-1"
            whileDrag={{ scale: 1.05, zIndex: 50, rotate: 2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}>
            <div className="h-full glass-card rounded-3xl p-6 border border-white/5 relative group hover:border-white/10 transition-colors bg-white/[0.02] backdrop-blur-3xl overflow-hidden cursor-grab active:cursor-grabbing">
                <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/30 transition-colors">
                    <GripHorizontal size={16} />
                </div>
                {children}
            </div>
        </Reorder.Item>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const [activeSidebar, setActiveSidebar] = useState('overview');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, isAuthenticated } = useAuthStore();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ activeBookings: 0 });
    const [bookings, setBookings] = useState<any[]>([]);
    const [myListings, setMyListings] = useState<any[]>([]);

    // Draggable layout state for widgets
    const [widgets, setWidgets] = useState([
        { id: 'active', size: 'grid-cols-2' },
        { id: 'upcoming', size: 'grid-cols-2' },
        { id: 'quick-actions', size: 'grid-cols-4' }
    ]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam && sidebarItems.some(s => s.id === tabParam)) setActiveSidebar(tabParam);
        }
    }, []);

    useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [b, s, l] = await Promise.all([
                apiClient.get<{ bookings: any[] }>('/bookings/me'),
                apiClient.get<any>('/dashboard/stats'),
                apiClient.get<{ listings: any[] }>('/listings/me')
            ]);
            setBookings(b.bookings || []);
            setStats(s);
            setMyListings(l.listings || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center bg-[#030304]">
                <Navbar />
                <div className="text-center font-outfit">
                    <Loader2 size={48} className="mx-auto animate-spin text-[#6c5ce7] mb-6" />
                    <h2 className="text-2xl font-bold mb-4 text-white">Loading Dashboard...</h2>
                </div>
            </main>
        );
    }

    const renderPanelContent = () => {
        switch (activeSidebar) {
            case 'host': return <HostPanel />;
            case 'tracker': return <TrackerPanel />;
            case 'analytics': return <AnalyticsPanel />;
            case 'earnings': return <EarningsPanel />;
            case 'referrals': return <ReferralsPanel />;
            case 'overview': return renderOverview();
            case 'listings': return renderListings();
            case 'notifications': return renderNotifications();
            default: return (
                <div className="py-20 text-center glass-card rounded-3xl border border-white/5">
                    <LayoutDashboard size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="text-xl font-bold text-white/50">Coming Soon</h3>
                    <p className="text-sm text-white/30">This panel is under construction.</p>
                </div>
            );
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold font-outfit text-white">At a Glance</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Drag to Reorder Widgets</p>
            </div>
            
            <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="flex flex-col gap-4">
                {widgets.map(w => {
                    if (w.id === 'active') return (
                        <BentoWidget key={w.id} item={w}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00cec9]/20 to-[#00b894]/20 flex items-center justify-center text-[#00cec9]">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Active Rentals</p>
                                    <p className="text-4xl font-extrabold font-outfit text-white">{stats.activeBookings || 0}</p>
                                </div>
                            </div>
                        </BentoWidget>
                    );
                    if (w.id === 'upcoming') return (
                        <BentoWidget key={w.id} item={w}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c5ce7]/20 to-[#a29bfe]/20 flex items-center justify-center text-[#a29bfe]">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Upcoming</p>
                                    <p className="text-4xl font-extrabold font-outfit text-white">{bookings.filter(b => b.status === 'CONFIRMED').length}</p>
                                </div>
                            </div>
                        </BentoWidget>
                    );
                    if (w.id === 'quick-actions') return (
                        <BentoWidget key={w.id} item={w}>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4">Quick Actions</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setActiveSidebar('tracker')} className="p-3 text-left rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <Package size={16} className="text-[#a29bfe] mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-xs font-bold text-white">Track Rentals</p>
                                </button>
                                <button onClick={() => setActiveSidebar('earnings')} className="p-3 text-left rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <DollarSign size={16} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-xs font-bold text-white">View Revenue</p>
                                </button>
                            </div>
                        </BentoWidget>
                    );
                    return null;
                })}
            </Reorder.Group>
        </div>
    );

    const renderListings = () => (
        <div className="glass-card rounded-3xl border border-white/5 overflow-hidden backdrop-blur-3xl bg-white/[0.02]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold font-outfit text-white">My Listings</h3>
                    <p className="text-xs text-white/40">Manage your published items</p>
                </div>
                <Link href="/listings/new" className="px-5 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-white/90 transition-colors">
                    Add Listing
                </Link>
            </div>
            <div className="p-6">
                {myListings.length === 0 ? (
                    <div className="py-20 text-center">
                        <List size={48} className="mx-auto text-white/5 mb-4" />
                        <p className="text-white/40 font-medium font-outfit">No listings yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {myListings.map(l => (
                            <Link href={`/item/${l.id}`} key={l.id} className="group block glass-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 border border-white/10">
                                <div className="aspect-[4/3] bg-black/50 relative">
                                    {l.media?.[0]?.url && <img src={l.media[0].url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt="" />}
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-bold text-white border border-white/10">
                                        {l.status || 'ACTIVE'}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-white text-sm line-clamp-1 mb-2">{l.title}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-outfit font-black text-white">${l.pricing?.dailyRate || l.price}<span className="text-[10px] text-white/40">/day</span></span>
                                        <ArrowUpRight size={16} className="text-white/40 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="glass-card rounded-3xl border border-white/5 overflow-hidden backdrop-blur-3xl bg-white/[0.02]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-2xl font-bold font-outfit text-white">Notifications</h3>
                <button onClick={() => markAllAsRead()} className="text-xs font-bold text-[#6c5ce7] hover:text-[#a29bfe] transition-colors">Mark All Read</button>
            </div>
            <div className="divide-y divide-white/5 custom-scrollbar max-h-[600px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="py-20 text-center"><Bell size={48} className="mx-auto text-white/5" /></div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} onClick={() => !n.read && markAsRead(n.id)} className={`p-6 flex gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${!n.read ? 'bg-[#6c5ce7]/5' : ''}`}>
                            <div className={`p-3 rounded-2xl ${!n.read ? 'bg-[#6c5ce7] text-white shadow-[0_0_20px_rgba(108,92,231,0.3)]' : 'bg-white/5 text-white/30'}`}><Bell size={20} /></div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">{n.title}</h4>
                                <p className="text-xs text-white/50 mb-2 leading-relaxed">{n.message}</p>
                                <span className="text-[10px] uppercase font-bold text-white/20 tracking-wider">
                                    {isNaN(new Date(n.createdAt).getTime()) ? 'Recently' : formatDistanceToNow(new Date(n.createdAt), {addSuffix:true})}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <main className="relative min-h-screen bg-[#030304]">
            {/* Global Premium Background Blocker */}
            <div className="fixed inset-0 z-[-1] bg-[#030304] pointer-events-none" />
            
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6c5ce7]/20 blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00cec9]/10 blur-[150px]" />
            </div>

            <Navbar />

            <div className="pt-24 flex min-h-[calc(100vh-6rem)] relative z-10 max-w-[1600px] mx-auto pb-10 px-4 sm:px-6 lg:px-8 gap-8">
                
                {/* Modern Floating Sidebar */}
                <motion.aside 
                    layout
                    animate={{ width: isCollapsed ? 80 : 260 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    className="hidden lg:flex flex-col h-[calc(100vh-8rem)] sticky top-28 glass-card rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-3xl overflow-hidden shadow-2xl z-20"
                >
                    <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] p-[2px]">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                           {user?.avatar ? <img src={user?.avatar} alt="" /> : <span className="text-xs font-bold mt-px">{user?.firstName?.[0]}</span>}
                                        </div>
                                    </div>
                                    <span className="font-outfit font-bold text-sm text-white truncate max-w-[130px]">{user?.firstName}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-white/10 rounded-xl transition-colors mx-auto">
                            {isCollapsed ? <ChevronRight size={16} className="text-white/50" /> : <ChevronLeft size={16} className="text-white/50" />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
                        {sidebarItems.map(item => {
                            const active = activeSidebar === item.id;
                            const Icon = item.icon;
                            return (
                                <button key={item.id} onClick={() => {
                                    if(item.id === 'settings') { router.push('/settings'); return; }
                                    setActiveSidebar(item.id);
                                }} className="w-full relative flex items-center py-3 px-3 rounded-2xl group transition-all outline-none">
                                    {active && (
                                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 border border-white/10 rounded-2xl shadow-lg" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                                    )}
                                    <div className="relative flex items-center gap-3 w-full z-10">
                                        <Icon size={isCollapsed ? 20 : 18} className={`transition-colors duration-300 ${active ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/40 group-hover:text-white/80'} ${isCollapsed ? 'mx-auto' : ''}`} />
                                        <AnimatePresence mode="wait">
                                            {!isCollapsed && (
                                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className={`text-sm font-medium whitespace-nowrap overflow-hidden ${active ? 'text-white font-bold' : 'text-white/50 group-hover:text-white/80'}`}>
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {!isCollapsed && item.badge && unreadCount > 0 && (
                                            <span className="ml-auto w-5 h-5 rounded-full bg-[#ff7675] text-[10px] flex items-center justify-center text-white font-bold animate-pulse">{unreadCount}</span>
                                        )}
                                        {isCollapsed && item.badge && unreadCount > 0 && (
                                            <span className="absolute top-[-4px] right-2 w-2 h-2 rounded-full bg-[#ff7675]" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.aside>

                {/* Mobile Dropdown (Visible only on small screens) */}
                <div className="lg:hidden w-full mb-6 relative z-30 flex-shrink-0">
                    <select
                        value={activeSidebar}
                        onChange={(e) => {
                            if (e.target.value === 'settings') { router.push('/settings'); return; }
                            setActiveSidebar(e.target.value);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold appearance-none glass-card focus:ring-2 focus:ring-[#6c5ce7]"
                    >
                        {sidebarItems.map(item => (
                            <option key={item.id} value={item.id} className="bg-[#030304]">{item.label}</option>
                        ))}
                    </select>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 w-full min-w-0">
                    <div className="mb-8 hidden lg:block">
                        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-black font-outfit text-white tracking-tight">
                            {sidebarItems.find(s => s.id === activeSidebar)?.label}
                        </motion.h1>
                    </div>

                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-32 flex justify-center">
                                    <Loader2 size={32} className="animate-spin text-[#6c5ce7]" />
                                </motion.div>
                            ) : (
                                <motion.div key={activeSidebar}
                                    initial={{ opacity: 0, y: 15, scale: 0.99 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -15, scale: 0.99 }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                                >
                                    {renderPanelContent()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </main>
    );
}

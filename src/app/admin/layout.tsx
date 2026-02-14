'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { useAdminUIStore } from '@/store/admin/admin-data-stores';
import {
    LayoutDashboard, Users, Building2, Calendar, CreditCard,
    FileText, Brain, Bell, ToggleRight, Shield, BarChart3,
    ScrollText, Server, Settings, ChevronLeft, ChevronRight,
    Search, LogOut, Menu, Command, Zap, AlertTriangle
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/layout/AdminBreadcrumbs';
import { AdminNotifications } from '@/components/admin/layout/AdminNotifications';
import { AdminActivityStream } from '@/components/admin/layout/AdminActivityStream';
import { AdminQuickActions } from '@/components/admin/layout/AdminQuickActions';

const iconMap: Record<string, React.ElementType> = {
    LayoutDashboard, Users, Building2, Calendar, CreditCard,
    FileText, Brain, Bell, ToggleRight, Shield, BarChart3,
    ScrollText, Server, Settings,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout, fetchMe, token } = useAdminAuthStore();
    const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen, toggleCommandPalette } = useAdminUIStore();
    const sidebarItems = useAdminAuthStore((s) => s.sidebarItems);
    const [mounted, setMounted] = useState(false);
    // Phase 3 State
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated && !isLoginPage) {
            router.push('/admin/login');
        } else if (mounted && token) {
            fetchMe();
        }
    }, [mounted, isAuthenticated, isLoginPage, router, token, fetchMe]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleCommandPalette]);

    // If on the login page, render children directly without the dashboard shell
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!mounted || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push('/admin/login');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex">
            {/* ─── Mobile Sidebar Overlay ─── */}
            <AnimatePresence>
                {sidebarMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ─── Sidebar ─── */}
            <motion.aside
                className={`fixed lg:relative z-50 h-screen flex flex-col
          bg-[#0d0d14]/95 backdrop-blur-xl border-r border-white/[0.06]
          transition-all duration-300 ease-out
          ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold">RV</span>
                        </div>
                        <AnimatePresence>
                            {!sidebarCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    <h1 className="text-sm font-semibold bg-gradient-to-r from-[var(--admin-accent)] to-[var(--admin-accent-2)] bg-clip-text text-transparent font-display">
                                        RentVerse
                                    </h1>
                                    <p className="text-[10px] text-[var(--admin-text-tertiary)] -mt-0.5 font-bold tracking-widest uppercase">Control Center</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
                    {sidebarItems.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    router.push(item.href);
                                    setSidebarMobileOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                                        ? 'bg-cyan-500/10 text-cyan-400'
                                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                                    }
                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="admin-sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r"
                                    />
                                )}
                                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                                <AnimatePresence>
                                    {!sidebarCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="overflow-hidden whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Collapse Toggle */}
                <div className="p-2 border-t border-white/[0.06] hidden lg:block">
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors text-xs"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        {!sidebarCollapsed && <span>Collapse</span>}
                    </button>
                </div>
            </motion.aside>

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.06] bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06]"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col gap-1">
                            <AdminBreadcrumbs />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Command Palette Trigger */}
                        <button
                            onClick={toggleCommandPalette}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.1] transition-all text-sm mr-2"
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden xl:inline">Search...</span>
                            <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] bg-white/[0.06] rounded text-white/30 border border-white/[0.06]">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Quick Actions */}
                        <div className="relative">
                            <button
                                onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                                className={`p-2 rounded-lg transition-colors relative ${isQuickActionsOpen ? 'text-white bg-white/[0.06]' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}`}
                            >
                                <Zap className="w-5 h-5" />
                            </button>
                            <AdminQuickActions isOpen={isQuickActionsOpen} onClose={() => setIsQuickActionsOpen(false)} />
                        </div>

                        {/* Notifications */}
                        <button
                            onClick={() => setIsNotificationsOpen(true)}
                            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors relative"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                        </button>

                        {/* User Menu */}
                        <div className="flex items-center gap-3 pl-3 border-l border-white/[0.06]">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-white/80">{user?.firstName} {user?.lastName}</p>
                                <p className="text-[10px] text-cyan-400/80 uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-medium text-cyan-400">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin admin-scrollbar">


                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    {/* Right Sidebar: Activity Stream */}
                    <AdminActivityStream />
                </div>
            </div>

            {/* Notification Panel */}
            <AdminNotifications isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </div>
    );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Search, Bell, MessageSquare, User as UserIcon, LogOut, Settings, LayoutDashboard, Heart, ShoppingBag, BarChart3, Menu, X } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import SearchBar from '@/components/hero/SearchBar';
import { useNotificationStore } from '@/store/notification-store';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import LiquidButton from '@/components/motion/LiquidButton';

const categories = [
    { name: 'Explore', href: '/explore', icon: '◈' },
    { name: 'Trending', href: '#trending', icon: '◎' },
    { name: 'How it Works', href: '#how-it-works', icon: '⬡' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hoveredOrbit, setHoveredOrbit] = useState<number | null>(null);

    const isMobileMenuOpen = useAppStore((s) => s.isMobileMenuOpen);
    const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const isSearchActive = useAppStore((s) => s.isSearchActive);
    const { user, isAuthenticated, logout } = useAuthStore();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

    // Orbital animation
    const orbitAngle = useMotionValue(0);
    const smoothAngle = useSpring(orbitAngle, { stiffness: 30, damping: 20 });
    const animRef = useRef<number>(0);
    const isPaused = useRef(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!isSearchActive && showSearch) setShowSearch(false);
    }, [isSearchActive, showSearch]);

    // Orbital rotation loop
    useEffect(() => {
        let angle = 0;
        const loop = () => {
            if (!isPaused.current) {
                angle += 0.15;
                orbitAngle.set(angle);
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, [orbitAngle]);

    const handleLogout = () => {
        logout();
        setShowProfileMenu(false);
    };

    const getOrbitPosition = useCallback((index: number, total: number, baseAngle: number) => {
        const angleStep = (2 * Math.PI) / total;
        const angle = baseAngle * (Math.PI / 180) + index * angleStep;
        const radiusX = 140;
        const radiusY = 20;
        return {
            x: Math.cos(angle) * radiusX,
            y: Math.sin(angle) * radiusY,
            z: Math.sin(angle),
        };
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'py-3' : 'py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className={`relative rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-700 ${scrolled
                    ? 'bg-[#020305]/90 backdrop-blur-3xl border border-white/[0.1] shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(139,92,246,0.06)]'
                    : 'bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06]'
                    }`}
                    style={scrolled ? { boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.05)' } : { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
                >

                    {/* Core Logo — The "RentVerse Core" */}
                    <motion.a
                        href="/"
                        className="flex items-center gap-3 group"
                        onMouseEnter={() => setCursorVariant('hover')}
                        onMouseLeave={() => setCursorVariant('default')}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {/* Glowing Core Orb */}
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A5B4FC] flex items-center justify-center relative z-10 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-shadow duration-500">
                                <span className="text-[#020305] font-bold text-sm tracking-tight">R</span>
                            </div>
                            <div className="absolute inset-0 rounded-xl bg-[#8B5CF6] blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                        </div>
                        <span className="text-lg font-medium hidden sm:block tracking-tight">
                            <span className="gradient-text">rent</span>
                            <span className="text-white/70">verse</span>
                        </span>
                    </motion.a>

                    {/* Desktop: Orbital Navigation */}
                    <div className="hidden md:flex items-center gap-1 relative">
                        <motion.div className="flex items-center gap-1">
                            {categories.map((cat, i) => (
                                <motion.a
                                    key={cat.name}
                                    href={cat.href}
                                    className="relative px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-all duration-300 rounded-xl group"
                                    onMouseEnter={() => {
                                        setCursorVariant('hover');
                                        setHoveredOrbit(i);
                                        isPaused.current = true;
                                    }}
                                    onMouseLeave={() => {
                                        setCursorVariant('default');
                                        setHoveredOrbit(null);
                                        isPaused.current = false;
                                    }}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <span className="text-[10px] text-white/20 group-hover:text-[#8B5CF6] transition-colors">{cat.icon}</span>
                                        <span className="tracking-wide">{cat.name}</span>
                                    </span>
                                    {/* Hover glow */}
                                    <motion.div
                                        className="absolute inset-0 rounded-xl bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="navHover"
                                    />
                                    {/* Active indicator */}
                                    {hoveredOrbit === i && (
                                        <motion.div
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8B5CF6]"
                                            layoutId="navIndicator"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{ boxShadow: '0 0 8px rgba(139,92,246,0.6)' }}
                                        />
                                    )}
                                </motion.a>
                            ))}
                        </motion.div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Search */}
                        <motion.button
                            onClick={() => {
                                const nextState = !showSearch;
                                setShowSearch(nextState);
                                useAppStore.getState().setSearchActive(nextState);
                            }}
                            className="p-2 text-white/40 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/[0.04]"
                            onMouseEnter={() => setCursorVariant('hover')}
                            onMouseLeave={() => setCursorVariant('default')}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Toggle search"
                            suppressHydrationWarning
                        >
                            <Search size={18} />
                        </motion.button>

                        {isAuthenticated && (
                            <>
                                <Link
                                    href="/wishlist"
                                    className="p-2 text-white/40 hover:text-[#F472B6] transition-all duration-300 rounded-xl hover:bg-white/[0.04] hidden sm:flex"
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    title="Wishlist"
                                    aria-label="View wishlist"
                                >
                                    <Heart size={18} />
                                </Link>
                                <Link
                                    href="/messages"
                                    className="p-2 text-white/40 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/[0.04] relative"
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    title="Messages"
                                    aria-label="View messages"
                                >
                                    <MessageSquare size={18} />
                                </Link>
                            </>
                        )}

                        {/* Notifications */}
                        <div className="relative">
                            <motion.button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 text-white/40 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/[0.04] relative"
                                onMouseEnter={() => setCursorVariant('hover')}
                                onMouseLeave={() => setCursorVariant('default')}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Toggle notifications"
                                suppressHydrationWarning
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1 right-1 w-4 h-4 bg-[#F472B6] rounded-full border-2 border-[#020305] text-[8px] font-bold text-white flex items-center justify-center"
                                        style={{ boxShadow: '0 0 8px rgba(244,114,182,0.5)' }}
                                    >
                                        {unreadCount}
                                    </motion.span>
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        className="absolute top-full right-0 mt-3 w-80 rounded-2xl border border-white/[0.06] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] z-50 bg-[#0a0b10]/95 backdrop-blur-2xl"
                                    >
                                        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                                            <h3 className="text-sm font-medium text-white/90 tracking-tight">notifications</h3>
                                            <button
                                                onClick={() => markAllAsRead()}
                                                className="text-label text-[#8B5CF6] hover:text-[#A5B4FC] transition-colors"
                                                suppressHydrationWarning
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <Bell size={28} className="mx-auto text-white/[0.06] mb-3" />
                                                    <p className="text-xs text-white/20">no new alerts</p>
                                                </div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`p-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${!n.read ? 'bg-[#7A5CFF]/[0.04]' : ''}`}
                                                        onClick={() => { if (!n.read) markAsRead(n.id); }}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.read ? 'bg-white/10' : 'bg-[#8B5CF6]'}`}
                                                                style={!n.read ? { boxShadow: '0 0 8px rgba(139,92,246,0.5)' } : {}}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-white/90 mb-0.5">{n.title}</p>
                                                                <p className="text-[11px] text-white/35 leading-relaxed truncate">{n.message}</p>
                                                                <p className="text-[9px] text-white/15 mt-2 font-medium tracking-wide">
                                                                    {(() => {
                                                                        try {
                                                                            const date = new Date(n.createdAt);
                                                                            return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
                                                                        } catch { return 'Recently'; }
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            className="block p-3 text-center text-label text-white/25 hover:text-white/50 bg-white/[0.01] hover:bg-white/[0.03] transition-all border-t border-white/[0.04]"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View Dashboard
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-5 w-px bg-white/[0.06] hidden sm:block" />

                        {/* Auth */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <motion.button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-2 p-1 pl-3 rounded-xl hover:bg-white/[0.04] transition-all duration-300 border border-white/[0.04]"
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label="User profile menu"
                                    suppressHydrationWarning
                                >
                                    <span className="text-xs font-medium text-white/60 hidden lg:block tracking-wide">
                                        {user?.firstName}
                                    </span>
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6]/40 to-[#A5B4FC]/40 flex items-center justify-center text-white text-xs border border-white/[0.06] overflow-hidden">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={14} />
                                        )}
                                    </div>
                                </motion.button>

                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                            className="absolute top-full right-0 mt-3 w-52 rounded-2xl border border-white/[0.06] p-2 shadow-[0_25px_60px_rgba(0,0,0,0.6)] z-50 bg-[#0a0b10]/95 backdrop-blur-2xl"
                                        >
                                            <div className="px-3 py-2.5 mb-1">
                                                <p className="text-label mb-1">Account</p>
                                                <p className="text-sm font-medium text-white/80 truncate">{user?.email}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                {[
                                                    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                                    { href: '/rentals', icon: ShoppingBag, label: 'My Rentals' },
                                                    { href: '/host', icon: BarChart3, label: 'Host Dashboard' },
                                                    { href: '/wishlist', icon: Heart, label: 'Wishlist' },
                                                    { href: '/settings', icon: Settings, label: 'Settings' },
                                                ].map(item => (
                                                    <a key={item.href} href={item.href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] text-sm text-white/50 hover:text-white/90 transition-all duration-200">
                                                        <item.icon size={15} />
                                                        <span className="tracking-wide">{item.label}</span>
                                                    </a>
                                                ))}
                                                <div className="h-px bg-white/[0.04] my-1" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F472B6]/10 text-sm text-[#F472B6]/70 hover:text-[#F472B6] transition-all duration-200 font-medium"
                                                >
                                                    <LogOut size={15} /> Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link href="/login" className="hidden sm:block">
                                <LiquidButton variant="primary" size="sm">
                                    get started
                                </LiquidButton>
                            </Link>
                        )}

                        {/* Mobile Toggle */}
                        <motion.button
                            className="md:hidden p-2 text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/[0.04]"
                            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                            whileTap={{ scale: 0.9 }}
                            suppressHydrationWarning
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu — Immersive fullscreen */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        className="fixed inset-0 z-40 md:hidden bg-[#050608]/98 backdrop-blur-3xl p-6 pt-28 flex flex-col"
                    >
                        <div className="flex flex-col gap-4 mb-12">
                            {categories.map((link, i) => (
                                <motion.a
                                    key={link.name}
                                    href={link.href}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                                    className="text-3xl font-light tracking-tight text-white/70 hover:text-white transition-colors lowercase flex items-center gap-3"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="text-sm text-[#8B5CF6]/50">{link.icon}</span>
                                    {link.name}
                                </motion.a>
                            ))}
                        </div>

                        {isAuthenticated ? (
                            <motion.div
                                className="mt-auto space-y-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="text-label mb-4">logged in as {user?.firstName}</p>
                                {[
                                    { href: '/dashboard', label: 'dashboard' },
                                    { href: '/rentals', label: 'my rentals' },
                                    { href: '/host', label: 'host dashboard' },
                                    { href: '/wishlist', label: 'wishlist' },
                                    { href: '/messages', label: 'messages' },
                                ].map(item => (
                                    <a key={item.href} href={item.href} className="block text-xl font-light text-white/60 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
                                        {item.label}
                                    </a>
                                ))}
                                <button onClick={handleLogout} className="text-xl font-light text-[#F472B6]/70 hover:text-[#F472B6] transition-colors mt-4">
                                    logout
                                </button>
                            </motion.div>
                        ) : (
                            <Link href="/login" className="mt-auto" onClick={() => setMobileMenuOpen(false)}>
                                <LiquidButton variant="primary" size="lg" className="w-full text-2xl py-6 rounded-3xl">
                                    get started
                                </LiquidButton>
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Search Overlay */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute top-full left-0 right-0 px-6 py-4 pointer-events-none z-[501]"
                    >
                        <div className="max-w-2xl mx-auto pointer-events-auto">
                            <SearchBar autoFocus={showSearch} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

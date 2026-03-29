'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Search, Bell, User as UserIcon, LogOut, Trophy, LayoutDashboard, Settings, ShoppingBag, BarChart3, Home, Heart, ChevronDown, List as ListIcon, Loader2, Sparkles, MessageCircle, Map, Zap, Menu, X, MessageSquare } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

import { useNotificationStore } from '@/store/notification-store';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import LiquidButton from '@/components/motion/LiquidButton';
import NotificationCenter from '@/components/notifications/NotificationCenter';

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

                    {/* Core Logo — The "Nexis Core" */}
                    <div onMouseEnter={() => setCursorVariant('hover')} onMouseLeave={() => setCursorVariant('default')}>
                        <Logo size="md" />
                    </div>

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
                                useAppStore.getState().setCommandMenuOpen(true);
                            }}
                            className="p-2 text-white/40 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/[0.04] flex items-center gap-2"
                            onMouseEnter={() => setCursorVariant('hover')}
                            onMouseLeave={() => setCursorVariant('default')}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Open global search"
                            suppressHydrationWarning
                        >
                            <Search size={18} />
                            <span className="hidden sm:flex text-[10px] font-medium text-white/30 border border-white/10 rounded px-1.5 py-0.5 mt-0.5">⌘K</span>
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
                                    className="p-2 text-white/40 hover:text-[#cdf876] transition-all duration-300 rounded-xl hover:bg-white/[0.04] hidden sm:flex relative"
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    title="Messages"
                                    aria-label="View messages"
                                >
                                    <MessageSquare size={18} />
                                    {/* Mock notification dot for visual effect */}
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#cdf876] rounded-full border border-[#020305]" style={{ boxShadow: '0 0 8px rgba(205,248,118,0.5)' }}></span>
                                </Link>
                            </>
                        )}

                        {/* Notifications */}
                        <NotificationCenter />

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
                                                    { href: `/profile/${user?.id}`, icon: Trophy, label: 'My Profile' },
                                                    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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
                                    { href: `/profile/${user?.id}`, label: 'my profile' },
                                    { href: '/dashboard', label: 'dashboard' },
                                    { href: '/host', label: 'host dashboard' },
                                    { href: '/rentals', label: 'my rentals' },
                                    { href: '/wishlist', label: 'wishlist' },
                                    { href: '/messages', label: 'messages' },
                                    { href: '/settings', label: 'settings' },
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


        </nav>
    );
}

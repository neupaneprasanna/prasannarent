'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Bell, Heart, ShoppingBag, Settings,
    LayoutDashboard, User as UserIcon, LogOut,
    Compass, TrendingUp, HelpCircle, Trophy,
    MessageSquare, Home, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const navItems = [
    { name: 'Home', href: '/', icon: Home, color: '#8B5CF6' },
    { name: 'Explore', href: '/explore', icon: Compass, color: '#A5B4FC' },
    { name: 'Trending', href: '#trending', icon: TrendingUp, color: '#00FFB3' },
    { name: 'How it Works', href: '#how-it-works', icon: HelpCircle, color: '#00F0FF' },
];

const userMenuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#8B5CF6' },
    { href: '/rentals', icon: ShoppingBag, label: 'My Rentals', color: '#A5B4FC' },
    { href: '/wishlist', icon: Heart, label: 'Wishlist', color: '#F472B6' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', color: '#cdf876' },
    { href: '/settings', icon: Settings, label: 'Settings', color: '#94A3B8' },
];

export default function SideNav() {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const sideNavRef = useRef<HTMLDivElement>(null);

    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const { user, isAuthenticated, logout } = useAuthStore();
    const { unreadCount } = useNotificationStore();

    // Check if desktop (md breakpoint = 768px)
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // Show sidebar after scrolling past the hero section
    useEffect(() => {
        const handleScroll = () => {
            const heroHeight = window.innerHeight;
            setIsVisible(window.scrollY > heroHeight * 0.85);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check initial position
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close expanded menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sideNavRef.current && !sideNavRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

    const handleLogout = () => {
        logout();
        setIsExpanded(false);
    };

    // Don't render on mobile
    if (!isDesktop) return null;

    const sideNavContent = (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={sideNavRef}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col"
                    style={{ willChange: 'transform' }}
                >
                    {/* Main container */}
                    <motion.div
                        animate={{ width: isExpanded ? 220 : 62 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative ml-4 rounded-2xl overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(10, 11, 16, 0.55), rgba(20, 21, 30, 0.45))',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(139, 92, 246, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                        }}
                    >
                        {/* Expand/Collapse toggle */}
                        <motion.button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full flex items-center justify-center p-3 text-white/30 hover:text-white/70 transition-colors duration-300 border-b border-white/[0.04]"
                            whileTap={{ scale: 0.9 }}
                            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                <ChevronRight size={16} />
                            </motion.div>
                        </motion.button>

                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 p-3 mx-1.5 my-1 rounded-xl hover:bg-white/[0.04] transition-all duration-300 group"
                            onMouseEnter={() => setCursorVariant('hover')}
                            onMouseLeave={() => setCursorVariant('default')}
                        >
                            <Logo size="sm" showText={isExpanded} />
                        </div>

                        <div className="h-px mx-3 bg-white/[0.04]" />

                        {/* Navigation Items */}
                        <div className="py-2 px-1.5 space-y-0.5">
                            <div className="relative mb-2">
                                <button
                                    onClick={() => useAppStore.getState().setCommandMenuOpen(true)}
                                    className="w-full relative flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-300 group"
                                    onMouseEnter={() => {
                                        setCursorVariant('hover');
                                        setHoveredItem('Search');
                                        if (!isExpanded) setActiveTooltip('Search (⌘K)');
                                    }}
                                    onMouseLeave={() => {
                                        setCursorVariant('default');
                                        setHoveredItem(null);
                                        setActiveTooltip(null);
                                    }}
                                >
                                    <motion.div
                                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                                        style={{
                                            background: hoveredItem === 'Search' ? `rgba(255,255,255,0.1)` : 'transparent',
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Search size={18} className="transition-colors duration-300 text-white/50 group-hover:text-white/90" />
                                    </motion.div>
                                    
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -8 }}
                                                transition={{ duration: 0.15 }}
                                                className="flex flex-1 items-center justify-between"
                                            >
                                                <span className="text-sm font-medium whitespace-nowrap tracking-wide text-white/70 group-hover:text-white/90 transition-colors duration-300">
                                                    Search
                                                </span>
                                                <span className="text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5 shadow-sm bg-black/20">⌘K</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>

                                {/* Tooltip for Search */}
                                <AnimatePresence>
                                    {!isExpanded && activeTooltip === 'Search (⌘K)' && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -8, scale: 0.95 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 whitespace-nowrap pointer-events-none z-[60]"
                                            style={{
                                                background: 'rgba(10, 11, 16, 0.95)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                                            }}
                                        >
                                            Search <span className="text-white/50 ml-1">⌘K</span>
                                            <div
                                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                                                style={{
                                                    background: 'rgba(10, 11, 16, 0.95)',
                                                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {navItems.map((item, index) => (
                                <div key={item.name} className="relative">
                                    <Link
                                        href={item.href}
                                        className="relative flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-300 group"
                                        onMouseEnter={() => {
                                            setCursorVariant('hover');
                                            setHoveredItem(item.name);
                                            if (!isExpanded) setActiveTooltip(item.name);
                                        }}
                                        onMouseLeave={() => {
                                            setCursorVariant('default');
                                            setHoveredItem(null);
                                            setActiveTooltip(null);
                                        }}
                                    >
                                        {/* Icon */}
                                        <motion.div
                                            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                                            style={{
                                                background: hoveredItem === item.name
                                                    ? `${item.color}15`
                                                    : 'transparent',
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <item.icon
                                                size={18}
                                                className="transition-colors duration-300"
                                                style={{
                                                    color: hoveredItem === item.name
                                                        ? item.color
                                                        : 'rgba(255,255,255,0.35)'
                                                }}
                                            />
                                        </motion.div>

                                        {/* Label */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -8 }}
                                                    transition={{ duration: 0.15, delay: index * 0.03 }}
                                                    className="text-sm font-medium whitespace-nowrap tracking-wide transition-colors duration-300"
                                                    style={{
                                                        color: hoveredItem === item.name
                                                            ? 'rgba(255,255,255,0.9)'
                                                            : 'rgba(255,255,255,0.45)'
                                                    }}
                                                >
                                                    {item.name}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>

                                        {/* Hover glow line */}
                                        {hoveredItem === item.name && (
                                            <motion.div
                                                layoutId="sidenavGlow"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                                style={{
                                                    background: item.color,
                                                    boxShadow: `0 0 12px ${item.color}60`,
                                                }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </Link>

                                    {/* Tooltip (when collapsed) */}
                                    <AnimatePresence>
                                        {!isExpanded && activeTooltip === item.name && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 whitespace-nowrap pointer-events-none z-[60]"
                                                style={{
                                                    background: 'rgba(10, 11, 16, 0.95)',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                                                }}
                                            >
                                                {item.name}
                                                <div
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                                                    style={{
                                                        background: 'rgba(10, 11, 16, 0.95)',
                                                        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-px mx-3 bg-white/[0.04]" />

                        {/* User section */}
                        {isAuthenticated && (
                            <div className="py-2 px-1.5 space-y-0.5">
                                {userMenuItems.map((item, index) => (
                                    <div key={item.label} className="relative">
                                        <Link
                                            href={item.href}
                                            className="relative flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-300 group"
                                            onMouseEnter={() => {
                                                setCursorVariant('hover');
                                                setHoveredItem(item.label);
                                                if (!isExpanded) setActiveTooltip(item.label);
                                            }}
                                            onMouseLeave={() => {
                                                setCursorVariant('default');
                                                setHoveredItem(null);
                                                setActiveTooltip(null);
                                            }}
                                        >
                                            <motion.div
                                                className="relative shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                                                style={{
                                                    background: hoveredItem === item.label
                                                        ? `${item.color}15`
                                                        : 'transparent',
                                                }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <item.icon
                                                    size={17}
                                                    className="transition-colors duration-300"
                                                    style={{
                                                        color: hoveredItem === item.label
                                                            ? item.color
                                                            : 'rgba(255,255,255,0.3)'
                                                    }}
                                                />
                                                {/* Messages badge */}
                                                {item.label === 'Messages' && (
                                                    <span
                                                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#cdf876] border border-[#0a0b10]"
                                                        style={{ boxShadow: '0 0 6px rgba(205,248,118,0.5)' }}
                                                    />
                                                )}
                                            </motion.div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.span
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -8 }}
                                                        transition={{ duration: 0.15, delay: index * 0.03 }}
                                                        className="text-sm font-medium whitespace-nowrap tracking-wide transition-colors duration-300"
                                                        style={{
                                                            color: hoveredItem === item.label
                                                                ? 'rgba(255,255,255,0.9)'
                                                                : 'rgba(255,255,255,0.4)'
                                                        }}
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>

                                            {hoveredItem === item.label && (
                                                <motion.div
                                                    layoutId="sidenavGlow"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                                    style={{
                                                        background: item.color,
                                                        boxShadow: `0 0 12px ${item.color}60`,
                                                    }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                        </Link>

                                        {/* Tooltip (when collapsed) */}
                                        <AnimatePresence>
                                            {!isExpanded && activeTooltip === item.label && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -8, scale: 0.95 }}
                                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                                    exit={{ opacity: 0, x: -8, scale: 0.95 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 whitespace-nowrap pointer-events-none z-[60]"
                                                    style={{
                                                        background: 'rgba(10, 11, 16, 0.95)',
                                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                                                    }}
                                                >
                                                    {item.label}
                                                    <div
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                                                        style={{
                                                            background: 'rgba(10, 11, 16, 0.95)',
                                                            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                        }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}

                                {/* Divider */}
                                <div className="h-px mx-1.5 my-1 bg-white/[0.04]" />

                                {/* User profile */}
                                <Link
                                    href={`/profile/${user?.id}`}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-300 group"
                                    onMouseEnter={() => {
                                        setCursorVariant('hover');
                                        if (!isExpanded) setActiveTooltip('profile');
                                    }}
                                    onMouseLeave={() => {
                                        setCursorVariant('default');
                                        setActiveTooltip(null);
                                    }}
                                >
                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6]/40 to-[#A5B4FC]/40 flex items-center justify-center text-white text-xs border border-white/[0.06] overflow-hidden">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={14} />
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -8 }}
                                                transition={{ duration: 0.15 }}
                                                className="min-w-0 flex-1"
                                            >
                                                <p className="text-xs font-medium text-white/70 truncate">{user?.firstName}</p>
                                                <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Link>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full relative flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F472B6]/10 transition-all duration-300 group"
                                    onMouseEnter={() => {
                                        setCursorVariant('hover');
                                        setHoveredItem('logout');
                                        if (!isExpanded) setActiveTooltip('logout');
                                    }}
                                    onMouseLeave={() => {
                                        setCursorVariant('default');
                                        setHoveredItem(null);
                                        setActiveTooltip(null);
                                    }}
                                >
                                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
                                        <LogOut
                                            size={17}
                                            className="transition-colors duration-300"
                                            style={{
                                                color: hoveredItem === 'logout'
                                                    ? '#F472B6'
                                                    : 'rgba(244,114,182,0.4)'
                                            }}
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -8 }}
                                                transition={{ duration: 0.15 }}
                                                className="text-sm font-medium text-[#F472B6]/60 group-hover:text-[#F472B6] transition-colors whitespace-nowrap"
                                            >
                                                Logout
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {/* Tooltip (when collapsed) */}
                                    <AnimatePresence>
                                        {!isExpanded && activeTooltip === 'logout' && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F472B6] whitespace-nowrap pointer-events-none z-[60]"
                                                style={{
                                                    background: 'rgba(10, 11, 16, 0.95)',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                                                }}
                                            >
                                                Logout
                                                <div
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                                                    style={{
                                                        background: 'rgba(10, 11, 16, 0.95)',
                                                        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        )}

                        {/* Notification badge (collapsed only) */}
                        {!isExpanded && unreadCount > 0 && (
                            <div className="px-1.5 pb-2">
                                <Link
                                    href="/dashboard"
                                    className="flex items-center justify-center p-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-300 relative"
                                    onMouseEnter={() => {
                                        setCursorVariant('hover');
                                        setActiveTooltip('notifications');
                                    }}
                                    onMouseLeave={() => {
                                        setCursorVariant('default');
                                        setActiveTooltip(null);
                                    }}
                                >
                                    <Bell size={17} className="text-white/30" />
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1.5 right-2.5 w-4 h-4 bg-[#F472B6] rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-[#0a0b10]"
                                        style={{ boxShadow: '0 0 8px rgba(244,114,182,0.5)' }}
                                    >
                                        {unreadCount}
                                    </motion.span>
                                </Link>

                                <AnimatePresence>
                                    {activeTooltip === 'notifications' && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -8, scale: 0.95 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                            className="absolute left-full bottom-4 ml-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 whitespace-nowrap pointer-events-none z-[60]"
                                            style={{
                                                background: 'rgba(10, 11, 16, 0.95)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                                            }}
                                        >
                                            {unreadCount} notifications
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Subtle animated border glow at top */}
                        <motion.div
                            className="absolute top-0 left-0 right-0 h-px"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
                            }}
                            animate={{
                                opacity: [0.3, 0.7, 0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Use portal to render on body, escaping any parent transforms that break position:fixed
    if (typeof document !== 'undefined') {
        return createPortal(sideNavContent, document.body);
    }
    return null;
}

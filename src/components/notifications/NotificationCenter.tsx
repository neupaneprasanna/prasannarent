'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, Notification } from '@/store/notification-store';
import { useAuthStore } from '@/store/auth-store';
import {
    Bell, Check, CheckCheck, X, Package, MessageCircle,
    DollarSign, ShieldCheck, Star, Megaphone, Clock, Trash2,
    ChevronRight, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_CATEGORIES = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'booking', label: 'Bookings', icon: Package },
    { key: 'message', label: 'Messages', icon: MessageCircle },
    { key: 'system', label: 'System', icon: ShieldCheck },
];

function getNotificationIcon(type: string) {
    switch (type) {
        case 'BOOKING_REQUEST': return <Package size={16} className="text-[#a29bfe]" />;
        case 'BOOKING_APPROVED': return <Check size={16} className="text-emerald-400" />;
        case 'BOOKING_REJECTED': return <X size={16} className="text-red-400" />;
        case 'BOOKING_CANCELLED': return <X size={16} className="text-amber-400" />;
        case 'NEW_MESSAGE': return <MessageCircle size={16} className="text-[#00cec9]" />;
        case 'NEW_REVIEW': return <Star size={16} className="text-[#fdcb6e]" />;
        case 'LISTING_APPROVED': return <ShieldCheck size={16} className="text-emerald-400" />;
        case 'PROMOTION': return <Megaphone size={16} className="text-[#f472b6]" />;
        default: return <Bell size={16} className="text-white/40" />;
    }
}

function getNotificationCategory(type: string): string {
    if (type.includes('BOOKING')) return 'booking';
    if (type.includes('MESSAGE')) return 'message';
    return 'system';
}

function getNotificationLink(notification: Notification): string | null {
    const type = notification.type;
    if (type.includes('BOOKING')) return '/host';
    if (type.includes('MESSAGE')) return '/messages';
    if (type === 'NEW_REVIEW') return '/settings';
    return null;
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const panelRef = useRef<HTMLDivElement>(null);
    const bellRef = useRef<HTMLButtonElement>(null);

    const { isAuthenticated } = useAuthStore();
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotificationStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            // Poll every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                panelRef.current && !panelRef.current.contains(e.target as Node) &&
                bellRef.current && !bellRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const filteredNotifications = activeCategory === 'all'
        ? notifications
        : notifications.filter(n => getNotificationCategory(n.type) === activeCategory);

    // Group by time
    const today: Notification[] = [];
    const earlier: Notification[] = [];
    const now = new Date();

    filteredNotifications.forEach(n => {
        const diff = now.getTime() - new Date(n.createdAt).getTime();
        if (diff < 24 * 60 * 60 * 1000) today.push(n);
        else earlier.push(n);
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        const link = getNotificationLink(notification);
        if (link) {
            setIsOpen(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                ref={bellRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-white/5 transition-all group"
                aria-label="Notifications"
            >
                <Bell size={20} className={`transition-colors ${isOpen ? 'text-[#a29bfe]' : 'text-white/50 group-hover:text-white/80'}`} />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#6c5ce7] flex items-center justify-center"
                        >
                            <span className="text-[9px] font-bold text-white px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Pulse ring */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#6c5ce7] animate-ping opacity-30" />
                )}
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute right-0 top-[calc(100%+8px)] w-[380px] max-w-[calc(100vw-24px)] bg-[#0c0c14]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-[100]"
                    >
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Bell size={16} className="text-[#a29bfe]" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] px-2 py-0.5 bg-[#6c5ce7]/20 text-[#a29bfe] rounded-full font-bold">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllAsRead()}
                                        className="flex items-center gap-1 text-[10px] text-[#a29bfe] hover:text-white font-medium transition-colors"
                                    >
                                        <CheckCheck size={12} /> Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Category Tabs */}
                            <div className="flex gap-1">
                                {NOTIFICATION_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.key}
                                        onClick={() => setActiveCategory(cat.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                                            activeCategory === cat.key
                                                ? 'bg-[#6c5ce7]/15 text-[#a29bfe] border border-[#6c5ce7]/25'
                                                : 'text-white/35 hover:text-white/60 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        <cat.icon size={11} />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto overscroll-contain px-2 pb-2">
                            {filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Bell size={32} className="text-white/8 mb-3" />
                                    <p className="text-xs text-white/30 font-medium">No notifications yet</p>
                                    <p className="text-[10px] text-white/15 mt-1">We'll notify you when something happens</p>
                                </div>
                            ) : (
                                <>
                                    {today.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-[9px] text-white/25 font-bold uppercase tracking-[0.15em] px-3 py-2">Today</p>
                                            {today.map(n => (
                                                <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                                            ))}
                                        </div>
                                    )}
                                    {earlier.length > 0 && (
                                        <div>
                                            <p className="text-[9px] text-white/25 font-bold uppercase tracking-[0.15em] px-3 py-2">Earlier</p>
                                            {earlier.map(n => (
                                                <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NotificationItem({ notification, onClick }: { notification: Notification; onClick: (n: Notification) => void }) {
    const link = getNotificationLink(notification);
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    const content = (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all group ${
                notification.read
                    ? 'hover:bg-white/[0.03]'
                    : 'bg-[#6c5ce7]/[0.06] hover:bg-[#6c5ce7]/[0.1] border-l-2 border-[#6c5ce7]/40'
            }`}
            onClick={() => onClick(notification)}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                notification.read ? 'bg-white/5' : 'bg-[#6c5ce7]/10'
            }`}>
                {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-tight mb-0.5 ${
                    notification.read ? 'text-white/50' : 'text-white/90'
                }`}>
                    {notification.title}
                </p>
                <p className={`text-[10px] leading-relaxed line-clamp-2 ${
                    notification.read ? 'text-white/25' : 'text-white/45'
                }`}>
                    {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-white/20 flex items-center gap-1">
                        <Clock size={9} /> {timeAgo}
                    </span>
                    {!notification.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7]" />
                    )}
                </div>
            </div>
            {link && (
                <ChevronRight size={14} className="text-white/10 group-hover:text-white/30 flex-shrink-0 mt-1 transition-colors" />
            )}
        </motion.div>
    );

    if (link) {
        return <Link href={link} style={{ textDecoration: 'none' }}>{content}</Link>;
    }
    return content;
}

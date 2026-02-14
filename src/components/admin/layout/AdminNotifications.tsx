'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { adminSpring } from '@/lib/admin/admin-motion';

// Mock Notification Data
const initialNotifications = [
    { id: 1, type: 'warning', title: 'High Server Load', message: 'CPU usage exceeded 85% on US-East region.', time: '2m ago', read: false },
    { id: 2, type: 'success', title: 'New Booking', message: 'User "Alice" booked "Sunset Villa" for $1,200.', time: '15m ago', read: false },
    { id: 3, type: 'info', title: 'System Update', message: 'Platform maintenance scheduled for 2:00 AM UTC.', time: '1h ago', read: true },
    { id: 4, type: 'error', title: 'Payment Failed', message: 'Transaction #TX-992 failed. Gateway timeout.', time: '3h ago', read: true },
    { id: 5, type: 'info', title: 'New User Registration', message: '12 new users joined in the last hour.', time: '4h ago', read: true },
];

interface AdminNotificationsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState(initialNotifications);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={16} className="text-[var(--admin-success)]" />;
            case 'warning': return <AlertTriangle size={16} className="text-[var(--admin-warning)]" />;
            case 'error': return <AlertOctagon size={16} className="text-[var(--admin-danger)]" />;
            default: return <Info size={16} className="text-[var(--admin-info)]" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={adminSpring}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--admin-surface)] border-l border-[var(--admin-border)] shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface)]/80 backdrop-blur-xl sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <Bell size={18} className="text-[var(--admin-accent)]" />
                                <h2 className="text-sm font-bold text-[var(--admin-text-primary)] uppercase tracking-wider">Notifications</h2>
                                <span className="bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={markAllRead}
                                    title="Mark all as read"
                                    className="p-1.5 rounded-lg text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface-hover)] transition-all"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={clearAll}
                                    title="Clear all"
                                    className="p-1.5 rounded-lg text-[var(--admin-text-tertiary)] hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger)]/10 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface-hover)] transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin admin-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <motion.div
                                            key={n.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className={`p-3 rounded-xl border transition-all relative group ${n.read
                                                ? 'bg-[var(--admin-glass)] border-[var(--admin-border)]'
                                                : 'bg-[var(--admin-surface-active)] border-[var(--admin-accent)]/20'
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-0.5 p-1.5 rounded-lg bg-[var(--admin-surface)] border border-[var(--admin-border)] h-fit`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className={`text-sm font-bold ${n.read ? 'text-[var(--admin-text-secondary)]' : 'text-[var(--admin-text-primary)]'}`}>
                                                            {n.title}
                                                        </h4>
                                                        <span className="text-[10px] text-[var(--admin-text-tertiary)] whitespace-nowrap">{n.time}</span>
                                                    </div>
                                                    <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5 leading-relaxed">
                                                        {n.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Delete Action */}
                                            <button
                                                onClick={() => deleteNotification(n.id)}
                                                className="absolute top-2 right-2 p-1 rounded-md text-[var(--admin-text-tertiary)] hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger)]/10 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-12 text-[var(--admin-text-muted)] text-center"
                                    >
                                        <Bell size={32} className="mb-3 opacity-20" />
                                        <p className="text-sm font-medium">All caught up!</p>
                                        <p className="text-xs">No new notifications.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

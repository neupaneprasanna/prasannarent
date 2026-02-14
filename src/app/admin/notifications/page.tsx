'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Mail,
    Send,
    Trash2,
    Check,
    CheckCircle2,
    AlertTriangle,
    AlertOctagon,
    Info,
    Search,
    Filter,
    Megaphone,
    Users,
    Clock,
    Plus
} from 'lucide-react';
import { useAdminNotificationsStore, AdminNotification } from '@/store/admin/admin-notifications-store';

export default function NotificationsPage() {
    const {
        notifications, announcements,
        markAsRead, markAllAsRead, deleteNotification, clearAllNotifications, createAnnouncement, deleteAnnouncement
    } = useAdminNotificationsStore();

    const [activeTab, setActiveTab] = useState<'inbox' | 'announcements'>('inbox');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Announcement Form State
    const [isComposing, setIsComposing] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState('all');
    const [sending, setSending] = useState(false);

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={18} className="text-[var(--admin-success)]" />;
            case 'warning': return <AlertTriangle size={18} className="text-[var(--admin-warning)]" />;
            case 'error': return <AlertOctagon size={18} className="text-[var(--admin-danger)]" />;
            default: return <Info size={18} className="text-[var(--admin-info)]" />;
        }
    };

    const handleSendAnnouncement = () => {
        if (!subject || !message) return;
        setSending(true);
        setTimeout(() => {
            createAnnouncement({
                subject,
                message,
                targetAudience: audience as any,
                status: 'sent'
            });
            setSending(false);
            setIsComposing(false);
            setSubject('');
            setMessage('');
        }, 1500);
    };

    // ─── Filtering ───────────────────────────────────────────────────────────────

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' || n.category === filter || (filter === 'unread' && !n.read);
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] tracking-tight flex items-center gap-3">
                        <Bell className="text-[var(--admin-accent)]" />
                        Communications Center
                    </h1>
                    <p className="text-sm text-[var(--admin-text-tertiary)] mt-1">
                        Manage system alerts and broadcast announcements to users.
                    </p>
                </div>
                <div className="flex gap-2 bg-[var(--admin-surface)] p-1 rounded-xl border border-[var(--admin-border)]">
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inbox'
                                ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)] shadow-sm'
                                : 'text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-secondary)]'
                            }`}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'announcements'
                                ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)] shadow-sm'
                                : 'text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-secondary)]'
                            }`}
                    >
                        Announcements
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden flex flex-col md:flex-row">

                {/* ─── Inbox View ─── */}
                {activeTab === 'inbox' && (
                    <>
                        {/* Sidebar Filters */}
                        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--admin-border)] p-4 flex flex-col gap-2 bg-[var(--admin-bg)]/50">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-tertiary)]" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[var(--admin-accent)]"
                                />
                            </div>

                            <button onClick={() => setFilter('all')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'}`}>All Notifications</button>
                            <button onClick={() => setFilter('unread')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'}`}>Unread</button>
                            <div className="h-px bg-[var(--admin-border)] my-1" />
                            <button onClick={() => setFilter('system')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'system' ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'}`}>System Alerts</button>
                            <button onClick={() => setFilter('booking')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'booking' ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'}`}>Bookings</button>
                            <button onClick={() => setFilter('payment')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'payment' ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'}`}>Payments</button>
                            <button onClick={() => setFilter('security')} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'security' ? 'bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)]'}`}>Security</button>

                            <div className="mt-auto">
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface)] transition-colors"
                                >
                                    <Check size={14} /> Mark all read
                                </button>
                                <button
                                    onClick={clearAllNotifications}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold text-[var(--admin-danger)] hover:bg-[var(--admin-danger)]/10 transition-colors"
                                >
                                    <Trash2 size={14} /> Clear all
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin admin-scrollbar bg-[var(--admin-bg)]">
                            <AnimatePresence mode="popLayout">
                                {filteredNotifications.length > 0 ? (
                                    filteredNotifications.map((n) => (
                                        <motion.div
                                            key={n.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`p-4 rounded-xl border transition-all flex gap-4 group ${n.read
                                                    ? 'bg-[var(--admin-surface)] border-[var(--admin-border)]'
                                                    : 'bg-[var(--admin-surface-active)] border-[var(--admin-accent)]/30 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.2)]'
                                                }`}
                                        >
                                            <div className="mt-1">{getIcon(n.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`text-sm font-bold ${n.read ? 'text-[var(--admin-text-secondary)]' : 'text-[var(--admin-text-primary)]'}`}>{n.title}</h4>
                                                    <span className="text-xs text-[var(--admin-text-tertiary)] font-mono">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-sm text-[var(--admin-text-secondary)] mt-1">{n.message}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] uppercase font-bold text-[var(--admin-text-tertiary)] bg-[var(--admin-glass)] px-1.5 py-0.5 rounded tracking-wide">{n.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.read && (
                                                    <button onClick={() => markAsRead(n.id)} className="p-1.5 rounded hover:bg-[var(--admin-border)] text-[var(--admin-text-secondary)]" title="Mark read">
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteNotification(n.id)} className="p-1.5 rounded hover:bg-[var(--admin-danger)]/10 text-[var(--admin-text-secondary)] hover:text-[var(--admin-danger)]" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--admin-text-muted)]">
                                        <Bell size={48} className="mb-4 opacity-20" />
                                        <p className="font-medium">No notifications found.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                {/* ─── Announcements View ─── */}
                {activeTab === 'announcements' && (
                    <div className="flex-1 flex flex-col p-6 bg-[var(--admin-bg)]">
                        {!isComposing ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Announcement History</h2>
                                    <button
                                        onClick={() => setIsComposing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-accent)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--admin-accent)]/20 hover:brightness-110 transition-all"
                                    >
                                        <Plus size={16} /> New Announcement
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {announcements.length > 0 ? (
                                        announcements.map((a) => (
                                            <div key={a.id} className="p-5 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex gap-4">
                                                <div className="w-12 h-12 rounded-full bg-[var(--admin-surface-active)] flex items-center justify-center flex-shrink-0">
                                                    <Megaphone size={20} className="text-[var(--admin-text-secondary)]" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-[var(--admin-text-primary)]">{a.subject}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-[var(--admin-text-tertiary)]">{new Date(a.sentAt).toLocaleDateString()}</span>
                                                            <button onClick={() => deleteAnnouncement(a.id)} className="text-[var(--admin-text-tertiary)] hover:text-[var(--admin-danger)] transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-[var(--admin-text-secondary)] mt-1 line-clamp-2">{a.message}</p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[var(--admin-text-tertiary)] tracking-wider">
                                                            <Users size={12} /> {a.targetAudience}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[var(--admin-success)] tracking-wider">
                                                            <CheckCircle2 size={12} /> Sent
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed border-[var(--admin-border)] rounded-2xl">
                                            <p className="text-[var(--admin-text-tertiary)] text-sm">No announcements sent yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto w-full space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-[var(--admin-text-primary)]">Compose Announcement</h2>
                                    <button onClick={() => setIsComposing(false)} className="text-sm text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)]">Cancel</button>
                                </div>

                                <div className="space-y-4 p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">Target Audience</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['all', 'hosts', 'guests'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setAudience(opt)}
                                                    className={`py-2 rounded-lg text-sm font-medium border transition-all uppercase tracking-wide ${audience === opt
                                                            ? 'bg-[var(--admin-accent)]/10 border-[var(--admin-accent)] text-[var(--admin-accent)]'
                                                            : 'bg-[var(--admin-bg)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:border-[var(--admin-text-tertiary)]'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">Subject</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl px-4 py-2 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
                                            placeholder="Important Update..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase">Message</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full h-40 bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl p-4 text-sm text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)] resize-none"
                                            placeholder="Write your announcement here..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleSendAnnouncement}
                                        disabled={sending || !subject || !message}
                                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all ${sending
                                                ? 'bg-[var(--admin-surface-active)] cursor-wait'
                                                : 'bg-[var(--admin-accent)] hover:brightness-110 shadow-lg shadow-[var(--admin-accent)]/20'
                                            }`}
                                    >
                                        {sending ? (
                                            <>Converting to Email...</>
                                        ) : (
                                            <>
                                                <Send size={16} /> Broadcast Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

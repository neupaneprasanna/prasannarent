'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, User, CreditCard, Building2, ShieldAlert, FileText } from 'lucide-react';
import { adminSpring } from '@/lib/admin/admin-motion';

// Mock Activity Data (eventually from WebSocket)
const activities = [
    { id: 1, type: 'user', message: 'New user registration: @john_doe', time: 'Just now', user: 'JD' },
    { id: 2, type: 'booking', message: 'Booking #BK-492 confirmed ($450)', time: '2m ago', user: 'AL' },
    { id: 3, type: 'listing', message: 'Listing "Modern Loft" updated', time: '5m ago', user: 'MK' },
    { id: 4, type: 'payment', message: 'Payout processed for user @sarah_j', time: '12m ago', user: 'SJ' },
    { id: 5, type: 'system', message: 'Database backup completed', time: '1h ago', user: 'SYS' },
];

export const AdminActivityStream: React.FC = () => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'user': return <User size={12} className="text-blue-400" />;
            case 'booking': return <CreditCard size={12} className="text-emerald-400" />;
            case 'listing': return <Building2 size={12} className="text-orange-400" />;
            case 'system': return <ShieldAlert size={12} className="text-purple-400" />;
            default: return <FileText size={12} className="text-cyan-400" />;
        }
    };

    return (
        <div className="bg-[var(--admin-surface)] border-l border-[var(--admin-border)] w-[280px] hidden xl:flex flex-col h-screen sticky top-0 right-0 z-30">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--admin-border)]">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[var(--admin-accent)]" />
                    <h3 className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-widest">Live Feed</h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-[var(--admin-success)] animate-pulse shadow-[0_0_8px_var(--admin-success)]" />
            </div>

            {/* Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin admin-scrollbar">
                <div className="relative border-l border-[var(--admin-border)] ml-3 pl-6 space-y-6">
                    {activities.map((activity, idx) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1, ...adminSpring }}
                            className="relative group"
                        >
                            {/* Timeline Dot */}
                            <div className="absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] group-hover:bg-[var(--admin-accent)] group-hover:border-[var(--admin-accent-glow)] transition-colors z-10" />

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--admin-text-tertiary)] font-mono">{activity.time}</span>
                                <p className="text-xs text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)] transition-colors leading-relaxed">
                                    {activity.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-4 h-4 rounded bg-[var(--admin-glass)] flex items-center justify-center border border-[var(--admin-border)]">
                                        {getIcon(activity.type)}
                                    </div>
                                    <span className="text-[10px] font-bold text-[var(--admin-text-tertiary)] uppercase">{activity.type}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer Status */}
            <div className="p-3 border-t border-[var(--admin-border)] bg-[var(--admin-glass)] text-center">
                <p className="text-[10px] text-[var(--admin-text-tertiary)]">
                    System Health: <span className="text-[var(--admin-success)] font-bold">99.9% Uptime</span>
                </p>
            </div>
        </div>
    );
};

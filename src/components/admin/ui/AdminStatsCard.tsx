'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease' | 'neutral';
    icon: LucideIcon;
    description?: string;
    loading?: boolean;
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    description,
    loading = false
}) => {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="admin-glass-card rounded-2xl p-5 relative overflow-hidden group admin-hover-lift"
        >
            {/* Background Glow */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--admin-accent)]/5 rounded-full blur-2xl group-hover:bg-[var(--admin-accent)]/10 transition-colors duration-500" />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="admin-label mb-1">
                        {title}
                    </p>
                    {loading ? (
                        <div className="h-8 w-24 bg-white/5 animate-pulse rounded-md" />
                    ) : (
                        <h3 className="text-2xl font-bold text-[var(--admin-text-primary)] tracking-tight font-display">
                            {value}
                        </h3>
                    )}
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[var(--admin-accent)] group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {change !== undefined && (
                    <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${changeType === 'increase' ? 'bg-emerald-500/10 text-emerald-400' :
                        changeType === 'decrease' ? 'bg-red-500/10 text-red-400' :
                            'bg-white/5 text-white/40'
                        }`}>
                        {changeType === 'increase' ? <TrendingUp size={12} /> :
                            changeType === 'decrease' ? <TrendingDown size={12} /> : null}
                        {change > 0 ? '+' : ''}{change}%
                    </div>
                )}

                {description && (
                    <span className="text-xs text-[var(--admin-text-tertiary)] truncate">
                        {description}
                    </span>
                )}
            </div>

            {/* Subtle border shine effect */}
            <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
        </motion.div>
    );
};

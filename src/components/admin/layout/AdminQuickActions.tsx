'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserPlus, CreditCard, AlertTriangle, Power, Zap } from 'lucide-react';
import { adminSpring, adminScaleIn } from '@/lib/admin/admin-motion';

interface AdminQuickActionsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({ isOpen, onClose }) => {
    const actions = [
        { label: 'Create User', icon: UserPlus, color: 'text-blue-400', shortcut: 'U' },
        { label: 'New Listing', icon: Plus, color: 'text-emerald-400', shortcut: 'L' },
        { label: 'Process Refund', icon: CreditCard, color: 'text-purple-400', shortcut: 'R' },
        { label: 'System Alert', icon: AlertTriangle, color: 'text-orange-400', shortcut: 'A' },
        { label: 'Clear Cache', icon: Zap, color: 'text-yellow-400', shortcut: 'C' },
        { label: 'Maintenance', icon: Power, color: 'text-red-400', shortcut: 'M' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Invisible Backdrop to close on click outside */}
                    <div className="fixed inset-0 z-40" onClick={onClose} />

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={adminScaleIn}
                        className="absolute top-16 right-4 w-64 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-3 border-b border-[var(--admin-border)] bg-[var(--admin-glass)]">
                            <h3 className="text-[10px] font-bold text-[var(--admin-text-tertiary)] uppercase tracking-widest">Quick Actions</h3>
                        </div>
                        <div className="p-2 space-y-1">
                            {actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {

                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--admin-surface-hover)] group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md bg-[var(--admin-glass)] border border-[var(--admin-border)] ${action.color} group-hover:scale-110 transition-transform`}>
                                            <action.icon size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)]">
                                            {action.label}
                                        </span>
                                    </div>
                                    <kbd className="hidden group-hover:inline-block text-[10px] font-mono text-[var(--admin-text-tertiary)] bg-[var(--admin-surface)] px-1.5 py-0.5 rounded border border-[var(--admin-border)]">
                                        ⌘{action.shortcut}
                                    </kbd>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

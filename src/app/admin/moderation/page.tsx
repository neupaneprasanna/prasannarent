'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, AlertOctagon, FileText, User } from 'lucide-react';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { toast } from 'sonner';

interface ModerationItem {
    id: string;
    targetType: 'Listing' | 'Review' | 'User';
    targetId: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    reviewer?: {
        firstName: string;
        lastName: string;
    };
}

export default function ModerationPage() {
    const { token } = useAdminAuthStore();
    const [items, setItems] = useState<ModerationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/moderation/queue?status=PENDING`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch moderation queue', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/moderation/queue/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ note: `Auto-${action} via Admin Dashboard` })
            });

            if (res.ok) {
                toast.success(`Item ${action}ed successfully`);
                setItems(prev => prev.filter(i => i.id !== id));
            } else {
                toast.error(`Failed to ${action} item`);
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [token]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Listing': return <FileText className="w-4 h-4" />;
            case 'User': return <User className="w-4 h-4" />;
            default: return <AlertOctagon className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">Moderation Queue</h1>
                    <p className="text-[var(--admin-text-secondary)]">Review flagged content and approvals</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[var(--admin-surface)] border border-[var(--admin-border)] text-sm text-[var(--admin-text-secondary)]">
                        Pending: <strong className="text-white">{items.length}</strong>
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--admin-text-tertiary)] bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)]">
                    <Shield className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm">No items in the moderation queue.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] hover:border-[var(--admin-border-hover)] transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg bg-[var(--admin-surface-active)] text-[var(--admin-text-primary)]`}>
                                    {getTypeIcon(item.targetType)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white text-sm">
                                            {item.targetType} #{item.targetId.substring(0, 8)}
                                        </h3>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(item.priority)}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--admin-text-secondary)]">
                                        Reason: <span className="text-[var(--admin-text-primary)]">{item.reason}</span>
                                    </p>
                                    <p className="text-xs text-[var(--admin-text-tertiary)] mt-1">
                                        Flagged on {new Date(item.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                                <button
                                    onClick={() => handleAction(item.id, 'reject')}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(item.id, 'approve')}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    <Check className="w-3 h-3" />
                                    Approve
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

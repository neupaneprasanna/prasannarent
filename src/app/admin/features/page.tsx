'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ToggleRight, ToggleLeft, Settings, Users, Percent } from 'lucide-react';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { toast } from 'sonner';

interface FeatureFlag {
    id: string;
    key: string;
    description: string;
    enabled: boolean;
    rollout: number; // 0-100%
}

export default function FeaturesPage() {
    const { token } = useAdminAuthStore();
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFlags = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/features/flags`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFlags(data.flags);
            }
        } catch (error) {
            console.error('Failed to fetch feature flags', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFlag = async (id: string, currentState: boolean) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/features/flags/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ enabled: !currentState })
            });

            if (res.ok) {
                toast.success(`Feature ${!currentState ? 'enabled' : 'disabled'}`);
                setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !currentState } : f));
            } else {
                toast.error('Failed to update feature');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    useEffect(() => {
        fetchFlags();
    }, [token]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">Feature Management</h1>
                    <p className="text-[var(--admin-text-secondary)]">Control feature rollouts and experiments</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : flags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--admin-text-tertiary)] bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)]">
                    <Settings className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">No feature flags found</p>
                    <p className="text-sm">Create flags in the database configuration.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flags.map((flag) => (
                        <motion.div
                            key={flag.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-6 rounded-xl border transition-all ${flag.enabled
                                    ? 'bg-[var(--admin-surface)] border-[var(--admin-success)]/30 shadow-[0_0_20px_-10px_var(--admin-success)]'
                                    : 'bg-[var(--admin-surface)] border-[var(--admin-border)] opacity-80'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-lg ${flag.enabled ? 'bg-[var(--admin-success)]/10 text-[var(--admin-success)]' : 'bg-[var(--admin-surface-active)] text-[var(--admin-text-tertiary)]'}`}>
                                    {flag.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                </div>
                                <button
                                    onClick={() => toggleFlag(flag.id, flag.enabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? 'bg-[var(--admin-success)]' : 'bg-[var(--admin-surface-active)]'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">{flag.key.replace(/_/g, ' ')}</h3>
                            <p className="text-sm text-[var(--admin-text-secondary)] mb-6 h-10 overflow-hidden">{flag.description}</p>

                            <div className="flex items-center gap-4 pt-4 border-t border-[var(--admin-border)]">
                                <div className="flex items-center gap-2 text-xs text-[var(--admin-text-tertiary)]">
                                    <Users className="w-3 h-3" />
                                    <span>Target: All Users</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[var(--admin-text-tertiary)] ml-auto">
                                    <Percent className="w-3 h-3" />
                                    <span>Rollout: {flag.rollout}%</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

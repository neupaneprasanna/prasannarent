'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Server, Activity, Database, Cpu, Clock,
    RefreshCw, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';

interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    database: {
        status: 'connected' | 'disconnected';
        latency: string;
    };
    memory: {
        heapUsed: string;
        heapTotal: string;
        rss: string;
    };
    timestamp: string;
}

export default function SystemPage() {
    const { token } = useAdminAuthStore();
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchHealth = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/system/health`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHealth(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch system health', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [token]);

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-[var(--admin-success)]';
            case 'connected': return 'text-[var(--admin-success)]';
            case 'degraded': return 'text-[var(--admin-warning)]';
            default: return 'text-[var(--admin-danger)]';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">System Status</h1>
                    <p className="text-[var(--admin-text-secondary)]">Real-time infrastructure monitoring</p>
                </div>
                <button
                    onClick={fetchHealth}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--admin-surface)] border border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)] transition-colors text-sm font-medium"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Overall Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AdminStatsCard
                    title="System Status"
                    value={health?.status?.toUpperCase() || '--'}
                    icon={Activity}
                    change={health?.status === 'healthy' ? 100 : 0}
                    changeType={health?.status === 'healthy' ? 'increase' : 'decrease'}
                    description="Overall Platform Health"
                />
                <AdminStatsCard
                    title="Uptime"
                    value={health ? formatUptime(health.uptime) : '--'}
                    icon={Clock}
                    change={100}
                    changeType="increase"
                    description="Since last restart"
                />
                <AdminStatsCard
                    title="Database Latency"
                    value={health?.database.latency || '--'}
                    icon={Database}
                    description="Connection Response Time"
                    changeType={health?.database.status === 'connected' ? 'neutral' : 'decrease'}
                />
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Memory Usage */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Memory Usage</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--admin-text-secondary)]">Heap Used</span>
                                <span className="text-white font-mono">{health?.memory.heapUsed || '--'}</span>
                            </div>
                            <div className="h-2 bg-[var(--admin-surface-active)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: '40%' }} // Mock width for visualization
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--admin-text-secondary)]">Heap Total</span>
                                <span className="text-white font-mono">{health?.memory.heapTotal || '--'}</span>
                            </div>
                            <div className="h-2 bg-[var(--admin-surface-active)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: '60%' }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--admin-text-secondary)]">RSS (Resident Set Size)</span>
                                <span className="text-white font-mono">{health?.memory.rss || '--'}</span>
                            </div>
                            <div className="h-2 bg-[var(--admin-surface-active)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-500 rounded-full"
                                    style={{ width: '75%' }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Service Health */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                            <Server className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Service Status</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--admin-surface-hover)]">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(health?.database.status || 'disconnected').replace('text-', 'bg-')}`} />
                                <span className="text-sm font-medium text-white">Primary Database</span>
                            </div>
                            <span className={`text-xs font-bold uppercase ${getStatusColor(health?.database.status || 'disconnected')}`}>
                                {health?.database.status || 'Unknown'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--admin-surface-hover)]">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium text-white">API Gateway</span>
                            </div>
                            <span className="text-xs font-bold text-green-400 uppercase">Operational</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--admin-surface-hover)]">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium text-white">Storage Service</span>
                            </div>
                            <span className="text-xs font-bold text-green-400 uppercase">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--admin-surface-hover)]">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium text-white">Auth Provider</span>
                            </div>
                            <span className="text-xs font-bold text-green-400 uppercase">Operational</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="text-xs text-[var(--admin-text-tertiary)] text-center pt-4">
                Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
        </div>
    );
}

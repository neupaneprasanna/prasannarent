'use client';

import React, { useEffect, useState } from 'react';
import {
    Shield,
    Search,
    Filter,
    Download,
    AlertTriangle,
    CheckCircle2,
    Info,
    User,
    FileText,
    Settings,
    Database,
    Lock
} from 'lucide-react';
import { useAdminDashboardStore } from '@/store/admin/admin-dashboard-store';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';
import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminActivityEvent } from '@/types/admin';

export default function AuditLogPage() {
    const { token } = useAdminAuthStore();
    const { activityFeed, fetchActivity, loading } = useAdminDashboardStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

    useEffect(() => {
        if (token) {
            // Fetch a larger set for the audit page
            fetchActivity(token, 100);
        }
    }, [token, fetchActivity]);

    // Client-side filtering
    const filtereddata = activityFeed.filter(item => {
        const matchesSearch =
            item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.details?.toString().toLowerCase().includes(searchTerm.toLowerCase());

        const matchesModule = selectedModule === 'all' || item.module === selectedModule;
        const matchesSeverity = selectedSeverity === 'all' || item.severity === selectedSeverity;

        return matchesSearch && matchesModule && matchesSeverity;
    });

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle size={14} className="text-red-400" />;
            case 'warning': return <AlertTriangle size={14} className="text-orange-400" />;
            default: return <Info size={14} className="text-blue-400" />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        const styles = {
            critical: 'bg-red-500/10 text-red-400 border-red-500/20',
            warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
        return (
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${styles[severity as keyof typeof styles] || styles.info}`}>
                {getSeverityIcon(severity)}
                {severity}
            </span>
        );
    };

    const columns = [
        {
            header: 'Timestamp',
            accessorKey: 'timestamp',
            cell: (item: AdminActivityEvent) => (
                <div className="flex flex-col">
                    <span className="text-sm text-[var(--admin-text-primary)] font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-[var(--admin-text-tertiary)] font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                </div>
            )
        },
        {
            header: 'Admin User',
            accessorKey: 'adminName',
            cell: (item: AdminActivityEvent) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--admin-surface-active)] flex items-center justify-center text-[10px] font-bold text-[var(--admin-text-secondary)]">
                        {item.adminName.charAt(0)}
                    </div>
                    <span className="text-sm text-[var(--admin-text-secondary)]">{item.adminName}</span>
                </div>
            )
        },
        {
            header: 'Module',
            accessorKey: 'module',
            cell: (item: AdminActivityEvent) => (
                <span className="px-2 py-1 rounded-md bg-[var(--admin-surface-active)] text-[10px] font-mono text-[var(--admin-text-tertiary)] uppercase">
                    {item.module}
                </span>
            )
        },
        {
            header: 'Action',
            accessorKey: 'action',
            cell: (item: AdminActivityEvent) => (
                <div className="max-w-[300px]">
                    <p className="text-sm font-medium text-[var(--admin-text-primary)] truncate" title={item.action}>
                        {item.action}
                    </p>
                    {item.details && (
                        <p className="text-[10px] text-[var(--admin-text-tertiary)] truncate mt-0.5">
                            ID: {item.id.slice(-8)}
                        </p>
                    )}
                </div>
            )
        },
        {
            header: 'Severity',
            accessorKey: 'severity',
            cell: (item: AdminActivityEvent) => getSeverityBadge(item.severity)
        }
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] tracking-tight flex items-center gap-3">
                        <Shield className="text-[var(--admin-accent)]" />
                        System Audit Log
                    </h1>
                    <p className="text-sm text-[var(--admin-text-tertiary)] mt-1">
                        Track all administrative actions, system events, and security alerts.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl text-sm font-bold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border-hover)] transition-all">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                <div className="flex-1 min-w-[240px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-tertiary)]" size={16} />
                    <input
                        type="text"
                        placeholder="Search actions, admins, or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl py-2 pl-10 pr-4 text-sm text-[var(--admin-text-primary)] placeholder-[var(--admin-text-tertiary)] focus:outline-none focus:border-[var(--admin-accent)] transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-[var(--admin-text-tertiary)]" />
                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl py-2 px-3 text-sm text-[var(--admin-text-secondary)] focus:outline-none focus:border-[var(--admin-accent)]"
                    >
                        <option value="all">All Modules</option>
                        <option value="users">Users</option>
                        <option value="listings">Listings</option>
                        <option value="bookings">Bookings</option>
                        <option value="system">System</option>
                        <option value="auth">Auth</option>
                    </select>

                    <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                        className="bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-xl py-2 px-3 text-sm text-[var(--admin-text-secondary)] focus:outline-none focus:border-[var(--admin-accent)]"
                    >
                        <option value="all">All Severities</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
            </div>

            {/* Content using AdminTable */}
            <AdminTable
                data={filtereddata}
                columns={columns}
                loading={loading}
                total={filtereddata.length}
                page={1}
                pageSize={100}
                onPageChange={() => { }}
                onSearchChange={() => { }}
                searchPlaceholder="Search..."
                hideSearch // we use custom search above
            />
        </div>
    );
}

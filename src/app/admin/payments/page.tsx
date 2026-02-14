'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, Search } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';
import { AdminTable } from '@/components/admin/ui/AdminTable';

// Mock Transaction Data
const mockTransactions = [
    { id: 'TRX-9982', user: 'Alice Smith', type: 'Payment', amount: 450.00, status: 'Completed', date: '2025-10-24' },
    { id: 'TRX-9983', user: 'Bob Jones', type: 'Refund', amount: -120.50, status: 'Processed', date: '2025-10-23' },
    { id: 'TRX-9984', user: 'Charlie Day', type: 'Payout', amount: -2400.00, status: 'Pending', date: '2025-10-23' },
    { id: 'TRX-9985', user: 'Diana Prince', type: 'Payment', amount: 890.00, status: 'Completed', date: '2025-10-22' },
    { id: 'TRX-9986', user: 'Evan Wright', type: 'Payment', amount: 120.00, status: 'Failed', date: '2025-10-22' },
];

export default function PaymentsPage() {
    const [search, setSearch] = useState('');

    const filteredTransactions = mockTransactions.filter(t =>
        t.user.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-500/10 text-green-400 border border-green-500/20';
            case 'Processed': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'Pending': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'Failed': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            default: return 'bg-[var(--admin-surface-active)] text-[var(--admin-text-secondary)]';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">Financial Center</h1>
                    <p className="text-[var(--admin-text-secondary)]">Monitor payments, refunds, and payouts</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 rounded-lg bg-[var(--admin-accent)] text-white text-sm font-bold hover:bg-[var(--admin-accent)]/80 transition-colors">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatsCard
                    title="Net Volume"
                    value="$842,300"
                    icon={Wallet}
                    change={14}
                    changeType="increase"
                    description="Total processed volume"
                />
                <AdminStatsCard
                    title="Active Subscriptions"
                    value="1,240"
                    icon={CreditCard}
                    change={5}
                    changeType="increase"
                    description="Recurring revenue"
                />
                <AdminStatsCard
                    title="Payouts"
                    value="$65,200"
                    icon={ArrowUpRight}
                    change={2}
                    changeType="decrease"
                    description="Sent to hosts"
                />
                <AdminStatsCard
                    title="Refund Rate"
                    value="1.2%"
                    icon={ArrowDownLeft}
                    change={0.1}
                    changeType="increase"
                    description="Low dispute rate"
                />
            </div>

            <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--admin-text-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg bg-[var(--admin-background)] border border-[var(--admin-border)] text-sm text-white focus:outline-none focus:border-[var(--admin-accent)] w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-text-tertiary)]">
                                <th className="py-3 px-4">Transaction ID</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredTransactions.map((trx) => (
                                <tr key={trx.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)] transition-colors">
                                    <td className="py-3 px-4 font-mono text-[var(--admin-accent)]">{trx.id}</td>
                                    <td className="py-3 px-4 font-medium text-white">{trx.user}</td>
                                    <td className="py-3 px-4 text-[var(--admin-text-secondary)]">{trx.type}</td>
                                    <td className="py-3 px-4 text-[var(--admin-text-secondary)]">{trx.date}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded textxs font-bold uppercase ${getStatusColor(trx.status)}`}>
                                            {trx.status}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-4 text-right font-mono font-bold ${trx.amount > 0 ? 'text-[var(--admin-success)]' : 'text-[var(--admin-text-primary)]'}`}>
                                        {trx.amount > 0 ? '+' : ''}{trx.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

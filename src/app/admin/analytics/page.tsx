'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { AdminRevenueChart } from '@/components/admin/dashboard/AdminRevenueChart';
import { AdminUserGrowthChart } from '@/components/admin/dashboard/AdminUserGrowthChart';
import { AdminStatsCard } from '@/components/admin/ui/AdminStatsCard';

// Mock Data
const mockRevenueData = [
    { date: '2025-01-01', revenue: 4000 },
    { date: '2025-01-08', revenue: 3000 },
    { date: '2025-01-15', revenue: 5000 },
    { date: '2025-01-22', revenue: 2780 },
    { date: '2025-01-29', revenue: 1890 },
    { date: '2025-02-05', revenue: 2390 },
    { date: '2025-02-12', revenue: 3490 },
];

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('30d');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">Analytics & Reports</h1>
                    <p className="text-[var(--admin-text-secondary)]">Deep dive into platform performance</p>
                </div>
                <div className="flex bg-[var(--admin-surface)] rounded-lg p-1 border border-[var(--admin-border)]">
                    {['7d', '30d', '90d', '1y'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${timeRange === range
                                ? 'bg-[var(--admin-surface-active)] text-white shadow-sm'
                                : 'text-[var(--admin-text-tertiary)] hover:text-white'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatsCard
                    title="Total Revenue"
                    value="$124,592"
                    icon={DollarSign}
                    change={12.5}
                    changeType="increase"
                    description="vs last period"
                />
                <AdminStatsCard
                    title="Active Users"
                    value="8,549"
                    icon={Users}
                    change={5.2}
                    changeType="increase"
                    description="vs last period"
                />
                <AdminStatsCard
                    title="Booking Rate"
                    value="42.8%"
                    icon={Calendar}
                    change={2.1}
                    changeType="decrease"
                    description="vs last period"
                />
                <AdminStatsCard
                    title="Avg. Order Value"
                    value="$342"
                    icon={TrendingUp}
                    change={8.4}
                    changeType="increase"
                    description="vs last period"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdminRevenueChart data={mockRevenueData} />
                <AdminUserGrowthChart />
            </div>

            {/* Detailed Reports (Placeholder) */}
            <div className="p-6 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[var(--admin-accent)]" />
                        Performance by Category
                    </h3>
                    <button className="text-sm text-[var(--admin-accent)] hover:underline">Download CSV</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-text-tertiary)]">
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Listings</th>
                                <th className="py-3 px-4">Views</th>
                                <th className="py-3 px-4">Bookings</th>
                                <th className="py-3 px-4 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[
                                { name: 'Luxury Villas', listings: 142, views: '45.2k', bookings: 328, revenue: '$84,200' },
                                { name: 'Urban Apartments', listings: 315, views: '82.1k', bookings: 512, revenue: '$28,400' },
                                { name: 'Cozy Cottages', listings: 89, views: '12.4k', bookings: 145, revenue: '$11,992' },
                            ].map((row, idx) => (
                                <tr key={idx} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)]">
                                    <td className="py-3 px-4 font-medium text-white">{row.name}</td>
                                    <td className="py-3 px-4 text-[var(--admin-text-secondary)]">{row.listings}</td>
                                    <td className="py-3 px-4 text-[var(--admin-text-secondary)]">{row.views}</td>
                                    <td className="py-3 px-4 text-[var(--admin-text-secondary)]">{row.bookings}</td>
                                    <td className="py-3 px-4 text-right text-[var(--admin-success)] font-mono">{row.revenue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

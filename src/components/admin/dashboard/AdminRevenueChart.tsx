'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { ADMIN_CHART_THEME, axisStyle, tooltipStyle } from '@/lib/admin/admin-chart-theme';

interface RevenueDataPoint {
    date: string;
    revenue: number;
    [key: string]: any;
}

interface AdminRevenueChartProps {
    data: RevenueDataPoint[];
}

export const AdminRevenueChart: React.FC<AdminRevenueChartProps> = ({ data }) => {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ADMIN_CHART_THEME.colors.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={ADMIN_CHART_THEME.colors.primary} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ADMIN_CHART_THEME.colors.grid} />
                    <XAxis
                        dataKey="date"
                        {...axisStyle}
                        tick={{ fill: ADMIN_CHART_THEME.colors.text, fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                        {...axisStyle}
                        tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                    />
                    <Tooltip
                        contentStyle={tooltipStyle.contentStyle}
                        itemStyle={tooltipStyle.itemStyle}
                        labelStyle={tooltipStyle.labelStyle}
                        formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, 'Revenue']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={ADMIN_CHART_THEME.colors.primary}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={3}
                        name="Revenue"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

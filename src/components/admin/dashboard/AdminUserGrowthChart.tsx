'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { ADMIN_CHART_THEME, axisStyle, tooltipStyle } from '@/lib/admin/admin-chart-theme';

interface AdminUserGrowthChartProps {
    data?: any[];
}

// Internal default mock if no data provided
const defaultData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 300 },
    { name: 'Mar', users: 550 },
    { name: 'Apr', users: 480 },
    { name: 'May', users: 620 },
    { name: 'Jun', users: 780 },
];

export const AdminUserGrowthChart: React.FC<AdminUserGrowthChartProps> = ({ data = defaultData }) => {
    // Determine the dataKey for XAxis based on the first data item
    const xAxisDataKey = data.length > 0 && data[0].date ? 'date' : 'name';

    return (
        <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ADMIN_CHART_THEME.colors.grid} />
                    <XAxis
                        dataKey={xAxisDataKey}
                        {...axisStyle}
                    />
                    <Tooltip
                        contentStyle={tooltipStyle.contentStyle}
                        itemStyle={tooltipStyle.itemStyle}
                        labelStyle={tooltipStyle.labelStyle}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Bar dataKey="users" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === data.length - 1 ? ADMIN_CHART_THEME.colors.primary : 'rgba(255, 255, 255, 0.2)'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

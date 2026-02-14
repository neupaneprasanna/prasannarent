// ─── Chart Theme Constants ───

export const ADMIN_CHART_THEME = {
    colors: {
        primary: '#06b6d4',   // Cyan
        secondary: '#3b82f6', // Blue
        success: '#10b981',   // Emerald
        warning: '#f97316',   // Orange
        danger: '#ef4444',    // Red
        grid: 'rgba(255, 255, 255, 0.06)',
        text: 'rgba(255, 255, 255, 0.4)',
        tooltipBg: '#0a0a0f',
        tooltipBorder: 'rgba(255, 255, 255, 0.1)'
    },
    fonts: {
        axis: '10px Inter, sans-serif',
        tooltip: '12px Inter, sans-serif'
    },
    gradients: {
        primaryArea: {
            id: 'colorPrimary',
            stops: [
                { offset: '5%', color: '#06b6d4', opacity: 0.3 },
                { offset: '95%', color: '#06b6d4', opacity: 0 }
            ]
        },
        secondaryArea: {
            id: 'colorSecondary',
            stops: [
                { offset: '5%', color: '#3b82f6', opacity: 0.3 },
                { offset: '95%', color: '#3b82f6', opacity: 0 }
            ]
        }
    }
};

// Reusable Axis Props
export const axisStyle = {
    stroke: ADMIN_CHART_THEME.colors.grid,
    tick: { fill: ADMIN_CHART_THEME.colors.text, fontSize: 10, fontFamily: 'Inter' },
    tickLine: false,
    axisLine: false
};

// Reusable Tooltip Style
export const tooltipStyle = {
    contentStyle: {
        backgroundColor: ADMIN_CHART_THEME.colors.tooltipBg,
        borderColor: ADMIN_CHART_THEME.colors.tooltipBorder,
        borderRadius: '12px',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
        padding: '12px'
    },
    itemStyle: {
        color: '#fff',
        fontSize: '12px',
        fontWeight: 500
    },
    labelStyle: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '6px'
    }
};

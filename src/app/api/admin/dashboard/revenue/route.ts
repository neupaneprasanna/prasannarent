import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const daysParam = searchParams.get('days');
        const days = parseInt(daysParam || '30') || 30;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const bookings = await prisma.booking.findMany({
            where: {
                status: { in: ['COMPLETED', 'ACTIVE'] },
                createdAt: { gte: startDate },
            },
            select: { totalPrice: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        const revenueMap = new Map<string, { revenue: number; bookings: number }>();
        bookings.forEach(b => {
            const day = b.createdAt.toISOString().split('T')[0];
            const existing = revenueMap.get(day) || { revenue: 0, bookings: 0 };
            existing.revenue += b.totalPrice;
            existing.bookings += 1;
            revenueMap.set(day, existing);
        });

        const data = Array.from(revenueMap.entries()).map(([date, stats]) => ({
            date,
            revenue: Math.round(stats.revenue * 100) / 100,
            bookings: stats.bookings,
        }));

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

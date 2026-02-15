import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const [totalUsers, totalListings, totalBookings, revenueResult, activeUsers, pendingApprovals, moderationQueue] = await Promise.all([
            prisma.user.count(),
            prisma.listing.count(),
            prisma.booking.count(),
            prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED' } }),
            (prisma.user as any).count({ where: { lastSeenAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } }),
            (prisma.listing as any).count({ where: { status: 'PENDING_APPROVAL' } }),
            (prisma as any).moderationItem?.count({ where: { status: 'PENDING' } }) || Promise.resolve(0),
        ]);

        return NextResponse.json({
            totalUsers,
            totalListings,
            totalBookings,
            totalRevenue: revenueResult._sum.totalPrice || 0,
            activeUsers,
            pendingApprovals,
            moderationQueue,
            systemHealth: 'healthy',
        });
    } catch (error) {
        console.error('[Admin Dashboard] Stats error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

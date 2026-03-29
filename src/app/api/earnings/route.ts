import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET /api/earnings - Detailed earnings for the logged-in user's listings
export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const bookings = await prisma.booking.findMany({
            where: {
                listing: { ownerId: user.userId },
                status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
            },
            select: {
                id: true,
                totalPrice: true,
                status: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                listing: { select: { id: true, title: true, images: true } },
                renter: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalEarnings = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const completedEarnings = bookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + b.totalPrice, 0);
        const pendingEarnings = bookings.filter(b => ['CONFIRMED', 'ACTIVE'].includes(b.status)).reduce((sum, b) => sum + b.totalPrice, 0);

        // Monthly breakdown (last 12 months)
        const monthlyData: Record<string, number> = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = 0;
        }

        bookings.forEach(b => {
            const key = `${new Date(b.createdAt).getFullYear()}-${String(new Date(b.createdAt).getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key] !== undefined) {
                monthlyData[key] += b.totalPrice;
            }
        });

        const monthlyChart = Object.entries(monthlyData).map(([month, amount]) => ({
            month,
            label: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
            amount: Math.round(amount * 100) / 100,
        }));

        // Per-listing breakdown
        const byListing: Record<string, { id: string; title: string; image: string | null; total: number; bookings: number }> = {};
        bookings.forEach(b => {
            if (!byListing[b.listing.id]) {
                byListing[b.listing.id] = {
                    id: b.listing.id,
                    title: b.listing.title,
                    image: b.listing.images[0] || null,
                    total: 0,
                    bookings: 0,
                };
            }
            byListing[b.listing.id].total += b.totalPrice;
            byListing[b.listing.id].bookings += 1;
        });

        const listingBreakdown = Object.values(byListing).sort((a, b) => b.total - a.total);

        return NextResponse.json({
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            completedEarnings: Math.round(completedEarnings * 100) / 100,
            pendingEarnings: Math.round(pendingEarnings * 100) / 100,
            totalBookings: bookings.length,
            monthlyChart,
            listingBreakdown,
            recentTransactions: bookings.slice(0, 15).map(b => ({
                id: b.id,
                amount: b.totalPrice,
                status: b.status,
                date: b.createdAt,
                listingTitle: b.listing.title,
                renterName: `${b.renter.firstName} ${b.renter.lastName}`,
            })),
        });
    } catch (error) {
        console.error('Earnings error:', error);
        return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
    }
}

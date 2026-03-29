import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET /api/analytics/listings - Get analytics for all user's listings
export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = user.userId;

        const listings = await (prisma.listing as any).findMany({
            where: { ownerId: userId },
            include: {
                bookings: {
                    select: {
                        id: true,
                        totalPrice: true,
                        status: true,
                        startDate: true,
                        endDate: true,
                        createdAt: true,
                    }
                },
                reviews: { select: { rating: true } },
                wishlistItems: { select: { id: true } },
                listingViews: {
                    select: { id: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 200,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute analytics per listing
        const analytics = (listings as any[]).map((listing: any) => {
            const revenue = listing.bookings
                .filter((b: any) => ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status))
                .reduce((sum: number, b: any) => sum + b.totalPrice, 0);

            const avgRating = listing.reviews.length > 0
                ? listing.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / listing.reviews.length
                : 0;

            const totalViews = listing.listingViews?.length || 0;
            const confirmedBookings = listing.bookings.filter((b: any) => ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status)).length;
            const conversionRate = totalViews > 0
                ? (confirmedBookings / totalViews) * 100
                : 0;

            // Listing health score (0-100)
            let healthScore = 0;
            if (listing.images.length >= 3) healthScore += 20; else healthScore += (listing.images.length / 3) * 20;
            if (listing.description.length >= 100) healthScore += 15; else healthScore += (listing.description.length / 100) * 15;
            if (listing.tags.length >= 3) healthScore += 10; else healthScore += (listing.tags.length / 3) * 10;
            if (avgRating >= 4) healthScore += 20; else healthScore += (avgRating / 4) * 20;
            if (confirmedBookings >= 1) healthScore += 15;
            if (totalViews >= 10) healthScore += 10; else healthScore += (totalViews / 10) * 10;
            if (listing.location) healthScore += 10;

            // View trend (last 30 days grouped by day)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const viewsByDay: Record<string, number> = {};
            (listing.listingViews || [])
                .filter((v: any) => new Date(v.createdAt) >= thirtyDaysAgo)
                .forEach((v: any) => {
                    const day = new Date(v.createdAt).toISOString().split('T')[0];
                    viewsByDay[day] = (viewsByDay[day] || 0) + 1;
                });

            // Tips
            const tips: string[] = [];
            if (listing.images.length < 3) tips.push(`Add ${3 - listing.images.length} more photo${listing.images.length < 2 ? 's' : ''} to attract more renters`);
            if (listing.description.length < 100) tips.push('Write a more detailed description (100+ characters)');
            if (listing.tags.length < 3) tips.push('Add more tags to improve discoverability');
            if (!listing.location) tips.push('Add a location to reach nearby renters');

            return {
                id: listing.id,
                title: listing.title,
                image: listing.images[0] || null,
                status: listing.status,
                price: listing.price,
                priceUnit: listing.priceUnit,
                totalViews,
                totalBookings: listing.bookings.length,
                confirmedBookings,
                totalReviews: listing.reviews.length,
                wishlistSaves: listing.wishlistItems?.length || 0,
                revenue,
                avgRating: Math.round(avgRating * 10) / 10,
                conversionRate: Math.round(conversionRate * 10) / 10,
                healthScore: Math.round(healthScore),
                viewsByDay,
                tips,
                createdAt: listing.createdAt,
            };
        });

        // Aggregate stats
        const totalRevenue = analytics.reduce((sum: number, a: any) => sum + a.revenue, 0);
        const totalViews = analytics.reduce((sum: number, a: any) => sum + a.totalViews, 0);
        const totalBookings = analytics.reduce((sum: number, a: any) => sum + a.totalBookings, 0);

        return NextResponse.json({
            listings: analytics,
            summary: {
                totalListings: analytics.length,
                totalRevenue,
                totalViews,
                totalBookings,
                avgHealthScore: analytics.length > 0
                    ? Math.round(analytics.reduce((sum: number, a: any) => sum + a.healthScore, 0) / analytics.length)
                    : 0,
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

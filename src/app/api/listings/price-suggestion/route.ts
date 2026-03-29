import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/listings/price-suggestion?category=X — Suggest optimal price based on market data
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        // Get all active listings in the same category
        const listings = await prisma.listing.findMany({
            where: {
                category,
                status: 'ACTIVE',
            },
            select: {
                price: true,
                priceUnit: true,
                rating: true,
                views: true,
                bookingCount: true,
                reviewCount: true,
            },
            orderBy: { price: 'asc' },
        });

        if (listings.length === 0) {
            return NextResponse.json({
                suggestion: null,
                message: 'No comparable listings found in this category',
                stats: { count: 0 },
            });
        }

        const prices = listings.map(l => l.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const medianPrice = prices[Math.floor(prices.length / 2)];

        // Find the "sweet spot" — listings with the best booking-to-view ratio
        const withPerformance = listings
            .filter(l => l.views > 0)
            .map(l => ({
                price: l.price,
                conversionRate: l.bookingCount / l.views,
                rating: l.rating,
            }))
            .sort((a, b) => b.conversionRate - a.conversionRate);

        const topPerformers = withPerformance.slice(0, Math.max(3, Math.floor(withPerformance.length * 0.3)));
        const optimalPrice = topPerformers.length > 0
            ? topPerformers.reduce((sum, l) => sum + l.price, 0) / topPerformers.length
            : medianPrice;

        // Price distribution for histogram
        const bucketCount = 6;
        const range = maxPrice - minPrice || 1;
        const bucketSize = range / bucketCount;
        const distribution = Array.from({ length: bucketCount }, (_, i) => {
            const from = minPrice + i * bucketSize;
            const to = from + bucketSize;
            return {
                range: `$${Math.round(from)}-$${Math.round(to)}`,
                from: Math.round(from),
                to: Math.round(to),
                count: prices.filter(p => p >= from && p < to + (i === bucketCount - 1 ? 1 : 0)).length,
            };
        });

        return NextResponse.json({
            suggestion: {
                optimal: Math.round(optimalPrice * 100) / 100,
                competitive: Math.round(medianPrice * 0.9 * 100) / 100,
                premium: Math.round(avgPrice * 1.15 * 100) / 100,
            },
            stats: {
                count: listings.length,
                min: Math.round(minPrice * 100) / 100,
                max: Math.round(maxPrice * 100) / 100,
                avg: Math.round(avgPrice * 100) / 100,
                median: Math.round(medianPrice * 100) / 100,
            },
            distribution,
        });
    } catch (error) {
        console.error('Price suggestion error:', error);
        return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
    }
}

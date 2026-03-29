import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q || q.length < 2) {
            return NextResponse.json({ listings: [], users: [], collections: [] });
        }

        const terms = q.trim().split(/\s+/);
        const term = terms[0]; // For simple fuzzy searching, we'll use the main contiguous string, or map them

        // Construct search conditions
        const searchConditions = terms.map(t => ({
            contains: t,
            mode: 'insensitive' as any
        }));

        const wordOrConditions = terms.map(t => ({
            OR: [
                { title: { contains: t, mode: 'insensitive' as any } },
                { description: { contains: t, mode: 'insensitive' as any } },
                { category: { contains: t, mode: 'insensitive' as any } },
            ]
        }));

        const userWordOrConditions = terms.map(t => ({
            OR: [
                { firstName: { contains: t, mode: 'insensitive' as any } },
                { lastName: { contains: t, mode: 'insensitive' as any } },
                { email: { contains: t, mode: 'insensitive' as any } },
            ]
        }));

        const [listings, users, collections] = await Promise.all([
            // Search Listings
            prisma.listing.findMany({
                where: {
                    status: 'ACTIVE',
                    OR: wordOrConditions.flatMap(w => w.OR)
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    priceUnit: true,
                    category: true,
                    images: true,
                    owner: {
                        select: {
                            firstName: true,
                            avatar: true
                        }
                    }
                },
                take: 5
            }),

            // Search Users
            prisma.user.findMany({
                where: {
                    banned: false,
                    OR: userWordOrConditions.flatMap(w => w.OR)
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    email: true,
                    role: true
                },
                take: 5
            }),

            // Search Collections
            prisma.wishlistCollection.findMany({
                where: {
                    isPublic: true,
                    name: { contains: term, mode: 'insensitive' }
                },
                select: {
                    id: true,
                    name: true,
                    emoji: true,
                    user: {
                        select: { firstName: true }
                    }
                },
                take: 5
            })
        ]);

        return NextResponse.json({
            listings,
            users,
            collections,
        });
    } catch (error) {
        console.error('Global Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

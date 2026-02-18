import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const sort = searchParams.get('sort');
        const minRating = searchParams.get('minRating');
        const availableOnly = searchParams.get('availableOnly');
        const id = searchParams.get('id');

        const where: any = {
            status: 'ACTIVE'
        };

        const conditions: any[] = [];

        if (id) {
            where.id = id;
        } else {
            if (category && category !== 'all' && category !== 'All') {
                conditions.push({ category: { equals: category, mode: 'insensitive' } });
            }

            if (search) {
                const searchWords = search.split(' ').filter(w => w.length > 1);
                if (searchWords.length > 0) {
                    const searchConditions = searchWords.map(word => ({
                        OR: [
                            { title: { contains: word, mode: 'insensitive' } },
                            { description: { contains: word, mode: 'insensitive' } },
                            { tags: { hasSome: [word] } }
                        ]
                    }));
                    conditions.push({ AND: searchConditions });
                }
            }

            if (minPrice || maxPrice) {
                where.price = {
                    gte: minPrice ? parseFloat(minPrice) : undefined,
                    lte: maxPrice ? parseFloat(maxPrice) : undefined,
                };
            }

            if (minRating) {
                where.rating = { gte: parseFloat(minRating) };
            }

            if (availableOnly === 'true') {
                where.available = true;
            }

            if (conditions.length > 0) {
                where.AND = conditions;
            }
        }

        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        else if (sort === 'price_desc') orderBy = { price: 'desc' };
        else if (sort === 'rating_desc') orderBy = { rating: 'desc' };

        const listings = await prisma.listing.findMany({
            where,
            orderBy,
            include: {
                owner: { select: { firstName: true, verified: true } },
                media: { orderBy: { order: 'asc' } },
                pricing: true
            }
        });

        return NextResponse.json({ listings });
    } catch (error) {
        console.error('Listings fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { title, description, price, category, tags, images, location, priceUnit, media, pricing } = body;

        if (!title || !description || !price || !category || !location) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const listing = await prisma.listing.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                category,
                tags: Array.from(new Set((tags || []).map((t: string) => t.trim()).filter(Boolean))),
                images: images || [],
                location,
                priceUnit: (priceUnit?.toUpperCase() as any) || 'DAY',
                ownerId: user.userId,
                media: media && media.length > 0 ? {
                    create: media.map((item: any, index: number) => ({
                        url: item.url,
                        type: item.type || 'IMAGE',
                        caption: item.caption || '',
                        order: index
                    }))
                } : undefined,
                pricing: pricing ? {
                    create: {
                        dailyPrice: parseFloat(price),
                        hourlyPrice: pricing.hourlyPrice ? parseFloat(pricing.hourlyPrice) : null,
                        weeklyPrice: pricing.weeklyPrice ? parseFloat(pricing.weeklyPrice) : null,
                        monthlyPrice: pricing.monthlyPrice ? parseFloat(pricing.monthlyPrice) : null,
                        weekendMultiplier: parseFloat(pricing.weekendMultiplier) || 1.0,
                    }
                } : undefined,
            },
            include: {
                media: true,
                pricing: true
            }
        });

        return NextResponse.json({ message: 'Listing created successfully', listing }, { status: 201 });
    } catch (error) {
        console.error('Create listing error:', error);
        return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }
}

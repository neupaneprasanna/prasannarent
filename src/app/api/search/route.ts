import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectSearchIntent, rankResults } from '@/lib/groq';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q) {
            return NextResponse.json({ results: [], query: q, intent: null });
        }

        const categories = ['Tech', 'Vehicles', 'Rooms', 'Equipment', 'Fashion', 'Studios', 'Tools', 'Digital'];
        const intent = await detectSearchIntent(q, categories);

        const searchTerms = new Set<string>();
        if (intent.keywords && intent.keywords.length > 0) {
            intent.keywords.forEach(k => {
                k.split(' ').forEach(word => {
                    if (word.length > 1) searchTerms.add(word.toLowerCase());
                });
                if (k.length > 1) searchTerms.add(k.toLowerCase());
            });
        }
        q.split(' ').forEach(word => {
            if (word.length > 1) searchTerms.add(word.toLowerCase());
        });

        const termArray = Array.from(searchTerms);
        const wordConditions = termArray.map(term => ({
            OR: [
                { title: { contains: term, mode: 'insensitive' as any } },
                { description: { contains: term, mode: 'insensitive' as any } },
                { tags: { hasSome: [term] } }
            ]
        }));

        const where: any = {
            status: 'ACTIVE',
            OR: [
                ...wordConditions,
                ...(intent.category ? [{ category: { equals: intent.category, mode: 'insensitive' as any } }] : [])
            ]
        };

        if (intent.minPrice !== null || intent.maxPrice !== null) {
            where.price = {
                gte: intent.minPrice ?? undefined,
                lte: intent.maxPrice ?? undefined,
            };
        }

        let listings = await prisma.listing.findMany({
            where,
            include: { owner: { select: { firstName: true, verified: true } } },
            take: 30
        });

        if (listings.length > 0) {
            listings = await rankResults(q, listings);
        }

        return NextResponse.json({
            results: listings,
            query: q,
            intent: {
                category: intent.category,
                explanation: intent.explanation,
                confidence: 0.95
            }
        });
    } catch (error) {
        console.error('AI Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

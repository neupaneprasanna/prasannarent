import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '20') || 20;
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');
        const status = searchParams.get('status');

        const where: any = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category) where.category = category;
        if (status) where.status = status;

        const [listings, total] = await Promise.all([
            prisma.listing.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    owner: { select: { firstName: true, email: true } },
                    _count: { select: { bookings: true, reviews: true } }
                }
            }),
            prisma.listing.count({ where }),
        ]);

        return NextResponse.json({
            items: listings,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

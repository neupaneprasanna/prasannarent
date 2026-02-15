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
        const role = searchParams.get('role');
        const verified = searchParams.get('verified');

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) where.role = role;
        if (verified === 'true') where.verified = true;
        if (verified === 'false') where.verified = false;

        const [users, total] = await Promise.all([
            (prisma.user as any).findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, email: true, firstName: true, lastName: true,
                    avatar: true, role: true, verified: true, banned: true,
                    loginCount: true, lastLoginAt: true, createdAt: true,
                    _count: { select: { listings: true, bookings: true, reviews: true } }
                }
            }),
            (prisma.user as any).count({ where }),
        ]);

        return NextResponse.json({
            items: users,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

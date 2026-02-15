import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'content', 'read');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const section = searchParams.get('section');
        const where: any = {};
        if (section) where.section = section;

        const blocks = await prisma.contentBlock.findMany({
            where,
            orderBy: [{ section: 'asc' }, { order: 'asc' }],
        });
        return NextResponse.json({ blocks });
    } catch (error) {
        console.error('Failed to fetch content blocks:', error);
        return NextResponse.json({ error: 'Failed to fetch content blocks' }, { status: 500 });
    }
}

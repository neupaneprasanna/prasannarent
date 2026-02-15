import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'features', 'read');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
        return NextResponse.json({ flags });
    } catch (error) {
        console.error('Failed to fetch feature flags:', error);
        return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
    }
}

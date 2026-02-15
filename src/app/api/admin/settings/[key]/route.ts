import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'settings', 'write');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { key } = await params;
        const { value } = await req.json();

        const setting = await prisma.platformSetting.update({
            where: { key },
            data: { value },
        });

        return NextResponse.json({ setting });
    } catch (error) {
        console.error('Failed to update setting:', error);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}

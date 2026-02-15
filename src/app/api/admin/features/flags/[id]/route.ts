import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'features', 'write');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id } = await params;
        const { enabled, rollout, metadata } = await req.json();

        const updateData: any = {};
        if (enabled !== undefined) updateData.enabled = enabled;
        if (rollout !== undefined) updateData.rollout = rollout;
        if (metadata !== undefined) updateData.metadata = metadata;

        const flag = await prisma.featureFlag.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ flag });
    } catch (error) {
        console.error('Failed to update feature flag:', error);
        return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
    }
}

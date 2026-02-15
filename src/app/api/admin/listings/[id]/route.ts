import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const { status, tags, category } = await req.json();
        const updateData: any = {};

        if (status !== undefined) updateData.status = status;
        if (tags !== undefined) updateData.tags = Array.from(new Set((tags || []).map((t: string) => t.trim()).filter(Boolean)));
        if (category !== undefined) updateData.category = category;

        const listing = await prisma.listing.update({
            where: { id },
            data: updateData,
            include: { owner: { select: { firstName: true, email: true } } }
        });

        // Add to audit log
        await (prisma as any).auditLog.create({
            data: {
                adminId: admin.userId,
                action: 'UPDATE_LISTING',
                module: 'LISTINGS',
                targetType: 'LISTING',
                targetId: id,
                details: `Updated listing status to ${status || 'unchanged'}`,
            }
        });

        return NextResponse.json({ message: 'Listing updated', listing });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const listing = await prisma.listing.delete({ where: { id } });

        // Add to audit log
        await (prisma as any).auditLog.create({
            data: {
                adminId: admin.userId,
                action: 'DELETE_LISTING',
                module: 'LISTINGS',
                targetType: 'LISTING',
                targetId: id,
                details: `Deleted listing permanently`,
            }
        });

        return NextResponse.json({ message: 'Listing deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

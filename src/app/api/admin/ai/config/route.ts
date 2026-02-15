import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'ai', 'read');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const configs = await prisma.aIConfig.findMany({ orderBy: [{ system: 'asc' }, { parameter: 'asc' }] });
        const grouped: Record<string, Array<{ parameter: string; value: string; description: string | null }>> = {};
        configs.forEach((c) => {
            if (!grouped[c.system]) grouped[c.system] = [];
            grouped[c.system].push({ parameter: c.parameter, value: c.value, description: c.description });
        });
        return NextResponse.json({ configs: grouped });
    } catch (error) {
        console.error('Failed to fetch AI config:', error);
        return NextResponse.json({ error: 'Failed to fetch AI config' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'ai', 'write');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { system, parameter, value } = await req.json();
        const config = await prisma.aIConfig.upsert({
            where: { system_parameter: { system, parameter } },
            update: { value },
            create: { system, parameter, value },
        });
        return NextResponse.json({ config });
    } catch (error) {
        console.error('Failed to update AI config:', error);
        return NextResponse.json({ error: 'Failed to update AI config' }, { status: 500 });
    }
}

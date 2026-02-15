import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const maintenanceMode = await prisma.platformSetting.findUnique({
            where: { key: 'maintenance_mode' }
        });
        return NextResponse.json({
            maintenanceMode: maintenanceMode?.value === 'true'
        });
    } catch (error) {
        console.error('Failed to fetch public settings:', error);
        return NextResponse.json({ error: 'Failed to fetch public settings' }, { status: 500 });
    }
}

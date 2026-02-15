import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { ROLE_PERMISSIONS } from '@/types/admin';
import type { AdminRole, PermissionModule, PermissionAction } from '@/types/admin';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function authenticateAdmin(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, banned: true }
        });

        if (!user || user.role === 'USER' || (user as any).banned) {
            return null;
        }

        return {
            userId: user.id,
            role: user.role as AdminRole,
            banned: (user as any).banned
        };
    } catch (error) {
        return null;
    }
}

export async function requirePermission(role: AdminRole, module: PermissionModule, action: PermissionAction): Promise<boolean> {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.some(p => p.module === module && p.action === action);
}

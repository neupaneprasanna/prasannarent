
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { ROLE_PERMISSIONS, getAccessibleModules, ADMIN_SIDEBAR_ITEMS, AdminRole } from '@/types/admin';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Fetch user
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if ((user as any).banned) return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
        if (user.role === 'USER') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

        const role = user.role as AdminRole;

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                role: user.role,
                verified: user.verified,
                permissions: ROLE_PERMISSIONS[role] || [],
            },
            accessibleModules: getAccessibleModules(role),
            sidebarItems: ADMIN_SIDEBAR_ITEMS.filter(item =>
                getAccessibleModules(role).includes(item.module)
            ),
        });

    } catch (error) {
        console.error('Me route error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

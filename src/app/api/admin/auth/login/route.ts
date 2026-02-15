import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ROLE_PERMISSIONS, getAccessibleModules, ADMIN_SIDEBAR_ITEMS, AdminRole } from '@/types/admin';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

        if ((user as any).banned) return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
        if (user.role === 'USER') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '4h' }
        );

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
            token,
            accessibleModules: getAccessibleModules(role),
            sidebarItems: ADMIN_SIDEBAR_ITEMS.filter(item =>
                getAccessibleModules(role).includes(item.module)
            ),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}

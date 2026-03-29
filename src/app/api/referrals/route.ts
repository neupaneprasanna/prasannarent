import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import crypto from 'crypto';

// GET /api/referrals - Get user's referral code and stats
export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Find or create referral code for user
        let referral = await prisma.referral.findFirst({
            where: { referrerId: user.userId },
            include: {
                referee: { select: { firstName: true, lastName: true, avatar: true, createdAt: true } },
            },
        });

        if (!referral) {
            // Generate unique code
            const code = `RV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            referral = await prisma.referral.create({
                data: {
                    referrerId: user.userId,
                    code,
                    rewardAmount: 10,
                },
                include: {
                    referee: { select: { firstName: true, lastName: true, avatar: true, createdAt: true } },
                },
            });
        }

        // Get all referrals by this user
        const allReferrals = await prisma.referral.findMany({
            where: { referrerId: user.userId },
            include: {
                referee: { select: { firstName: true, lastName: true, avatar: true, createdAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const completed = allReferrals.filter(r => r.status === 'REWARDED');
        const pending = allReferrals.filter(r => r.status === 'PENDING');
        const totalEarned = completed.reduce((sum, r) => sum + r.rewardAmount, 0);

        return NextResponse.json({
            code: referral.code,
            rewardAmount: referral.rewardAmount,
            stats: {
                totalReferrals: allReferrals.length,
                completed: completed.length,
                pending: pending.length,
                totalEarned,
            },
            referrals: allReferrals.map(r => ({
                id: r.id,
                status: r.status,
                rewardAmount: r.rewardAmount,
                referee: r.referee,
                redeemedAt: r.redeemedAt,
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        console.error('Referral error:', error);
        return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
    }
}

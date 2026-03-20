import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const userId = params.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                bio: true,
                verified: true,
                city: true,
                interests: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Mock data for engagement features not yet fully implemented in DB
        const data = {
            user: {
                ...user,
                level: 1,
                points: 100,
                fairnessScore: 95,
                subscriptionTier: 'FREE',
                responseTime: 2,
                levelInfo: {
                    level: 1,
                    title: 'New Member',
                    minPoints: 0,
                    maxPoints: 500,
                    progress: 20
                }
            },
            reputation: {
                trustScore: 92,
                status: 'Excellent',
                color: '#34d399',
                components: {
                    transaction: 90,
                    review: 95,
                    verification: 100,
                    activity: 85,
                    response: 90
                },
                negativeFactors: {
                    reports: 0,
                    disputes: 0,
                    cancellations: 0,
                    spam: 0
                }
            },
            subscription: {
                tier: 'FREE',
                monthlyPrice: 0,
                features: ['Basic access', 'standard support'],
                isActive: true,
                renewalDate: null
            },
            achievements: [],
            connections: {
                all: [],
                closeFriends: [],
                businessFriends: [],
                followers: [],
                following: [],
                trustedPartners: []
            },
            stats: {
                listings: 0,
                completedTransactions: 0,
                reviewsReceived: 0,
                followersCount: 0,
                followingCount: 0,
                totalConnections: 0
            },
            recentActivity: [],
            allLevels: [
                { level: 1, title: 'New Member', minPoints: 0, maxPoints: 500 }
            ],
            allSubscriptionTiers: {
                FREE: { price: 0, features: ['Basic access'] }
            }
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching full profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

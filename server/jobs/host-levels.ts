
import { PrismaClient, HostLevel } from '@prisma/client';

const prisma = new PrismaClient();

export async function calculateHostLevels() {
    console.log('[Job] Starting Host Level Calculation...');

    try {
        // 1. Fetch all users who have listings (potential hosts)
        const hosts = await prisma.user.findMany({
            where: {
                listings: { some: {} }
            },
            include: {
                listings: {
                    include: {
                        bookings: { select: { status: true, totalPrice: true } },
                        reviews: { select: { rating: true } }
                    }
                },
                hostProfile: true
            }
        });

        console.log(`[Job] Found ${hosts.length} hosts to process.`);

        let updatedCount = 0;

        for (const host of hosts) {
            // -- Calculate Metrics --

            // Total Rentals (Completed bookings)
            const completedBookings = host.listings.flatMap(l => l.bookings)
                .filter(b => b.status === 'COMPLETED').length;

            // Average Rating
            const allReviews = host.listings.flatMap(l => l.reviews);
            const avgRating = allReviews.length > 0
                ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
                : 0;

            // Response Rate (Mock logic for now as we don't track message reply times yet)
            // Default to 100% or keep existing if manually set, otherwise random high number for demo
            const responseRate = host.hostProfile?.responseRate || 100;

            // -- Determine Level --
            let level: HostLevel = 'BRONZE';

            if (completedBookings >= 10 && avgRating >= 4.8 && responseRate >= 90) {
                level = 'SUPERHOST';
            } else if (completedBookings >= 5 && avgRating >= 4.5 && responseRate >= 80) {
                level = 'GOLD';
            } else if (completedBookings >= 1 && avgRating >= 4.0) {
                level = 'SILVER';
            }

            // -- Update Profile --
            await prisma.hostProfile.upsert({
                where: { userId: host.id },
                create: {
                    userId: host.id,
                    level,
                    totalRentals: completedBookings,
                    responseRate,
                    completionRate: 100, // Placeholder
                    lastCalculated: new Date()
                },
                update: {
                    level,
                    totalRentals: completedBookings,
                    responseRate, // Keep existing or update if we had real logic
                    lastCalculated: new Date()
                }
            });

            updatedCount++;
        }

        console.log(`[Job] Successfully updated levels for ${updatedCount} hosts.`);
        return { success: true, updatedCount };

    } catch (error) {
        console.error('[Job] Failed to calculate host levels:', error);
        throw error;
    }
}

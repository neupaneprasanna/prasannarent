import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface AuthRequest extends Request {
    user?: { userId: string; email: string };
}

// Auth middleware (shared)
function authenticateToken(req: Request, res: Response, next: Function) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        (req as AuthRequest).user = user as { userId: string; email: string };
        next();
    });
}

export function createEngagementRouter(): Router {
    const router = Router();

    // ═══════════════════════════════════════════
    //  WISHLIST SYSTEM
    // ═══════════════════════════════════════════

    // GET /api/engagement/wishlist — Get all collections with items
    router.get('/wishlist', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const collections = await (prisma as any).wishlistCollection.findMany({
                where: { userId },
                include: {
                    items: {
                        include: {
                            listing: {
                                select: {
                                    id: true, title: true, price: true, priceUnit: true,
                                    images: true, rating: true, location: true, available: true,
                                }
                            }
                        },
                        orderBy: { addedAt: 'desc' }
                    },
                    _count: { select: { items: true } }
                },
                orderBy: { createdAt: 'asc' }
            });
            res.json({ collections });
        } catch (error) {
            console.error('Wishlist fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch wishlist' });
        }
    });

    // POST /api/engagement/wishlist/collections — Create collection
    router.post('/wishlist/collections', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { name, emoji } = req.body;
            const collection = await (prisma as any).wishlistCollection.create({
                data: { userId, name: name || 'New Collection', emoji: emoji || '📁' }
            });
            res.status(201).json({ collection });
        } catch (error) {
            console.error('Create collection error:', error);
            res.status(500).json({ error: 'Failed to create collection' });
        }
    });

    // POST /api/engagement/wishlist/:collectionId/items — Add item to collection
    router.post('/wishlist/:collectionId/items', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { collectionId } = req.params;
            const { listingId } = req.body;

            // Verify ownership
            const collection = await (prisma as any).wishlistCollection.findFirst({
                where: { id: collectionId, userId }
            });
            if (!collection) return res.status(404).json({ error: 'Collection not found' });

            const item = await (prisma as any).wishlistItem.upsert({
                where: { collectionId_listingId: { collectionId, listingId } },
                update: {},
                create: { collectionId, listingId }
            });
            res.status(201).json({ item });
        } catch (error) {
            console.error('Add to wishlist error:', error);
            res.status(500).json({ error: 'Failed to add item' });
        }
    });

    // DELETE /api/engagement/wishlist/items/:collectionId/:listingId — Remove item
    router.delete('/wishlist/items/:collectionId/:listingId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { collectionId, listingId } = req.params;

            // Verify ownership
            const collection = await (prisma as any).wishlistCollection.findFirst({
                where: { id: collectionId, userId }
            });
            if (!collection) return res.status(404).json({ error: 'Collection not found' });

            await (prisma as any).wishlistItem.delete({
                where: { collectionId_listingId: { collectionId, listingId } }
            });
            res.json({ success: true });
        } catch (error) {
            console.error('Remove from wishlist error:', error);
            res.status(500).json({ error: 'Failed to remove item' });
        }
    });

    // DELETE /api/engagement/wishlist/collections/:id — Delete collection
    router.delete('/wishlist/collections/:id', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { id } = req.params;

            const collection = await (prisma as any).wishlistCollection.findFirst({
                where: { id, userId }
            });
            if (!collection) return res.status(404).json({ error: 'Collection not found' });
            if (collection.isDefault) return res.status(400).json({ error: 'Cannot delete default collection' });

            await (prisma as any).wishlistCollection.delete({ where: { id } });
            res.json({ success: true });
        } catch (error) {
            console.error('Delete collection error:', error);
            res.status(500).json({ error: 'Failed to delete collection' });
        }
    });

    // POST /api/engagement/wishlist/quick-save — Quick save to default collection
    router.post('/wishlist/quick-save', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { listingId } = req.body;

            // Find or create default collection
            let defaultCollection = await (prisma as any).wishlistCollection.findFirst({
                where: { userId, isDefault: true }
            });
            if (!defaultCollection) {
                defaultCollection = await (prisma as any).wishlistCollection.create({
                    data: { userId, name: 'Saved Items', emoji: '❤️', isDefault: true }
                });
            }

            const item = await (prisma as any).wishlistItem.upsert({
                where: { collectionId_listingId: { collectionId: defaultCollection.id, listingId } },
                update: {},
                create: { collectionId: defaultCollection.id, listingId }
            });
            res.status(201).json({ item, collectionId: defaultCollection.id });
        } catch (error) {
            console.error('Quick save error:', error);
            res.status(500).json({ error: 'Failed to save' });
        }
    });

    // POST /api/engagement/wishlist/quick-unsave — Remove from default collection
    router.post('/wishlist/quick-unsave', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { listingId } = req.body;

            // Find all collections containing this listing for this user
            const items = await (prisma as any).wishlistItem.findMany({
                where: {
                    listingId,
                    collection: { userId }
                }
            });

            if (items.length > 0) {
                await (prisma as any).wishlistItem.deleteMany({
                    where: { id: { in: items.map((i: any) => i.id) } }
                });
            }
            res.json({ success: true });
        } catch (error) {
            console.error('Quick unsave error:', error);
            res.status(500).json({ error: 'Failed to unsave' });
        }
    });

    // GET /api/engagement/wishlist/check/:listingId — Check if listing is saved
    router.get('/wishlist/check/:listingId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { listingId } = req.params;

            const item = await (prisma as any).wishlistItem.findFirst({
                where: { listingId, collection: { userId } }
            });
            res.json({ saved: !!item });
        } catch (error) {
            res.json({ saved: false });
        }
    });

    // ═══════════════════════════════════════════
    //  RECENTLY VIEWED
    // ═══════════════════════════════════════════

    // POST /api/engagement/recently-viewed — Track a view
    router.post('/recently-viewed', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { listingId } = req.body;

            await (prisma as any).recentlyViewed.upsert({
                where: { userId_listingId: { userId, listingId } },
                update: { viewedAt: new Date() },
                create: { userId, listingId }
            });

            // Prune: keep only last 50 viewed items per user
            const old = await (prisma as any).recentlyViewed.findMany({
                where: { userId },
                orderBy: { viewedAt: 'desc' },
                skip: 50,
                select: { id: true }
            });
            if (old.length > 0) {
                await (prisma as any).recentlyViewed.deleteMany({
                    where: { id: { in: old.map((o: any) => o.id) } }
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Track view error:', error);
            res.status(500).json({ error: 'Failed to track view' });
        }
    });

    // GET /api/engagement/recently-viewed — Get recently viewed listings
    router.get('/recently-viewed', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const limit = parseInt(req.query.limit as string) || 20;

            const items = await (prisma as any).recentlyViewed.findMany({
                where: { userId },
                orderBy: { viewedAt: 'desc' },
                take: limit,
                include: {
                    listing: {
                        select: {
                            id: true, title: true, price: true, priceUnit: true,
                            images: true, rating: true, location: true, available: true,
                            category: true, reviewCount: true,
                        }
                    }
                }
            });

            res.json({ items: items.map((i: any) => ({ ...i.listing, viewedAt: i.viewedAt })) });
        } catch (error) {
            console.error('Recently viewed fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch recently viewed' });
        }
    });

    // ═══════════════════════════════════════════
    //  FOLLOW HOST
    // ═══════════════════════════════════════════

    // POST /api/engagement/follow/:hostId — Follow a host
    router.post('/follow/:hostId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const followerId = (req as AuthRequest).user!.userId;
            const { hostId } = req.params;

            if (followerId === hostId) return res.status(400).json({ error: 'Cannot follow yourself' });

            await (prisma as any).hostFollow.upsert({
                where: { followerId_hostId: { followerId, hostId } },
                update: {},
                create: { followerId, hostId }
            });

            res.json({ following: true });
        } catch (error) {
            console.error('Follow error:', error);
            res.status(500).json({ error: 'Failed to follow' });
        }
    });

    // DELETE /api/engagement/follow/:hostId — Unfollow a host
    router.delete('/follow/:hostId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const followerId = (req as AuthRequest).user!.userId;
            const { hostId } = req.params;

            await (prisma as any).hostFollow.delete({
                where: { followerId_hostId: { followerId, hostId } }
            }).catch(() => { }); // ignore if not following

            res.json({ following: false });
        } catch (error) {
            console.error('Unfollow error:', error);
            res.status(500).json({ error: 'Failed to unfollow' });
        }
    });

    // GET /api/engagement/follow/check/:hostId — Check follow status
    router.get('/follow/check/:hostId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const followerId = (req as AuthRequest).user!.userId;
            const { hostId } = req.params;

            const follow = await (prisma as any).hostFollow.findUnique({
                where: { followerId_hostId: { followerId, hostId } }
            });
            res.json({ following: !!follow });
        } catch (error) {
            res.json({ following: false });
        }
    });

    // GET /api/engagement/follow/stats/:hostId — Get follower count
    router.get('/follow/stats/:hostId', async (req: Request, res: Response) => {
        try {
            const { hostId } = req.params;
            const count = await (prisma as any).hostFollow.count({ where: { hostId } });
            res.json({ followers: count });
        } catch (error) {
            res.json({ followers: 0 });
        }
    });

    // ═══════════════════════════════════════════
    //  BOOKING TIMELINE
    // ═══════════════════════════════════════════

    // GET /api/engagement/bookings/:id/timeline — Get booking timeline
    router.get('/bookings/:id/timeline', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { id } = req.params as { id: string };

            // Verify user is part of this booking
            const booking = await prisma.booking.findFirst({
                where: {
                    id,
                    OR: [
                        { renterId: userId },
                        { listing: { ownerId: userId } }
                    ]
                }
            });
            if (!booking) return res.status(404).json({ error: 'Booking not found' });

            const timeline = await (prisma as any).bookingTimeline.findMany({
                where: { bookingId: id },
                orderBy: { createdAt: 'asc' }
            });
            res.json({ timeline });
        } catch (error) {
            console.error('Timeline fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch timeline' });
        }
    });

    // POST /api/engagement/bookings/:id/counter — Host sends counter-offer
    router.post('/bookings/:id/counter', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { id } = req.params as { id: string };
            const { counterPrice, counterMessage } = req.body;

            const booking = await prisma.booking.findFirst({
                where: { id, listing: { ownerId: userId }, status: 'PENDING' }
            });
            if (!booking) return res.status(404).json({ error: 'Booking not found or not authorized' });

            const updated = await prisma.booking.update({
                where: { id },
                data: {
                    status: 'COUNTER_OFFERED' as any,
                    counterPrice: parseFloat(counterPrice),
                    counterMessage,
                }
            });

            // Add timeline entry
            await (prisma as any).bookingTimeline.create({
                data: {
                    bookingId: id,
                    status: 'COUNTER_OFFERED',
                    note: `Counter-offer: $${counterPrice}. ${counterMessage || ''}`,
                    actor: 'host'
                }
            });

            res.json({ booking: updated });
        } catch (error) {
            console.error('Counter-offer error:', error);
            res.status(500).json({ error: 'Failed to send counter-offer' });
        }
    });

    // POST /api/engagement/bookings/:id/accept-counter — Renter accepts counter
    router.post('/bookings/:id/accept-counter', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { id } = req.params as { id: string };

            const booking = await prisma.booking.findFirst({
                where: { id, renterId: userId, status: 'COUNTER_OFFERED' as any }
            });
            if (!booking) return res.status(404).json({ error: 'Booking not found' });

            const updated = await prisma.booking.update({
                where: { id },
                data: {
                    status: 'CONFIRMED',
                    totalPrice: (booking as any).counterPrice || booking.totalPrice,
                }
            });

            await (prisma as any).bookingTimeline.create({
                data: {
                    bookingId: id,
                    status: 'CONFIRMED',
                    note: `Counter-offer accepted at $${updated.totalPrice}`,
                    actor: 'renter'
                }
            });

            res.json({ booking: updated });
        } catch (error) {
            console.error('Accept counter error:', error);
            res.status(500).json({ error: 'Failed to accept counter-offer' });
        }
    });

    // POST /api/engagement/bookings/:id/extend — Request extension
    router.post('/bookings/:id/extend', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { id } = req.params as { id: string };
            const { extensionEndDate, renterNote } = req.body;

            const booking = await prisma.booking.findFirst({
                where: { id, renterId: userId, status: 'ACTIVE' }
            });
            if (!booking) return res.status(404).json({ error: 'Booking not found or not active' });

            const updated = await prisma.booking.update({
                where: { id },
                data: {
                    status: 'EXTENSION_REQUESTED' as any,
                    extensionEndDate: new Date(extensionEndDate),
                    renterNote,
                } as any
            });

            await (prisma as any).bookingTimeline.create({
                data: {
                    bookingId: id,
                    status: 'EXTENSION_REQUESTED',
                    note: `Extension requested until ${new Date(extensionEndDate).toLocaleDateString()}. ${renterNote || ''}`,
                    actor: 'renter'
                }
            });

            res.json({ booking: updated });
        } catch (error) {
            console.error('Extension request error:', error);
            res.status(500).json({ error: 'Failed to request extension' });
        }
    });

    // POST /api/engagement/bookings/:id/early-return — Request early return
    router.post('/bookings/:id/early-return', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { id } = req.params as { id: string };
            const { returnDate, renterNote } = req.body;

            const booking = await prisma.booking.findFirst({
                where: { id, renterId: userId, status: 'ACTIVE' }
            });
            if (!booking) return res.status(404).json({ error: 'Booking not found or not active' });

            const updated = await prisma.booking.update({
                where: { id },
                data: {
                    status: 'EARLY_RETURN_REQUESTED' as any,
                    returnDate: new Date(returnDate),
                    renterNote,
                } as any
            });

            await (prisma as any).bookingTimeline.create({
                data: {
                    bookingId: id,
                    status: 'EARLY_RETURN_REQUESTED',
                    note: `Early return requested for ${new Date(returnDate).toLocaleDateString()}. ${renterNote || ''}`,
                    actor: 'renter'
                }
            });

            res.json({ booking: updated });
        } catch (error) {
            console.error('Early return error:', error);
            res.status(500).json({ error: 'Failed to request early return' });
        }
    });

    // ═══════════════════════════════════════════
    //  HOST DASHBOARD
    // ═══════════════════════════════════════════

    // GET /api/engagement/host/stats — Host overview statistics
    router.get('/host/stats', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;

            const [listings, completedBookings, allBookings, reviews] = await Promise.all([
                prisma.listing.findMany({
                    where: { ownerId: userId },
                    select: { id: true, views: true, status: true }
                }),
                prisma.booking.count({
                    where: { listing: { ownerId: userId }, status: 'COMPLETED' }
                }),
                prisma.booking.findMany({
                    where: { listing: { ownerId: userId } },
                    select: { status: true, totalPrice: true, createdAt: true }
                }),
                prisma.review.aggregate({
                    where: { listing: { ownerId: userId } },
                    _avg: { rating: true },
                    _count: true
                })
            ]);

            const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
            const totalBookings = allBookings.length;
            const conversionRate = totalViews > 0 ? ((totalBookings / totalViews) * 100).toFixed(1) : '0';
            const totalEarnings = allBookings
                .filter(b => b.status === 'COMPLETED')
                .reduce((sum, b) => sum + b.totalPrice, 0);

            const activeListings = listings.filter(l => l.status === 'ACTIVE').length;

            res.json({
                totalListings: listings.length,
                activeListings,
                totalViews,
                totalBookings,
                completedBookings,
                conversionRate: `${conversionRate}%`,
                totalEarnings: Math.round(totalEarnings * 100) / 100,
                avgRating: reviews._avg.rating?.toFixed(1) || 'N/A',
                reviewCount: reviews._count,
            });
        } catch (error) {
            console.error('Host stats error:', error);
            res.status(500).json({ error: 'Failed to fetch host stats' });
        }
    });

    // GET /api/engagement/host/listings/performance — Per-listing analytics
    router.get('/host/listings/performance', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;

            const listings = await prisma.listing.findMany({
                where: { ownerId: userId },
                select: {
                    id: true, title: true, images: true, price: true, priceUnit: true,
                    views: true, rating: true, reviewCount: true, status: true,
                    bookings: { select: { status: true, totalPrice: true } },
                },
                orderBy: { views: 'desc' }
            });

            const performance = listings.map(l => ({
                id: l.id,
                title: l.title,
                image: l.images[0] || null,
                price: l.price,
                priceUnit: l.priceUnit,
                views: l.views,
                rating: l.rating,
                reviewCount: l.reviewCount,
                status: l.status,
                totalBookings: l.bookings.length,
                completedBookings: l.bookings.filter(b => b.status === 'COMPLETED').length,
                revenue: l.bookings
                    .filter(b => b.status === 'COMPLETED')
                    .reduce((sum, b) => sum + b.totalPrice, 0),
                conversionRate: l.views > 0
                    ? ((l.bookings.length / l.views) * 100).toFixed(1) + '%'
                    : '0%',
            }));

            res.json({ listings: performance });
        } catch (error) {
            console.error('Listing performance error:', error);
            res.status(500).json({ error: 'Failed to fetch listing performance' });
        }
    });

    // GET /api/engagement/host/earnings — Earnings over time
    router.get('/host/earnings', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const days = parseInt(req.query.days as string) || 30;

            const since = new Date();
            since.setDate(since.getDate() - days);

            const bookings = await prisma.booking.findMany({
                where: {
                    listing: { ownerId: userId },
                    status: 'COMPLETED',
                    createdAt: { gte: since }
                },
                select: { totalPrice: true, createdAt: true },
                orderBy: { createdAt: 'asc' }
            });

            // Group by date
            const dailyMap = new Map<string, { earnings: number; bookings: number }>();
            for (const b of bookings) {
                const dateKey = b.createdAt.toISOString().split('T')[0];
                const existing = dailyMap.get(dateKey) || { earnings: 0, bookings: 0 };
                existing.earnings += b.totalPrice;
                existing.bookings += 1;
                dailyMap.set(dateKey, existing);
            }

            // Fill in missing dates with 0
            const data = [];
            for (let i = 0; i < days; i++) {
                const d = new Date(since);
                d.setDate(d.getDate() + i);
                const key = d.toISOString().split('T')[0];
                const entry = dailyMap.get(key) || { earnings: 0, bookings: 0 };
                data.push({ date: key, ...entry });
            }

            res.json({ data });
        } catch (error) {
            console.error('Earnings fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch earnings' });
        }
    });

    // ═══════════════════════════════════════════
    //  RENTER DASHBOARD
    // ═══════════════════════════════════════════

    // GET /api/engagement/renter/stats — Renter booking summary
    router.get('/renter/stats', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;

            const [active, upcoming, completed, cancelled, totalSpent] = await Promise.all([
                prisma.booking.count({ where: { renterId: userId, status: 'ACTIVE' } }),
                prisma.booking.count({ where: { renterId: userId, status: 'CONFIRMED' } }),
                prisma.booking.count({ where: { renterId: userId, status: 'COMPLETED' } }),
                prisma.booking.count({ where: { renterId: userId, status: 'CANCELLED' } }),
                prisma.booking.aggregate({
                    where: { renterId: userId, status: 'COMPLETED' },
                    _sum: { totalPrice: true }
                })
            ]);

            res.json({
                active,
                upcoming,
                completed,
                cancelled,
                totalSpent: totalSpent._sum.totalPrice || 0,
                totalBookings: active + upcoming + completed + cancelled,
            });
        } catch (error) {
            console.error('Renter stats error:', error);
            res.status(500).json({ error: 'Failed to fetch renter stats' });
        }
    });

    // GET /api/engagement/renter/bookings — Filtered renter bookings
    router.get('/renter/bookings', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const status = req.query.status as string;
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;

            const where: any = { renterId: userId };
            if (status === 'active') where.status = 'ACTIVE';
            else if (status === 'upcoming') where.status = 'CONFIRMED';
            else if (status === 'past') where.status = { in: ['COMPLETED', 'CANCELLED', 'EXPIRED'] };

            const [bookings, total] = await Promise.all([
                prisma.booking.findMany({
                    where,
                    include: {
                        listing: {
                            select: {
                                id: true, title: true, images: true, price: true,
                                priceUnit: true, location: true,
                                owner: { select: { firstName: true, lastName: true, avatar: true } }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
                prisma.booking.count({ where })
            ]);

            res.json({ bookings, total, totalPages: Math.ceil(total / pageSize) });
        } catch (error) {
            console.error('Renter bookings error:', error);
            res.status(500).json({ error: 'Failed to fetch bookings' });
        }
    });

    // ═══════════════════════════════════════════
    //  CALENDAR AVAILABILITY
    // ═══════════════════════════════════════════

    // GET /api/engagement/listings/:id/availability — Get calendar data
    router.get('/listings/:id/availability', async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const months = parseInt(req.query.months as string) || 3;

            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + months);

            const [bookings, blocks] = await Promise.all([
                prisma.booking.findMany({
                    where: {
                        listingId: id,
                        status: { in: ['CONFIRMED', 'ACTIVE'] },
                        endDate: { gte: startDate },
                        startDate: { lte: endDate },
                    },
                    select: { startDate: true, endDate: true, status: true }
                }),
                (prisma as any).calendarBlock.findMany({
                    where: {
                        listingId: id,
                        endDate: { gte: startDate },
                        startDate: { lte: endDate },
                    },
                    select: { startDate: true, endDate: true, reason: true }
                })
            ]);

            res.json({ bookings, blocks });
        } catch (error) {
            console.error('Availability fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch availability' });
        }
    });

    // POST /api/engagement/listings/:id/calendar/block — Block dates
    router.post('/listings/:id/calendar/block', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { id } = req.params as { id: string };
            const { startDate, endDate, reason } = req.body;

            // Verify ownership
            const listing = await prisma.listing.findFirst({
                where: { id, ownerId: userId }
            });
            if (!listing) return res.status(404).json({ error: 'Listing not found or not authorized' });

            const block = await (prisma as any).calendarBlock.create({
                data: {
                    listingId: id,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    reason
                }
            });

            res.status(201).json({ block });
        } catch (error) {
            console.error('Calendar block error:', error);
            res.status(500).json({ error: 'Failed to block dates' });
        }
    });

    return router;
}

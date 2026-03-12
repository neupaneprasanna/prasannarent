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
                                    media: true,
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
                            category: true, reviewCount: true, media: true,
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
                    media: true,
                    bookings: { select: { status: true, totalPrice: true } },
                },
                orderBy: { views: 'desc' }
            });

            const performance = listings.map(l => {
                const mainImage = (l as any).media?.find((m: any) => m.type === 'IMAGE')?.url || l.images[0] || null;
                return {
                    id: l.id,
                    title: l.title,
                    image: mainImage,
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
                };
            });

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
                                priceUnit: true, location: true, media: true,
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

    // ═══════════════════════════════════════════
    //  REPUTATION & POINTS SYSTEM
    // ═══════════════════════════════════════════

    // Activity point values
    const POINT_VALUES: Record<string, { points: number; cooldownMinutes?: number; description: string }> = {
        listing_created: { points: 20, description: 'Created a listing' },
        transaction_completed: { points: 50, description: 'Completed a transaction' },
        review_received_positive: { points: 15, description: 'Received a positive review' },
        comment_posted: { points: 5, cooldownMinutes: 10, description: 'Posted a helpful comment' },
        daily_login: { points: 2, cooldownMinutes: 1440, description: 'Daily login bonus' },
        referral_completed: { points: 40, description: 'Referred a new user' },
        identity_verified: { points: 30, description: 'Verified identity' },
        profile_completed: { points: 10, description: 'Completed profile' },
        first_booking: { points: 25, description: 'Made first booking' },
    };

    // Level thresholds
    const LEVELS = [
        { level: 1, title: 'Explorer', minPoints: 0, maxPoints: 100 },
        { level: 2, title: 'Contributor', minPoints: 100, maxPoints: 500 },
        { level: 3, title: 'Trusted Member', minPoints: 500, maxPoints: 1500 },
        { level: 4, title: 'Community Leader', minPoints: 1500, maxPoints: 5000 },
        { level: 5, title: 'Elite Partner', minPoints: 5000, maxPoints: 15000 },
        { level: 6, title: 'Platform Ambassador', minPoints: 15000, maxPoints: 999999 },
    ];

    function getLevelInfo(points: number) {
        const current = LEVELS.find(l => points >= l.minPoints && points < l.maxPoints) || LEVELS[LEVELS.length - 1];
        const progress = Math.min(100, ((points - current.minPoints) / (current.maxPoints - current.minPoints)) * 100);
        return { ...current, progress: Math.round(progress) };
    }

    function getTrustStatus(score: number) {
        if (score >= 90) return { status: 'Highly Trusted', color: '#34d399' };
        if (score >= 75) return { status: 'Trusted', color: '#60a5fa' };
        if (score >= 50) return { status: 'Standard', color: '#fbbf24' };
        if (score >= 25) return { status: 'Risky', color: '#f97316' };
        return { status: 'Restricted', color: '#ef4444' };
    }

    // POST /api/engagement/reputation/award — Award points for an activity
    router.post('/reputation/award', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { activity } = req.body;

            const activityConfig = POINT_VALUES[activity];
            if (!activityConfig) return res.status(400).json({ error: 'Unknown activity type' });

            // Cooldown check
            if (activityConfig.cooldownMinutes) {
                const cooldownDate = new Date();
                cooldownDate.setMinutes(cooldownDate.getMinutes() - activityConfig.cooldownMinutes);

                const recent = await (prisma as any).pointLedger.findFirst({
                    where: {
                        userId,
                        activity,
                        createdAt: { gte: cooldownDate }
                    }
                });

                if (recent) {
                    return res.status(429).json({ error: 'Activity on cooldown', cooldownMinutes: activityConfig.cooldownMinutes });
                }
            }

            // Award points
            const [ledgerEntry, updatedUser] = await prisma.$transaction([
                (prisma as any).pointLedger.create({
                    data: {
                        userId,
                        activity,
                        points: activityConfig.points,
                        description: activityConfig.description,
                    }
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: {
                        points: { increment: activityConfig.points },
                    } as any
                })
            ]);

            // Recalculate level
            const newLevel = getLevelInfo((updatedUser as any).points);
            if (newLevel.level !== (updatedUser as any).level) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { level: newLevel.level } as any
                });
            }

            res.json({
                pointsAwarded: activityConfig.points,
                totalPoints: (updatedUser as any).points,
                level: newLevel,
            });
        } catch (error) {
            console.error('Award points error:', error);
            res.status(500).json({ error: 'Failed to award points' });
        }
    });

    // GET /api/engagement/reputation/:userId — Get reputation data
    router.get('/reputation/:userId', async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId as string;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true, points: true, level: true, verified: true,
                    fairnessScore: true, responseTime: true,
                    createdAt: true,
                } as any
            });

            if (!user) return res.status(404).json({ error: 'User not found' });

            // Get or create reputation record
            let reputation = await (prisma as any).userReputation.findUnique({
                where: { userId }
            });

            if (!reputation) {
                reputation = await (prisma as any).userReputation.create({
                    data: { userId, overallScore: (user as any).fairnessScore || 50 }
                });
            }

            // Get recent point activity
            const recentActivity = await (prisma as any).pointLedger.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });

            // Get achievements
            const achievements = await (prisma as any).achievement.findMany({
                where: { userId },
                orderBy: { unlockedAt: 'desc' },
            });

            const levelInfo = getLevelInfo((user as any).points);
            const trustInfo = getTrustStatus(reputation.overallScore);

            res.json({
                points: (user as any).points,
                level: levelInfo,
                trustScore: {
                    overall: reputation.overallScore,
                    ...trustInfo,
                    components: {
                        transaction: reputation.transactionScore,
                        review: reputation.reviewScore,
                        verification: reputation.verificationScore,
                        activity: reputation.activityScore,
                        response: reputation.responseScore,
                    },
                    negativeFactors: {
                        reports: reputation.reportCount,
                        disputes: reputation.disputeCount,
                        cancellations: reputation.cancelCount,
                        spam: reputation.spamCount,
                    }
                },
                achievements,
                recentActivity,
                verified: (user as any).verified,
                memberSince: (user as any).createdAt,
            });
        } catch (error) {
            console.error('Reputation fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch reputation' });
        }
    });

    // POST /api/engagement/reputation/recalculate — Recalculate trust score
    router.post('/reputation/recalculate', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;

            // Get user data for calculation
            const [completedBookingsAsRenter, completedBookingsAsHost, reviewsReceived, cancelledBookings, user] = await Promise.all([
                prisma.booking.count({ where: { renterId: userId, status: 'COMPLETED' } }),
                prisma.booking.count({ where: { listing: { ownerId: userId }, status: 'COMPLETED' } }),
                prisma.review.findMany({ where: { listing: { ownerId: userId } }, select: { rating: true } }),
                prisma.booking.count({
                    where: {
                        OR: [
                            { renterId: userId, status: 'CANCELLED' },
                            { listing: { ownerId: userId }, status: 'CANCELLED' }
                        ]
                    }
                }),
                prisma.user.findUnique({
                    where: { id: userId },
                    select: { verified: true, loginCount: true, createdAt: true } as any
                })
            ]);

            if (!user) return res.status(404).json({ error: 'User not found' });

            const totalTransactions = completedBookingsAsRenter + completedBookingsAsHost;
            const transactionScore = Math.min(100, 30 + (totalTransactions * 5));

            const avgRating = reviewsReceived.length > 0
                ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length
                : 2.5;
            const reviewScore = Math.min(100, (avgRating / 5) * 100);

            const verificationScore = (user as any).verified ? 100 : 0;

            const daysSinceJoin = Math.floor((Date.now() - new Date((user as any).createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const activityScore = Math.min(100, 20 + (daysSinceJoin / 2) + ((user as any).loginCount * 2));

            const cancelRate = totalTransactions > 0 ? cancelledBookings / (totalTransactions + cancelledBookings) : 0;
            const responseScore = Math.max(0, 100 - (cancelRate * 100));

            // Weighted average
            const overallScore = Math.round(
                transactionScore * 0.25 +
                reviewScore * 0.25 +
                verificationScore * 0.15 +
                activityScore * 0.15 +
                responseScore * 0.20
            );

            // Update or create
            const reputation = await (prisma as any).userReputation.upsert({
                where: { userId },
                update: {
                    transactionScore: Math.round(transactionScore),
                    reviewScore: Math.round(reviewScore),
                    verificationScore,
                    activityScore: Math.round(activityScore),
                    responseScore: Math.round(responseScore),
                    cancelCount: cancelledBookings,
                    overallScore,
                    lastCalculated: new Date(),
                },
                create: {
                    userId,
                    transactionScore: Math.round(transactionScore),
                    reviewScore: Math.round(reviewScore),
                    verificationScore,
                    activityScore: Math.round(activityScore),
                    responseScore: Math.round(responseScore),
                    cancelCount: cancelledBookings,
                    overallScore,
                }
            });

            // Update user's fairnessScore
            await prisma.user.update({
                where: { id: userId },
                data: { fairnessScore: overallScore } as any
            });

            res.json({ reputation, overallScore });
        } catch (error) {
            console.error('Recalculate reputation error:', error);
            res.status(500).json({ error: 'Failed to recalculate reputation' });
        }
    });

    // ═══════════════════════════════════════════
    //  SUBSCRIPTION SYSTEM
    // ═══════════════════════════════════════════

    const SUBSCRIPTION_TIERS = {
        FREE: { price: 0, features: ['Basic features', 'Up to 5 listings', 'Standard support'] },
        PRO: { price: 9, features: ['Boosted visibility', 'Advanced analytics', 'Profile highlight badge', 'Up to 20 listings', 'Priority support'] },
        BUSINESS: { price: 29, features: ['Business profile verification', 'Bulk listing tools', 'Networking features', 'Unlimited listings', 'Advanced analytics', 'Priority support'] },
        ENTERPRISE: { price: 79, features: ['API integrations', 'Premium exposure', 'Dedicated support', 'Unlimited everything', 'Custom branding', 'White-label options'] },
    };

    // GET /api/engagement/subscription/:userId — Get subscription info
    router.get('/subscription/:userId', async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId as string;

            let subscription = await (prisma as any).subscription.findUnique({
                where: { userId }
            });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { subscriptionTier: true } as any
            });

            if (!subscription) {
                // Default to free
                const tier = (user as any)?.subscriptionTier || 'FREE';
                const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.FREE;
                return res.json({
                    tier,
                    monthlyPrice: tierInfo.price,
                    features: tierInfo.features,
                    isActive: true,
                    startDate: null,
                    renewalDate: null,
                });
            }

            const tierInfo = SUBSCRIPTION_TIERS[subscription.tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.FREE;

            res.json({
                ...subscription,
                features: subscription.features.length > 0 ? subscription.features : tierInfo.features,
                allTiers: SUBSCRIPTION_TIERS,
            });
        } catch (error) {
            console.error('Subscription fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch subscription' });
        }
    });

    // ═══════════════════════════════════════════
    //  SOCIAL CONNECTIONS
    // ═══════════════════════════════════════════

    // GET /api/engagement/connections/:userId — Get user connections
    router.get('/connections/:userId', async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const type = req.query.type as string;

            const where: any = {
                OR: [{ fromUserId: userId }, { toUserId: userId }]
            };
            if (type) where.type = type;

            const connections = await (prisma as any).connection.findMany({
                where,
                include: {
                    fromUser: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true, level: true, subscriptionTier: true } },
                    toUser: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true, level: true, subscriptionTier: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            // Map connections to show the "other" user
            const mapped = connections.map((c: any) => {
                const isFrom = c.fromUserId === userId;
                const otherUser = isFrom ? c.toUser : c.fromUser;
                return {
                    id: c.id,
                    type: c.type,
                    user: otherUser,
                    note: c.note,
                    createdAt: c.createdAt,
                };
            });

            // Group by type
            const grouped = {
                closeFriends: mapped.filter((c: any) => c.type === 'CLOSE_FRIEND'),
                businessFriends: mapped.filter((c: any) => c.type === 'BUSINESS_FRIEND'),
                followers: mapped.filter((c: any) => c.type === 'FOLLOWER'),
                following: mapped.filter((c: any) => c.type === 'FOLLOWING'),
                trustedPartners: mapped.filter((c: any) => c.type === 'TRUSTED_PARTNER'),
            };

            res.json({ connections: mapped, grouped, total: mapped.length });
        } catch (error) {
            console.error('Connections fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch connections' });
        }
    });

    // POST /api/engagement/connections — Add connection
    router.post('/connections', authenticateToken, async (req: Request, res: Response) => {
        try {
            const fromUserId = (req as AuthRequest).user!.userId;
            const { toUserId, type } = req.body;

            if (fromUserId === toUserId) return res.status(400).json({ error: 'Cannot connect with yourself' });

            const connection = await (prisma as any).connection.upsert({
                where: { fromUserId_toUserId: { fromUserId, toUserId } },
                update: { type },
                create: { fromUserId, toUserId, type: type || 'FOLLOWER' },
                include: {
                    toUser: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true, level: true } },
                }
            });

            res.status(201).json({ connection });
        } catch (error) {
            console.error('Add connection error:', error);
            res.status(500).json({ error: 'Failed to add connection' });
        }
    });

    // DELETE /api/engagement/connections/:connectionId — Remove connection
    router.delete('/connections/:connectionId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const { connectionId } = req.params;

            const connection = await (prisma as any).connection.findFirst({
                where: {
                    id: connectionId,
                    OR: [{ fromUserId: userId }, { toUserId: userId }]
                }
            });

            if (!connection) return res.status(404).json({ error: 'Connection not found' });

            await (prisma as any).connection.delete({ where: { id: connectionId } });
            res.json({ success: true });
        } catch (error) {
            console.error('Remove connection error:', error);
            res.status(500).json({ error: 'Failed to remove connection' });
        }
    });

    // ═══════════════════════════════════════════
    //  FULL PROFILE DATA
    // ═══════════════════════════════════════════

    // GET /api/engagement/profile/:userId/full — Complete profile data for profile page
    router.get('/profile/:userId/full', async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;

            const [user, reputation, subscription, achievements, connections, recentPoints, listings, completedBookings, reviewsReceived, followersCount, followingCount] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true, firstName: true, lastName: true, avatar: true,
                        bio: true, verified: true, city: true, interests: true,
                        level: true, points: true, fairnessScore: true,
                        subscriptionTier: true, responseTime: true,
                        createdAt: true,
                    } as any,
                }),
                (prisma as any).userReputation.findUnique({ where: { userId } }),
                (prisma as any).subscription.findUnique({ where: { userId } }),
                (prisma as any).achievement.findMany({
                    where: { userId },
                    orderBy: { unlockedAt: 'desc' },
                }),
                (prisma as any).connection.findMany({
                    where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
                    include: {
                        fromUser: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true, level: true, subscriptionTier: true } },
                        toUser: { select: { id: true, firstName: true, lastName: true, avatar: true, verified: true, level: true, subscriptionTier: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                }),
                (prisma as any).pointLedger.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                }),
                prisma.listing.count({ where: { ownerId: userId, status: 'ACTIVE' } }),
                prisma.booking.count({
                    where: {
                        OR: [
                            { renterId: userId, status: 'COMPLETED' },
                            { listing: { ownerId: userId }, status: 'COMPLETED' }
                        ]
                    }
                }),
                prisma.review.count({ where: { listing: { ownerId: userId } } }),
                (prisma as any).hostFollow.count({ where: { hostId: userId } }),
                (prisma as any).hostFollow.count({ where: { followerId: userId } }),
            ]);

            if (!user) return res.status(404).json({ error: 'User not found' });

            const levelInfo = getLevelInfo((user as any).points);
            const trustInfo = getTrustStatus(reputation?.overallScore || (user as any).fairnessScore);

            // Map connections
            const mappedConnections = (connections || []).map((c: any) => {
                const isFrom = c.fromUserId === userId;
                return {
                    id: c.id,
                    type: c.type,
                    user: isFrom ? c.toUser : c.fromUser,
                    createdAt: c.createdAt,
                };
            });

            const tier = (user as any).subscriptionTier || 'FREE';
            const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.FREE;

            res.json({
                user: {
                    ...(user as any),
                    levelInfo,
                },
                reputation: {
                    trustScore: reputation?.overallScore || (user as any).fairnessScore,
                    ...trustInfo,
                    components: reputation ? {
                        transaction: reputation.transactionScore,
                        review: reputation.reviewScore,
                        verification: reputation.verificationScore,
                        activity: reputation.activityScore,
                        response: reputation.responseScore,
                    } : null,
                    negativeFactors: reputation ? {
                        reports: reputation.reportCount,
                        disputes: reputation.disputeCount,
                        cancellations: reputation.cancelCount,
                        spam: reputation.spamCount,
                    } : null,
                },
                subscription: {
                    tier,
                    monthlyPrice: tierInfo.price,
                    features: subscription?.features?.length > 0 ? subscription.features : tierInfo.features,
                    isActive: subscription?.isActive ?? true,
                    renewalDate: subscription?.renewalDate,
                },
                achievements: achievements || [],
                connections: {
                    all: mappedConnections,
                    closeFriends: mappedConnections.filter((c: any) => c.type === 'CLOSE_FRIEND'),
                    businessFriends: mappedConnections.filter((c: any) => c.type === 'BUSINESS_FRIEND'),
                    followers: mappedConnections.filter((c: any) => c.type === 'FOLLOWER'),
                    following: mappedConnections.filter((c: any) => c.type === 'FOLLOWING'),
                    trustedPartners: mappedConnections.filter((c: any) => c.type === 'TRUSTED_PARTNER'),
                },
                stats: {
                    listings,
                    completedTransactions: completedBookings,
                    reviewsReceived,
                    followersCount,
                    followingCount,
                    totalConnections: mappedConnections.length,
                },
                recentActivity: recentPoints || [],
                allLevels: LEVELS,
                allSubscriptionTiers: SUBSCRIPTION_TIERS,
            });
        } catch (error) {
            console.error('Full profile fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch full profile' });
        }
    });

    return router;
}

import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

// ═══════════════════════════════════════════
//  TOOL DEFINITIONS — what the AI can do
// ═══════════════════════════════════════════

export interface AgentTool {
    name: string;
    description: string;
    parameters: Record<string, { type: string; description: string; required?: boolean; enum?: string[] }>;
}

const AGENT_TOOLS: AgentTool[] = [
    {
        name: "navigate",
        description: "Navigate the user to a specific page on the platform. Use this when the user wants to go somewhere (e.g., use /listings/new when they want to add an item).",
        parameters: {
            page: {
                type: "string",
                description: "The relative page path to navigate to, starting with / (e.g., '/', '/explore', '/dashboard', '/profile/[userId]', '/item/[listingId]', '/messages'). NEVER include http:// or localhost.",
                required: true,
            },
            reason: { type: "string", description: "Brief explanation of why navigating here" }
        }
    },
    {
        name: "search_listings",
        description: "Search for rental listings/items on the platform. Use this when the user wants to find items to rent, asks about products, or wants recommendations.",
        parameters: {
            query: { type: "string", description: "Search keywords", required: true },
            category: { type: "string", description: "Filter by category (e.g., Tech, Vehicles, Tools, Fashion, Sports, Music, Furniture, Cameras)" },
            sort: { type: "string", description: "Sort order", enum: ["price_asc", "price_desc", "rating_desc", "newest"] },
            minPrice: { type: "number", description: "Minimum price filter" },
            maxPrice: { type: "number", description: "Maximum price filter" },
            limit: { type: "number", description: "Max number of results (default 5)" }
        }
    },
    {
        name: "get_listing_details",
        description: "Get full details of a specific listing by its ID. Use when the user asks about a specific item or wants info about something they're viewing.",
        parameters: {
            listingId: { type: "string", description: "The listing ID", required: true }
        }
    },
    {
        name: "summarize_listing",
        description: "Generate an AI summary of a listing. Use when user asks to summarize an item, describe what's on the current page, or wants a quick overview.",
        parameters: {
            listingId: { type: "string", description: "The listing ID to summarize", required: true }
        }
    },
    {
        name: "search_users",
        description: "Search for users on the platform by name or role.",
        parameters: {
            query: { type: "string", description: "Name or keyword to search", required: true },
            role: { type: "string", description: "Filter by role", enum: ["USER", "ADMIN"] }
        }
    },
    {
        name: "get_my_bookings",
        description: "Get the current user's bookings. Use when user asks about their bookings, reservations, or rentals.",
        parameters: {
            status: { type: "string", description: "Filter by booking status", enum: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "all"] }
        }
    },
    {
        name: "cancel_booking",
        description: "Cancel one of the user's bookings. IMPORTANT: This is a destructive action — always confirm with the user first before calling this.",
        parameters: {
            bookingId: { type: "string", description: "The booking ID to cancel", required: true }
        }
    },
    {
        name: "get_reviews",
        description: "Get reviews for a specific listing.",
        parameters: {
            listingId: { type: "string", description: "The listing ID to get reviews for", required: true }
        }
    },
    {
        name: "get_my_wishlist",
        description: "Get the user's wishlist collections and saved items.",
        parameters: {}
    },
    {
        name: "get_my_listings",
        description: "Get listings owned by the current user (as a host).",
        parameters: {
            status: { type: "string", description: "Filter by status", enum: ["ACTIVE", "DRAFT", "PAUSED", "all"] }
        }
    },
    {
        name: "get_earnings_summary",
        description: "Get a summary of the host's earnings from rentals.",
        parameters: {}
    },
    {
        name: "get_notifications",
        description: "Get the user's recent notifications.",
        parameters: {
            unreadOnly: { type: "boolean", description: "Only show unread notifications" }
        }
    },
    {
        name: "answer_question",
        description: "Answer a general question about the Nexis platform, how something works, or provide help. Use this as a fallback when no specific tool is needed.",
        parameters: {
            topic: { type: "string", description: "The topic of the question", required: true }
        }
    },
    {
        name: "toggle_wishlist_item",
        description: "Add or remove an item from the user's wishlist. Use this when the user says 'save this for later' or 'remove this from my wishlist'. Requires a listingId.",
        parameters: {
            listingId: { type: "string", description: "The listing ID to save/remove. ALWAYS use the listingId from the page context if the user is currently viewing an item and asks to save 'this' item.", required: true }
        }
    },
    {
        name: "draft_listing",
        description: "Quickly prepare a draft for a new rental listing and navigate the user to the creation page pre-filled with this data. Use when the user wants to rent out their own item.",
        parameters: {
            title: { type: "string", description: "A catchy, professional title for the item", required: true },
            description: { type: "string", description: "Detailed description of the item", required: true },
            category: { type: "string", description: "Category (e.g., Tech, Vehicles, Tools, Fashion)", required: true },
            price: { type: "number", description: "Suggested daily rental price", required: true }
        }
    },
    {
        name: "message_owner",
        description: "Send a direct message to the owner of a listing. Use when the user asks to 'message the owner' or 'ask if this is available'.",
        parameters: {
            listingId: { type: "string", description: "The ID of the listing whose owner to message (from page context)", required: true },
            content: { type: "string", description: "The message content to send", required: true }
        }
    },
    {
        name: "toggle_theme",
        description: "Switch the application UI between light mode and dark mode. Use when the user complains about brightness or asks for dark/light mode.",
        parameters: {
            theme: { type: "string", description: "The target theme", enum: ["dark", "light", "system"], required: true }
        }
    },
    {
        name: "estimate_price",
        description: "Estimate a fair market daily rental price for an item by looking at similar listings on the platform. Use when the user asks 'how much should I charge for X?'",
        parameters: {
            itemName: { type: "string", description: "The name of the item to estimate (e.g. 'PS5', 'Drone'). Should be concise.", required: true }
        }
    },
    {
        name: "analyze_chat",
        description: "Analyze the active chat room from the page context. Use this when the user asks 'what did we agree on?' or 'summarize this chat'.",
        parameters: {}
    },
    {
        name: "draft_chat_reply",
        description: "Draft a reply to the ongoing conversation in the active chat. Use this when the user says 'tell them yes' or 'decline the offer'.",
        parameters: {
            content: { type: "string", description: "The drafted reply text to put in the chat input.", required: true }
        }
    },
    {
        name: "create_booking_request",
        description: "Initiate a booking request for an item. Use when the user says 'book this' or 'I want to rent it'. Navigates to booking page.",
        parameters: {
            listingId: { type: "string", description: "The ID of the listing to book.", required: true },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)", required: true },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)", required: true }
        }
    },
    {
        name: "analyze_host",
        description: "Analyze a host's reputation and trust metrics. Use when the user asks 'is this host reliable?'.",
        parameters: {
            hostId: { type: "string", description: "The user ID of the host.", required: true }
        }
    },
    {
        name: "negotiation_prep",
        description: "Prepare a negotiation strategy for an item.",
        parameters: {
            listingId: { type: "string", description: "The listing ID.", required: true }
        }
    },
    {
        name: "rent_vs_buy",
        description: "Calculate whether it makes sense to rent or buy an item, based on typical MSRP.",
        parameters: {
            itemName: { type: "string", description: "Name of the item.", required: true },
            dailyPrice: { type: "number", description: "Daily rental price.", required: true },
            daysNeeded: { type: "number", description: "Number of days the user needs it.", required: true }
        }
    }
];

// ═══════════════════════════════════════════
//  SYSTEM PROMPT — the agent's personality
// ═══════════════════════════════════════════

function buildSystemPrompt(userId: string, currentPage: string, pageContext: any): string {
    const toolDescriptions = AGENT_TOOLS.map(t => {
        const params = Object.entries(t.parameters).map(([k, v]) => {
            let desc = `    - ${k} (${v.type}${v.required ? ', required' : ''}): ${v.description}`;
            if (v.enum) desc += ` [options: ${v.enum.join(', ')}]`;
            return desc;
        }).join('\n');
        return `  ${t.name}: ${t.description}\n${params}`;
    }).join('\n\n');

    return `You are Nexis AI, the autonomous intelligent assistant for the Nexis rental platform.
You are speaking with user ID: ${userId}
The user is currently on page: ${currentPage}
Current Context extracted from the app state: ${JSON.stringify(pageContext || {})}

YOUR PERSONALITY:
- You are helpful, concise, and confident
- You execute tasks immediately when possible — don't just explain, DO it
- You speak in a friendly but professional tone
- When the user asks you to do something, you DO it (call the right tool)
- You never say "I can't do that" — you find a way or explain alternatives

AVAILABLE TOOLS:
${toolDescriptions}

RESPONSE FORMAT:
You MUST respond with a JSON object containing:
{
  "thinking": "Your internal reasoning about what the user wants (1-2 sentences)",
  "tool_calls": [
    {
      "tool": "tool_name",
      "args": { "param1": "value1" },
      "requires_confirmation": true/false
    }
  ],
  "message": "Your response message to the user (markdown supported)",
  "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2"]
}

CRITICAL RULES:
1. For DESTRUCTIVE actions (cancel_booking, etc.), set requires_confirmation: true. NEVER execute destructive actions without confirmation.
2. For NAVIGATION actions, execute immediately (requires_confirmation: false).
3. For SEARCH actions, execute immediately and describe results.
4. You can call MULTIPLE tools in one response (e.g., search then navigate).
5. If the user says "summarize this" or "what's on this page", extract the listing ID from the currentPage URL (e.g., /item/abc123 → listingId = abc123).
6. If the user asks for the "cheapest" something, use sort: "price_asc" and limit: 1.
7. If the user asks for "best rated", use sort: "rating_desc".
8. Be proactive — suggest follow-up actions after completing a task.
9. ALWAYS respond with valid JSON. No text before or after the JSON.
10. Keep the "message" field conversational and helpful, using emojis sparingly.`;
}

// ═══════════════════════════════════════════
//  TOOL EXECUTION — database queries & actions
// ═══════════════════════════════════════════

export interface ToolResult {
    tool: string;
    success: boolean;
    data: any;
    requiresConfirmation?: boolean;
}

async function executeSearchListings(args: any): Promise<ToolResult> {
    try {
        const where: any = { status: 'ACTIVE' };
        const conditions: any[] = [];

        if (args.query) {
            const words = args.query.split(' ').filter((w: string) => w.length > 1);
            if (words.length > 0) {
                const searchConditions = words.map((word: string) => ({
                    OR: [
                        { title: { contains: word, mode: 'insensitive' } },
                        { description: { contains: word, mode: 'insensitive' } },
                        { category: { contains: word, mode: 'insensitive' } },
                        { tags: { hasSome: [word.toLowerCase()] } }
                    ]
                }));
                conditions.push({ AND: searchConditions });
            }
        }

        if (args.category) {
            conditions.push({ category: { equals: args.category, mode: 'insensitive' } });
        }

        if (args.minPrice || args.maxPrice) {
            where.price = {};
            if (args.minPrice) where.price.gte = parseFloat(args.minPrice);
            if (args.maxPrice) where.price.lte = parseFloat(args.maxPrice);
        }

        if (conditions.length > 0) where.AND = conditions;

        let orderBy: any = { createdAt: 'desc' };
        if (args.sort === 'price_asc') orderBy = { price: 'asc' };
        else if (args.sort === 'price_desc') orderBy = { price: 'desc' };
        else if (args.sort === 'rating_desc') orderBy = { rating: 'desc' };

        const listings = await prisma.listing.findMany({
            where,
            orderBy,
            take: Math.min(args.limit || 5, 10),
            select: {
                id: true, title: true, price: true, priceUnit: true,
                category: true, rating: true, location: true, images: true,
                views: true, reviewCount: true, available: true,
                owner: { select: { firstName: true, verified: true } }
            }
        });

        return { tool: 'search_listings', success: true, data: { listings, count: listings.length } };
    } catch (error) {
        return { tool: 'search_listings', success: false, data: { error: 'Failed to search listings' } };
    }
}

async function executeGetListingDetails(args: any): Promise<ToolResult> {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: args.listingId },
            include: {
                owner: { select: { id: true, firstName: true, lastName: true, verified: true, avatar: true } },
                media: { orderBy: { order: 'asc' }, take: 5 },
                pricing: true,
                reviews: {
                    take: 3,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { firstName: true } } }
                }
            }
        });

        if (!listing) return { tool: 'get_listing_details', success: false, data: { error: 'Listing not found' } };
        return { tool: 'get_listing_details', success: true, data: { listing } };
    } catch (error) {
        return { tool: 'get_listing_details', success: false, data: { error: 'Failed to fetch listing' } };
    }
}

async function executeSummarizeListing(args: any): Promise<ToolResult> {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: args.listingId },
            include: {
                owner: { select: { firstName: true, verified: true } },
                reviews: { take: 5, orderBy: { createdAt: 'desc' }, select: { rating: true, text: true } },
                pricing: true
            }
        });

        if (!listing) return { tool: 'summarize_listing', success: false, data: { error: 'Listing not found' } };

        // Generate AI summary
        if (groq) {
            const summaryCompletion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant. Summarize this rental listing in 3-4 sentences covering: what it is, condition/quality, price value, and key highlights. Be concise and informative."
                    },
                    {
                        role: "user",
                        content: `Title: ${listing.title}\nCategory: ${listing.category}\nPrice: $${listing.price}/${listing.priceUnit}\nDescription: ${listing.description}\nRating: ${listing.rating}/5 (${listing.reviewCount} reviews)\nOwner: ${listing.owner.firstName} (${listing.owner.verified ? 'Verified' : 'Unverified'})\nRecent Reviews: ${listing.reviews.map(r => `${r.rating}★: ${r.text}`).join('; ')}`
                    }
                ],
                max_tokens: 200
            });
            const summary = summaryCompletion.choices[0]?.message?.content || 'Unable to generate summary.';
            return { tool: 'summarize_listing', success: true, data: { summary, listing: { id: listing.id, title: listing.title, price: listing.price, priceUnit: listing.priceUnit, rating: listing.rating } } };
        }

        return { tool: 'summarize_listing', success: true, data: { summary: `${listing.title} — $${listing.price}/${listing.priceUnit}. ${listing.category} with ${listing.rating}★ rating from ${listing.reviewCount} reviews.`, listing: { id: listing.id, title: listing.title } } };
    } catch (error) {
        return { tool: 'summarize_listing', success: false, data: { error: 'Failed to summarize' } };
    }
}

async function executeSearchUsers(args: any): Promise<ToolResult> {
    try {
        const words = args.query.split(' ').filter((w: string) => w.length > 1);
        const conditions = words.flatMap((word: string) => [
            { firstName: { contains: word, mode: 'insensitive' as any } },
            { lastName: { contains: word, mode: 'insensitive' as any } }
        ]);

        const where: any = { banned: false, OR: conditions };
        if (args.role && args.role !== 'all') where.role = args.role;

        const users = await prisma.user.findMany({
            where,
            take: 5,
            select: {
                id: true, firstName: true, lastName: true, avatar: true,
                verified: true, role: true, level: true, points: true
            }
        });

        return { tool: 'search_users', success: true, data: { users, count: users.length } };
    } catch (error) {
        return { tool: 'search_users', success: false, data: { error: 'Failed to search users' } };
    }
}

async function executeGetMyBookings(userId: string, args: any): Promise<ToolResult> {
    try {
        const where: any = { renterId: userId };
        if (args.status && args.status !== 'all') where.status = args.status;

        const bookings = await prisma.booking.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                listing: { select: { id: true, title: true, images: true, price: true, priceUnit: true } },
            }
        });

        return { tool: 'get_my_bookings', success: true, data: { bookings, count: bookings.length } };
    } catch (error) {
        return { tool: 'get_my_bookings', success: false, data: { error: 'Failed to fetch bookings' } };
    }
}

async function executeCancelBooking(userId: string, args: any): Promise<ToolResult> {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: args.bookingId },
            include: { listing: { select: { title: true, ownerId: true } } }
        });

        if (!booking) return { tool: 'cancel_booking', success: false, data: { error: 'Booking not found' } };
        if (booking.renterId !== userId) return { tool: 'cancel_booking', success: false, data: { error: 'This booking does not belong to you' } };
        if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
            return { tool: 'cancel_booking', success: false, data: { error: `Booking is already ${booking.status.toLowerCase()}` } };
        }

        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: args.bookingId },
                data: { status: 'CANCELLED' }
            });

            await tx.notification.create({
                data: {
                    userId: booking.listing.ownerId,
                    type: 'BOOKING_CANCELLED',
                    title: 'Booking Cancelled',
                    message: `A booking for "${booking.listing.title}" has been cancelled by the renter.`
                }
            });
        });

        return { tool: 'cancel_booking', success: true, data: { message: `Booking for "${booking.listing.title}" has been cancelled successfully.` } };
    } catch (error) {
        return { tool: 'cancel_booking', success: false, data: { error: 'Failed to cancel booking' } };
    }
}

async function executeGetReviews(args: any): Promise<ToolResult> {
    try {
        const reviews = await prisma.review.findMany({
            where: { listingId: args.listingId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { firstName: true, lastName: true, avatar: true } },
                listing: { select: { title: true } }
            }
        });

        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 'N/A';

        return { tool: 'get_reviews', success: true, data: { reviews, count: reviews.length, avgRating } };
    } catch (error) {
        return { tool: 'get_reviews', success: false, data: { error: 'Failed to fetch reviews' } };
    }
}

async function executeGetMyWishlist(userId: string): Promise<ToolResult> {
    try {
        const collections = await prisma.wishlistCollection.findMany({
            where: { userId },
            include: {
                items: {
                    take: 5,
                    include: {
                        listing: { select: { id: true, title: true, price: true, priceUnit: true, images: true, category: true } }
                    }
                }
            }
        });

        return { tool: 'get_my_wishlist', success: true, data: { collections, count: collections.length } };
    } catch (error) {
        return { tool: 'get_my_wishlist', success: false, data: { error: 'Failed to fetch wishlist' } };
    }
}

async function executeGetMyListings(userId: string, args: any): Promise<ToolResult> {
    try {
        const where: any = { ownerId: userId };
        if (args.status && args.status !== 'all') where.status = args.status;

        const listings = await prisma.listing.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true, title: true, price: true, priceUnit: true,
                category: true, status: true, views: true, rating: true,
                reviewCount: true, bookingCount: true, available: true
            }
        });

        return { tool: 'get_my_listings', success: true, data: { listings, count: listings.length } };
    } catch (error) {
        return { tool: 'get_my_listings', success: false, data: { error: 'Failed to fetch your listings' } };
    }
}

async function executeGetEarningsSummary(userId: string): Promise<ToolResult> {
    try {
        const completedBookings = await prisma.booking.findMany({
            where: {
                listing: { ownerId: userId },
                status: { in: ['COMPLETED', 'ACTIVE', 'CONFIRMED'] }
            },
            select: { totalPrice: true, status: true, createdAt: true }
        });

        const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const activeBookings = completedBookings.filter(b => b.status === 'ACTIVE' || b.status === 'CONFIRMED').length;
        const completedCount = completedBookings.filter(b => b.status === 'COMPLETED').length;

        return {
            tool: 'get_earnings_summary', success: true,
            data: { totalEarnings, activeBookings, completedRentals: completedCount, totalTransactions: completedBookings.length }
        };
    } catch (error) {
        return { tool: 'get_earnings_summary', success: false, data: { error: 'Failed to fetch earnings' } };
    }
}

async function executeGetNotifications(userId: string, args: any): Promise<ToolResult> {
    try {
        const where: any = { userId };
        if (args.unreadOnly) where.read = false;

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return { tool: 'get_notifications', success: true, data: { notifications, count: notifications.length } };
    } catch (error) {
        return { tool: 'get_notifications', success: false, data: { error: 'Failed to fetch notifications' } };
    }
}

async function executeToggleWishlist(userId: string, args: any): Promise<ToolResult> {
    try {
        if (!args.listingId) return { tool: 'toggle_wishlist_item', success: false, data: { error: 'No listing ID provided in context or parameters.' } };
        
        // Find default wishlist
        let wishlist = await prisma.wishlistCollection.findFirst({
            where: { userId, isDefault: true }
        });
        
        if (!wishlist) {
            wishlist = await prisma.wishlistCollection.create({
                data: { userId, name: 'Saved Items', isDefault: true }
            });
        }
        
        // Check if item is already in wishlist
        const existingItem = await prisma.wishlistItem.findUnique({
            where: {
                collectionId_listingId: {
                    collectionId: wishlist.id,
                    listingId: args.listingId
                }
            }
        });

        if (existingItem) {
            await prisma.wishlistItem.delete({
                where: { id: existingItem.id }
            });
            return { tool: 'toggle_wishlist_item', success: true, data: { message: 'Removed listing from your saved items.', status: 'removed' } };
        } else {
            await prisma.wishlistItem.create({
                data: {
                    collectionId: wishlist.id,
                    listingId: args.listingId
                }
            });
            return { tool: 'toggle_wishlist_item', success: true, data: { message: 'Added listing to your saved items.', status: 'added' } };
        }
    } catch (error: any) {
        return { tool: 'toggle_wishlist_item', success: false, data: { error: 'Failed to modify wishlist' } };
    }
}

async function executeEstimatePrice(args: any): Promise<ToolResult> {
    try {
        const word = args.itemName.split(' ')[0] || args.itemName;
        const similarListings = await prisma.listing.findMany({
            where: {
                OR: [
                    { title: { contains: word, mode: 'insensitive' } },
                    { description: { contains: word, mode: 'insensitive' } }
                ],
                status: 'ACTIVE'
            },
            take: 10,
            select: { price: true, title: true }
        });

        if (similarListings.length === 0) {
            return { tool: 'estimate_price', success: true, data: { itemName: args.itemName, estimate: null, message: `I couldn't find enough similar items to "${args.itemName}" to give an accurate price estimate. Consider checking general market rates.` } };
        }

        const avgPrice = similarListings.reduce((sum, l) => sum + l.price, 0) / similarListings.length;
        return { 
            tool: 'estimate_price', 
            success: true, 
            data: { 
                itemName: args.itemName, 
                estimateRange: { min: Math.max(1, avgPrice * 0.7).toFixed(2), max: (avgPrice * 1.3).toFixed(2), avg: avgPrice.toFixed(2) },
                basedOn: similarListings.length,
                message: `Based on ${similarListings.length} similar items, you should charge around $${avgPrice.toFixed(2)}/day.`
            } 
        };
    } catch (error) {
        return { tool: 'estimate_price', success: false, data: { error: "Failed to estimate price" } };
    }
}

async function executeMessageOwner(userId: string, args: any): Promise<ToolResult> {
    try {
        if (!args.listingId) return { tool: 'message_owner', success: false, data: { error: 'No listing specified.' } };
        if (!args.content) return { tool: 'message_owner', success: false, data: { error: 'No message content provided.' } };

        const listing = await prisma.listing.findUnique({
            where: { id: args.listingId },
            include: { owner: { select: { id: true, firstName: true } } }
        });

        if (!listing) return { tool: 'message_owner', success: false, data: { error: 'Listing not found.' } };
        if (listing.ownerId === userId) return { tool: 'message_owner', success: false, data: { error: 'You cannot message yourself.' } };

        // Transaction to find or create chat and send message
        const result = await prisma.$transaction(async (tx) => {
            // Find existing 1-on-1 chat
            const existingChats = await tx.chatRoom.findMany({
                where: {
                    isGroup: false,
                    members: { some: { userId } }
                },
                include: { members: true }
            });

            let targetChat = existingChats.find(chat => 
                chat.members.some(m => m.userId === listing.ownerId) && chat.members.length === 2
            );

            if (!targetChat) {
                targetChat = await tx.chatRoom.create({
                    data: {
                        isGroup: false,
                        members: {
                            create: [{ userId }, { userId: listing.ownerId }]
                        }
                    },
                    include: { members: true }
                });
            }

            const senderMember = targetChat.members.find(m => m.userId === userId);

            const message = await tx.message.create({
                data: {
                    content: args.content,
                    senderId: senderMember!.id,
                    chatRoomId: targetChat.id,
                }
            });

            return { chatRoom: targetChat, message, ownerName: listing.owner.firstName };
        });

        return { 
            tool: 'message_owner', 
            success: true, 
            data: { 
                chatRoomId: result.chatRoom.id, 
                message: `Sent message to ${result.ownerName}: "${args.content}"` 
            } 
        };
    } catch (error) {
        return { tool: 'message_owner', success: false, data: { error: 'Failed to send message' } };
    }
}

async function executeAnalyzeChat(pageContext: any): Promise<ToolResult> {
    if (!pageContext.activeChat) {
        return { tool: 'analyze_chat', success: false, data: { error: 'No active chat context found. User must be in a conversation on the messages page.' } };
    }
    return { 
        tool: 'analyze_chat', 
        success: true, 
        data: { 
            chatData: pageContext.activeChat, 
            instruction: "You can now read the chatData and summarize what was discussed, explicitly extracting prices, dates, or meeting locations."
        } 
    };
}

async function executeDraftChatReply(args: any): Promise<ToolResult> {
    return {
        tool: 'draft_chat_reply',
        success: true,
        data: { message: "Drafted reply loaded into the chat input.", draftedText: args.content }
    };
}

async function executeCreateBookingRequest(args: any): Promise<ToolResult> {
    return {
        tool: 'create_booking_request',
        success: true,
        data: { message: "Navigating to checkout.", listingId: args.listingId, startDate: args.startDate, endDate: args.endDate }
    };
}

async function executeAnalyzeHost(args: any): Promise<ToolResult> {
    try {
        const rep = await (prisma as any).userReputation?.findUnique({ where: { userId: args.hostId } });
        const user = await prisma.user.findUnique({ where: { id: args.hostId }, select: { firstName: true, createdAt: true, fairnessScore: true, verified: true }});
        return {
            tool: 'analyze_host',
            success: true,
            data: { user, reputation: rep || { note: "No advanced metrics available yet." } }
        };
    } catch {
        return { tool: 'analyze_host', success: false, data: { error: "Failed to fetch host data" } };
    }
}

async function executeNegotiationPrep(args: any, pageContext: any): Promise<ToolResult> {
    const listingId = args.listingId || pageContext?.listingId;
    if (!listingId) return { tool: 'negotiation_prep', success: false, data: { error: 'No listing ID provided' } };
    try {
        const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { owner: { select: { responseTime: true, fairnessScore: true }}}});
        if (!listing) return { tool: 'negotiation_prep', success: false, data: { error: "Listing not found" } };
        
        const comparables = await prisma.listing.findMany({
            where: { category: listing.category, id: { not: listingId }, status: 'ACTIVE' },
            select: { price: true },
            take: 10
        });
        const marketAvg = comparables.length > 0 ? comparables.reduce((a,c)=>a+c.price,0)/comparables.length : listing.price;
        
        return { tool: 'negotiation_prep', success: true, data: { listingPrice: listing.price, marketAvg, hostResponseTime: listing.owner.responseTime, hostFairness: listing.owner.fairnessScore }};
    } catch {
        return { tool: 'negotiation_prep', success: false, data: { error: "Failed to load prep data" }};
    }
}

async function executeRentVsBuy(args: any): Promise<ToolResult> {
    return {
        tool: 'rent_vs_buy',
        success: true,
        data: { 
            instruction: "Use typical MSRP knowledge of this item to compare with renting. Emphasize the break-even math.",
            dailyPrice: args.dailyPrice, 
            daysNeeded: args.daysNeeded
        }
    };
}

// ═══════════════════════════════════════════
//  MAIN AGENT FUNCTION
// ═══════════════════════════════════════════

export interface AgentMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AgentResponse {
    message: string;
    toolResults: ToolResult[];
    actions: Array<{ type: string; payload: any; requiresConfirmation: boolean }>;
    suggestions: string[];
}

export async function runAgent(
    userId: string,
    userMessage: string,
    currentPage: string,
    pageContext: any,
    conversationHistory: AgentMessage[],
    confirmedAction?: { tool: string; args: any }
): Promise<AgentResponse> {
    // If this is a confirmed action, execute it directly
    if (confirmedAction) {
        let result: ToolResult;
        switch (confirmedAction.tool) {
            case 'cancel_booking':
                result = await executeCancelBooking(userId, confirmedAction.args);
                break;
            default:
                result = { tool: confirmedAction.tool, success: false, data: { error: 'Unknown action' } };
        }
        return {
            message: result.success ? `✅ ${result.data.message || 'Action completed successfully.'}` : `❌ ${result.data.error || 'Action failed.'}`,
            toolResults: [result],
            actions: [],
            suggestions: result.success ? ['Show my bookings', 'Go to dashboard'] : ['Try again', 'Show my bookings']
        };
    }

    if (!groq) {
        return {
            message: "I'm sorry, the AI service is not configured. Please add a GROQ_API_KEY to your environment.",
            toolResults: [],
            actions: [],
            suggestions: []
        };
    }

    try {
        // Build conversation context
        const recentHistory = conversationHistory.slice(-8);
        const messages: any[] = [
            { role: "system", content: buildSystemPrompt(userId, currentPage, pageContext) },
            ...recentHistory.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
        ];

        // Ask LLM to decide what to do
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 1024
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        let parsed: any;
        try {
            parsed = JSON.parse(responseText);
        } catch {
            return {
                message: "I had trouble processing that. Could you rephrase your request?",
                toolResults: [],
                actions: [],
                suggestions: ['Search for items', 'Show my bookings', 'Go to explore']
            };
        }

        const toolCalls = parsed.tool_calls || [];
        const toolResults: ToolResult[] = [];
        const actions: Array<{ type: string; payload: any; requiresConfirmation: boolean }> = [];

        // Execute each tool call
        for (const call of toolCalls) {
            const args = call.args || {};
            const needsConfirmation = call.requires_confirmation === true;

            if (needsConfirmation) {
                // Don't execute — send back as pending action
                actions.push({
                    type: call.tool,
                    payload: args,
                    requiresConfirmation: true
                });
                continue;
            }

            let result: ToolResult;
            switch (call.tool) {
                case 'navigate':
                    actions.push({ type: 'navigate', payload: { page: args.page, reason: args.reason }, requiresConfirmation: false });
                    result = { tool: 'navigate', success: true, data: { page: args.page } };
                    break;
                case 'search_listings':
                    result = await executeSearchListings(args);
                    break;
                case 'get_listing_details':
                    result = await executeGetListingDetails(args);
                    break;
                case 'summarize_listing':
                    result = await executeSummarizeListing(args);
                    break;
                case 'search_users':
                    result = await executeSearchUsers(args);
                    break;
                case 'get_my_bookings':
                    result = await executeGetMyBookings(userId, args);
                    break;
                case 'cancel_booking':
                    // Force confirmation even if LLM didn't set it
                    actions.push({ type: 'cancel_booking', payload: args, requiresConfirmation: true });
                    result = { tool: 'cancel_booking', success: true, data: { message: 'Awaiting confirmation' } };
                    break;
                case 'get_reviews':
                    result = await executeGetReviews(args);
                    break;
                case 'get_my_wishlist':
                    result = await executeGetMyWishlist(userId);
                    break;
                case 'get_my_listings':
                    result = await executeGetMyListings(userId, args);
                    break;
                case 'get_earnings_summary':
                    result = await executeGetEarningsSummary(userId);
                    break;
                case 'get_notifications':
                    result = await executeGetNotifications(userId, args);
                    break;
                case 'answer_question':
                    result = { tool: 'answer_question', success: true, data: { topic: args.topic } };
                    break;
                case 'toggle_wishlist_item':
                    result = await executeToggleWishlist(userId, args);
                    break;
                case 'estimate_price':
                    result = await executeEstimatePrice(args);
                    break;
                case 'message_owner':
                    // Force confirmation for messaging
                    actions.push({ type: 'message_owner', payload: args, requiresConfirmation: true });
                    result = { tool: 'message_owner', success: true, data: { message: 'Awaiting confirmation before sending message.' } };
                    break;
                case 'draft_listing':
                    actions.push({ type: 'populate_draft', payload: { draft: { title: args.title, description: args.description, category: args.category, price: args.price } }, requiresConfirmation: false });
                    result = { tool: 'draft_listing', success: true, data: { message: 'Listing draft prepared. Navigating you to the creation screen.' } };
                    break;
                case 'toggle_theme':
                    actions.push({ type: 'theme', payload: { theme: args.theme }, requiresConfirmation: false });
                    result = { tool: 'toggle_theme', success: true, data: { message: `Theme switched to ${args.theme}.` } };
                    break;
                case 'analyze_chat':
                    result = await executeAnalyzeChat(pageContext);
                    break;
                case 'draft_chat_reply':
                    actions.push({ type: 'draft_chat_reply', payload: { content: args.content }, requiresConfirmation: false });
                    result = await executeDraftChatReply(args);
                    break;
                case 'create_booking_request':
                    actions.push({ type: 'navigate', payload: { page: `/booking/${args.listingId}?start=${args.startDate}&end=${args.endDate}` }, requiresConfirmation: false });
                    result = await executeCreateBookingRequest(args);
                    break;
                case 'analyze_host':
                    result = await executeAnalyzeHost(args);
                    break;
                case 'negotiation_prep':
                    result = await executeNegotiationPrep(args, pageContext);
                    break;
                case 'rent_vs_buy':
                    result = await executeRentVsBuy(args);
                    break;
                default:
                    result = { tool: call.tool, success: false, data: { error: `Unknown tool: ${call.tool}` } };
            }
            toolResults.push(result);
        }

        // If we got tool results, ask LLM to format a nice response incorporating the data
        let finalMessage = parsed.message || "I've completed your request.";

        if (toolResults.length > 0 && toolResults.some(r => r.data && Object.keys(r.data).length > 1)) {
            try {
                const dataContext = toolResults.map(r => `Tool: ${r.tool}\nSuccess: ${r.success}\nData: ${JSON.stringify(r.data, null, 1).substring(0, 2000)}`).join('\n\n');

                const formatCompletion = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are Nexis AI assistant. The user asked: "${userMessage}". You executed tools and got results. Format a helpful, conversational response based on the data below. Use markdown for formatting. Be concise but informative. Include key details like prices, ratings, and names. If showing listings, format them as a clean numbered list. If navigating, mention where you're taking them. Keep it under 200 words.`
                        },
                        { role: "user", content: dataContext }
                    ],
                    max_tokens: 400,
                    temperature: 0.4
                });
                finalMessage = formatCompletion.choices[0]?.message?.content || finalMessage;
            } catch {
                // Keep the original LLM message as fallback
            }
        }

        return {
            message: finalMessage,
            toolResults,
            actions,
            suggestions: parsed.suggestions || []
        };
    } catch (error) {
        console.error('Agent error:', error);
        return {
            message: "I encountered an error processing your request. Please try again.",
            toolResults: [],
            actions: [],
            suggestions: ['Try again', 'Go to explore', 'Show my bookings']
        };
    }
}

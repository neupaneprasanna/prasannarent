export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    verified?: boolean;
}

export interface Listing {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    priceUnit: string;
    location: string;
    images: string[];
    ownerId: string;
    owner?: User;
    latitude?: number;
    longitude?: number;
    available: boolean;
    featured?: boolean;
    views?: number;
    rating?: number;
    reviewCount?: number;
    tags?: string[];
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'BLOCKED';
    media?: { id: string; url: string; type: string; order: number }[];
    attributes?: { key: string; value: string }[];
    pricing?: {
        hourlyPrice?: number;
        weeklyPrice?: number;
        monthlyPrice?: number;
        weekendMultiplier?: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Booking {
    id: string;
    listingId: string;
    listing?: Listing;
    userId: string;
    user?: User;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    createdAt: string;
}

export interface Review {
    id: string;
    listingId: string;
    userId: string;
    user?: User;
    rating: number;
    text: string;
    createdAt: string;
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/nav/Navbar';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import {
    User, MapPin, Calendar, Star, ShieldCheck, Package, MessageSquare,
    ExternalLink, Loader2, Trophy
} from 'lucide-react';
import Link from 'next/link';

interface ProfileData {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        bio?: string;
        verified: boolean;
        city?: string;
        interests: string[];
        createdAt: string;
    };
    listings: any[];
    reviews: any[];
    stats: { listingCount: number; reviewCount: number };
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

    const userId = params.id as string;
    const isOwnProfile = currentUser?.id === userId;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get<ProfileData>(`/users/${userId}`);
                setProfile(res);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchProfile();
    }, [userId]);

    const handleStartConversation = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        router.push(`/messages?startWith=${userId}`);
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Loader2 size={40} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                </div>
            </>
        );
    }

    if (!profile) {
        return (
            <>
                <Navbar />
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                }}>
                    <User size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <h2>User not found</h2>
                    <Link href="/" style={{ color: '#818cf8', marginTop: '8px' }}>Go home</Link>
                </div>
            </>
        );
    }

    const { user: profileUser, listings, reviews, stats } = profile;
    const memberSince = new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <>
            <Navbar />
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
                paddingTop: '100px',
                paddingBottom: '60px',
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
                    {/* Profile Header */}
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            marginBottom: '40px',
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            overflow: 'hidden',
                            border: '4px solid rgba(129,140,248,0.3)',
                            boxShadow: '0 0 40px rgba(129,140,248,0.2)',
                        }}>
                            {profileUser.avatar ? (
                                <img src={profileUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700 }}>
                                    {profileUser.firstName[0]}{profileUser.lastName[0]}
                                </span>
                            )}
                        </div>

                        {/* Name + Verified */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                                {profileUser.firstName} {profileUser.lastName}
                            </h1>
                            {profileUser.verified && (
                                <ShieldCheck size={24} style={{ color: '#34d399' }} />
                            )}
                        </div>

                        {/* Location & Member Since */}
                        <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '12px' }}>
                            {profileUser.city && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={14} /> {profileUser.city}
                                </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={14} /> Member since {memberSince}
                            </span>
                        </div>

                        {/* Bio */}
                        {profileUser.bio && (
                            <p style={{
                                color: 'rgba(255,255,255,0.6)',
                                maxWidth: '600px',
                                fontSize: '1rem',
                                lineHeight: 1.6,
                                marginBottom: '20px',
                            }}>
                                {profileUser.bio}
                            </p>
                        )}

                        {/* Interests */}
                        {profileUser.interests && profileUser.interests.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
                                {profileUser.interests.map(interest => (
                                    <span key={interest} style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: 'rgba(129,140,248,0.15)',
                                        color: '#818cf8',
                                        fontSize: '0.8rem',
                                        border: '1px solid rgba(129,140,248,0.2)',
                                    }}>
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Stats */}
                        <div style={{
                            display: 'flex',
                            gap: '32px',
                            marginBottom: '24px',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#818cf8', margin: 0 }}>{stats.listingCount}</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>Listings</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#818cf8', margin: 0 }}>{stats.reviewCount}</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>Reviews</p>
                            </div>
                        </div>

                        {/* Actions */}
                        {!isOwnProfile && (
                            <motion.button
                                onClick={handleStartConversation}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                }}
                            >
                                <MessageSquare size={18} /> Message
                            </motion.button>
                        )}
                    </motion.div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '24px',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        paddingBottom: '0',
                    }}>
                        {[
                            { key: 'listings', label: `Listings (${stats.listingCount})`, icon: Package },
                            { key: 'reviews', label: `Reviews (${stats.reviewCount})`, icon: Star },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '12px 20px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: activeTab === tab.key ? '#818cf8' : 'rgba(255,255,255,0.5)',
                                    fontWeight: activeTab === tab.key ? 600 : 400,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === tab.key ? '2px solid #818cf8' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'listings' && (
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '20px',
                            }}
                        >
                            {listings.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                                    <Package size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                    <p>No listings yet</p>
                                </div>
                            ) : (
                                listings.map(listing => (
                                    <motion.div
                                        key={listing.id}
                                        variants={fadeInUp}
                                        whileHover={{ y: -4 }}
                                        style={{
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                        }}
                                    >
                                        <Link href={`/item/${listing.id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                height: '180px',
                                                background: listing.images?.[0]
                                                    ? `url(${listing.images[0]}) center/cover`
                                                    : 'linear-gradient(135deg, #1a1a2e, #16213e)',
                                            }} />
                                            <div style={{ padding: '16px' }}>
                                                <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>
                                                    {listing.title}
                                                </h3>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#818cf8', fontWeight: 700 }}>
                                                        ${listing.price}/{listing.priceUnit || 'day'}
                                                    </span>
                                                    {listing.rating > 0 && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.85rem' }}>
                                                            <Star size={14} fill="#fbbf24" /> {listing.rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'reviews' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {reviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                                    <Star size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                    <p>No reviews yet</p>
                                </div>
                            ) : (
                                reviews.map((review: any) => (
                                    <div key={review.id} style={{
                                        padding: '16px 20px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div>
                                                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} size={14} fill={i < review.rating ? '#fbbf24' : 'transparent'} style={{ color: i < review.rating ? '#fbbf24' : 'rgba(255,255,255,0.2)' }} />
                                                    ))}
                                                </div>
                                                {review.listing && (
                                                    <Link href={`/item/${review.listingId}`} style={{ color: '#818cf8', fontSize: '0.8rem', textDecoration: 'none' }}>
                                                        {review.listing.title}
                                                    </Link>
                                                )}
                                            </div>
                                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5, fontSize: '0.9rem' }}>
                                            {review.text}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/sections/Footer';
import RentalCard from '@/components/cards/RentalCard';
import Button from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Loader2, MapPin, Star, MessageSquare, ShieldCheck, ChevronLeft, Calendar, Info } from 'lucide-react';

export default function ProductPage() {
    const { id } = useParams();
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'availability'>('details');
    const [selectedImage, setSelectedImage] = useState(0);
    const [imgError, setImgError] = useState<Record<number, boolean>>({});
    const [bookingLoading, setBookingLoading] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [newReview, setNewReview] = useState({ rating: 5, text: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const { isAuthenticated } = useAuthStore();
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    useEffect(() => {
        if (id) {
            fetchItem();
            fetchReviews();
        }
    }, [id]);

    const fetchReviews = async () => {
        try {
            const data = await apiClient.get<{ reviews: any[] }>(`/reviews/${id}`);
            setReviews(data.reviews);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        setReviewSubmitting(true);
        try {
            await apiClient.post('/reviews', {
                listingId: id,
                rating: newReview.rating,
                text: newReview.text
            });
            setNewReview({ rating: 5, text: '' });
            fetchReviews(); // Refresh
            fetchItem(); // Refresh average rating
        } catch (err: any) {
            console.error('Failed to post review:', err);
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleBooking = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        setBookingLoading(true);
        setError('');
        console.log('[Booking] Starting booking for item:', id);
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 1);

            const payload = {
                listingId: id,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalPrice: item.price
            };
            console.log('[Booking] Sending payload:', payload);

            await apiClient.post('/bookings', payload);
            console.log('[Booking] Success!');

            router.push('/dashboard');
        } catch (err: any) {
            console.error('[Booking] Error:', err);
            setError(err.message || 'Failed to create booking');
        } finally {
            setBookingLoading(false);
        }
    };

    const fetchItem = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<{ listing: any }>(`/listings/${id}`);
            if (data.listing) {
                setItem(data.listing);
            } else {
                setError('Item not found');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch item');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen pt-24 flex flex-col items-center justify-center">
                <Navbar />
                <Loader2 size={40} className="animate-spin text-[#6c5ce7] mb-4" />
                <p className="text-white/40">Loading details...</p>
            </main>
        );
    }

    if (error || !item) {
        return (
            <main className="min-h-screen pt-24 flex flex-col items-center justify-center">
                <Navbar />
                <Info size={48} className="text-white/10 mb-6" />
                <h2 className="text-2xl font-bold mb-2">{error || 'Item not found'}</h2>
                <Button variant="outline" onClick={() => router.push('/explore')}>Back to Explore</Button>
            </main>
        );
    }

    const images = item.images && item.images.length > 0 ? item.images : [];
    const hasImages = images.length > 0;

    return (
        <main className="relative min-h-screen">
            <Navbar />

            <div className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
                {/* Back Link */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-xs text-white/40 hover:text-white mb-8 transition-colors"
                >
                    <ChevronLeft size={14} /> Back to results
                </button>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left: Gallery */}
                    <motion.div
                        className="lg:w-[55%]"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        {/* Main Image */}
                        <div className="relative glass-card rounded-3xl overflow-hidden aspect-[4/3] mb-4 flex items-center justify-center bg-gradient-to-br from-[#6c5ce7]/10 to-[#a29bfe]/10">
                            <AnimatePresence mode="wait">
                                {hasImages && !imgError[selectedImage] ? (
                                    <motion.img
                                        key={images[selectedImage]}
                                        src={images[selectedImage]}
                                        alt={item.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4 }}
                                        onError={() => setImgError(prev => ({ ...prev, [selectedImage]: true }))}
                                    />
                                ) : (
                                    <motion.div
                                        key="placeholder"
                                        className="text-9xl opacity-30"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        📦
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {item.featured && (
                                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-xs font-medium text-white shadow-lg">
                                    Featured
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {images.map((img: string, i: number) => (
                                <motion.button
                                    key={i}
                                    className={`w-20 h-20 flex-shrink-0 rounded-xl glass overflow-hidden flex items-center justify-center transition-all ${selectedImage === i ? 'ring-2 ring-[#6c5ce7] bg-[#6c5ce7]/10' : 'opacity-50 hover:opacity-80'
                                        }`}
                                    onClick={() => setSelectedImage(i)}
                                    whileTap={{ scale: 0.95 }}
                                    suppressHydrationWarning
                                >
                                    {!imgError[i] ? (
                                        <img src={img} alt="" className="w-full h-full object-cover" onError={() => setImgError(prev => ({ ...prev, [i]: true }))} />
                                    ) : (
                                        <span className="text-2xl">📦</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Details */}
                    <motion.div
                        className="lg:w-[45%]"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        {/* Category */}
                        <span className="text-xs text-[#a29bfe] tracking-wider uppercase mb-2 block font-bold">
                            {item.category} / Asset
                        </span>

                        <h1 className="text-2xl md:text-5xl font-bold text-white/90 mb-4 leading-tight">
                            {item.title}
                        </h1>

                        {/* Rating & Location */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1">
                                <Star size={14} fill="#fdcb6e" className="text-[#fdcb6e]" />
                                <span className="text-sm text-white/70">{item.rating || 'New'}</span>
                                <span className="text-xs text-white/30">({item.reviewCount || 0} reviews)</span>
                            </div>
                            <span className="text-xs text-white/30">•</span>
                            <span className="text-xs text-white/40 flex items-center gap-1">
                                <MapPin size={10} />
                                {item.location}
                            </span>
                        </div>

                        {/* Price */}
                        <div className="glass-card rounded-3xl p-8 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6c5ce7]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <div className="flex items-end gap-2 mb-6">
                                <span className="text-5xl font-bold gradient-text">${item.price}</span>
                                <span className="text-white/40 mb-2 font-medium">/ {item.priceUnit?.toLowerCase()}</span>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full justify-center text-base py-6 rounded-2xl shadow-xl shadow-[#6c5ce7]/20"
                                onClick={handleBooking}
                                disabled={bookingLoading || !item.available}
                            >
                                {bookingLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                {item.available ? `Rent Now — $${item.price}/${item.priceUnit?.toLowerCase()}` : 'Currently Unavailable'}
                            </Button>

                            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-white/5">
                                <div className="flex flex-col items-center">
                                    <ShieldCheck size={16} className="text-[#00cec9] mb-1" />
                                    <span className="text-[10px] text-white/30 font-medium">Insured</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Calendar size={16} className="text-[#a29bfe] mb-1" />
                                    <span className="text-[10px] text-white/30 font-medium">Flexible</span>
                                </div>
                            </div>
                        </div>

                        {/* Owner */}
                        <div className="glass-card rounded-2xl p-5 mb-6 hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-lg font-bold text-white overflow-hidden shadow-inner">
                                    {item.owner?.avatar ? <img src={item.owner.avatar} className="w-full h-full object-cover" /> : (item.owner?.firstName?.[0] || 'O')}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white/80">{item.owner?.firstName} {item.owner?.lastName || ''}</span>
                                        {item.owner?.verified && (
                                            <ShieldCheck size={12} className="text-[#00cec9]" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-white/30">Verified Property Owner</p>
                                </div>
                                <button className="p-3 rounded-xl glass hover:bg-[#6c5ce7]/20 transition-all text-white/40 hover:text-white">
                                    <MessageSquare size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 glass rounded-2xl p-1.5 border border-white/5">
                            {(['details', 'reviews', 'availability'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all capitalize ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'
                                        }`}
                                    onClick={() => setActiveTab(tab)}
                                    onMouseEnter={() => setCursorVariant('hover')}
                                    onMouseLeave={() => setCursorVariant('default')}
                                    suppressHydrationWarning
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'details' && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-white/60 leading-relaxed space-y-4"
                                >
                                    <div className="p-6 glass-card rounded-2xl bg-white/5">
                                        <p className="whitespace-pre-wrap">{item.description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {item.tags?.map((tag: string) => (
                                            <span key={tag} className="px-4 py-1.5 rounded-full glass text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'reviews' && (
                                <motion.div
                                    key="reviews"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* Review Form */}
                                    {isAuthenticated ? (
                                        <div className="glass-card rounded-2xl p-6 bg-white/5 border border-white/10">
                                            <h4 className="text-sm font-bold mb-4">Write a Review</h4>
                                            <form onSubmit={handleReviewSubmit} className="space-y-4">
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => setNewReview({ ...newReview, rating: s })}
                                                            className={`transition-colors ${newReview.rating >= s ? 'text-[#fdcb6e]' : 'text-white/10'}`}
                                                        >
                                                            <Star size={20} fill={newReview.rating >= s ? 'currentColor' : 'none'} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={newReview.text}
                                                    onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                                                    placeholder="Share your experience with this item..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#6c5ce7] outline-none resize-none"
                                                    rows={3}
                                                    required
                                                />
                                                <div className="flex justify-end">
                                                    <Button variant="primary" size="sm" disabled={reviewSubmitting}>
                                                        {reviewSubmitting ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                                                        Post Review
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 glass rounded-2xl border border-white/5">
                                            <p className="text-xs text-white/30">Please <Link href="/login" className="text-[#6c5ce7] hover:underline">log in</Link> to leave a review.</p>
                                        </div>
                                    )}

                                    {/* Reviews List */}
                                    {reviews.length === 0 ? (
                                        <div className="text-center py-12 glass rounded-3xl border border-white/5">
                                            <Star size={32} className="mx-auto mb-4 text-white/10" />
                                            <p className="text-sm text-white/40">No reviews yet for this listing.</p>
                                            <p className="text-[10px] text-white/20 mt-1">Be the first to rent and leave feedback!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {reviews.map((rev) => (
                                                <div key={rev.id} className="glass-card rounded-2xl p-5 border border-white/5">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center text-xs font-bold">
                                                                {rev.user?.firstName?.[0] || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold">{rev.user?.firstName}</p>
                                                                <p className="text-[10px] text-white/20">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} size={10} fill={rev.rating >= s ? '#fdcb6e' : 'none'} className={rev.rating >= s ? 'text-[#fdcb6e]' : 'text-white/10'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-white/60 leading-relaxed italic">&quot;{rev.text}&quot;</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'availability' && (
                                <motion.div
                                    key="availability"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-center py-12 glass rounded-3xl border border-white/5"
                                >
                                    <Calendar size={32} className="mx-auto mb-4 text-white/10" />
                                    <p className="text-sm text-white/40">Listing is available starting today.</p>
                                    <div className="mt-4 flex justify-center gap-4 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00cec9]" /> Available</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/10" /> Reserved</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

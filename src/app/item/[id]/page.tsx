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
import { Loader2, MapPin, Star, MessageSquare, ShieldCheck, ChevronLeft, Calendar, Info, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';

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
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [bookingStartDate, setBookingStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [bookingEndDate, setBookingEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
    });
    const [bookingRating, setBookingRating] = useState(5);
    const [bookingReview, setBookingReview] = useState('');
    const [reviews, setReviews] = useState<any[]>([]);
    const [newReview, setNewReview] = useState({ rating: 5, text: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const { isAuthenticated } = useAuthStore();
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);
    const isCinemaMode = useAppStore((s) => s.isCinemaMode);
    const setCinemaMode = useAppStore((s) => s.setCinemaMode);

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
        setBookingModalOpen(true);
    };

    const executeBooking = async () => {
        setBookingLoading(true);
        setError('');
        try {
            const start = new Date(bookingStartDate);
            const end = new Date(bookingEndDate);
            const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const totalPrice = item.price * days;

            const payload = {
                listingId: id,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                totalPrice,
                rating: bookingRating,
                reviewText: bookingReview
            };

            await apiClient.post('/bookings', payload);

            // If user provided a review text, we also trigger the reviews endpoint
            if (bookingReview.trim()) {
                try {
                    await apiClient.post('/reviews', {
                        listingId: id,
                        rating: bookingRating,
                        text: bookingReview
                    });
                } catch (revErr) {
                    console.error('Secondary review creation failed:', revErr);
                }
            }

            setBookingModalOpen(false);
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
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={14} /> Back to results
                    </button>
                    <button
                        onClick={() => setCinemaMode(!isCinemaMode)}
                        className="flex items-center gap-2 text-xs text-[#a29bfe] hover:text-white transition-colors uppercase tracking-widest font-bold"
                    >
                        <Sparkles size={14} /> Cinema Mode
                    </button>
                </div>

                {typeof document !== 'undefined' && isCinemaMode && createPortal(
                    <AnimatePresence>
                        {isCinemaMode && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 overflow-hidden"
                            >
                                {/* Immersive Background */}
                                <motion.div
                                    className="absolute inset-0 bg-black"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />

                                <motion.img
                                    key={`backdrop-${selectedImage}`}
                                    src={images[selectedImage]}
                                    className="absolute inset-0 w-full h-full object-cover opacity-30 blur-3xl scale-110"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 1 }}
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

                                {/* Controls */}
                                <button
                                    onClick={() => setCinemaMode(false)}
                                    className="absolute top-10 right-10 z-[1001] w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:scale-110 transition-all"
                                >
                                    <ChevronLeft size={24} className="rotate-180" />
                                </button>

                                {/* Image Container */}
                                <motion.div
                                    className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-8"
                                    initial={{ y: 40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                                >
                                    <div className="relative group max-w-5xl w-full h-full flex items-center justify-center">
                                        <motion.img
                                            key={`cinema-${selectedImage}`}
                                            src={images[selectedImage]}
                                            className="max-h-full max-w-full object-contain rounded-2xl shadow-[0_0_100px_rgba(108,92,231,0.2)]"
                                            layoutId={`item-image-${selectedImage}`}
                                        />

                                        {/* Navigation arrows */}
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full glass border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                                                    }}
                                                >
                                                    <ChevronLeft size={32} />
                                                </button>
                                                <button
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full glass border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                                                    }}
                                                >
                                                    <ChevronLeft size={32} className="rotate-180" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center">
                                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{item.title}</h2>
                                        <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-bold">
                                            Image {selectedImage + 1} of {images.length}
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}

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
                                        {Array.from(new Set(item.tags || [])).map((tag: any) => (
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

            {/* Booking Modal */}
            <AnimatePresence>
                {bookingModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setBookingModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg glass-card rounded-[2.5rem] p-8 md:p-12 overflow-hidden border border-white/10 shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6c5ce7]/10 rounded-full -mr-32 -mt-32 blur-[80px]" />

                            <h2 className="text-3xl font-bold mb-2">Book Your <span className="gradient-text">Rental</span></h2>
                            <p className="text-white/40 text-sm mb-8">Select your dates and provide a quick rating to continue.</p>

                            <div className="space-y-6 relative z-10">
                                {/* Date Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Start Date</label>
                                        <input
                                            type="date"
                                            value={bookingStartDate}
                                            onChange={(e) => setBookingStartDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#6c5ce7] outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">End Date</label>
                                        <input
                                            type="date"
                                            value={bookingEndDate}
                                            onChange={(e) => setBookingEndDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#6c5ce7] outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Rating Section */}
                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/30">Initial Rating & Experience</label>
                                    <div className="flex gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setBookingRating(s)}
                                                className={`transition-all duration-300 hover:scale-110 ${bookingRating >= s ? 'text-[#fdcb6e]' : 'text-white/10'}`}
                                            >
                                                <Star size={24} fill={bookingRating >= s ? 'currentColor' : 'none'} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={bookingReview}
                                        onChange={(e) => setBookingReview(e.target.value)}
                                        placeholder="Any special requests or initial thoughts? (Optional)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#6c5ce7] outline-none resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Price Breakdown */}
                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-xs text-white/30 mb-1">Total for {Math.max(1, Math.ceil((new Date(bookingEndDate).getTime() - new Date(bookingStartDate).getTime()) / (1000 * 86400)))} days</p>
                                            <p className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                                ${(item.price * Math.max(1, Math.ceil((new Date(bookingEndDate).getTime() - new Date(bookingStartDate).getTime()) / (1000 * 86400)))).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-[#00cec9] font-bold uppercase tracking-widest">Instant Booking</p>
                                            <p className="text-[10px] text-white/20">Secure with RentVerse</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1 py-4 rounded-2xl"
                                            onClick={() => setBookingModalOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-[2] py-4 rounded-2xl"
                                            onClick={executeBooking}
                                            disabled={bookingLoading}
                                        >
                                            {bookingLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                            Confirm & Rent
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

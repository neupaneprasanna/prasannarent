'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/sections/Footer';
import Button from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Package, MapPin, DollarSign, Image as ImageIcon, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

const steps = [
    { id: 'basic', title: 'Basic Info', icon: <Package size={20} /> },
    { id: 'details', title: 'Details', icon: <MapPin size={20} /> },
    { id: 'photos', title: 'Photos', icon: <ImageIcon size={20} /> },
    { id: 'review', title: 'Review', icon: <Check size={20} /> },
];

const categories = ['Tech', 'Vehicles', 'Rooms', 'Equipment', 'Fashion', 'Studios', 'Tools', 'Digital'];
const priceUnits = ['HOUR', 'DAY', 'WEEK', 'MONTH'];

export default function CreateListingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { isAuthenticated } = useAuthStore();
    const setCursorVariant = useAppStore((s) => s.setCursorVariant);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Tech',
        price: '',
        priceUnit: 'DAY',
        description: '',
        location: '',
        tags: '',
        images: '',
        media: [] as { url: string; type: string; caption: string }[],
        customAttributes: {} as Record<string, any>,
        pricing: {
            hourlyPrice: '',
            weeklyPrice: '',
            monthlyPrice: '',
            weekendMultiplier: '1.0',
        },
    });

    const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);

    useEffect(() => {
        if (formData.category) {
            fetchCategoryAttributes(formData.category);
        }
    }, [formData.category]);

    const fetchCategoryAttributes = async (catName: string) => {
        try {
            const data = await apiClient.get<{ attributes: any[] }>(`/categories/${catName}/attributes`);
            setCategoryAttributes(data.attributes || []);
            // Reset custom attributes for the new category
            const initialAttrs: Record<string, any> = {};
            (data.attributes || []).forEach(attr => {
                if (attr.type === 'boolean') initialAttrs[attr.name] = false;
                else if (attr.type === 'number') initialAttrs[attr.name] = '';
                else initialAttrs[attr.name] = '';
            });
            setFormData(prev => ({ ...prev, customAttributes: initialAttrs }));
        } catch (err) {
            console.error('Failed to fetch attributes:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAttributeChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            customAttributes: { ...prev.customAttributes, [name]: value }
        }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                tags: Array.from(new Set(formData.tags.split(',').map(tag => tag.trim()).filter(Boolean))),
                media: formData.media,
                attributes: Object.entries(formData.customAttributes).map(([key, value]) => ({
                    key,
                    value: String(value)
                })),
                pricing: {
                    dailyPrice: parseFloat(formData.price),
                    hourlyPrice: formData.pricing.hourlyPrice ? parseFloat(formData.pricing.hourlyPrice) : null,
                    weeklyPrice: formData.pricing.weeklyPrice ? parseFloat(formData.pricing.weeklyPrice) : null,
                    monthlyPrice: formData.pricing.monthlyPrice ? parseFloat(formData.pricing.monthlyPrice) : null,
                    weekendMultiplier: parseFloat(formData.pricing.weekendMultiplier) || 1.0,
                },
                // Keep images array for backward compatibility but populate from media URLs
                images: formData.media.filter(m => m.type === 'IMAGE').map(m => m.url)
            };

            await apiClient.post('/listings', payload);
            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen pt-24 flex items-center justify-center">
                <Navbar />
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please log in to list an item</h2>
                    <Button variant="primary" onClick={() => router.push('/login')}>Log In</Button>
                </div>
            </main>
        );
    }

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-black">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-[#00cec9]/20 flex items-center justify-center mx-auto mb-6 text-[#00cec9]">
                        <Check size={40} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Listing Created!</h2>
                    <p className="text-white/40">Redirecting to your dashboard...</p>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen">
            <Navbar />

            <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
                <motion.div
                    className="mb-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-bold mb-4">List Your <span className="gradient-text">Asset</span></h1>
                    <p className="text-white/40">Turn your unused items into passive income in 4 easy steps.</p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between mb-4">
                        {steps.map((step, i) => (
                            <div
                                key={step.id}
                                className={`flex flex-col items-center gap-2 transition-all duration-300 ${i <= currentStep ? 'text-[#6c5ce7]' : 'text-white/20'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${i <= currentStep ? 'border-[#6c5ce7] bg-[#6c5ce7]/5' : 'border-white/10'}`}>
                                    {i < currentStep ? <Check size={18} /> : step.icon}
                                </div>
                                <span className="text-[10px] font-medium uppercase tracking-wider">{step.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Form Content */}
                <div className="glass-card rounded-3xl p-8 md:p-10 mb-8 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {currentStep === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Item Title</label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Sony A7IV Camera Kit"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Category</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                            >
                                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Price</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                                                <input
                                                    name="price"
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Flexible Pricing Section */}
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-4 bg-[#6c5ce7] rounded-full" />
                                                <label className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em]">Flexible Pricing (Optional)</label>
                                            </div>
                                            <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Set discounts for long durations</span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-[10px] text-white/30 mb-1.5 font-medium uppercase tracking-wider">Hourly</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20">$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#6c5ce7]"
                                                        onChange={(e) => setFormData(p => ({ ...p, pricing: { ...p.pricing, hourlyPrice: e.target.value } }))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-white/30 mb-1.5 font-medium uppercase tracking-wider">Weekly</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20">$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#6c5ce7]"
                                                        onChange={(e) => setFormData(p => ({ ...p, pricing: { ...p.pricing, weeklyPrice: e.target.value } }))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-white/30 mb-1.5 font-medium uppercase tracking-wider">Monthly</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20">$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#6c5ce7]"
                                                        onChange={(e) => setFormData(p => ({ ...p, pricing: { ...p.pricing, monthlyPrice: e.target.value } }))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-white/30 mb-1.5 font-medium uppercase tracking-wider">Weekend x</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="1.0"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#6c5ce7]"
                                                        onChange={(e) => setFormData(p => ({ ...p, pricing: { ...p.pricing, weekendMultiplier: e.target.value } }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Category Attributes */}
                                    {categoryAttributes.length > 0 && (
                                        <div className="pt-6 border-t border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-4 bg-[#6c5ce7] rounded-full" />
                                                <label className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em]">Specifications</label>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {categoryAttributes.map((attr) => (
                                                    <div key={attr.id} className="space-y-2">
                                                        <label className="block text-xs text-white/40 font-medium">{attr.label} {attr.unit && `(${attr.unit})`}</label>
                                                        {attr.type === 'select' ? (
                                                            <select
                                                                value={formData.customAttributes[attr.name] || ''}
                                                                onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#6c5ce7]"
                                                            >
                                                                <option value="">Select {attr.label}</option>
                                                                {attr.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        ) : attr.type === 'boolean' ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAttributeChange(attr.name, true)}
                                                                    className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all ${formData.customAttributes[attr.name] === true ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-white' : 'border-white/5 bg-white/5 text-white/40'}`}
                                                                >
                                                                    Yes
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAttributeChange(attr.name, false)}
                                                                    className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all ${formData.customAttributes[attr.name] === false ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-white' : 'border-white/5 bg-white/5 text-white/40'}`}
                                                                >
                                                                    No
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type={attr.type === 'number' ? 'number' : 'text'}
                                                                value={formData.customAttributes[attr.name] || ''}
                                                                onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                                                                placeholder={attr.placeholder || `Enter ${attr.label.toLowerCase()}...`}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#6c5ce7]"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-semibold mb-6">Details & Location</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Tell potential renters about your item..."
                                            rows={4}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Location</label>
                                        <input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g. San Francisco, CA"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Tags (comma separated)</label>
                                        <input
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleInputChange}
                                            placeholder="e.g. camera, photography, sony"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#6c5ce7] transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-semibold mb-6">Product Photos</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-xs text-white/40 font-medium uppercase tracking-wider">Media Gallery</label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                media: [...prev.media, { url: '', type: 'IMAGE', caption: '' }]
                                            }))}
                                        >
                                            + Add Media
                                        </Button>
                                    </div>

                                    {formData.media.map((item, index) => (
                                        <div key={index} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                            <div className="flex gap-3">
                                                <select
                                                    value={item.type}
                                                    onChange={(e) => {
                                                        const newMedia = [...formData.media];
                                                        newMedia[index].type = e.target.value;
                                                        setFormData(prev => ({ ...prev, media: newMedia }));
                                                    }}
                                                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-2 text-[10px] text-white outline-none focus:border-[#6c5ce7]"
                                                >
                                                    <option value="IMAGE">IMAGE</option>
                                                    <option value="VIDEO">VIDEO</option>
                                                    <option value="PANORAMA_360">360° VIEW</option>
                                                </select>
                                                <input
                                                    placeholder="Media URL (direct link)"
                                                    value={item.url}
                                                    onChange={(e) => {
                                                        const newMedia = [...formData.media];
                                                        newMedia[index].url = e.target.value;
                                                        setFormData(prev => ({ ...prev, media: newMedia }));
                                                    }}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#6c5ce7]"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newMedia = formData.media.filter((_, i) => i !== index);
                                                        setFormData(prev => ({ ...prev, media: newMedia }));
                                                    }}
                                                    className="text-red-400/60 hover:text-red-400 p-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <input
                                                placeholder="Add a caption (optional)"
                                                value={item.caption}
                                                onChange={(e) => {
                                                    const newMedia = [...formData.media];
                                                    newMedia[index].caption = e.target.value;
                                                    setFormData(prev => ({ ...prev, media: newMedia }));
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/60 outline-none focus:border-[#6c5ce7]"
                                            />
                                        </div>
                                    ))}

                                    {formData.media.length === 0 && (
                                        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/40">
                                                <ImageIcon size={24} />
                                            </div>
                                            <p className="text-sm text-white/60 mb-1">No media added yet</p>
                                            <p className="text-xs text-white/20">Add images, videos or 360 views to showcase your asset</p>
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-semibold mb-6">Review Listing</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center text-2xl overflow-hidden">
                                            {formData.media[0]?.url ? (
                                                <img src={formData.media[0].url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                '📦'
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-lg">{formData.title || 'Untitled Listing'}</h4>
                                            <p className="text-xs text-white/40">{formData.category} · ${formData.price}/{formData.priceUnit}</p>
                                            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                                                <MapPin size={10} /> {formData.location || 'No location set'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <h5 className="text-[10px] font-medium uppercase tracking-wider text-white/40 mb-2">Description Snippet</h5>
                                        <p className="text-xs text-white/60 line-clamp-3 italic">
                                            &quot;{formData.description || 'No description provided.'}&quot;
                                        </p>
                                    </div>
                                    {error && (
                                        <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                    {currentStep > 0 && (
                        <button
                            onClick={prevStep}
                            className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                    )}
                    <div className="flex-1" />
                    {currentStep < steps.length - 1 ? (
                        <Button
                            variant="primary"
                            size="lg"
                            className="px-10"
                            onClick={nextStep}
                            disabled={currentStep === 0 && (!formData.title || !formData.price)}
                        >
                            Continue <ChevronRight size={18} />
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            className="px-10"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Publish Listing'}
                        </Button>
                    )}
                </div>
            </div>

            <Footer />
        </main >
    );
}

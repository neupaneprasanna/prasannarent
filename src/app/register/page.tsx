'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MagneticButton from '@/components/cursor/MagneticButton';
import { fadeInUp } from '@/lib/animations/motion-config';
import { useAuthStore, type User } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';

import { supabase } from '@/lib/supabase';

const steps = ['Account', 'Profile', 'Security', 'Preferences'];

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '',
        firstName: '', lastName: '', phone: '', avatar: '',
        address: '', city: '', dateOfBirth: '',
        governmentIdType: '', governmentIdNumber: '',
        interests: [] as string[],
    });

    const categories = ['Tech', 'Vehicles', 'Rooms', 'Equipment', 'Fashion', 'Studios', 'Tools', 'Digital'];

    const toggleInterest = (cat: string) => {
        setFormData((prev) => ({
            ...prev,
            interests: prev.interests.includes(cat)
                ? prev.interests.filter((i) => i !== cat)
                : [...prev.interests, cat],
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log('🟢 [Register] Image uploaded. URL:', publicUrl);
            setFormData(prev => ({ ...prev, avatar: publicUrl }));
        } catch (error: any) {
            console.error('Upload failed:', error);
            setError('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const validateStep = () => {
        if (currentStep === 0) {
            if (!formData.email || !formData.password) return 'Email and password are required';
            if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
            if (formData.password.length < 8) return 'Password must be at least 8 characters';
        } else if (currentStep === 1) {
            if (!formData.firstName || !formData.lastName) return 'Name is required';
            if (!formData.phone) return 'Phone number is required for security';
        } else if (currentStep === 2) {
            if (!formData.address || !formData.city) return 'Address and city are required';
            if (!formData.dateOfBirth) return 'Date of birth is required';
        }
        return null;
    };

    const handleNext = async () => {
        const stepError = validateStep();
        if (stepError) {
            setError(stepError);
            return;
        }

        setError('');

        if (currentStep < 3) {
            setCurrentStep((s) => s + 1);
        } else {
            // Final submission
            setLoading(true);
            try {
                const submissionData = {
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    avatar: formData.avatar,
                    address: formData.address,
                    city: formData.city,
                    dateOfBirth: formData.dateOfBirth,
                    governmentIdType: formData.governmentIdType,
                    governmentIdNumber: formData.governmentIdNumber,
                    interests: formData.interests,
                };

                const data = await apiClient.post<{
                    token: string,
                    user: User,
                    message: string
                }>('/auth/register', submissionData);

                setAuth(data.user, data.token);
                router.push('/');
            } catch (err: any) {
                setError(err.message || 'Registration failed. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center px-6">

            <motion.div
                className="relative w-full max-w-md"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center">
                            <span className="text-white font-bold text-lg">R</span>
                        </div>
                        <span className="text-2xl font-bold">
                            <span className="gradient-text">Rent</span>
                            <span className="text-white/90">Verse</span>
                        </span>
                    </a>
                    <h1 className="text-2xl md:text-3xl font-bold text-white/90 mb-2">Create Account</h1>
                    <p className="text-sm text-white/40">Join the future of renting</p>
                </div>

                {/* Progress steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((step, i) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${i <= currentStep
                                ? 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white'
                                : 'glass text-white/30'
                                }`}>
                                {i < currentStep ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs hidden sm:block ${i <= currentStep ? 'text-white/70' : 'text-white/20'}`}>
                                {step}
                            </span>
                            {i < steps.length - 1 && (
                                <div className={`w-8 h-px ${i < currentStep ? 'bg-[#6c5ce7]' : 'bg-white/10'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="glass-card rounded-3xl p-8">
                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] text-center">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {currentStep === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required suppressHydrationWarning />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Password</label>
                                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min 8 characters" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required suppressHydrationWarning />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Confirm Password</label>
                                    <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Re-enter password" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required suppressHydrationWarning />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                                className="space-y-4"
                            >
                                {/* Photo Upload */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative w-24 h-24 mb-3">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group">
                                            {formData.avatar ? (
                                                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-white/20">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                <span className="text-[10px] uppercase font-bold text-white tracking-wider">Change</span>
                                            </div>
                                        </div>
                                        {formData.avatar && (
                                            <div className="text-[8px] text-white/20 mt-1 max-w-[200px] truncate">
                                                {formData.avatar}
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('avatar-upload')?.click()}
                                        className="text-xs text-[#a29bfe] hover:text-[#6c5ce7] transition-colors font-medium"
                                    >
                                        Upload Photo
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-white/40 mb-1.5 block">First Name</label>
                                        <input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="John" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/40 mb-1.5 block">Last Name</label>
                                        <input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="Doe" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Phone Number</label>
                                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                                className="space-y-4"
                            >
                                <p className="text-sm text-white/50 mb-2">For your security and identity verification</p>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Address *</label>
                                    <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="123 Main St" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">City *</label>
                                    <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="San Francisco" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Date of Birth *</label>
                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-white/40 mb-1.5 block">ID Type</label>
                                        <select value={formData.governmentIdType} onChange={(e) => setFormData({ ...formData, governmentIdType: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50">
                                            <option value="" style={{ background: '#1a1a2e' }}>Select...</option>
                                            <option value="drivers_license" style={{ background: '#1a1a2e' }}>Driver&apos;s License</option>
                                            <option value="passport" style={{ background: '#1a1a2e' }}>Passport</option>
                                            <option value="national_id" style={{ background: '#1a1a2e' }}>National ID</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/40 mb-1.5 block">ID Number</label>
                                        <input value={formData.governmentIdNumber} onChange={(e) => setFormData({ ...formData, governmentIdNumber: e.target.value })}
                                            placeholder="ID Number" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            >
                                <p className="text-sm text-white/50 mb-4">What are you interested in renting?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            className={`py-3 rounded-xl text-sm transition-all ${formData.interests.includes(cat)
                                                ? 'bg-[#6c5ce7]/20 border border-[#6c5ce7]/40 text-white'
                                                : 'glass text-white/40 hover:text-white/60'
                                                }`}
                                            onClick={() => toggleInterest(cat)}
                                            suppressHydrationWarning
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            type="button"
                            className={`px-6 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
                            onClick={() => setCurrentStep((s) => s - 1)}
                            disabled={loading}
                            suppressHydrationWarning
                        >
                            Back
                        </button>
                        <MagneticButton strength={0.1}>
                            <button
                                type="button"
                                className={`px-8 py-2.5 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-medium text-white transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}
                                onClick={handleNext}
                                disabled={loading}
                                suppressHydrationWarning
                            >
                                {loading ? 'Creating...' : currentStep === 3 ? 'Create Account' : 'Continue'}
                            </button>
                        </MagneticButton>
                    </div>
                </div>

                <motion.p className="text-center mt-6 text-sm text-white/30" variants={fadeInUp} initial="hidden" animate="visible" custom={4}>
                    Already have an account?{' '}
                    <a href="/login" className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors">Sign in</a>
                </motion.p>
            </motion.div>
        </main>
    );
}

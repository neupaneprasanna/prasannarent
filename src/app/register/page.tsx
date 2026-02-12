'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MagneticButton from '@/components/cursor/MagneticButton';
import { fadeInUp } from '@/lib/animations/motion-config';
import { useAuthStore, type User } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';

const steps = ['Account', 'Profile', 'Preferences'];

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '',
        firstName: '', lastName: '', phone: '',
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

    const validateStep = () => {
        if (currentStep === 0) {
            if (!formData.email || !formData.password) return 'Email and password are required';
            if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
            if (formData.password.length < 8) return 'Password must be at least 8 characters';
        } else if (currentStep === 1) {
            if (!formData.firstName || !formData.lastName) return 'Name is required';
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

        if (currentStep < 2) {
            setCurrentStep((s) => s + 1);
        } else {
            // Final submission
            setLoading(true);
            try {
                const data = await apiClient.post<{
                    token: string,
                    user: User,
                    message: string
                }>('/auth/register', {
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    interests: formData.interests
                });

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
                                        placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Password</label>
                                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min 8 characters" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1.5 block">Confirm Password</label>
                                    <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Re-enter password" className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50" required />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                                className="space-y-4"
                            >
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
                                {loading ? 'Creating...' : currentStep === 2 ? 'Create Account' : 'Continue'}
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

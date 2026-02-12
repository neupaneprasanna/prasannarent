'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MagneticButton from '@/components/cursor/MagneticButton';
import { fadeInUp } from '@/lib/animations/motion-config';
import { useAuthStore, type User } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiClient.post<{
                token: string,
                user: User,
                message: string
            }>('/auth/login', { email, password });

            setAuth(data.user, data.token);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
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
                <motion.div className="text-center mb-8" variants={fadeInUp} initial="hidden" animate="visible">
                    <a href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center">
                            <span className="text-white font-bold text-lg">R</span>
                        </div>
                        <span className="text-2xl font-bold">
                            <span className="gradient-text">Rent</span>
                            <span className="text-white/90">Verse</span>
                        </span>
                    </a>
                    <h1 className="text-2xl md:text-3xl font-bold text-white/90 mb-2">Welcome Back</h1>
                    <p className="text-sm text-white/40">Sign in to access your rentals</p>
                </motion.div>

                {/* Form */}
                <motion.div
                    className="glass-card rounded-3xl p-8"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                >
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                            {error}
                        </div>
                    )}

                    {/* Social logins */}
                    <div className="flex gap-3 mb-6">
                        <button className="flex-1 py-3 glass rounded-xl text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-all flex items-center justify-center gap-2" suppressHydrationWarning>
                            <span className="text-base">G</span> Google
                        </button>
                        <button className="flex-1 py-3 glass rounded-xl text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-all flex items-center justify-center gap-2" suppressHydrationWarning>
                            <span className="text-base">🍎</span> Apple
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/20">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50 transition-all"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 mb-1.5 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl glass bg-white/[0.02] text-sm text-white/90 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#6c5ce7]/50 transition-all"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-white/30">
                                <input type="checkbox" className="rounded accent-[#6c5ce7]" />
                                Remember me
                            </label>
                            <a href="#" className="text-xs text-[#a29bfe] hover:text-[#6c5ce7] transition-colors">
                                Forgot password?
                            </a>
                        </div>

                        <MagneticButton strength={0.1} className="w-full">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl text-sm font-medium text-white transition-all ${loading ? 'opacity-70 cursor-wait' : 'hover:shadow-lg hover:shadow-[#6c5ce7]/20'}`}
                                suppressHydrationWarning
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </MagneticButton>
                    </form>
                </motion.div>

                <motion.p
                    className="text-center mt-6 text-sm text-white/30"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    custom={4}
                >
                    Don&apos;t have an account?{' '}
                    <a href="/register" className="text-[#a29bfe] hover:text-[#6c5ce7] transition-colors">
                        Sign up
                    </a>
                </motion.p>
            </motion.div>
        </main>
    );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Cog, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>

            <div className="max-w-2xl w-full relative z-10 text-center space-y-12">
                {/* Brand Logo / Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-center"
                >
                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Cog className="w-12 h-12 text-cyan-400 animate-[spin_4s_linear_infinite]" />
                    </div>
                </motion.div>

                {/* Content */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-white mb-4">
                            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Refining</span>
                        </h1>
                        <p className="text-lg text-white/50 max-w-lg mx-auto font-medium">
                            RentVerse is currently evolving. We're performing scheduled maintenance to upgrade your rental experience. We'll be back shortly.
                        </p>
                    </motion.div>

                    {/* Progress Simulation */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3 pt-8"
                    >
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30 px-1">
                            <span>System Upgrade</span>
                            <span className="text-cyan-400">85% Complete</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "85%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Status Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {[
                        { label: 'Blockchain', status: 'Healthy', icon: ShieldCheck, color: 'text-emerald-400' },
                        { label: 'Core Engine', status: 'Upgrading', icon: Cog, color: 'text-cyan-400' },
                        { label: 'Asset Nodes', status: 'Healthy', icon: Zap, color: 'text-amber-400' },
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center gap-2">
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                            <span className="text-xs font-bold text-white/80">{item.status}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="pt-8 border-t border-white/5 flex flex-col items-center gap-4"
                >
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                        Admin Access Only Below
                    </p>
                    <Link href="/admin/login">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all group"
                        >
                            Admin Console
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

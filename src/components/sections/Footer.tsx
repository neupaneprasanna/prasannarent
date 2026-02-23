'use client';

import { motion } from 'framer-motion';

const footerLinks = {
    Product: ['Explore', 'Categories', 'Pricing', 'Enterprise', 'Mobile App'],
    Company: ['About Us', 'Careers', 'Blog', 'Press', 'Partners'],
    Resources: ['Help Center', 'Safety', 'Community', 'Trust & Verification', 'API'],
    Legal: ['Terms', 'Privacy', 'Cookies', 'Licenses', 'Accessibility'],
};

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function Footer() {
    return (
        <footer className="relative pt-20 pb-8">
            {/* Top gradient line — luminous separator */}
            <div className="absolute top-0 left-[5%] right-[5%] h-[2px]"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(122,92,255,0.3), rgba(0,240,255,0.25), transparent)',
                    boxShadow: '0 0 15px rgba(122,92,255,0.1)',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                    {/* Brand */}
                    <motion.div
                        className="col-span-2 md:col-span-1"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={spring}
                    >
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7A5CFF] to-[#A18CFF] flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">R</span>
                            </div>
                            <span className="text-lg font-medium tracking-tight">
                                <span className="gradient-text">rent</span>
                                <span className="text-white/70">verse</span>
                            </span>
                        </div>
                        <p className="text-sm text-white/25 leading-relaxed mb-6">
                            the future of renting. anything, anywhere, anytime.
                        </p>
                        <div className="flex gap-2.5">
                            {['X', 'in', 'ig', 'gh'].map((social) => (
                                <motion.div
                                    key={social}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] text-white/40 hover:text-white/70 transition-all duration-300 cursor-pointer tracking-wider"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.04)',
                                    }}
                                >
                                    {social}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links], i) => (
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: (i + 1) * 0.06 }}
                        >
                            <h4 className="text-label text-white/50 mb-5">{title}</h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-white/25 hover:text-white/50 transition-colors duration-200 tracking-wide">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] text-white/15 tracking-wide">
                        © 2026 rentverse. all rights reserved.
                    </p>
                    <div className="flex items-center gap-5">
                        <span className="text-[11px] text-white/10 tracking-wide">made with precision</span>
                        <div className="flex items-center gap-1.5">
                            <div className="relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB3]" style={{ boxShadow: '0 0 6px rgba(0,255,179,0.4)' }} />
                            </div>
                            <span className="text-[11px] text-white/20 tracking-wide">all systems operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

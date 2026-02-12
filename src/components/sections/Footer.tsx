'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations/motion-config';
import MagneticButton from '@/components/cursor/MagneticButton';

const footerLinks = {
    Product: ['Explore', 'Categories', 'Pricing', 'Enterprise', 'Mobile App'],
    Company: ['About Us', 'Careers', 'Blog', 'Press', 'Partners'],
    Resources: ['Help Center', 'Safety', 'Community', 'Trust & Verification', 'API'],
    Legal: ['Terms', 'Privacy', 'Cookies', 'Licenses', 'Accessibility'],
};

export default function Footer() {
    return (
        <footer className="relative pt-24 pb-8">
            {/* Top border gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Brand column */}
                    <motion.div className="col-span-2 md:col-span-1" variants={fadeInUp}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center">
                                <span className="text-white font-bold text-sm">R</span>
                            </div>
                            <span className="text-lg font-bold">
                                <span className="gradient-text">Rent</span>
                                <span className="text-white/90">Verse</span>
                            </span>
                        </div>
                        <p className="text-sm text-white/30 leading-relaxed mb-6">
                            The future of renting. Anything, anywhere, anytime.
                        </p>
                        {/* Social */}
                        <div className="flex gap-3">
                            {['X', 'In', 'Ig', 'Gh'].map((social) => (
                                <MagneticButton key={social} strength={0.3}>
                                    <div className="w-9 h-9 rounded-lg glass flex items-center justify-center text-xs text-white/40 hover:text-white/70 transition-colors">
                                        {social}
                                    </div>
                                </MagneticButton>
                            ))}
                        </div>
                    </motion.div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links], i) => (
                        <motion.div key={title} variants={fadeInUp} custom={i + 1}>
                            <h4 className="text-sm font-semibold text-white/70 mb-4">{title}</h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Bottom */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/20">
                        © 2026 RentVerse. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-xs text-white/15">Made with precision</span>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00cec9]" />
                            <span className="text-xs text-white/30">All systems operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

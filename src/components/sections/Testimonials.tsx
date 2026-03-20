'use client';

import { motion, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const testimonials = [
    { name: 'Sarah Mitchell', role: 'photographer', quote: 'rented a Sony A7IV for a weekend shoot. seamless experience, gear arrived in perfect condition. this platform is a game-changer.', avatar: 'S', rating: 5, color: '#00F0FF' },
    { name: 'David Park', role: 'filmmaker', quote: 'I needed a drone for a short film project. found one within minutes, and the owner was incredibly helpful. will definitely use again.', avatar: 'D', rating: 5, color: '#7A5CFF' },
    { name: 'Emily Rodriguez', role: 'event planner', quote: 'rented lighting and sound equipment for a corporate event. saved us thousands compared to buying. customer support was exceptional.', avatar: 'E', rating: 5, color: '#00FFB3' },
];

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

function TypewriterQuote({ quote, color, delayMs = 0 }: { quote: string, color: string, delayMs: number }) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (!inView) return;
        
        let timeout: ReturnType<typeof setTimeout>;
        let interval: ReturnType<typeof setInterval>;
        
        timeout = setTimeout(() => {
            setHasStarted(true);
            setIsTyping(true);
            let i = 0;
            interval = setInterval(() => {
                setDisplayedText(quote.slice(0, i + 1));
                i++;
                if (i >= quote.length) {
                    setIsTyping(false);
                    clearInterval(interval);
                }
            }, 30); // 30ms per character typing speed
        }, delayMs);

        return () => {
             clearTimeout(timeout);
             clearInterval(interval);
        };
    }, [inView, quote, delayMs]);

    return (
        <span ref={ref} className="relative block">
            {/* Invisible ghost text to hold exact container layout height so cards don't jitter during typing! */}
            <span className="opacity-0 pointer-events-none select-none">{quote}</span>
            {/* Absolutely positioned typing overlay */}
            <span className="absolute top-0 left-0 w-full text-left">
                {displayedText}
                <span 
                    className={`inline-block w-[3px] h-[0.9em] ml-1 translate-y-[2px] opacity-80 ${hasStarted && isTyping ? 'animate-pulse' : 'hidden'}`}
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                />
            </span>
        </span>
    );
}

export default function Testimonials() {
    return (
        <section className="section-padding relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label mb-4 block" style={{ color: '#A18CFF', textShadow: '0 0 20px rgba(161,140,255,0.3)' }}>testimonials</span>
                    <h2 className="text-section mb-4">
                        what <span className="gradient-text">renters</span> say
                    </h2>
                    <p className="text-body text-white/35 max-w-md mx-auto">
                        hear from our community of satisfied renters and hosts.
                    </p>
                </motion.div>

                {/* Editorial Floating Testimonials */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16 pt-10">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            className={`group relative flex flex-col ${i === 1 ? 'lg:mt-16' : i === 2 ? 'lg:mt-8' : ''}`}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ ...spring, delay: i * 0.15 }}
                        >
                            {/* Giant decorative quote mark background */}
                            <div 
                                className="absolute -top-16 -left-8 text-[12rem] sm:text-[14rem] font-serif leading-none opacity-[0.15] pointer-events-none select-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6"
                                style={{
                                    background: `linear-gradient(135deg, ${t.color}, transparent)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                &ldquo;
                            </div>

                            <p className="text-white/80 text-xl sm:text-2xl font-medium leading-relaxed mb-10 relative z-10 transition-colors duration-300 group-hover:text-white">
                                <TypewriterQuote quote={t.quote} color={t.color} delayMs={i * 500 + 300} />
                            </p>

                            <div className="mt-auto flex items-center gap-5 relative z-10">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-2xl transition-transform duration-500 group-hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${t.color}30, ${t.color}10)`,
                                        color: t.color,
                                        border: `1px solid ${t.color}40`,
                                        boxShadow: `0 0 30px ${t.color}20`,
                                    }}
                                >
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-base sm:text-lg font-bold text-white tracking-wide">{t.name}</p>
                                    <p className="text-sm text-white/50 uppercase tracking-widest">{t.role}</p>
                                </div>
                            </div>
                            
                            {/* Minimal glowing accent line at the bottom */}
                            <div 
                                className="h-[1px] w-12 mt-8 opacity-50 group-hover:w-full group-hover:opacity-100 transition-all duration-700" 
                                style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }} 
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

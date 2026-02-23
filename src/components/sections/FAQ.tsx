'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: 'how does the rental process work?',
        answer: 'browse items, select your dates, and book instantly. once confirmed, you can pick up the item or have it delivered. return it when your rental period ends. the entire process takes less than 60 seconds.',
    },
    {
        question: 'what if an item gets damaged during my rental?',
        answer: 'every rental includes up to $10,000 in damage protection at no extra cost. if something happens, file a claim through the app and our team will handle it within 72 hours. owners are always protected.',
    },
    {
        question: 'how do I become a host and list my items?',
        answer: 'tap "list your item," upload photos, set your price and availability, and you\'re live. our AI helps you write descriptions and price competitively. most hosts start earning within their first week.',
    },
    {
        question: 'is my personal information safe?',
        answer: 'absolutely. we use bank-level AES-256 encryption, are SOC2 compliant, and never share your data with third parties. all payments are processed through PCI DSS certified systems.',
    },
    {
        question: 'can I rent items for just a few hours?',
        answer: 'yes! our flexible duration system lets you rent for as little as 1 hour. you can also extend your rental anytime from the app without the owner\'s manual approval.',
    },
    {
        question: 'what happens if the owner cancels my booking?',
        answer: 'you\'ll receive a full refund immediately. we\'ll also help you find a similar replacement item. owners who cancel frequently face account restrictions to protect renters.',
    },
    {
        question: 'are there fees for using the platform?',
        answer: 'renters pay a small service fee (8-12%) on each booking. hosts keep 85% of the rental price. there are no monthly fees, listing fees, or hidden charges.',
    },
];

const spring = { type: 'spring' as const, stiffness: 200, damping: 25 };

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (i: number) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    return (
        <section className="section-padding relative overflow-hidden">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-14"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={spring}
                >
                    <span className="text-label mb-4 block" style={{ color: '#00F0FF', textShadow: '0 0 20px rgba(0,240,255,0.3)' }}>
                        faq
                    </span>
                    <h2 className="text-section mb-4">
                        got <span className="gradient-text">questions</span>?
                    </h2>
                    <p className="text-body text-white/35 max-w-md mx-auto">
                        everything you need to know about RentVerse.
                    </p>
                </motion.div>

                {/* FAQ accordion */}
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            className="relative rounded-xl overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={{ ...spring, delay: i * 0.05 }}
                            style={{
                                background: openIndex === i
                                    ? 'linear-gradient(135deg, rgba(16,17,26,0.95) 0%, rgba(20,18,40,0.9) 100%)'
                                    : 'linear-gradient(135deg, rgba(16,17,26,0.7) 0%, rgba(10,11,16,0.6) 100%)',
                                border: `1px solid ${openIndex === i ? 'rgba(122,92,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
                                backdropFilter: 'blur(12px)',
                                transition: 'background 0.3s ease, border-color 0.3s ease',
                            }}
                        >
                            {/* Question row */}
                            <button
                                onClick={() => toggleFAQ(i)}
                                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left group"
                            >
                                <span className={`text-sm font-medium tracking-tight transition-colors duration-300 ${openIndex === i ? 'text-white/90' : 'text-white/60 group-hover:text-white/80'}`}>
                                    {faq.question}
                                </span>
                                <motion.div
                                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                                    transition={spring}
                                    className="flex-shrink-0"
                                >
                                    <ChevronDown size={18} className={`transition-colors duration-300 ${openIndex === i ? 'text-[#7A5CFF]' : 'text-white/20'}`} />
                                </motion.div>
                            </button>

                            {/* Answer */}
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 150, damping: 22 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                                            <div className="w-12 h-[1px] mb-4" style={{ background: 'linear-gradient(90deg, rgba(122,92,255,0.4), transparent)' }} />
                                            <p className="text-sm text-white/35 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Active left accent */}
                            {openIndex === i && (
                                <motion.div
                                    className="absolute left-0 top-[15%] bottom-[15%] w-[2px]"
                                    initial={{ opacity: 0, scaleY: 0 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    exit={{ opacity: 0, scaleY: 0 }}
                                    style={{ background: 'linear-gradient(to bottom, transparent, rgba(122,92,255,0.6), transparent)' }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

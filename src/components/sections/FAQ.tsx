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
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
                        everything you need to know about Nexis.
                    </p>
                </motion.div>

                {/* Simple Typography FAQ List */}
                <div className="space-y-2 mt-12">
                    {faqs.map((faq, i) => (
                        <div key={i} className="border-b border-white/5 last:border-b-0">
                            <button
                                onClick={() => toggleFAQ(i)}
                                className="w-full flex items-center justify-between gap-6 py-8 text-left group outline-none"
                                suppressHydrationWarning
                            >
                                <span className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 ${openIndex === i ? 'text-[#00F0FF]' : 'text-white/80 group-hover:text-white'}`}>
                                    {faq.question}
                                </span>
                                <motion.div
                                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                                    transition={spring}
                                    className="flex-shrink-0 ml-4"
                                >
                                    <ChevronDown size={28} className={`transition-colors duration-300 ${openIndex === i ? 'text-[#00F0FF]' : 'text-white/30 group-hover:text-white/60'}`} />
                                </motion.div>
                            </button>

                            {/* Answer Area */}
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 150, damping: 22 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pb-10 pr-12">
                                            <p className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-3xl">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

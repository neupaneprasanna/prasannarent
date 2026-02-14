'use client';

import { motion } from 'framer-motion';

interface ElasticButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export default function ElasticButton({ children, onClick, className = '' }: ElasticButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            className={`relative overflow-hidden ${className}`}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
            <motion.div
                className="w-full h-full"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
                {children}
            </motion.div>
        </motion.button>
    );
}

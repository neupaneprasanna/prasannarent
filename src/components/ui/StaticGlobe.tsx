'use client';

import { motion } from 'framer-motion';

const hotspots = [
    { city: 'New York', x: '25%', y: '35%', count: '5.2k' },
    { city: 'London', x: '48%', y: '28%', count: '4.1k' },
    { city: 'Tokyo', x: '85%', y: '35%', count: '3.8k' },
    { city: 'San Francisco', x: '18%', y: '38%', count: '2.9k' },
    { city: 'Dubai', x: '60%', y: '42%', count: '2.1k' },
    { city: 'Sydney', x: '88%', y: '75%', count: '1.8k' },
];

export default function StaticGlobe() {
    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Simple CSS-based Earth representation */}
            <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-[#0a0a12] to-[#1a1a2e] border border-white/10 shadow-[0_0_50px_rgba(108,92,231,0.1)] overflow-hidden">
                {/* Subtle Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(108,92,231,0.1)_0%,transparent_70%)] pointer-events-none" />

                {/* Continents (Simplified SVG or Background Pattern) */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `url('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                {/* Hotspots */}
                {hotspots.map((spot, i) => (
                    <motion.div
                        key={spot.city}
                        className="absolute w-2 h-2 rounded-full bg-[#6c5ce7] shadow-[0_0_8px_#6c5ce7]"
                        style={{ left: spot.x, top: spot.y }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 * i, duration: 0.5 }}
                    >
                        <motion.div
                            className="absolute inset-0 rounded-full bg-[#6c5ce7]"
                            animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Labels overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {hotspots.slice(0, 3).map((spot, i) => (
                    <motion.div
                        key={`${spot.city}-label`}
                        className="absolute transform -translate-x-1/2"
                        style={{ left: spot.x, top: `calc(${spot.y} - 20px)` }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + 0.2 * i }}
                    >
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                            {spot.city}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';
import { CITIES } from './Globe';

// Approximate flat-map positions for each city (percent of a 2:1 equirectangular map)
const cityPositions: Record<string, { x: number; y: number }> = {
    'New York':      { x: 23.5, y: 36 },
    'London':        { x: 48.3, y: 26 },
    'Tokyo':         { x: 83.8, y: 34 },
    'San Francisco': { x: 17.2, y: 37 },
    'Dubai':         { x: 62.0, y: 41 },
    'Sydney':        { x: 87.5, y: 74 },
    'Stockholm':     { x: 51.5, y: 22 },
    'Singapore':     { x: 78.8, y: 52 },
    'São Paulo':     { x: 30.5, y: 67 },
    'Mumbai':        { x: 67.8, y: 44 },
    'Berlin':        { x: 51.1, y: 25 },
    'Lagos':         { x: 48.5, y: 55 },
};

const regionColors: Record<string, string> = {
    Americas: '#00FFB3',
    Europe: '#7A5CFF',
    'Asia-Pacific': '#00F0FF',
    'Middle East': '#F59E0B',
    Africa: '#F43F5E',
};

// Arcs as pairs of city names
const ARCS: Array<[string, string]> = [
    ['New York', 'London'],
    ['London', 'Dubai'],
    ['Dubai', 'Mumbai'],
    ['Mumbai', 'Singapore'],
    ['Singapore', 'Tokyo'],
    ['Tokyo', 'Sydney'],
    ['Sydney', 'São Paulo'],
    ['São Paulo', 'New York'],
    ['San Francisco', 'Tokyo'],
    ['London', 'Stockholm'],
];

function pct2px(pct: number, total: number) {
    return (pct / 100) * total;
}

export default function StaticGlobe() {
    // We draw everything on a 800x400 viewBox (2:1 equirectangular)
    const W = 800;
    const H = 400;

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <motion.div
                className="relative w-full"
                style={{ maxWidth: 700, aspectRatio: '2/1' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
            >
                {/* Background map */}
                <div
                    className="absolute inset-0 rounded-2xl overflow-hidden border border-white/8"
                    style={{ background: 'linear-gradient(135deg, #04040c 0%, #080815 50%, #04040c 100%)' }}
                >
                    {/* Equirectangular earth texture */}
                    <img
                        src="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg"
                        alt="World map"
                        className="w-full h-full object-cover opacity-[0.15] mix-blend-luminosity"
                        draggable={false}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(4,4,12,0.6) 0%, transparent 30%, transparent 70%, rgba(4,4,12,0.6) 100%)' }} />
                </div>

                {/* SVG for arcs + animated particles */}
                <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                    <defs>
                        {ARCS.map(([a, b], i) => {
                            const pa = cityPositions[a];
                            const pb = cityPositions[b];
                            if (!pa || !pb) return null;
                            const x1 = pct2px(pa.x, W);
                            const y1 = pct2px(pa.y, H);
                            const x2 = pct2px(pb.x, W);
                            const y2 = pct2px(pb.y, H);
                            const cx = (x1 + x2) / 2;
                            const cy = Math.min(y1, y2) - 50 - Math.abs(x2 - x1) * 0.15;
                            const d = `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`;
                            return <path key={`def-${i}`} id={`arc-path-${i}`} d={d} />;
                        })}
                    </defs>

                    {ARCS.map(([a, b], i) => {
                        const pa = cityPositions[a];
                        const pb = cityPositions[b];
                        if (!pa || !pb) return null;
                        const x1 = pct2px(pa.x, W);
                        const y1 = pct2px(pa.y, H);
                        const x2 = pct2px(pb.x, W);
                        const y2 = pct2px(pb.y, H);
                        const cx = (x1 + x2) / 2;
                        const cy = Math.min(y1, y2) - 50 - Math.abs(x2 - x1) * 0.15;
                        const d = `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`;
                        const arcColors = ['#00FFB3', '#7A5CFF', '#00F0FF'];
                        const color = arcColors[i % arcColors.length];
                        const dur = `${4 + i * 0.35}s`;

                        return (
                            <g key={`${a}-${b}`}>
                                {/* Dim arc line */}
                                <path d={d} fill="none" stroke={color} strokeWidth={0.8} strokeOpacity={0.2} />
                                {/* Travelling particle using native SVG animateMotion */}
                                <circle r={2.5} fill={color} filter={`drop-shadow(0 0 3px ${color})`}>
                                    <animateMotion dur={dur} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                                        <mpath href={`#arc-path-${i}`} />
                                    </animateMotion>
                                </circle>
                            </g>
                        );
                    })}
                </svg>

                {/* City hotspot dots */}
                {CITIES.map((city, i) => {
                    const pos = cityPositions[city.city];
                    if (!pos) return null;
                    const color = regionColors[city.region] ?? '#00FFB3';

                    return (
                        <motion.div
                            key={city.city}
                            className="absolute"
                            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.05 * i + 0.6, duration: 0.4 }}
                        >
                            {/* Pulse ring */}
                            <motion.div
                                className="absolute rounded-full"
                                style={{ width: 20, height: 20, top: -10, left: -10, border: `1px solid ${color}`, opacity: 0.4 }}
                                animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: i * 0.2 }}
                            />
                            {/* Core dot */}
                            <div className="w-2 h-2 rounded-full relative z-10" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                            {/* Label (only top 6 cities) */}
                            {i < 6 && (
                                <div
                                    className="absolute text-[7px] font-black uppercase tracking-widest pointer-events-none whitespace-nowrap"
                                    style={{ color: `${color}cc`, top: -14, left: '50%', transform: 'translateX(-50%)' }}
                                >
                                    {city.city}
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {/* Horizontal and vertical grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                    {/* Latitude lines */}
                    {[20, 40, 50, 60, 80].map(y => (
                        <line key={`lat-${y}`} x1={0} y1={y / 100 * H} x2={W} y2={y / 100 * H} stroke="white" strokeWidth={0.5} />
                    ))}
                    {/* Longitude lines */}
                    {[20, 35, 50, 65, 80].map(x => (
                        <line key={`lng-${x}`} x1={x / 100 * W} y1={0} x2={x / 100 * W} y2={H} stroke="white" strokeWidth={0.5} />
                    ))}
                    {/* Equator */}
                    <line x1={0} y1={H * 0.5} x2={W} y2={H * 0.5} stroke="#00F0FF" strokeWidth={1} strokeOpacity={0.15} />
                </svg>
            </motion.div>
        </div>
    );
}

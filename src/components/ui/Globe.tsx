'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

// ─── helpers ────────────────────────────────────────────────────────────────

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface CityData {
    city: string;
    lat: number;
    lng: number;
    count: string;
    region: string;
}

export const CITIES: CityData[] = [
    { city: 'New York',      lat:  40.71, lng:  -74.01, count: '5.2k', region: 'Americas' },
    { city: 'London',        lat:  51.51, lng:   -0.13, count: '4.1k', region: 'Europe' },
    { city: 'Tokyo',         lat:  35.68, lng:  139.65, count: '3.8k', region: 'Asia-Pacific' },
    { city: 'San Francisco', lat:  37.77, lng: -122.42, count: '2.9k', region: 'Americas' },
    { city: 'Dubai',         lat:  25.20, lng:   55.27, count: '2.6k', region: 'Middle East' },
    { city: 'Sydney',        lat: -33.87, lng:  151.21, count: '2.1k', region: 'Asia-Pacific' },
    { city: 'Stockholm',     lat:  59.33, lng:   18.07, count: '1.9k', region: 'Europe' },
    { city: 'Singapore',     lat:   1.35, lng:  103.82, count: '1.7k', region: 'Asia-Pacific' },
    { city: 'São Paulo',     lat: -23.55, lng:  -46.63, count: '1.4k', region: 'Americas' },
    { city: 'Mumbai',        lat:  19.08, lng:   72.88, count: '1.2k', region: 'Asia-Pacific' },
    { city: 'Berlin',        lat:  52.52, lng:   13.41, count: '1.1k', region: 'Europe' },
    { city: 'Lagos',         lat:   6.52, lng:    3.38, count: '0.8k', region: 'Africa' },
];

const ARC_ROUTES: Array<[number, number]> = [
    [0, 1],   // New York ↔ London
    [1, 4],   // London ↔ Dubai
    [4, 9],   // Dubai ↔ Mumbai
    [9, 7],   // Mumbai ↔ Singapore
    [7, 2],   // Singapore ↔ Tokyo
    [2, 5],   // Tokyo ↔ Sydney
    [5, 8],   // Sydney ↔ São Paulo
    [8, 0],   // São Paulo ↔ New York
    [3, 2],   // San Francisco ↔ Tokyo
    [1, 6],   // London ↔ Stockholm
    [4, 11],  // Dubai ↔ Lagos
    [0, 10],  // New York ↔ Berlin
];

const ARC_COLORS = ['#00FFB3', '#7A5CFF', '#00F0FF', '#00FFB3', '#7A5CFF', '#00F0FF', '#00FFB3', '#7A5CFF', '#00F0FF', '#00FFB3', '#7A5CFF', '#00F0FF'];

// ─── ConnectionArc ───────────────────────────────────────────────────────────

function ConnectionArc({ fromIdx, toIdx, color, speed }: { fromIdx: number; toIdx: number; color: string; speed: number }) {
    const particleRef = useRef<THREE.Mesh>(null);
    const progress = useRef(Math.random());

    const { arcPoints, curve } = useMemo(() => {
        const c1 = CITIES[fromIdx];
        const c2 = CITIES[toIdx];
        const p1 = latLngToVec3(c1.lat, c1.lng, 2.52);
        const p2 = latLngToVec3(c2.lat, c2.lng, 2.52);
        const mid = new THREE.Vector3().addVectors(p1, p2).normalize().multiplyScalar(4.0);
        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        return { arcPoints: curve.getPoints(64), curve };
    }, [fromIdx, toIdx]);

    useFrame((_, delta) => {
        progress.current = (progress.current + delta * speed) % 1;
        if (particleRef.current) {
            const pos = curve.getPoint(progress.current);
            particleRef.current.position.copy(pos);
        }
    });

    return (
        <group>
            <Line points={arcPoints} color={color} lineWidth={0.8} transparent opacity={0.22} />
            <mesh ref={particleRef}>
                <sphereGeometry args={[0.022, 8, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>
            {/* Glow orb */}
            <mesh ref={particleRef} scale={3}>
                <sphereGeometry args={[0.022, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.1} />
            </mesh>
        </group>
    );
}

// ─── Hotspot ────────────────────────────────────────────────────────────────

function HotspotPin({ city }: { city: CityData }) {
    const ringRef = useRef<THREE.Mesh>(null);
    const pos = useMemo(() => latLngToVec3(city.lat, city.lng, 2.54), [city.lat, city.lng]);

    useFrame((state) => {
        if (ringRef.current) {
            const pulse = Math.sin(state.clock.elapsedTime * 2.5) * 0.5 + 0.5;
            ringRef.current.scale.setScalar(1 + pulse * 1.8);
            (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 - pulse * 0.22;
        }
    });

    return (
        <group position={pos}>
            {/* Core dot */}
            <mesh>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshBasicMaterial color="#00FFB3" />
            </mesh>
            {/* Pulse ring */}
            <mesh ref={ringRef}>
                <ringGeometry args={[0.03, 0.055, 24]} />
                <meshBasicMaterial color="#00FFB3" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            {/* HTML label */}
            <Html distanceFactor={9} position={[0, 0.12, 0]}>
                <div className="pointer-events-none select-none" style={{ whiteSpace: 'nowrap', transform: 'translateX(-50%)' }}>
                    <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest"
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,179,0.3)', color: '#00FFB3', backdropFilter: 'blur(4px)' }}>
                        {city.city}
                        <span className="ml-1 opacity-50">{city.count}</span>
                    </div>
                </div>
            </Html>
        </group>
    );
}

// ─── Globe mesh ──────────────────────────────────────────────────────────────

interface GlobeProps {
    focusLng?: number | null;
}

export default function Globe({ focusLng }: GlobeProps) {
    const globeRef = useRef<THREE.Group>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const targetY = useRef(0);
    const isAutoRotating = useRef(true);
    const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [dayMap, normalMap, specularMap, cloudsMap] = useTexture([
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
    ]);

    useEffect(() => {
        if (focusLng == null) return;
        // Compute the Y rotation needed to center the city
        const desired = -(focusLng + 180) * (Math.PI / 180);
        targetY.current = desired;
        isAutoRotating.current = false;
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => { isAutoRotating.current = true; }, 4000);
    }, [focusLng]);

    useFrame((_, delta) => {
        if (!globeRef.current) return;

        if (isAutoRotating.current) {
            globeRef.current.rotation.y += delta * 0.055;
            targetY.current = globeRef.current.rotation.y;
        } else {
            globeRef.current.rotation.y += (targetY.current - globeRef.current.rotation.y) * 0.04;
        }

        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.075;
            cloudsRef.current.rotation.x += delta * 0.012;
        }
    });

    return (
        <group ref={globeRef}>
            {/* Lights */}
            <ambientLight intensity={0.6} />
            <pointLight position={[8, 6, 8]} intensity={2.0} color="#ffffff" />
            <pointLight position={[-8, -4, -8]} intensity={0.4} color="#7A5CFF" />
            <pointLight position={[0, 8, 0]} intensity={0.3} color="#00F0FF" />

            {/* Earth */}
            <Sphere args={[2.5, 72, 72]}>
                <meshPhongMaterial map={dayMap} normalMap={normalMap} specularMap={specularMap} shininess={8} />
            </Sphere>

            {/* Clouds */}
            <Sphere ref={cloudsRef} args={[2.53, 64, 64]}>
                <meshPhongMaterial map={cloudsMap} transparent opacity={0.35} depthWrite={false} />
            </Sphere>

            {/* Atmosphere inner glow */}
            <Sphere args={[2.62, 48, 48]}>
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.04} side={THREE.BackSide} />
            </Sphere>

            {/* Atmosphere outer glow */}
            <Sphere args={[2.85, 48, 48]}>
                <meshBasicMaterial color="#6366f1" transparent opacity={0.06} side={THREE.BackSide} />
            </Sphere>

            {/* Connection arcs */}
            {ARC_ROUTES.map(([from, to], i) => (
                <ConnectionArc
                    key={i}
                    fromIdx={from}
                    toIdx={to}
                    color={ARC_COLORS[i % ARC_COLORS.length]}
                    speed={0.12 + (i % 5) * 0.03}
                />
            ))}

            {/* Hotspot pins */}
            {CITIES.map((c) => (
                <HotspotPin key={c.city} city={c} />
            ))}
        </group>
    );
}

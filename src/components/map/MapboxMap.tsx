'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

import { Listing } from '@/types/rental';

// Custom 3D-style Marker Icon
const createCustomIcon = (price: number) => {
    return L.divIcon({
        className: 'custom-3d-pin',
        html: `
            <div class="relative group cursor-pointer transition-transform duration-300 hover:-translate-y-1 active:scale-95">
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-black/40 blur-[2px] rounded-full group-hover:scale-150 transition-transform"></div>
                <div class="relative px-3 py-1.5 bg-[#6c5ce7] text-white rounded-xl font-bold text-xs shadow-[0_4px_10px_rgba(108,92,231,0.4)] border border-white/20 whitespace-nowrap">
                    $${price}
                </div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#6c5ce7]"></div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });
};

interface MapboxMapProps {
    listings?: Listing[];
}

export default function MapboxMap({ listings = [] }: MapboxMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-full h-full bg-[#0a0a0a] animate-pulse" />;

    // Use current listings OR Manhattan center as fallback
    const center: [number, number] = listings.length > 0 && listings[0].latitude && listings[0].longitude
        ? [listings[0].latitude, listings[0].longitude]
        : [40.7128, -74.0060];

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Atmospheric Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/20" />

            {/* 3D Perspective Wrapper */}
            <div className="w-full h-full" style={{ perspective: '1000px' }}>
                <div
                    className="w-[120%] h-[120%] -ml-[10%] -mt-[5%]"
                    style={{ transform: 'rotateX(25deg)', transformOrigin: 'bottom' }}
                >
                    <MapContainer
                        center={center}
                        zoom={12}
                        scrollWheelZoom={false}
                        className="w-full h-full z-0"
                        style={{ background: '#0a0a0a' }}
                    >
                        {/* High-res Satellite Imagery */}
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />

                        {/* Hybrid Layer (Borders/Labels) */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                            opacity={0.8}
                        />

                        {listings.map((listing) => (
                            listing.latitude && listing.longitude && (
                                <Marker
                                    key={listing.id}
                                    position={[listing.latitude, listing.longitude]}
                                    icon={createCustomIcon(listing.price)}
                                >
                                    <Popup closeButton={false} className="3d-map-popup">
                                        <div className="p-1">
                                            <div className="text-sm font-bold text-black mb-1">{listing.title}</div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-black/60 font-medium">Daily starting at</span>
                                                <span className="text-xs font-black text-[#6c5ce7]">${listing.price}</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Scale/Compass UI */}
            <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                <div className="glass p-2 rounded-xl border border-white/10 flex items-center justify-center text-[10px] text-white/40 uppercase tracking-widest font-black">
                    3D View
                </div>
                <div className="glass p-2 rounded-xl border border-white/10 flex items-center justify-center text-[10px] text-white/40 uppercase tracking-widest font-black">
                    Satellite
                </div>
            </div>
        </div>
    );
}

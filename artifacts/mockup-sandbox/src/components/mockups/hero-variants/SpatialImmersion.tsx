import React, { useEffect, useState } from "react";
import { Search, Compass, LogIn, Menu, Shield, Camera, Car, Box, Cpu } from "lucide-react";

export default function SpatialImmersion() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -1 to 1
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate stars
  const stars = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.1,
    animationDuration: Math.random() * 3 + 2,
  }));

  const cards = [
    { id: 1, title: "Pro DJ Setup", price: "$45/day", icon: <Box size={32} />, gradient: "from-blue-600/40 to-cyan-500/10", zIndex: 1, transform: `translate3d(-240px, -20px, -200px) rotateY(15deg) scale(0.75)` },
    { id: 2, title: "Sony A7IV Lens Kit", price: "$65/day", icon: <Camera size={32} />, gradient: "from-indigo-600/40 to-blue-500/10", zIndex: 2, transform: `translate3d(-120px, -10px, -100px) rotateY(5deg) scale(0.85)` },
    { id: 3, title: "Tesla Model 3 LR", price: "$120/day", icon: <Car size={40} />, gradient: "from-violet-600/50 to-fuchsia-600/20", zIndex: 3, transform: `translate3d(0, 0, 0) scale(1)`, isCenter: true },
    { id: 4, title: "MacBook Pro M3", price: "$85/day", icon: <Cpu size={32} />, gradient: "from-fuchsia-600/40 to-pink-500/10", zIndex: 2, transform: `translate3d(120px, -10px, -100px) rotateY(-5deg) scale(0.85)` },
    { id: 5, title: "Drone DJI Mavic 3", price: "$55/day", icon: <Shield size={32} />, gradient: "from-purple-600/40 to-indigo-500/10", zIndex: 1, transform: `translate3d(240px, -20px, -200px) rotateY(-15deg) scale(0.75)` },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden text-white" style={{ backgroundColor: "#050810", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Background Spatial Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep background glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-40 transition-transform duration-1000 ease-out"
          style={{ 
            background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.2) 50%, rgba(5,8,16,0) 80%)",
            transform: `translate(calc(-50% + ${mousePosition.x * 20}px), calc(-50% - ${mousePosition.y * 20}px))`
          }}
        />

        {/* Horizon line */}
        <div className="absolute top-[60%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

        {/* Perspective Grid */}
        <div 
          className="absolute top-[60%] left-[-50%] w-[200%] h-[100%] opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(59,130,246,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59,130,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(75deg)',
            transformOrigin: 'top center'
          }}
        />

        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDuration: `${star.animationDuration}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 mx-auto max-w-7xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">RentVerse</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#" className="hover:text-white transition-colors">Explore</a>
          <a href="#" className="hover:text-white transition-colors">How it works</a>
          <a href="#" className="hover:text-white transition-colors">Categories</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            <LogIn className="w-4 h-4" />
            Sign in
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-md">
            Sign up
          </button>
          <button className="md:hidden p-2 text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-4">
        
        {/* Header Text */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            The future of renting.
          </h1>
          <p className="text-xl md:text-2xl text-blue-200/60 font-light">
            Access anything. Own nothing.
          </p>
        </div>

        {/* Spatial Card Cluster */}
        <div 
          className="relative w-full max-w-5xl h-[360px] flex items-center justify-center mb-16 perspective-[1200px]"
        >
          <div 
            className="relative w-[280px] h-[360px] transform-style-preserve-3d transition-transform duration-1000 ease-out"
            style={{
              transform: `rotateY(${mousePosition.x * 10}deg) rotateX(${mousePosition.y * 5}deg)`
            }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                className="absolute inset-0 rounded-2xl border border-white/10 transition-all duration-500 ease-out flex flex-col overflow-hidden group"
                style={{
                  transform: card.transform,
                  zIndex: card.zIndex,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(12px)",
                  boxShadow: card.isCenter 
                    ? "0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.2)" 
                    : "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                  filter: !card.isCenter ? "brightness(0.7) contrast(1.2)" : "none",
                }}
              >
                {/* Image Gradient Area */}
                <div className={`h-3/5 w-full bg-gradient-to-br ${card.gradient} relative flex items-center justify-center overflow-hidden`}>
                  {/* Subtle noise texture overlay */}
                  <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
                  
                  {/* Icon */}
                  <div className={`text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform duration-500 group-hover:scale-110 ${card.isCenter ? 'scale-110' : ''}`}>
                    {card.icon}
                  </div>
                </div>

                {/* Content Area */}
                <div className="h-2/5 p-5 flex flex-col justify-between relative bg-black/40">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <h3 className={`font-medium ${card.isCenter ? 'text-lg text-white' : 'text-base text-gray-300'}`}>
                    {card.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-md ${card.isCenter ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                      {card.price}
                    </span>
                    {card.isCenter && (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 z-20">
          <button className="px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all flex items-center gap-2 group">
            <Search className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Start exploring
          </button>
          <button className="px-8 py-3.5 rounded-full bg-transparent hover:bg-white/5 text-gray-300 font-medium border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
            List an item
          </button>
        </div>

      </main>
    </div>
  );
}

// Arrow icon for card
function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}

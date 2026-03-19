import React, { useEffect, useState, useRef } from "react";
import { Search, Compass, LogIn, Menu, Shield, Camera, Car, Box, Cpu } from "lucide-react";

const positionTransforms: Record<number, { transform: string; zIndex: number; filter: string; shadow: string }> = {
  [-2]: {
    transform: `translate3d(-240px, -20px, -200px) rotateY(15deg) scale(0.75)`,
    zIndex: 1,
    filter: "brightness(0.55) contrast(1.1)",
    shadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  [-1]: {
    transform: `translate3d(-120px, -10px, -100px) rotateY(5deg) scale(0.87)`,
    zIndex: 2,
    filter: "brightness(0.72) contrast(1.1)",
    shadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
  },
  [0]: {
    transform: `translate3d(0, 0, 0) scale(1)`,
    zIndex: 5,
    filter: "none",
    shadow: "0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  [1]: {
    transform: `translate3d(120px, -10px, -100px) rotateY(-5deg) scale(0.87)`,
    zIndex: 2,
    filter: "brightness(0.72) contrast(1.1)",
    shadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
  },
  [2]: {
    transform: `translate3d(240px, -20px, -200px) rotateY(-15deg) scale(0.75)`,
    zIndex: 1,
    filter: "brightness(0.55) contrast(1.1)",
    shadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
};

export default function SpatialImmersion() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState(2);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Auto-advance loop — pauses while user is hovering a card
  useEffect(() => {
    if (isHovering) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 5);
    }, 2200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovering]);

  const stars = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: (i * 37.3) % 100,
    y: (i * 19.7) % 100,
    size: (i % 3) + 1,
    opacity: 0.1 + (i % 5) * 0.08,
    animationDuration: 2 + (i % 4),
  }));

  const cards = [
    { id: 1, title: "Pro DJ Setup", price: "$45/day", icon: <Box size={32} />, gradient: "from-blue-600/40 to-cyan-500/10" },
    { id: 2, title: "Sony A7IV Lens Kit", price: "$65/day", icon: <Camera size={32} />, gradient: "from-indigo-600/40 to-blue-500/10" },
    { id: 3, title: "Tesla Model 3 LR", price: "$120/day", icon: <Car size={40} />, gradient: "from-violet-600/50 to-fuchsia-600/20" },
    { id: 4, title: "MacBook Pro M3", price: "$85/day", icon: <Cpu size={32} />, gradient: "from-fuchsia-600/40 to-pink-500/10" },
    { id: 5, title: "Drone DJI Mavic 3", price: "$55/day", icon: <Shield size={32} />, gradient: "from-purple-600/40 to-indigo-500/10" },
  ];

  const handleCardHover = (index: number) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovering(true);
    setActiveIndex(index);
  };

  const handleClusterLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovering(false);
    }, 400);
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden text-white"
      style={{ backgroundColor: "#050810", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* Background Spatial Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.2) 50%, rgba(5,8,16,0) 80%)",
            transform: `translate(calc(-50% + ${mousePosition.x * 20}px), calc(-50% - ${mousePosition.y * 20}px))`,
            transition: "transform 1s ease-out",
          }}
        />
        <div className="absolute top-[60%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        <div
          className="absolute top-[60%] left-[-50%] w-[200%] h-[100%] opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.3) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
            transform: "perspective(500px) rotateX(75deg)",
            transformOrigin: "top center",
          }}
        />
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
          <button className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-all backdrop-blur-md">
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
          className="relative w-full max-w-5xl h-[360px] flex items-center justify-center mb-16"
          style={{ perspective: "1200px" }}
          onMouseLeave={handleClusterLeave}
        >
          <div
            className="relative w-[280px] h-[360px]"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${mousePosition.x * 6}deg) rotateX(${mousePosition.y * 3}deg)`,
              transition: "transform 1s ease-out",
            }}
          >
            {cards.map((card, i) => {
              const pos = Math.max(-2, Math.min(2, i - activeIndex));
              const style = positionTransforms[pos];
              const isCenter = pos === 0;

              return (
                <div
                  key={card.id}
                  className="absolute inset-0 rounded-2xl border border-white/10 flex flex-col overflow-hidden group cursor-pointer"
                  style={{
                    transform: style.transform,
                    zIndex: style.zIndex,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(12px)",
                    boxShadow: style.shadow,
                    filter: style.filter,
                    transition: "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.55s ease, box-shadow 0.55s ease, z-index 0s",
                  }}
                  onMouseEnter={() => handleCardHover(i)}
                >
                  {/* Gradient photo area */}
                  <div className={`h-3/5 w-full bg-gradient-to-br ${card.gradient} relative flex items-center justify-center overflow-hidden`}>
                    <div
                      className="absolute inset-0 opacity-20 mix-blend-overlay"
                      style={{
                        backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
                      }}
                    />
                    <div className={`text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform duration-500 ${isCenter ? "scale-110" : ""} group-hover:scale-110`}>
                      {card.icon}
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="h-2/5 p-5 flex flex-col justify-between relative bg-black/40">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <h3 className={`font-medium ${isCenter ? "text-lg text-white" : "text-base text-gray-300"}`}>
                      {card.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-md ${isCenter ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                        {card.price}
                      </span>
                      {isCenter && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                          <ArrowRight size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 mb-8 -mt-10">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === activeIndex ? "24px" : "6px",
                height: "6px",
                backgroundColor: i === activeIndex ? "rgba(59,130,246,0.9)" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 z-20">
          <button className="px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all flex items-center gap-2 group">
            <Search className="w-4 h-4" />
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

function ArrowRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

import React, { useState, useEffect } from 'react';
import { Star, MapPin, Bell, Search, Menu, Camera, Bike, Tent, Music, Wrench, Video } from 'lucide-react';

const LISTINGS = [
  {
    id: 1,
    title: 'Sony A7IV Mirrorless Camera',
    price: 45,
    owner: 'JD',
    rating: 4.9,
    gradient: 'from-orange-500 to-amber-300',
    icon: Camera,
    height: 'h-64'
  },
  {
    id: 2,
    title: 'Specialized Road Bike',
    price: 25,
    owner: 'MS',
    rating: 4.8,
    gradient: 'from-emerald-500 to-teal-300',
    icon: Bike,
    height: 'h-48'
  },
  {
    id: 3,
    title: '4-Person Camping Tent',
    price: 15,
    owner: 'AT',
    rating: 5.0,
    gradient: 'from-blue-500 to-cyan-300',
    icon: Tent,
    height: 'h-56'
  },
  {
    id: 4,
    title: 'Fender Stratocaster',
    price: 30,
    owner: 'RB',
    rating: 4.9,
    gradient: 'from-rose-500 to-pink-300',
    icon: Music,
    height: 'h-64'
  },
  {
    id: 5,
    title: 'Dewalt Power Drill Set',
    price: 12,
    owner: 'KL',
    rating: 4.7,
    gradient: 'from-yellow-500 to-orange-300',
    icon: Wrench,
    height: 'h-48'
  },
  {
    id: 6,
    title: 'DJI Mavic 3 Drone',
    price: 55,
    owner: 'CH',
    rating: 4.9,
    gradient: 'from-purple-500 to-indigo-300',
    icon: Video,
    height: 'h-56'
  }
];

export default function LiveMarketplace() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1C1408] text-[#FEF9EF] font-sans">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 relative z-20 border-b border-[#2D1E08]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B] to-orange-600 flex items-center justify-center">
            <span className="font-bold text-white text-lg">R</span>
          </div>
          <span className="text-xl font-bold tracking-tight">RentVerse</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#FEF9EF]/80">
          <a href="#" className="hover:text-[#F59E0B] transition-colors">How it works</a>
          <a href="#" className="hover:text-[#F59E0B] transition-colors">Categories</a>
          <a href="#" className="hover:text-[#F59E0B] transition-colors">List your gear</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center justify-center bg-[#F59E0B] text-[#1C1408] hover:bg-[#F59E0B]/90 font-semibold px-5 py-2.5 rounded-full transition-transform hover:scale-105 active:scale-95 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            Browse near me
          </button>
          <button className="md:hidden p-2 text-[#FEF9EF]">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row h-[calc(100vh-73px)] relative z-10">
        
        {/* Left Side: Copy */}
        <div className="w-full md:w-1/3 p-6 md:p-12 flex flex-col justify-center relative z-20 bg-gradient-to-r from-[#1C1408] via-[#1C1408] to-transparent">
          <div className="max-w-md">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#2D1E08] border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] mr-2 animate-pulse"></span>
              Live Feed
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.1] mb-6 tracking-tight">
              Rent from <br/><span className="text-[#F59E0B]">real people</span> <br/>near you.
            </h1>
            <p className="text-lg md:text-xl text-[#FEF9EF]/70 mb-8 leading-relaxed">
              Why buy when you can borrow? Join the neighborhood marketplace for everything.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button className="w-full sm:w-auto bg-[#F59E0B] text-[#1C1408] font-bold px-8 py-4 rounded-xl flex items-center justify-center transition-all hover:bg-[#F59E0B]/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Search className="w-5 h-5 mr-2" />
                Find items
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm text-[#FEF9EF]/60 font-medium">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1C1408] bg-[#2D1E08] flex items-center justify-center text-xs font-bold text-[#F59E0B]">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p>Join <strong className="text-[#FEF9EF]">12,000+</strong> renters today</p>
            </div>
          </div>
        </div>

        {/* Right Side: Live Feed Grid */}
        <div className="w-full md:w-2/3 p-4 overflow-hidden relative">
          
          {/* Subtle gradient overlays for fade effect */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#1C1408] to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#1C1408] via-[#1C1408]/80 to-transparent z-10 pointer-events-none"></div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 pt-4 pb-32 h-full overflow-y-auto hidden-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {LISTINGS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  className="bg-[#2D1E08] border border-[#F59E0B]/10 rounded-2xl overflow-hidden shadow-xl hover:border-[#F59E0B]/40 transition-all duration-300 group transform hover:-translate-y-1 cursor-pointer break-inside-avoid animate-in fade-in slide-in-from-bottom-8"
                  style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                >
                  {/* Photo Area (Gradient representation) */}
                  <div className={`w-full ${item.height} bg-gradient-to-br ${item.gradient} relative p-4 flex flex-col justify-between`}>
                    <div className="flex justify-between items-start">
                      <div className="bg-[#1C1408]/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-white/10 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                        Available
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#1C1408]/60 backdrop-blur-md flex items-center justify-center border border-white/10">
                        <span className="text-white text-xs font-bold">{item.owner}</span>
                      </div>
                    </div>
                    <div className="self-end opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-12 h-12 text-white/80 drop-shadow-lg" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-[#FEF9EF] text-base mb-1 truncate">{item.title}</h3>
                    <div className="flex justify-between items-end mt-3">
                      <div>
                        <p className="text-xs text-[#FEF9EF]/50 mb-0.5">Per day</p>
                        <p className="font-black text-[#F59E0B] text-lg">${item.price}</p>
                      </div>
                      <div className="flex items-center bg-[#1C1408] px-2 py-1 rounded-md border border-[#F59E0B]/10">
                        <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B] mr-1" />
                        <span className="text-xs font-bold text-[#FEF9EF]">{item.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Live Status Overlay */}
      <div className="fixed bottom-0 left-0 w-full h-16 bg-[#1C1408]/90 backdrop-blur-lg border-t border-[#F59E0B]/20 flex items-center justify-center z-30">
        <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-[#2D1E08] border border-[#F59E0B]/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <p className="text-sm font-medium text-[#FEF9EF]">
            Live: <span className="font-bold text-[#F59E0B]">2,847</span> items available in your area
          </p>
        </div>
      </div>

      {/* Social Proof Toast */}
      <div 
        className={`fixed bottom-24 right-6 bg-[#2D1E08] border border-[#F59E0B]/30 p-3 pr-6 rounded-xl shadow-2xl flex items-center gap-3 z-40 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-[#1C1408] shadow-inner">
          <span className="text-white text-xs font-bold">AN</span>
        </div>
        <div>
          <p className="text-sm text-[#FEF9EF] font-medium"><strong className="text-white">Ana</strong> just rented</p>
          <p className="text-xs text-[#F59E0B] font-bold flex items-center mt-0.5">
            <Video className="w-3 h-3 mr-1" /> a GoPro Hero 11
          </p>
        </div>
        <div className="absolute top-2 right-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}

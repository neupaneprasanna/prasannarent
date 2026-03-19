import React from "react";
import { 
  Camera, 
  Tent, 
  Wrench, 
  Music, 
  Car, 
  CheckCircle2, 
  Star, 
  ArrowRight
} from "lucide-react";

export default function EditorialSplit() {
  return (
    <div className="min-h-screen w-full flex flex-col font-sans" style={{ backgroundColor: "#F8F7F4", color: "#1A1A1A" }}>
      {/* Navigation Bar (Minimal for hero) */}
      <nav className="w-full flex justify-between items-center py-6 px-8 md:px-16 border-b border-gray-200/50">
        <div className="font-['Playfair_Display'] text-2xl font-bold tracking-tight">
          RentVerse.
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#" className="hover:text-[#3730A3] transition-colors">How it works</a>
          <a href="#" className="hover:text-[#3730A3] transition-colors">Browse</a>
          <a href="#" className="hover:text-[#3730A3] transition-colors">List an item</a>
        </div>
        <div>
          <button style={{ backgroundColor: "#3730A3" }} className="text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </div>
      </nav>

      {/* Main Hero Split */}
      <div className="flex-1 w-full flex flex-col md:flex-row max-w-[1600px] mx-auto">
        
        {/* Left Column - Editorial Typography */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 md:py-0 md:border-r border-gray-200/60">
          <div className="max-w-xl">
            <h1 className="font-['Playfair_Display'] text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05] font-bold tracking-tight mb-8">
              rent<br />anything,<br />anywhere.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed font-light">
              From cameras to kayaks — rent from people near you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button style={{ backgroundColor: "#3730A3" }} className="text-white px-8 py-4 rounded-full text-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group">
                Browse listings
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-full text-lg font-medium border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors">
                List your item
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <CheckCircle2 className="w-5 h-5 text-[#3730A3]" />
              <span>Verified by RentVerse Guarantee</span>
            </div>
          </div>
        </div>

        {/* Right Column - Featured Product */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-white/30 backdrop-blur-sm">
          
          {/* Featured Card */}
          <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 transform hover:-translate-y-2 transition-transform duration-500">
            {/* Abstract Gradient Image Area */}
            <div className="w-full aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-amber-50 flex items-center justify-center p-8">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-200/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-200/50 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>
              
              {/* Product Representation */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-white/40 backdrop-blur-md shadow-xl border border-white/60 flex items-center justify-center">
                  <Camera className="w-20 h-20 text-[#3730A3] opacity-80" strokeWidth={1.5} />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-[#3730A3] shadow-sm">
                  Electronics
                </span>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-sm">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold font-['Playfair_Display'] mb-1">Sony Alpha a7 IV</h3>
                  <p className="text-sm text-gray-500">Mirrorless Digital Camera</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#3730A3]">$45</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">per day</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-sm">4.9</span>
                  <span className="text-xs text-gray-400 ml-1">(128)</span>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  🔥 156 rentals
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Category Bar */}
      <div className="w-full border-t border-gray-200/60 bg-white/50 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-8 md:px-16 py-6 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-8 min-w-max md:justify-center">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400 mr-4">Popular Categories</span>
            
            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors group">
              <Camera className="w-4 h-4 text-gray-400 group-hover:text-[#3730A3]" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#1A1A1A]">Electronics</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors group">
              <Tent className="w-4 h-4 text-gray-400 group-hover:text-[#3730A3]" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#1A1A1A]">Outdoors</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors group">
              <Wrench className="w-4 h-4 text-gray-400 group-hover:text-[#3730A3]" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#1A1A1A]">Tools</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors group">
              <Music className="w-4 h-4 text-gray-400 group-hover:text-[#3730A3]" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#1A1A1A]">Music</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors group">
              <Car className="w-4 h-4 text-gray-400 group-hover:text-[#3730A3]" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#1A1A1A]">Vehicles</span>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

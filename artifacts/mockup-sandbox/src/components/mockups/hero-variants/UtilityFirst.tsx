import React from 'react';
import { 
  Search, 
  Camera, 
  Bike, 
  Wrench, 
  Music, 
  Tent, 
  Car, 
  Trophy, 
  Laptop
} from 'lucide-react';

export default function UtilityFirst() {
  const categories = [
    { name: "Cameras", icon: <Camera className="w-6 h-6 mb-2" /> },
    { name: "Bikes", icon: <Bike className="w-6 h-6 mb-2" /> },
    { name: "Tools", icon: <Wrench className="w-6 h-6 mb-2" /> },
    { name: "Music", icon: <Music className="w-6 h-6 mb-2" /> },
    { name: "Camping", icon: <Tent className="w-6 h-6 mb-2" /> },
    { name: "Vehicles", icon: <Car className="w-6 h-6 mb-2" /> },
    { name: "Sports", icon: <Trophy className="w-6 h-6 mb-2" /> },
    { name: "Electronics", icon: <Laptop className="w-6 h-6 mb-2" /> },
  ];

  const popularSearches = ["DJI Drone", "Power Washer", "Mountain Bike"];

  const listings = [
    { title: "Sony A7IV Mirrorless", price: "$45/day", icon: <Camera className="w-6 h-6 text-gray-500" /> },
    { title: "Trek Fuel EX 8", price: "$65/day", icon: <Bike className="w-6 h-6 text-gray-500" /> },
    { title: "Honda EB2800i", price: "$35/day", icon: <Wrench className="w-6 h-6 text-gray-500" /> },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-[#111827] flex flex-col items-center justify-center font-sans px-4 relative overflow-hidden">
      {/* Header/Wordmark */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-center md:justify-start">
        <span className="text-xl font-bold tracking-tight">Nexis</span>
      </div>

      <div className="w-full max-w-[900px] flex flex-col items-center mt-16">
        {/* Headline */}
        <h1 className="text-[40px] md:text-[48px] font-medium tracking-tight mb-8 text-center leading-tight max-w-[600px]">
          Find anything to rent near you.
        </h1>

        {/* Search Bar */}
        <div className="w-full max-w-[700px] relative flex items-center mb-10">
          <div className="absolute left-6 text-gray-400">
            <Search className="w-6 h-6" />
          </div>
          <input 
            type="text" 
            placeholder="What do you need?" 
            className="w-full h-[68px] pl-16 pr-36 rounded-full border border-gray-200 outline-none text-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 bg-white"
          />
          <button className="absolute right-2.5 h-[48px] px-8 bg-[#2563EB] hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center justify-center">
            Search
          </button>
        </div>

        {/* Categories - Single Row */}
        <div className="w-full overflow-x-auto no-scrollbar mb-8">
          <div className="flex flex-row justify-start md:justify-center gap-4 min-w-max px-4">
            {categories.map((cat, i) => (
              <button 
                key={i}
                className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-600 hover:text-[#111827] bg-white flex-shrink-0"
              >
                {cat.icon}
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Popular Searches */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16 text-sm">
          <span className="text-gray-500">Popular right now:</span>
          {popularSearches.map((term, i) => (
            <button 
              key={i}
              className="px-4 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Minimal Listings */}
        <div className="w-full flex flex-col sm:flex-row gap-4 justify-center mt-4">
          {listings.map((listing, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-3 pr-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                {listing.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-[#111827]">{listing.title}</span>
                <span className="text-gray-500 text-sm">{listing.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

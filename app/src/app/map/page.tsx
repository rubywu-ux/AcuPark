"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MockService, ParkingLot } from "@/services/mockData";
import FilterChip from "@/components/FilterChip";
import SavedLotsDrawer from "@/components/SavedLotsDrawer";
import { MapPin, Navigation, Calendar, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function MapPage() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("Near Me");
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filters = [
    "Near Me",
    "Distance to Destination",
    "Walkability",
    "Late Hours",
    "Free Parking",
    "Low Cost",
  ];

  useEffect(() => {
    MockService.getLots().then(setLots);
  }, []);

  const filteredLots = lots.filter((lot) => {
    if (selectedFilter === "Near Me") return true; // Show all for demo
    return lot.features.includes(selectedFilter);
  });

  return (
    <main className="flex min-h-screen flex-col relative">
      {/* Map Container */}
      <div className="absolute inset-0 z-0">
        <Map 
          lots={filteredLots} 
          selectedLot={selectedLot} 
          onLotSelect={setSelectedLot} 
        />
      </div>

      {/* Top Search & Filter Bar */}
      <div className="z-10 pt-6 px-4 pb-4 bg-gradient-to-b from-white/90 via-white/80 to-transparent pointer-events-none">
        {/* Location Header */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center px-2 py-1 opacity-50 select-none">
            <MapPin size={14} className="text-gray-800 mr-1" />
            <span className="text-xs font-semibold text-gray-800">Seattle, WA</span>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="flex gap-3 mb-4 pointer-events-auto">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search parking..." 
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-md border-none focus:ring-2 focus:ring-primary outline-none text-text"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={clsx(
              "p-3 rounded-xl shadow-md transition-colors",
              isFilterOpen ? "bg-primary text-white" : "bg-white text-text hover:bg-surface"
            )}
          >
            <SlidersHorizontal size={24} />
          </button>
        </div>

        {/* Filter Chips Horizontal Scroll */}
        {isFilterOpen && (
          <div className="pointer-events-auto overflow-x-auto pb-2 hide-scrollbar flex space-x-2 animate-in fade-in slide-in-from-top-2">
            {filters.map((filter) => (
              <FilterChip
                key={filter}
                label={filter}
                isActive={selectedFilter === filter}
                onClick={() => {
                  setSelectedFilter(filter);
                  // Optional: Keep open to allow multiple selections or close immediately
                  // setIsFilterOpen(false); 
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute top-44 right-4 z-0 pointer-events-auto bg-surface/90 backdrop-blur-md p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600 shadow-sm ring-1 ring-green-200"></div>
          <span className="text-xs font-semibold text-text-muted">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm ring-1 ring-orange-200"></div>
          <span className="text-xs font-semibold text-text-muted">Busy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600 shadow-sm ring-1 ring-red-200"></div>
          <span className="text-xs font-semibold text-text-muted">Full</span>
        </div>
      </div>

      {/* Lot Details Drawer */}
      {selectedLot && (
        <div className="absolute bottom-24 left-4 right-4 bg-surface rounded-2xl shadow-2xl p-5 z-20 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold text-text">{selectedLot.name}</h2>
              <p className="text-text-muted text-sm">{selectedLot.availableSpots} spots available</p>
            </div>
            <button 
              onClick={() => setSelectedLot(null)}
              className="text-text-muted hover:text-text"
            >
              ✕
            </button>
          </div>

          <div className="flex space-x-2 mb-4">
            {selectedLot.features.map(f => (
              <span key={f} className="text-xs bg-gray-100 text-text-muted px-2 py-1 rounded">
                {f}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLot.location.lat},${selectedLot.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-text py-3 rounded-xl font-medium transition-colors"
            >
              <Navigation size={18} className="mr-2" />
              Navigate
            </a>
            <Link 
              href={`/reservation?lotId=${selectedLot.id}`}
              className="flex items-center justify-center bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-colors"
            >
              <Calendar size={18} className="mr-2" />
              Reserve
            </Link>
          </div>
        </div>
      )}

      <SavedLotsDrawer />
    </main>
  );
}


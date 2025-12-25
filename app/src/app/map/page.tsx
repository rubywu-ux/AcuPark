"use client";

import { useState, useEffect } from "react";
import { MockService, ParkingLot } from "@/services/mockData";
import FilterChip from "@/components/FilterChip";
import { MapPin, Navigation, Calendar } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function MapPage() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("Near Me");
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);

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
      {/* Map Container (Mock) */}
      <div className="absolute inset-0 bg-gray-200 z-0">
        <div className="w-full h-full relative overflow-hidden">
          {/* Mock Map Background Pattern */}
          <div className="absolute inset-0 opacity-10" 
               style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
          
          {/* Mock User Location */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="w-16 h-16 bg-blue-500/20 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
          </div>

          {/* Lot Markers */}
          {filteredLots.map((lot, index) => {
            // Randomize positions slightly for demo
            const top = 40 + (index * 15) + "%";
            const left = 20 + (index * 25) + "%";
            
            let colorClass = "bg-green-500";
            if (lot.status === "Busy") colorClass = "bg-yellow-500";
            if (lot.status === "Full") colorClass = "bg-red-500";

            return (
              <button
                key={lot.id}
                onClick={() => setSelectedLot(lot)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ top, left }}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold transition-transform hover:scale-110",
                  colorClass
                )}>
                  P
                </div>
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {lot.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="z-10 pt-12 px-4 pb-4 bg-gradient-to-b from-white/90 to-transparent pointer-events-none">
        <div className="pointer-events-auto overflow-x-auto pb-2 hide-scrollbar flex space-x-2">
          {filters.map((filter) => (
            <FilterChip
              key={filter}
              label={filter}
              isActive={selectedFilter === filter}
              onClick={() => setSelectedFilter(filter)}
            />
          ))}
        </div>
      </div>

      {/* Lot Details Drawer */}
      {selectedLot && (
        <div className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-5 z-20 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedLot.name}</h2>
              <p className="text-gray-500 text-sm">{selectedLot.availableSpots} spots available</p>
            </div>
            <button 
              onClick={() => setSelectedLot(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="flex space-x-2 mb-4">
            {selectedLot.features.map(f => (
              <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {f}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-xl font-medium transition-colors">
              <Navigation size={18} className="mr-2" />
              Navigate
            </button>
            <Link 
              href={`/reservation?lotId=${selectedLot.id}`}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              <Calendar size={18} className="mr-2" />
              Reserve
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, MapPin } from "lucide-react";
import { clsx } from "clsx";

export default function SavedLotsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"saved" | "favorites">("saved");

  const toggleDrawer = () => setIsOpen(!isOpen);

  return (
    <div 
      className={clsx(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-20 flex flex-col",
        isOpen ? "h-[60vh]" : "h-36" // Collapsed height shows handle only (approx 64px visible above nav)
      )}
    >
      {/* Handle / Toggle Area */}
      <div 
        className="w-full flex flex-col items-center pt-3 pb-10 cursor-pointer shrink-0"
        onClick={toggleDrawer}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2" />
      </div>

      {/* Tabs and Content Wrapper */}
      <div 
        className={clsx(
          "flex-1 flex flex-col min-h-0 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100 shrink-0">
          <button
            className={clsx(
              "flex-1 pb-3 text-sm font-medium transition-colors relative",
              activeTab === "saved" ? "text-primary" : "text-gray-400"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("saved");
            }}
          >
            Recents
            {activeTab === "saved" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            className={clsx(
              "flex-1 pb-3 text-sm font-medium transition-colors relative",
              activeTab === "favorites" ? "text-primary" : "text-gray-400"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("favorites");
            }}
          >
            Favorites
            {activeTab === "favorites" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 pb-24">
          {activeTab === "saved" ? (
            <div className="space-y-4">
              {/* Saved Lot Card - Mimicking 'Zone' from Figma */}
              <div className="bg-white border-2 border-[#919191] rounded-[20px] p-4 flex justify-between items-start shadow-sm">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="text-[#502E83] font-semibold text-sm mb-1">Lot</div>
                    <div className="text-[#211F27] text-2xl font-normal">N-06/ C3</div>
                  </div>
                  <div className="text-[#502E83] text-sm mt-4">Previously visited</div>
                </div>
                
                {/* Map Placeholder / Icon */}
                <div className="w-[100px] h-[67px] bg-gray-200 rounded-[20px] border border-[#919191] flex items-center justify-center relative overflow-hidden">
                   {/* Placeholder for map image */}
                   <div className="absolute inset-0 bg-gray-300 opacity-50"></div>
                   <div className="bg-white p-2 rounded-full shadow-sm z-10">
                      <MapPin size={20} className="text-[#502E83]" />
                   </div>
                </div>
              </div>

               {/* Another Example Card */}
               <div className="bg-white border border-gray-200 rounded-[20px] p-4 flex justify-between items-center shadow-sm opacity-60">
                <div>
                    <div className="text-gray-500 font-semibold text-xs mb-1">Lot</div>
                    <div className="text-gray-800 text-xl">S-12/ A1</div>
                    <div className="text-gray-400 text-xs mt-1">Last week</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p>No favorites yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

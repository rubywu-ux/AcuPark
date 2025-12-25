"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Navigation, TrafficCone, MapPin } from "lucide-react";
import { clsx } from "clsx";

export default function NavigationPage() {
  const router = useRouter();
  const [availableSpots, setAvailableSpots] = useState(6);
  const [distance, setDistance] = useState(16); // km
  const [timeLeft, setTimeLeft] = useState(6); // min
  const [trafficLights, setTrafficLights] = useState(2);
  const [showArrival, setShowArrival] = useState(false);

  // Simulate "Anxiety Reducer" - Live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAvailableSpots(prev => Math.max(1, prev - (Math.random() > 0.7 ? 1 : 0)));
    }, 3000);

    // Simulate driving
    const driveInterval = setInterval(() => {
      setDistance(prev => Math.max(0, prev - 0.1));
      setTimeLeft(prev => Math.max(0, prev - 0.05));
    }, 1000);

    // Simulate arrival after 10 seconds for demo
    const arrivalTimer = setTimeout(() => {
      setShowArrival(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(driveInterval);
      clearTimeout(arrivalTimer);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col relative bg-gray-900 text-white">
      {/* Mock Navigation Map */}
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="w-full h-full bg-gray-800 relative overflow-hidden">
           {/* Road */}
           <div className="absolute left-1/2 top-0 bottom-0 w-16 bg-gray-700 transform -translate-x-1/2">
             <div className="absolute left-1/2 top-0 bottom-0 w-1 border-l-2 border-dashed border-yellow-500 transform -translate-x-1/2"></div>
           </div>
           {/* Car */}
           <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
             <div className="w-8 h-12 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/50"></div>
           </div>
        </div>
      </div>

      {/* Top HUD */}
      <div className="relative z-10 p-6 flex justify-between items-start">
        <button onClick={() => router.back()} className="bg-black/40 p-3 rounded-full backdrop-blur-md">
          <ArrowLeft size={24} />
        </button>
        
        {/* Anxiety Reducer Badge */}
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/30 flex items-center animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="font-mono font-bold text-green-400">{availableSpots} Spots Available</span>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 p-6 rounded-t-3xl shadow-2xl z-20 border-t border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Lot N06</h2>
            <p className="text-gray-400 text-sm">123 University Way</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">{Math.ceil(timeLeft)} <span className="text-sm font-normal text-gray-400">min</span></div>
            <div className="text-gray-400 text-sm">{distance.toFixed(1)} km</div>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <div className="bg-gray-800 p-3 rounded-xl flex-1 flex items-center justify-center">
            <TrafficCone size={20} className="text-orange-500 mr-2" />
            <span className="font-medium">{trafficLights} Lights</span>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl flex-1 flex items-center justify-center">
            <Navigation size={20} className="text-blue-500 mr-2" />
            <span className="font-medium">Fastest Route</span>
          </div>
        </div>

        <button className="w-full bg-red-500/20 text-red-400 font-bold py-4 rounded-xl hover:bg-red-500/30 transition-colors">
          End Navigation
        </button>
      </div>

      {/* Arrival Modal */}
      {showArrival && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white text-gray-900 w-full max-w-sm rounded-3xl p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You've Arrived!</h2>
            <p className="text-gray-500 mb-6">Please confirm your spot to process payment.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200"
              >
                Scan to Pay (Apple Pay)
              </button>
              <button 
                onClick={() => router.push('/')}
                className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-xl"
              >
                Use Saved Card
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

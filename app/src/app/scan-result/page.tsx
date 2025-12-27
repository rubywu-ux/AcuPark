"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MockService, User } from "@/services/mockData";
import { Pencil, MapPin, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ScanResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  useEffect(() => {
    // Simulate processing/fetching data based on the scan
    const loadData = async () => {
      // Retrieve image from session storage
      const storedImage = sessionStorage.getItem('scannedImage');
      console.log("Retrieved image from storage:", storedImage ? "Found (length: " + storedImage.length + ")" : "Not found");
      
      if (storedImage) {
        console.log("Image preview:", storedImage.substring(0, 50) + "...");
        setScannedImage(storedImage);
      }

      // In a real app, we might use the searchParams.get('plate') to fetch specific data
      const userData = await MockService.getUser();
      setUser(userData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-primary relative flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center">
        <Link href="/" className="text-white/80 hover:text-white bg-black/20 backdrop-blur-md p-2 rounded-full">
          <ArrowLeft size={24} />
        </Link>
        <span className="text-white/80 font-medium text-sm bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
          Scan ID: #8X29A
        </span>
      </div>

      {/* Scanned Image Area (Simulated) */}
      <div className="flex-1 relative bg-primary overflow-hidden">
        {/* This represents the captured photo */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ 
            backgroundImage: `url('${scannedImage || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop"}')` 
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-primary"></div>
        
        {/* Scanning Overlay Effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-2 border-green-400/50 rounded-lg relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500 -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500 -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500 -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500 -mb-1 -mr-1"></div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="bg-surface rounded-t-3xl -mt-6 relative z-10 px-6 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 duration-500">
        {/* Handle Bar */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-secondary text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                {user.role}
              </span>
              <span className="text-green-600 text-xs font-bold flex items-center">
                <Check size={12} className="mr-1" /> Verified
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text">
              {user.vehicle.color} {user.vehicle.make} {user.vehicle.model}
            </h1>
          </div>
          <button className="text-text-muted hover:text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
            <Pencil size={20} />
          </button>
        </div>

        {/* License Plate */}
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 text-center mb-6 shadow-sm">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-1">License Plate</p>
          <p className="font-mono text-4xl font-bold text-text tracking-widest">{user.vehicle.plate}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center text-text-muted mb-2">
              <MapPin size={14} className="mr-1" />
              <span className="text-[10px] uppercase font-bold">Location</span>
            </div>
            <p className="text-text font-bold text-lg">Lot N06</p>
            <p className="text-xs text-text-muted">North Campus</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center text-text-muted mb-2">
              <span className="text-[10px] uppercase font-bold">Rate</span>
            </div>
            <p className="text-primary font-bold text-lg">$4.50<span className="text-sm text-text-muted font-normal">/hr</span></p>
            <p className="text-xs text-text-muted">Standard Rate</p>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => router.push('/map')}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center"
        >
          Confirm & Park Here
        </button>
      </div>
    </main>
  );
}

export default function ScanResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <ScanResultContent />
    </Suspense>
  );
}

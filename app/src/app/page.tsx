"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Camera, Scan, AlertCircle, X, Search, Pencil } from "lucide-react";
import { MockService, User, Reservation, ParkingLot } from "@/services/mockData";
import ReservationCard from "@/components/ReservationCard";
import Link from "next/link";

const Webcam = dynamic(() => import("@/components/WebcamWrapper"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [reservedLot, setReservedLot] = useState<ParkingLot | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const webcamRef = useRef<any>(null);

  useEffect(() => {
    console.log("Home Page Mounted");
    setIsMounted(true);
    // Load initial data
    const loadData = async () => {
      try {
        console.log("Loading data...");
        const userData = await MockService.getUser();
        const reservations = await MockService.getReservations();
        const lots = await MockService.getLots();

        setUser(userData);
        console.log("Data loaded", { userData });
        
        // Find upcoming or active reservation
        const upcoming = reservations.find(r => r.status === 'upcoming' || r.status === 'active');
        if (upcoming) {
          setActiveReservation(upcoming);
          const lot = lots.find(l => l.id === upcoming.lotId);
          setReservedLot(lot || null);
        }
      } catch (e) {
        console.error("Error loading data", e);
      }
    };
    loadData();
  }, []);

  const handleUserMedia = useCallback(() => {
    console.log("Webcam: User Media Allowed");
    setIsCameraReady(true);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error("Webcam: User Media Error", error);
    setCameraError("Camera access denied or not available");
  }, []);

  const capture = useCallback(() => {
    console.log("Initiating capture...");
    setIsScanning(true);
    
    if (!webcamRef.current) {
      console.error("Webcam reference is missing!");
      // Try to recover or just warn
    }

    // Capture image immediately
    const imageSrc = webcamRef.current?.getScreenshot();
    console.log("Screenshot result:", imageSrc ? "Data captured" : "Null");
    
    if (imageSrc) {
      try {
        sessionStorage.setItem('scannedImage', imageSrc);
        console.log("Image successfully saved to sessionStorage. Size:", imageSrc.length);
      } catch (e) {
        console.error("Storage error:", e);
        alert("Failed to save image. Storage might be full.");
        setIsScanning(false);
        return;
      }
    } else {
        console.warn("Failed to capture image from webcam");
        // If we fail, try one more time after a short delay
        setTimeout(() => {
             const retryImage = webcamRef.current?.getScreenshot();
             if (retryImage) {
                 sessionStorage.setItem('scannedImage', retryImage);
                 // Continue flow
             } else {
                 alert("Could not capture image. Please ensure camera is active.");
                 setIsScanning(false);
             }
        }, 500);
        return;
    }

    // Simulate AI processing
    setTimeout(() => {
      setIsScanning(false);
      if (user) {
        // Navigate to the result page
        router.push('/scan-result');
      }
    }, 2000);
  }, [user, router]);

  return (
    <main className="flex min-h-screen flex-col px-6 pt-8 bg-surface">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Hello, {user?.name.split(' ')[0] || 'Driver'}
          </h1>
          <p className="text-primary/70 text-lg font-medium mt-1">Ready to park?</p>
        </div>
      </div>

      {/* Lot Search */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Enter lot number..." 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-primary outline-none text-text"
          />
        </div>
      </div>

      {/* AI Quick Scan Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-text mb-3 flex items-center">
          <Scan className="mr-2 text-primary" size={20} />
          AI Quick Scan
        </h2>
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
          {!isCameraActive ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-primary text-white">
              <button 
                onClick={() => {
                  setIsCameraActive(true);
                  setIsCameraReady(false);
                  setCameraError(null);
                }}
                className="flex flex-col items-center justify-center space-y-3 group"
              >
                <div className="bg-secondary p-4 rounded-full shadow-lg shadow-primary/50 group-hover:scale-110 transition-transform">
                  <Camera size={32} className="text-primary" />
                </div>
                <span className="font-medium text-sm text-white/80">Tap to Scan Vehicle</span>
              </button>
            </div>
          ) : (
            <>
              <button 
                 onClick={() => setIsCameraActive(false)}
                 className="absolute top-3 right-3 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
               >
                 <X size={20} />
               </button>
              {cameraError ? (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white p-4 text-center">
                  <p>{cameraError}</p>
                </div>
              ) : (
                <Webcam
                  audio={false}
                  webcamRef={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.7}
                  videoConstraints={{ 
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  }}
                  className="w-full h-full object-cover opacity-80"
                  onUserMedia={handleUserMedia}
                  onUserMediaError={handleUserMediaError}
                />
              )}
              {!cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {isScanning ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-2"></div>
                      <p className="text-white font-medium drop-shadow-md">Scanning Vehicle...</p>
                    </div>
                  ) : (
                    isCameraReady && (
                      <button
                        onClick={capture}
                        className="bg-white/20 backdrop-blur-md border-2 border-white/50 p-4 rounded-full hover:bg-white/30 transition-all animate-in zoom-in duration-300"
                      >
                        <Camera className="text-white" size={32} />
                      </button>
                    )
                  )}
                </div>
              )}
              {!cameraError && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white/80 text-xs">Align license plate within frame</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active/Upcoming Reservation */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-text mb-3">
          {activeReservation?.status === 'active' ? 'Active Session' : 'Upcoming Reservation'}
        </h2>
        {activeReservation && reservedLot ? (
          <ReservationCard reservation={activeReservation} lot={reservedLot} />
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
            <p className="text-text-muted mb-4">No active parking sessions.</p>
            <Link href="/map" className="text-primary font-medium hover:underline">
              Find a spot now &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions / Tips */}
      <div>
        <h2 className="text-lg font-bold text-text mb-3">Quick Tips</h2>
        <div className="bg-primary/5 p-4 rounded-xl flex items-start">
          <AlertCircle className="text-primary mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-primary text-sm">Campus Event Today</h4>
            <p className="text-text-muted text-xs mt-1">
              Lot E03 is reserved for the graduation ceremony until 5 PM.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Camera, Scan, AlertCircle } from "lucide-react";
import { MockService, User, Reservation, ParkingLot } from "@/services/mockData";
import ReservationCard from "@/components/ReservationCard";
import Link from "next/link";

const Webcam = dynamic(() => import("@/components/WebcamWrapper"), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [reservedLot, setReservedLot] = useState<ParkingLot | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
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
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error("Webcam: User Media Error", error);
    setCameraError("Camera access denied or not available");
  }, []);

  const capture = useCallback(() => {
    setIsScanning(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsScanning(false);
      if (user) {
        setScanResult(`Vehicle Detected: ${user.vehicle.make} ${user.vehicle.model} (${user.vehicle.plate})`);
      }
    }, 2000);
  }, [user]);

  return (
    <main className="flex min-h-screen flex-col px-6 pt-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.name.split(' ')[0] || 'Driver'}</h1>
          <p className="text-gray-500 text-sm">Ready to park?</p>
        </div>
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
          {user?.name.charAt(0) || 'U'}
        </div>
      </div>

      {/* AI Quick Scan Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
          <Scan className="mr-2 text-blue-600" size={20} />
          AI Quick Scan
        </h2>
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
          {!scanResult ? (
            <>
              {cameraError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white p-4 text-center">
                  <p>{cameraError}</p>
                </div>
              ) : (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
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
                    <button
                      onClick={capture}
                      className="bg-white/20 backdrop-blur-md border-2 border-white/50 p-4 rounded-full hover:bg-white/30 transition-all"
                    >
                      <Camera className="text-white" size={32} />
                    </button>
                  )}
                </div>
              )}
              {!cameraError && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white/80 text-xs">Align license plate within frame</p>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <Scan className="text-white" size={32} />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Scan Complete</h3>
              <p className="text-gray-300 mb-6">{scanResult}</p>
              <button 
                onClick={() => setScanResult(null)}
                className="text-white underline text-sm"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active/Upcoming Reservation */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {activeReservation?.status === 'active' ? 'Active Session' : 'Upcoming Reservation'}
        </h2>
        {activeReservation && reservedLot ? (
          <ReservationCard reservation={activeReservation} lot={reservedLot} />
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
            <p className="text-gray-500 mb-4">No active parking sessions.</p>
            <Link href="/map" className="text-blue-600 font-medium hover:underline">
              Find a spot now &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions / Tips */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Tips</h2>
        <div className="bg-blue-50 p-4 rounded-xl flex items-start">
          <AlertCircle className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Campus Event Today</h4>
            <p className="text-blue-800 text-xs mt-1">
              Lot E03 is reserved for the graduation ceremony until 5 PM.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

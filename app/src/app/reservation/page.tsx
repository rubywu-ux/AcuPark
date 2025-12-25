"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MockService, ParkingLot } from "@/services/mockData";
import { ArrowLeft, Calendar, Clock, CreditCard, CheckCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function ReservationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lotId = searchParams.get("lotId");
  
  const [step, setStep] = useState(1);
  const [lot, setLot] = useState<ParkingLot | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("13:00");
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    if (lotId) {
      MockService.getLots().then(lots => {
        const found = lots.find(l => l.id === lotId);
        setLot(found || null);
      });
    }
  }, [lotId]);

  if (!lot) return <div className="p-8 text-center">Loading...</div>;

  // Mock Spots Grid
  const renderSpotGrid = () => {
    const rows = ['A', 'B', 'C', 'D'];
    const cols = [1, 2, 3, 4];
    
    return (
      <div className="grid grid-cols-4 gap-3 mb-6">
        {rows.map(row => (
          cols.map(col => {
            const spotId = `${row}${col}`;
            const isOccupied = Math.random() > 0.7; // Randomly occupied
            const isSelected = selectedSpot === spotId;
            
            return (
              <button
                key={spotId}
                disabled={isOccupied}
                onClick={() => setSelectedSpot(spotId)}
                className={clsx(
                  "aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                  isOccupied ? "bg-gray-200 text-gray-400 cursor-not-allowed" : 
                  isSelected ? "bg-blue-600 text-white shadow-lg scale-105" : "bg-green-100 text-green-800 hover:bg-green-200"
                )}
              >
                {spotId}
              </button>
            );
          })
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 pt-8 pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">
          {step === 1 ? "Select Spot" : step === 2 ? "Date & Time" : "Confirm"}
        </h1>
      </div>

      {/* Step 1: Spot Selection */}
      {step === 1 && (
        <div className="animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
            <h2 className="font-bold text-lg mb-2">{lot.name}</h2>
            <p className="text-gray-500 text-sm">Select your preferred spot</p>
          </div>
          
          {renderSpotGrid()}

          <div className="flex justify-between text-xs text-gray-500 px-4 mb-8">
            <div className="flex items-center"><div className="w-3 h-3 bg-green-100 rounded mr-2"></div> Available</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-gray-200 rounded mr-2"></div> Occupied</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-blue-600 rounded mr-2"></div> Selected</div>
          </div>

          <button
            disabled={!selectedSpot}
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Time Setup */}
      {step === 2 && (
        <div className="animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar size={16} className="mr-2" /> Date
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock size={16} className="mr-2" /> Start Time
              </label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map(h => (
                  <button
                    key={h}
                    onClick={() => setDuration(h)}
                    className={clsx(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      duration === h ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Review Reservation
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-blue-100">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{lot.name}</h2>
                <p className="text-blue-600 font-medium">Spot {selectedSpot}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                <MapPin size={24} className="text-blue-600" />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{time} ({duration}h)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium">Toyota Camry</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-xl text-blue-600">${lot.pricePerHour * duration}</span>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 mb-4">
              Payment will be processed upon arrival via Apple Pay or Saved Card.
            </div>
          </div>

          <Link
            href="/"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-green-200"
          >
            <CheckCircle size={20} className="mr-2" />
            Confirm Reservation
          </Link>
        </div>
      )}
    </main>
  );
}

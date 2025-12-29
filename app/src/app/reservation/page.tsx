"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MockService, ParkingLot } from "@/services/mockData";
import { ArrowLeft, Calendar as CalendarIcon, Clock, CreditCard, CheckCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import Calendar from "@/components/Calendar";
import CustomTimePicker from "@/components/CustomTimePicker";

function ReservationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lotId = searchParams.get("lotId");
  
  const [step, setStep] = useState(1);
  const [lot, setLot] = useState<ParkingLot | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([new Date().toISOString().split('T')[0]]);
  const [time, setTime] = useState("13:00");
  const [duration, setDuration] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Generate time slots
  const timeSlots = [];
  for (let i = 6; i <= 22; i++) {
    const hour = i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const label = `${displayHour}:00 ${ampm}`;
    timeSlots.push({ value: timeString, label });
  }
  
  // Stable spot data
  const [spots, setSpots] = useState<{id: string, isOccupied: boolean}[]>([]);

  useEffect(() => {
    if (lotId) {
      MockService.getLots().then(lots => {
        const found = lots.find(l => l.id === lotId);
        setLot(found || null);
      });
      
      // Generate stable spots
      const rows = ['A', 'B', 'C', 'D'];
      const cols = [1, 2, 3, 4];
      const newSpots = [];
      
      for (const row of rows) {
        for (const col of cols) {
          newSpots.push({
            id: `${row}${col}`,
            isOccupied: Math.random() > 0.7
          });
        }
      }
      setSpots(newSpots);
    }
  }, [lotId]);

  if (!lot) return <div className="p-8 text-center">Loading...</div>;

  // Mock Spots Grid
  const renderSpotGrid = () => {
    return (
      <div className="grid grid-cols-4 gap-3 mb-6">
        {spots.map(spot => {
            const isSelected = selectedSpot === spot.id;
            
            return (
              <button
                key={spot.id}
                disabled={spot.isOccupied}
                onClick={() => setSelectedSpot(spot.id)}
                className={clsx(
                  "aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                  spot.isOccupied ? "bg-gray-200 text-gray-400 cursor-not-allowed" : 
                  isSelected ? "bg-primary text-white shadow-lg scale-105" : "bg-secondary/20 text-primary hover:bg-secondary/30"
                )}
              >
                {spot.id}
              </button>
            );
        })}
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
        <div className="animate-in slide-in-from-right fade-in duration-200">
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
            <h2 className="font-bold text-lg mb-2">{lot.name}</h2>
            <p className="text-gray-500 text-sm">Select your preferred spot</p>
          </div>
          
          {renderSpotGrid()}

          <div className="flex justify-between text-xs text-gray-500 px-4 mb-8">
            <div className="flex items-center"><div className="w-3 h-3 bg-secondary/20 rounded mr-2"></div> Available</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-gray-200 rounded mr-2"></div> Occupied</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-primary rounded mr-2"></div> Selected</div>
          </div>

          <button
            disabled={!selectedSpot}
            onClick={() => setStep(2)}
            className="w-full bg-primary disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Time Setup */}
      {step === 2 && (
        <div className="animate-in slide-in-from-right fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-center">
                <CalendarIcon size={16} className="mr-2" /> 
                Select Dates
              </label>
              
              <Calendar 
                selectedDates={selectedDates}
                minDate={today}
                onDateSelect={(dateStr) => {
                  if (selectedDates.includes(dateStr)) {
                    setSelectedDates(selectedDates.filter(d => d !== dateStr));
                  } else {
                    setSelectedDates([...selectedDates, dateStr].sort());
                  }
                  setError(null);
                }}
              />
              
              {selectedDates.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Selected Dates:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map(d => (
                      <div key={d} className="bg-primary/5 text-primary px-3 py-1 rounded-full text-sm flex items-center">
                        {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        <button 
                          onClick={() => setSelectedDates(selectedDates.filter(date => date !== d))}
                          className="ml-2 text-primary/60 hover:text-primary"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-500 mt-2 text-center">Please select at least one date.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock size={16} className="mr-2" /> Start Time
              </label>
              <CustomTimePicker
                value={time}
                duration={duration}
                onChange={(newTime) => {
                  setTime(newTime);
                  setError(null);
                }}
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
                      duration === h ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <button
            disabled={selectedDates.length === 0}
            onClick={() => {
              // Validate time if date is today
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              const [selectedHour, selectedMinute] = time.split(':').map(Number);
              
              // Check if any selected date is today and time is in past
              const hasToday = selectedDates.some(d => d === today);
              
              if (hasToday) {
                if (selectedHour < currentHour || (selectedHour === currentHour && selectedMinute < currentMinute)) {
                  setError("Cannot select a time in the past for today");
                  return;
                }
              }
              
              setStep(3);
            }}
            className="w-full bg-primary disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Review Reservation
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="animate-in slide-in-from-right fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-primary/10">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{lot.name}</h2>
                <p className="text-primary font-medium">Spot {selectedSpot}</p>
              </div>
              <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center">
                <MapPin size={24} className="text-primary" />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Dates</span>
                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{selectedDates.length} day{selectedDates.length > 1 ? 's' : ''} selected</span>
                    <span className="text-xs text-gray-400">
                      {selectedDates.map(d => new Date(d).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})).join(', ')}
                    </span>
                  </div>
                </div>
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
                <span className="font-bold text-xl text-primary">
                  ${lot.pricePerHour * duration * selectedDates.length}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 mb-4">
              Payment will be processed upon arrival via Apple Pay or Saved Card.
            </div>
          </div>

          <Link
            href="/"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-primary/20"
          >
            <CheckCircle size={20} className="mr-2" />
            Confirm Reservation
          </Link>
        </div>
      )}
    </main>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ReservationContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import { MockService, User } from "@/services/mockData";
import { User as UserIcon, Car, CreditCard, Shield } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    MockService.getUser().then(setUser);
  }, []);

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-surface px-6 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-text mb-8">My Profile</h1>

      {/* User Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex items-center border border-gray-100">
        <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-secondary font-bold text-2xl mr-4 shadow-lg shadow-primary/20">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="font-bold text-lg text-text">{user.name}</h2>
          <p className="text-text-muted text-sm">{user.email}</p>
          <span className="inline-block bg-secondary text-primary text-xs px-2 py-1 rounded mt-2 font-bold uppercase tracking-wide">
            {user.role}
          </span>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <h3 className="font-bold text-text mb-4 flex items-center">
          <Car className="mr-2 text-primary" size={20} />
          Vehicle Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-text-muted">Plate</span>
            <span className="font-mono font-medium text-text">{user.vehicle.plate}</span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-text-muted">Make/Model</span>
            <span className="font-medium text-text">{user.vehicle.make} {user.vehicle.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Color</span>
            <span className="font-medium text-text">{user.vehicle.color}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <h3 className="font-bold text-text mb-4 flex items-center">
          <CreditCard className="mr-2 text-primary" size={20} />
          Payment Methods
        </h3>
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl mb-3">
          <div className="flex items-center">
            <div className="w-10 h-6 bg-black rounded mr-3"></div>
            <span className="font-medium text-text">Apple Pay</span>
          </div>
          <span className="text-xs text-green-600 font-bold">Default</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
          <div className="flex items-center">
            <div className="w-10 h-6 bg-primary rounded mr-3"></div>
            <span className="font-medium text-text">Visa •••• 4242</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button className="text-red-500 font-medium text-sm hover:text-red-600 transition-colors">Log Out</button>
      </div>
    </main>
  );
}

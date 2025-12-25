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
    <main className="min-h-screen bg-gray-50 px-6 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      {/* User Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex items-center">
        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl mr-4">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="font-bold text-lg">{user.name}</h2>
          <p className="text-gray-500 text-sm">{user.email}</p>
          <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mt-2 font-medium">
            {user.role}
          </span>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Car className="mr-2 text-gray-400" size={20} />
          Vehicle Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Plate</span>
            <span className="font-mono font-medium">{user.vehicle.plate}</span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Make/Model</span>
            <span className="font-medium">{user.vehicle.make} {user.vehicle.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Color</span>
            <span className="font-medium">{user.vehicle.color}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <CreditCard className="mr-2 text-gray-400" size={20} />
          Payment Methods
        </h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
          <div className="flex items-center">
            <div className="w-10 h-6 bg-black rounded mr-3"></div>
            <span className="font-medium">Apple Pay</span>
          </div>
          <span className="text-xs text-green-600 font-bold">Default</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center">
            <div className="w-10 h-6 bg-blue-800 rounded mr-3"></div>
            <span className="font-medium">Visa •••• 4242</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button className="text-red-500 font-medium text-sm">Log Out</button>
      </div>
    </main>
  );
}

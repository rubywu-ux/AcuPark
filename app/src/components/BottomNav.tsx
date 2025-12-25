"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, User, CircleParking } from "lucide-react";
import { clsx } from "clsx";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: CircleParking },
    { name: "Map", href: "/map", icon: Map },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-20">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors",
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <item.icon size={28} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs mt-1 font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

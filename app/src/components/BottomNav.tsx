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
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-20">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all duration-200",
              isActive 
                ? "text-primary bg-primary/10 font-semibold" 
                : "text-gray-400 hover:text-primary hover:bg-gray-50"
            )}
          >
            <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

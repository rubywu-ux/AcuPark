"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MapPin, Settings } from "lucide-react";
import { clsx } from "clsx";

const ParkGlyph = ({ size = 24 }: { size?: number }) => (
  <span className="font-semibold leading-none" style={{ fontSize: size }}>
    P
  </span>
);

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: ParkGlyph },
  { name: "Map", href: "/map", icon: MapPin },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const TAB_ROUTES = NAV_ITEMS.map((i) => i.href);

/** Space the nav takes at the bottom: its measured height, or bar + safe area until measured. */
export const NAV_SPACE = "var(--nav-total, calc(var(--nav-h) + env(safe-area-inset-bottom)))";

export default function BottomNav() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  // Publish the nav's real height (bar + safe area) as --nav-total. Mobile Safari's floating
  // toolbar makes 100dvh and env(safe-area-inset-bottom) disagree, so screens that sit on top
  // of the nav (the map) size themselves from this instead of a calc.
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty("--nav-total", `${nav.offsetHeight}px`));
    ro.observe(nav);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--nav-total");
    };
  }, []);

  return (
    <nav
      ref={ref}
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 mx-auto max-w-app z-50 bg-nav text-white pb-safe shadow-[0_-4px_12px_rgba(13,10,44,0.08)]"
    >
      <div className="flex h-[var(--nav-h)]">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                active ? "text-white" : "text-white/55 hover:text-white/80"
              )}
            >
              <Icon size={22} />
              <span className={clsx("text-[12px]", active ? "font-semibold" : "font-normal")}>{item.name}</span>
              <span
                className={clsx(
                  "absolute bottom-1 h-[3px] rounded-full bg-white transition-all duration-300",
                  active ? "w-12 opacity-100" : "w-0 opacity-0"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

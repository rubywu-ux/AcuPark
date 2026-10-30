"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BottomNav, { NAV_SPACE, TAB_ROUTES } from "@/components/BottomNav";
import Splash, { SPLASH_MS } from "@/components/Splash";
import { useToast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatTime } from "@/services/mockData";

/** Phone-width column, theme sync, launch splash on every load, and nav only on the three tab screens. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, session, ready } = useStore();
  const toast = useToast();
  const remindedFor = useRef<string | null>(null);
  const showNav = TAB_ROUTES.includes(pathname);
  // Every full page load (opening the app or refreshing) starts on the logo splash.
  // It's rendered from the first paint, so the app never flashes before it.
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    // Until the store hydrates, the pre-paint script in layout owns the theme.
    if (!ready) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme, ready]);

  // Heads-up 10 minutes before the parking session runs out (once per end time).
  useEffect(() => {
    if (!session) return;
    const check = () => {
      const left = new Date(session.endsAt).getTime() - Date.now();
      const key = `${session.id}:${session.endsAt}`;
      if (left > 0 && left <= 10 * 60_000 && remindedFor.current !== key) {
        remindedFor.current = key;
        toast(`⏰ Parking ends at ${formatTime(session.endsAt)} — tap +30 min on Home to extend`);
      }
    };
    check();
    const t = setInterval(check, 15_000);
    return () => clearInterval(t);
  }, [session, toast]);

  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setSplash(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, [splash]);

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-app bg-bg sm:shadow-lift">
      <div style={showNav ? { paddingBottom: NAV_SPACE } : undefined}>{children}</div>
      {showNav && <BottomNav />}
      {splash && !pathname.startsWith("/preview") && <Splash />}
    </div>
  );
}

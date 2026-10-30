"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BottomNav, { TAB_ROUTES } from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { useToast } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatTime } from "@/services/mockData";

/** Phone-width column, theme sync, launch splash, and nav only on the three tab screens. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, session, ready } = useStore();
  const toast = useToast();
  const remindedFor = useRef<string | null>(null);
  const showNav = TAB_ROUTES.includes(pathname);
  const [splash, setSplash] = useState(false);

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
    try {
      if (sessionStorage.getItem("acupark:splash")) return;
      sessionStorage.setItem("acupark:splash", "1");
    } catch {
      return;
    }
    setSplash(true);
  }, []);

  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setSplash(false), 1400);
    return () => clearTimeout(t);
  }, [splash]);

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-app bg-bg sm:shadow-lift">
      <div className={showNav ? "pb-[calc(72px+env(safe-area-inset-bottom))]" : undefined}>{children}</div>
      {showNav && <BottomNav />}
      {splash && (
        <div className="fixed inset-0 z-[100] mx-auto max-w-app bg-[#F3ECFB] grid place-items-center animate-[fade-up_0.3s_reverse_both_1.1s]">
          <div className="flex flex-col items-center gap-4 animate-pop">
            <Logo size={150} />
            <p className="text-[#502E83] font-semibold tracking-[0.2em] text-sm">ACUPARK</p>
          </div>
        </div>
      )}
    </div>
  );
}

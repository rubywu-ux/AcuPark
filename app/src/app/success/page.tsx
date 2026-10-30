"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { PAYMENT_METHODS, formatMoney, formatTime, getLot, signCode } from "@/services/mockData";

/** The green "Paid" frames from Figma: ring draws, check pops, then home. */
function SuccessScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { session } = useStore();
  const s = session?.id === params.get("s") ? session : null;
  const lot = getLot(s?.lotId);

  useEffect(() => {
    const t = setTimeout(() => router.replace("/"), 4200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main
      className="min-h-[100dvh] bg-success text-white flex flex-col items-center justify-center px-8 text-center cursor-pointer"
      onClick={() => router.replace("/")}
    >
      <svg width="148" height="148" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="277"
          strokeDashoffset="277"
          className="animate-draw"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
        <path
          d="M30 52 L45 66 L71 37"
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="70"
          strokeDashoffset="70"
          className="animate-draw"
          style={{ animationDelay: "0.5s" }}
        />
      </svg>

      <div className="animate-fade-up" style={{ animationDelay: "0.8s" }}>
        <h1 className="text-[30px] font-semibold mt-8">You&apos;re all set</h1>
        {s && lot ? (
          <>
            <p className="text-white/85 text-[17px] mt-2">
              {formatMoney(s.amount)} paid with {PAYMENT_METHODS[s.payment].label}
            </p>
            <p className="mt-6 inline-block rounded-2xl bg-white/15 px-5 py-3 text-[17px]">
              {signCode(lot)}/{s.spotId} · until {formatTime(s.endsAt)}
            </p>
          </>
        ) : (
          <p className="text-white/85 text-[17px] mt-2">Payment complete.</p>
        )}
        <p className="text-white/60 text-[13px] mt-10">We&apos;ll remind you 10 minutes before time runs out.</p>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-success" />}>
      <SuccessScreen />
    </Suspense>
  );
}

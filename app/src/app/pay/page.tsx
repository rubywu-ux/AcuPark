"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { Check, CreditCard, ScanFace, Smartphone } from "lucide-react";
import { Button, Card, Chip, Eyebrow, MapThumb, Sheet, Spinner, TitleBlock, TopBar } from "@/components/ui";
import { useStore } from "@/lib/store";
import { PaymentMethodId, formatMoney, getLot, priceFor, signCode, spotsFor } from "@/services/mockData";

function PayScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, user, reservations, defaultPayment, checkIn } = useStore();
  const reservation = reservations.find((r) => r.id === params.get("res"));
  const lot = getLot(reservation?.lotId ?? params.get("lot"));
  // Checkout mode: the driver picked a lot by hand (Home search) and pays on the spot,
  // so they choose the stall and how long here instead of coming from a scan or reservation.
  const checkout = !reservation && !params.get("spot");
  const suggestedStall = useMemo(
    () => (lot ? spotsFor(lot, new Date()).find((s) => !s.occupied)?.id ?? "" : ""),
    [lot]
  );
  const [stall, setStall] = useState<string | null>(null);
  const [pickedHours, setPickedHours] = useState(2);

  const spotId = reservation?.spotId ?? params.get("spot") ?? (stall ?? suggestedStall).trim().toUpperCase();
  const hours = reservation
    ? (new Date(reservation.end).getTime() - new Date(reservation.start).getTime()) / 3_600_000
    : checkout
      ? pickedHours
      : Number(params.get("h") || 1);

  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [processing, setProcessing] = useState(false);
  const chosen = method ?? defaultPayment;

  if (!ready) return <main className="min-h-[100dvh] bg-bg" />;
  if (!lot || (!spotId && !checkout)) {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-8 text-center">
        <div>
          <p className="text-[17px] font-semibold mb-4">Nothing to pay for yet.</p>
          <Button href="/">Go home</Button>
        </div>
      </main>
    );
  }

  const amount = reservation?.price ?? priceFor(lot, hours, user.role);

  const pay = () => {
    setProcessing(true);
    // UI-only payment: simulate wallet/card authorization.
    setTimeout(() => {
      const session = checkIn({ lotId: lot.id, spotId, hours, reservationId: reservation?.id, payment: chosen });
      router.replace(`/success?s=${session.id}`);
    }, 1500);
  };

  return (
    <main className="min-h-[100dvh] bg-bg flex flex-col">
      <TopBar back />

      <div className="flex-1 px-6 pt-8 pb-32">
        <TitleBlock
          strong={checkout ? "Checkout" : "Payment"}
          light={checkout ? "Pay as you park" : "Confirmation"}
          className="mb-8"
        />

        <Card className="p-6 shadow-none border-0 bg-surface">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[14px] font-semibold text-subtle">{lot.kind}</p>
              <p className="text-[30px] leading-tight">
                {signCode(lot)}
                {spotId ? `/${spotId}` : ""}
              </p>
              {checkout && <p className="text-[13px] text-muted mt-0.5">{lot.address}</p>}
            </div>
            <MapThumb at={lot.location} className="w-[94px] h-[68px]" />
          </div>

          {checkout && (
            <div className="mt-6 space-y-5">
              <label className="block">
                <Eyebrow className="mb-1.5">Your stall #</Eyebrow>
                <input
                  value={stall ?? suggestedStall}
                  onChange={(e) => setStall(e.target.value)}
                  placeholder="e.g. C3"
                  maxLength={4}
                  autoCapitalize="characters"
                  className="w-full h-12 rounded-xl bg-card border border-line px-3 text-[18px] font-mono uppercase tracking-widest outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <span className="block text-[12px] text-muted mt-1">Printed on the ground or on lot sign</span>
              </label>
              <div>
                <Eyebrow className="mb-1.5">How long?</Eyebrow>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((h) => (
                    <Chip key={h} active={pickedHours === h} onClick={() => setPickedHours(h)} className="w-full">
                      {h} hr
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}
          <p className="text-[14px] font-semibold text-subtle mt-6">Proceed Payment</p>
          <p className="text-[28px] font-semibold">{formatMoney(amount)}</p>
          <p className="text-[13px] text-muted">
            {hours} hr{hours === 1 ? "" : "s"} · {user.role} rate{reservation ? " · reserved" : ""}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3 mt-6" role="radiogroup" aria-label="Payment method">
          {(["apple-pay", "card"] as PaymentMethodId[]).map((id) => {
            const active = chosen === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(id)}
                className={clsx(
                  "relative rounded-2xl border-2 px-4 py-3.5 text-left transition",
                  active
                    ? "border-brand bg-brand-soft shadow-[0_6px_18px_rgb(var(--brand)/0.25)]"
                    : "border-line bg-card opacity-45 hover:opacity-75"
                )}
              >
                <span
                  className={clsx(
                    "w-10 h-7 rounded-md grid place-items-center text-white mb-2",
                    id === "apple-pay" ? "bg-black" : "bg-brand"
                  )}
                >
                  {id === "apple-pay" ? <Smartphone size={15} /> : <CreditCard size={15} />}
                </span>
                <span className={clsx("block text-[16px] font-semibold", active ? "text-ink" : "text-muted")}>
                  {id === "apple-pay" ? "Apple Pay" : "Saved Card"}
                </span>
                <span className="block text-[12px] text-muted">
                  {id === "apple-pay" ? "Face ID" : "Visa •••• 4242"}
                </span>
                <span
                  className={clsx(
                    "absolute right-3 top-3 w-6 h-6 rounded-full grid place-items-center transition",
                    active ? "bg-brand text-white" : "border-2 border-line"
                  )}
                >
                  {active && <Check size={15} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-app px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] bg-gradient-to-t from-bg via-bg to-transparent">
        <Button block onClick={pay} disabled={processing || !spotId}>
          {processing ? <Spinner /> : `Confirm Payment · ${formatMoney(amount)}`}
        </Button>
      </div>

      <Sheet open={processing && chosen === "apple-pay"} onClose={() => {}} title="Apple Pay">
        <div className="flex flex-col items-center py-4">
          <ScanFace size={56} className="text-brand-text animate-pulse" strokeWidth={1.5} />
          <p className="mt-3 text-[17px] font-semibold">Confirm with Face ID</p>
          <p className="text-[14px] text-muted">
            AcuPark · {formatMoney(amount)}
          </p>
        </div>
      </Sheet>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-bg" />}>
      <PayScreen />
    </Suspense>
  );
}

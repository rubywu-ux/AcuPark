"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { CreditCard, ScanFace, Smartphone } from "lucide-react";
import { Button, Card, MapThumb, Sheet, Spinner, TitleBlock, TopBar } from "@/components/ui";
import { useStore } from "@/lib/store";
import { PAYMENT_METHODS, PaymentMethodId, formatMoney, getLot, priceFor, signCode } from "@/services/mockData";

function PayScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, user, reservations, defaultPayment, checkIn } = useStore();
  const reservation = reservations.find((r) => r.id === params.get("res"));
  const lot = getLot(reservation?.lotId ?? params.get("lot"));
  const spotId = reservation?.spotId ?? params.get("spot");
  const hours = reservation
    ? (new Date(reservation.end).getTime() - new Date(reservation.start).getTime()) / 3_600_000
    : Number(params.get("h") || 1);

  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [processing, setProcessing] = useState(false);
  const chosen = method ?? defaultPayment;

  if (!ready) return <main className="min-h-[100dvh] bg-bg" />;
  if (!lot || !spotId) {
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
        <TitleBlock strong="Payment" light="Confirmation" className="mb-8" />

        <Card className="p-6 shadow-none border-0 bg-surface">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[14px] font-semibold text-subtle">{lot.kind}</p>
              <p className="text-[30px] leading-tight">
                {signCode(lot)}/{spotId}
              </p>
            </div>
            <MapThumb at={lot.location} className="w-[94px] h-[68px]" />
          </div>
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
                  "h-[60px] rounded-2xl border-2 flex items-center justify-center gap-2 text-[16px] font-semibold transition",
                  id === "apple-pay"
                    ? active
                      ? "bg-black text-white border-black"
                      : "bg-card text-ink border-line"
                    : active
                      ? "bg-brand-soft text-brand-text border-brand"
                      : "bg-card text-ink border-line"
                )}
              >
                {id === "apple-pay" ? <Smartphone size={18} /> : <CreditCard size={18} />}
                {id === "apple-pay" ? "Apple Pay" : "Saved Card"}
              </button>
            );
          })}
        </div>
        <p className="text-[13px] text-muted mt-2 text-center">{PAYMENT_METHODS[chosen].label} · {PAYMENT_METHODS[chosen].detail}</p>
      </div>

      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-app px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] bg-gradient-to-t from-bg via-bg to-transparent">
        <Button block onClick={pay} disabled={processing}>
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

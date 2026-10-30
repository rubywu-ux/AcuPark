"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { BadgeCheck, Check, CreditCard, MapPin, ScanFace, Smartphone } from "lucide-react";
import { SCAN_IMAGE_KEY } from "@/components/Scanner";
import { Button, Chip, Eyebrow, Sheet, Spinner, TopBar, useToast } from "@/components/ui";
import VehicleForm from "@/components/VehicleForm";
import { useStore } from "@/lib/store";
import { PaymentMethodId, formatMoney, formatTime, getLot, priceFor, signCode, spotsFor } from "@/services/mockData";

function ArriveScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { ready, user, reservations, updateVehicle, defaultPayment, checkIn } = useStore();
  const reservation = reservations.find((r) => r.id === params.get("res"));
  const lot = getLot(reservation?.lotId ?? params.get("lot"));

  const [photo, setPhoto] = useState("/lots/scan-car.jpg");
  const [matching, setMatching] = useState(true);
  const [hours, setHours] = useState(2);
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [processing, setProcessing] = useState(false);
  const payment = method ?? defaultPayment;

  // Walk-up arrivals get the first open stall the camera "sees".
  const detectedSpot = useMemo(() => (lot ? spotsFor(lot, new Date()).find((s) => !s.occupied)?.id : undefined), [lot]);
  const spotId = reservation?.spotId ?? detectedSpot;

  useEffect(() => {
    try {
      const img = sessionStorage.getItem(SCAN_IMAGE_KEY);
      if (img) setPhoto(img);
    } catch {
      // keep sample photo
    }
    const t = setTimeout(() => setMatching(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <main className="min-h-[100dvh] bg-bg" />;
  if (!lot) {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-8 text-center">
        <div>
          <p className="text-[17px] font-semibold mb-4">We couldn&apos;t tell which lot you&apos;re in.</p>
          <Button href="/map">Pick on map</Button>
        </div>
      </main>
    );
  }

  const hrs = reservation
    ? (new Date(reservation.end).getTime() - new Date(reservation.start).getTime()) / 3_600_000
    : hours;
  const amount = reservation?.price ?? priceFor(lot, hours, user.role);
  const v = user.vehicle;

  // "I'm here" path: everything is detected, so the driver only picks a duration and pays — no extra screen.
  const pay = () => {
    if (!spotId) return;
    setProcessing(true);
    setTimeout(() => {
      const session = checkIn({ lotId: lot.id, spotId, hours: hrs, reservationId: reservation?.id, payment });
      router.replace(`/success?s=${session.id}`);
    }, 1500);
  };

  return (
    <main className="min-h-[100dvh] bg-bg flex flex-col">
      <TopBar back="/" />

      <div className="flex-1 px-6 pt-6 pb-32">
        <h1 className="text-[30px] leading-[1.1] tracking-tight">
          <span className="block font-light">Located at</span>
          <span className="block font-bold">
            {signCode(lot)}
            {spotId ? <span className="font-light text-muted"> / {spotId}</span> : null}
          </span>
        </h1>

        <div className="relative mt-5 aspect-[4/3] w-full rounded-card overflow-hidden border-4 border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Your vehicle" className="w-full h-full object-cover object-bottom" />
          {matching ? (
            <div className="absolute inset-0 bg-black/30 grid place-items-center">
              <span className="absolute left-4 right-4 h-[3px] rounded-full bg-accent shadow-[0_0_16px_4px_rgba(255,199,0,0.6)] animate-scan-line" />
              <span className="flex items-center gap-2 rounded-full bg-black/60 text-white px-4 h-10 text-[14px] font-medium">
                <Spinner className="w-4 h-4" /> Matching plate…
              </span>
            </div>
          ) : (
            <span className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-success text-white pl-2 pr-3 h-9 text-[14px] font-semibold animate-pop">
              <BadgeCheck size={18} /> Plate {v.plate} matched
            </span>
          )}
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px]">
              {v.color} - {v.make} {v.model} <span className="font-mono text-[14px]">#{v.plate}</span>
            </p>
            <p className="text-[15px] text-subtle mt-1">
              {user.role}: {formatMoney(amount)}
              {reservation && ` · until ${formatTime(reservation.end)}`}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 h-8 px-3 rounded-full border border-line text-[14px] text-muted hover:bg-surface"
          >
            Edit Details
          </button>
        </div>

        {!reservation && (
          <div className="mt-6">
            <Eyebrow className="mb-2">How long are you staying?</Eyebrow>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((h) => (
                <Chip key={h} active={hours === h} onClick={() => setHours(h)} className="w-full">
                  {h} hr
                </Chip>
              ))}
            </div>
            <p className="text-[13px] text-muted mt-2 flex items-center gap-1">
              <MapPin size={13} /> {lot.name} · {spotId ? `stall ${spotId} detected` : "no open stall detected"}
            </p>
          </div>
        )}

        <div className="mt-6">
          <Eyebrow className="mb-2">Pay with</Eyebrow>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
            {(["apple-pay", "card"] as PaymentMethodId[]).map((id) => {
              const active = payment === id;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMethod(id)}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl border-2 px-3 h-12 text-[14px] font-semibold transition",
                    active ? "border-brand bg-brand-soft text-ink" : "border-line bg-card opacity-45 hover:opacity-75"
                  )}
                >
                  {id === "apple-pay" ? <Smartphone size={16} /> : <CreditCard size={16} />}
                  {id === "apple-pay" ? "Apple Pay" : "Visa 4242"}
                  {active && <Check size={16} className="ml-auto text-brand-text" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-app px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] bg-gradient-to-t from-bg via-bg to-transparent">
        {!spotId ? (
          <Button block variant="brand" href="/map">
            Lot is full — find another
          </Button>
        ) : (
          <Button block disabled={matching || processing} onClick={pay} className={clsx(matching && "opacity-60")}>
            {processing ? <Spinner /> : `Confirm Payment · ${formatMoney(amount)}`}
          </Button>
        )}
        <p className="text-center text-[12px] text-subtle mt-2">
          {hrs} hr{hrs === 1 ? "" : "s"} · {reservation ? "reserved" : `${user.role} rate`}
        </p>
      </div>

      <Sheet open={processing && payment === "apple-pay"} onClose={() => {}} title="Apple Pay">
        <div className="flex flex-col items-center py-4">
          <ScanFace size={56} className="text-brand-text animate-pulse" strokeWidth={1.5} />
          <p className="mt-3 text-[17px] font-semibold">Confirm with Face ID</p>
          <p className="text-[14px] text-muted">AcuPark · {formatMoney(amount)}</p>
        </div>
      </Sheet>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Fix vehicle details">
        <VehicleForm
          initial={v}
          onSave={(nv) => {
            updateVehicle(nv);
            setEditing(false);
            toast("Vehicle updated");
          }}
        />
      </Sheet>
    </main>
  );
}

export default function ArrivePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-bg" />}>
      <ArriveScreen />
    </Suspense>
  );
}

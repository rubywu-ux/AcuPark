"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { AlertCircle, CalendarDays, Clock } from "lucide-react";
import Calendar from "@/components/Calendar";
import CustomTimePicker from "@/components/CustomTimePicker";
import SpotMap from "@/components/SpotMap";
import { Button, Card, Chip, Eyebrow, MapThumb, TitleBlock, TopBar } from "@/components/ui";
import { useStore } from "@/lib/store";
import {
  formatDay,
  formatMoney,
  formatTime,
  fromDateKey,
  getLot,
  priceFor,
  signCode,
  spotsFor,
  toDateKey,
} from "@/services/mockData";

const STEPS = ["Select spot", "Date & time", "Review"];

/** Next half hour at least 15 minutes out. */
const defaultStart = () => {
  const d = new Date(Date.now() + 15 * 60_000);
  d.setMinutes(d.getMinutes() <= 30 ? 30 : 60, 0, 0);
  return d;
};

function ReserveFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const lot = getLot(params.get("lot"));
  const { user, reservations, reserve } = useStore();

  const initial = useMemo(defaultStart, []);
  const [step, setStep] = useState(0);
  // Open on the first aisle that has a free stall.
  const [aisle, setAisle] = useState(() => (lot ? spotsFor(lot, new Date()).find((s) => !s.occupied)?.aisle ?? 0 : 0));
  const [spot, setSpot] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([toDateKey(initial)]);
  const [time, setTime] = useState(
    `${String(initial.getHours()).padStart(2, "0")}:${String(initial.getMinutes()).padStart(2, "0")}`
  );
  const [hours, setHours] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const mine = reservations.filter((r) => r.lotId === lot?.id && r.status === "upcoming").map((r) => r.spotId);
  const spots = useMemo(() => (lot ? spotsFor(lot, new Date(), mine) : []), [lot, mine.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lot) {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-8 text-center">
        <div>
          <p className="text-[17px] font-semibold mb-4">That lot doesn&apos;t exist.</p>
          <Button href="/map">Back to map</Button>
        </div>
      </main>
    );
  }

  const aisleSpots = spots.filter((s) => s.aisle === aisle);
  const openInAisle = (a: number) => spots.filter((s) => s.aisle === a && !s.occupied).length;
  const openTotal = spots.filter((s) => !s.occupied).length;

  const starts = dates.map((key) => {
    const d = fromDateKey(key);
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  });
  const end = (d: Date) => new Date(d.getTime() + hours * 3_600_000);
  const total = priceFor(lot, hours, user.role) * dates.length;

  const validateTime = () => {
    if (dates.length === 0) return "Pick at least one date.";
    if (starts.some((d) => d.getTime() < Date.now() - 60_000)) return "That start time has already passed today.";
    const clash = reservations.some(
      (r) =>
        r.status === "upcoming" &&
        starts.some((s) => s.getTime() < new Date(r.end).getTime() && end(s).getTime() > new Date(r.start).getTime())
    );
    if (clash) return "You already have a reservation that overlaps this time.";
    return null;
  };

  const next = () => {
    if (step === 1) {
      const err = validateTime();
      setError(err);
      if (err) return;
    }
    setStep((s) => s + 1);
  };

  const confirm = () => {
    const created = reserve({ lotId: lot.id, spotId: spot!, starts, hours });
    if (created[0]) router.replace(`/reservation/${created[0].id}`);
  };

  return (
    <main className="min-h-[100dvh] bg-surface flex flex-col">
      <TopBar
        back
        onBack={() => (step > 0 ? setStep(step - 1) : router.back())}
        title={STEPS[step]}
        right={<span className="text-[14px] text-white/70 pr-1">{step + 1} / 3</span>}
      >
        <div className="flex gap-1.5 mt-3">
          {STEPS.map((s, i) => (
            <span key={s} className={clsx("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-accent" : "bg-white/25")} />
          ))}
        </div>
      </TopBar>

      <div className="flex-1 px-5 pt-5 pb-32">
        {step === 0 && (
          <div className="animate-fade-up">
            <div className="text-center mb-4">
              <p className="text-[17px] font-medium">Select Parking</p>
              <span className="inline-block mt-2 rounded-full bg-brand-soft text-brand-text px-5 h-10 leading-10 text-[18px] font-medium shadow-card">
                {lot.name}
              </span>
              <p className="text-[13px] text-muted mt-2">{openTotal} open stalls right now</p>
            </div>

            {lot.aisles > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-5 px-5">
                {Array.from({ length: lot.aisles }, (_, a) => (
                  <Chip key={a} active={aisle === a} onClick={() => setAisle(a)}>
                    Aisle {a + 1}
                    <span className={clsx("ml-1.5 text-[12px]", aisle === a ? "text-white/70" : "text-muted")}>
                      {openInAisle(a) || "full"}
                    </span>
                  </Chip>
                ))}
              </div>
            )}

            <SpotMap spots={aisleSpots} selected={spot} onSelect={setSpot} />

            {openInAisle(aisle) === 0 && (
              <p className="text-[14px] text-muted text-center mt-3">This aisle is full — try another one.</p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-up">
            <Card className="p-5">
              <Eyebrow className="mb-3 flex items-center gap-1.5">
                <CalendarDays size={14} /> Dates · tap to add more
              </Eyebrow>
              <Calendar
                selectedDates={dates}
                minDate={toDateKey(new Date())}
                onDateSelect={(key) => {
                  setDates((cur) => (cur.includes(key) ? cur.filter((d) => d !== key) : [...cur, key].sort()));
                  setError(null);
                }}
              />
            </Card>
            <Card className="p-5">
              <Eyebrow className="mb-4 flex items-center gap-1.5">
                <Clock size={14} /> Start time
              </Eyebrow>
              <CustomTimePicker
                value={time}
                duration={hours}
                onChange={(t) => {
                  setTime(t);
                  setError(null);
                }}
              />
              <Eyebrow className="mt-5 mb-2">Duration</Eyebrow>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((h) => (
                  <Chip key={h} active={hours === h} onClick={() => setHours(h)} className="w-full">
                    {h} hr
                  </Chip>
                ))}
              </div>
            </Card>
            {error && (
              <p role="alert" className="flex items-center gap-2 rounded-2xl bg-danger/10 text-danger px-4 py-3 text-[14px] font-medium">
                <AlertCircle size={18} /> {error}
              </p>
            )}
          </div>
        )}

        {step === 2 && spot && (
          <div className="animate-fade-up">
            <TitleBlock strong="Book your car" light="Parking" className="mb-6 mt-2" />
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-subtle">{lot.kind}</p>
                  <p className="text-[30px] leading-tight">
                    {signCode(lot)}/{spot}
                  </p>
                  <p className="text-[13px] text-muted mt-1">{lot.address}</p>
                </div>
                <MapThumb at={lot.location} className="w-[94px] h-[68px]" />
              </div>
              <dl className="mt-6 space-y-4 text-[15px]">
                <Row label="Time slot" value={`${formatTime(starts[0])} – ${formatTime(end(starts[0]))}`} />
                <Row
                  label={dates.length > 1 ? `${dates.length} dates` : "Date"}
                  value={starts.map((d) => formatDay(d)).join(", ")}
                />
                <Row label="Vehicle" value={`${user.vehicle.make} ${user.vehicle.model} · ${user.vehicle.plate}`} />
                <div className="pt-4 border-t border-line flex items-end justify-between">
                  <div>
                    <dt className="text-[14px] font-semibold text-subtle">Pay upon arrival</dt>
                    <dd className="text-[13px] text-muted">
                      {user.role} rate{dates.length > 1 ? ` × ${dates.length}` : ""}
                    </dd>
                  </div>
                  <dd className="text-[26px] font-semibold">{formatMoney(total)}</dd>
                </div>
              </dl>
            </Card>
            <p className="text-[13px] text-muted mt-3 px-1">
              Free cancellation until your start time. You&apos;ll pay with Apple Pay or your saved card when you arrive.
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-app px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] bg-gradient-to-t from-surface via-surface to-transparent">
        {step === 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-2xl border border-line bg-card h-14 px-4 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-subtle leading-none">Lot</span>
              <span className="text-[19px] leading-tight">{spot ? `${signCode(lot)}/${spot}` : "Pick a stall"}</span>
            </div>
            <Button disabled={!spot} onClick={next} className="px-8">
              Confirm
            </Button>
          </div>
        )}
        {step === 1 && (
          <Button block onClick={next} disabled={dates.length === 0}>
            Review · {formatMoney(total)}
          </Button>
        )}
        {step === 2 && (
          <Button block onClick={confirm}>
            Start Reservation
          </Button>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle font-semibold text-[14px] shrink-0">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export default function ReservePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-surface" />}>
      <ReserveFlow />
    </Suspense>
  );
}

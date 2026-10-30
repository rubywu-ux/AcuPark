"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Camera, ChevronRight, Clock, Navigation, ScanLine } from "lucide-react";
import LotSearch from "@/components/LotSearch";
import Scanner from "@/components/Scanner";
import { Button, Card, Eyebrow, MapThumb, Sheet, StatusPill, useToast } from "@/components/ui";
import { useNow, useStore } from "@/lib/store";
import {
  LOTS,
  USER_LOCATION,
  availabilityAt,
  distanceKm,
  driveMinutes,
  formatCountdown,
  formatDay,
  formatMoney,
  formatTime,
  getLot,
  signCode,
  splitClock,
  statusFor,
} from "@/services/mockData";

export default function Home() {
  const router = useRouter();
  const toast = useToast();
  const { ready, user, session, upcoming, extendSession, endSession, defaultPayment } = useStore();
  const now = useNow();
  const [scanning, setScanning] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const firstName = user.name.split(" ")[0];

  const onScanned = () => {
    setScanning(false);
    // A reservation starting within the next 2 hours is what the driver is arriving for.
    if (upcoming && new Date(upcoming.start).getTime() - Date.now() < 2 * 3_600_000) {
      router.push(`/arrive?res=${upcoming.id}`);
      return;
    }
    const nearest = [...LOTS]
      .filter((l) => availabilityAt(l, new Date()).open > 0)
      .sort((a, b) => distanceKm(USER_LOCATION, a.location) - distanceKm(USER_LOCATION, b.location))[0];
    router.push(`/arrive?lot=${nearest.id}`);
  };

  return (
    <main className="min-h-[100dvh] bg-bg">
      <header className="bg-band text-white px-6 pt-[max(env(safe-area-inset-top),28px)] pb-7 rounded-b-[28px]">
        <h1 className="text-[34px] font-medium tracking-tight">Hello, {firstName}</h1>
        <p className="text-white/70 text-[15px] mt-1 mb-5">
          {session ? "You're parked. We'll keep an eye on the clock." : "Ready to park?"}
        </p>
        <LotSearch placeholder="Search lot #" onPick={(lot) => router.push(`/map?lot=${lot.id}`)} />
      </header>

      <div className="px-6 pt-6 space-y-6 pb-8">
        {/* AI Quick Scan */}
        <button
          onClick={() => setScanning(true)}
          className="group w-full rounded-card border-[3px] border-dashed border-line bg-surface hover:border-brand/40 transition flex items-center gap-4 p-5 text-left"
        >
          <span className="grid place-items-center w-16 h-16 rounded-2xl bg-brand text-white shadow-lift group-active:scale-95 transition">
            <Camera size={30} />
          </span>
          <span className="flex-1">
            <span className="flex items-center gap-1.5 text-[18px] font-semibold">
              <ScanLine size={18} className="text-brand-text" /> AI Quick Scan
            </span>
            <span className="block text-[14px] text-muted mt-0.5">Snap your plate to check in and pay on arrival</span>
          </span>
          <ChevronRight className="text-subtle" />
        </button>

        {!ready ? (
          <div className="h-40 rounded-card bg-surface animate-pulse" />
        ) : session ? (
          <ActiveSession
            now={now}
            onExtend={() => {
              const charge = extendSession(30);
              toast(`Added 30 min · ${formatMoney(charge)} on ${defaultPayment === "apple-pay" ? "Apple Pay" : "Visa 4242"}`);
            }}
            onEnd={() => setConfirmEnd(true)}
          />
        ) : upcoming ? (
          <UpcomingCard now={now} />
        ) : (
          <NearbyLots />
        )}
      </div>

      {scanning && <Scanner onClose={() => setScanning(false)} onDone={onScanned} />}

      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title="End parking?">
        <p className="text-muted text-[15px] mb-5">
          Your session will close now. Any time left isn&apos;t refunded for reserved spots.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmEnd(false)}>
            Keep parking
          </Button>
          <Button
            variant="brand"
            onClick={() => {
              endSession();
              setConfirmEnd(false);
              toast("Session ended. Drive safe!");
            }}
          >
            End now
          </Button>
        </div>
      </Sheet>
    </main>
  );
}

function ActiveSession({ now, onExtend, onEnd }: { now: number; onExtend: () => void; onEnd: () => void }) {
  const { session } = useStore();
  if (!session) return null;
  const lot = getLot(session.lotId)!;
  const left = new Date(session.endsAt).getTime() - now;
  const { h, m, s } = splitClock(left);
  const expired = left <= 0;
  const low = !expired && left < 10 * 60_000;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="space-y-5 animate-fade-up">
      <div>
        <Eyebrow className="mb-2">{expired ? "Time's up" : "Time remaining"}</Eyebrow>
        <div className="flex rounded-card overflow-hidden text-white shadow-lift">
          <div
            className={clsx(
              "flex-1 px-5 py-4 transition-colors",
              expired ? "bg-danger" : low ? "bg-warning" : "bg-brand-deep"
            )}
            role="timer"
            aria-live="off"
          >
            <div className="flex items-end gap-1 font-light text-[46px] leading-none tabular tracking-tight">
              <span>{h}</span>:<span>{pad(m)}</span>:<span>{pad(s)}</span>
            </div>
            <div className="flex gap-6 text-[12px] text-white/75 mt-1.5 pl-0.5">
              <span>Hours</span>
              <span>Minutes</span>
              <span>Seconds</span>
            </div>
          </div>
          <button
            onClick={onExtend}
            className={clsx(
              "w-[104px] border-l-[6px] border-bg text-[18px] font-medium active:brightness-125 transition",
              expired ? "bg-danger" : low ? "bg-warning" : "bg-brand-deep"
            )}
          >
            +30 min
          </button>
        </div>
        <p className="text-[14px] text-muted mt-2">
          {expired ? "Extend now or move your car to avoid a citation." : `Ends at ${formatTime(session.endsAt)} · ${formatMoney(session.amount)} paid`}
        </p>
      </div>

      <div>
        <Eyebrow className="mb-2">Parked at</Eyebrow>
        <Card className="flex items-center justify-between p-5 shadow-none border-2">
          <div>
            <p className="text-[14px] font-semibold text-subtle">{lot.kind}</p>
            <p className="text-[28px] font-normal leading-tight">
              {signCode(lot)}/ {session.spotId}
            </p>
            <p className="text-[13px] text-muted mt-0.5">{lot.address}</p>
          </div>
          <MapThumb at={lot.location} className="w-[100px] h-[68px]" />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="md" href={`/map?lot=${lot.id}`}>
          View on map
        </Button>
        <Button variant="danger" size="md" className="border border-danger/30" onClick={onEnd}>
          End parking
        </Button>
      </div>
    </section>
  );
}

function UpcomingCard({ now }: { now: number }) {
  const { upcoming } = useStore();
  if (!upcoming) return null;
  const lot = getLot(upcoming.lotId)!;
  const untilStart = new Date(upcoming.start).getTime() - now;
  const started = untilStart <= 0;

  return (
    <section className="animate-fade-up">
      <Eyebrow className="mb-2">Upcoming reservation</Eyebrow>
      <Card className="p-5">
        <Link href={`/reservation/${upcoming.id}`} className="flex items-start justify-between">
          <div>
            <p className="text-[14px] font-semibold text-subtle">{lot.kind}</p>
            <p className="text-[28px] leading-tight">
              {signCode(lot)}/{upcoming.spotId}
            </p>
            <p className="text-[14px] text-muted mt-1 flex items-center gap-1.5">
              <Clock size={14} /> {formatDay(upcoming.start)} · {formatTime(upcoming.start)} – {formatTime(upcoming.end)}
            </p>
          </div>
          <MapThumb at={lot.location} className="w-[94px] h-[68px]" />
        </Link>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3">
          <span className="text-[14px] text-brand-text font-medium">{started ? "Your spot is held" : "Starting in"}</span>
          <span className="text-[20px] font-semibold tabular text-brand-text">
            {started ? `until ${formatTime(upcoming.end)}` : formatCountdown(untilStart)}
          </span>
        </div>
        <Button block className="mt-4" href={`/navigate?res=${upcoming.id}`}>
          <Navigation size={18} /> Take Me There
        </Button>
      </Card>
    </section>
  );
}

function NearbyLots() {
  const lots = [...LOTS]
    .map((l) => ({ lot: l, km: distanceKm(USER_LOCATION, l.location), ...availabilityAt(l, new Date()) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);

  return (
    <section className="animate-fade-up">
      <div className="flex items-center justify-between mb-2">
        <Eyebrow>Nearby right now</Eyebrow>
        <Link href="/map" className="text-[14px] font-semibold text-brand-text">
          See map
        </Link>
      </div>
      <div className="space-y-3">
        {lots.map(({ lot, km, open, total }) => (
          <Link key={lot.id} href={`/map?lot=${lot.id}`} className="block">
            <Card className="flex items-center gap-4 p-3 pr-4 hover:border-brand/30 transition">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lot.photo} alt="" className="w-[72px] h-[56px] rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold truncate">{lot.name}</p>
                <p className="text-[13px] text-muted">
                  {driveMinutes(km)} min · {formatMoney(lot.ratePerHour)}
                  {lot.ratePerHour ? "/hr" : ""}
                </p>
              </div>
              <StatusPill status={statusFor(open, total)} open={open} total={total} />
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

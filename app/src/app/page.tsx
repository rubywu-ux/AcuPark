"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { BellRing, Camera, Check, ChevronRight, Clock, CreditCard, Navigation, ScanLine, Smartphone, Zap } from "lucide-react";
import LotSearch from "@/components/LotSearch";
import Scanner from "@/components/Scanner";
import { Button, Card, Chip, Eyebrow, MapThumb, Sheet, StatusPill, useNotify, useToast } from "@/components/ui";
import { useNow, useStore } from "@/lib/store";
import {
  LOTS,
  PAYMENT_METHODS,
  PaymentMethodId,
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
  const notify = useNotify();
  const { ready, user, session, upcoming, extendSession, endSession, defaultPayment, autoPay, cancelAutoPay, runAutoPay } =
    useStore();
  const now = useNow();
  const [scanning, setScanning] = useState(false);
  const [chooser, setChooser] = useState<null | "choose" | "ahead">(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Stand-in for the geofence that would fire when the driver pulls into a lot.
  const simulateArrival = () => {
    const s = runAutoPay();
    if (!s) {
      toast("Couldn't find an open lot nearby");
      return;
    }
    const lot = getLot(s.lotId)!;
    notify({
      title: "All set, parking paid!",
      body: `${lot.name} · stall ${s.spotId} · ${formatMoney(s.amount)} until ${formatTime(s.endsAt)}.`,
      href: `/success?s=${s.id}&review=1`,
    });
  };

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
        <LotSearch
          placeholder="Not scanning? Search by lot #"
          // Search is the pay-now path; AI Quick Scan is for paying ahead or auto-detecting the lot.
          onPick={(lot) => router.push(`/pay?lot=${lot.id}`)}
          onPickPlace={(place) => router.push(`/map?place=${place.id}`)}
        />
      </header>

      <div className="px-6 pt-6 space-y-6 pb-8">
        {/* AI Quick Scan: pay ahead (auto-pay on arrival) or scan now */}
        {autoPay ? (
          <AutoPayCard onArrive={simulateArrival} onScan={() => setScanning(true)} onCancel={cancelAutoPay} />
        ) : (
          <button
            onClick={() => setChooser("choose")}
            className="group w-full rounded-card border-[3px] border-dashed border-line bg-surface hover:border-brand/40 transition flex items-center gap-4 p-5 text-left"
          >
            <span className="grid place-items-center w-16 h-16 rounded-2xl bg-brand text-white shadow-lift group-active:scale-95 transition">
              <Camera size={30} />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-1.5 text-[18px] font-semibold">
                <ScanLine size={18} className="text-brand-text" /> AI Quick Scan
              </span>
              <span className="block text-[14px] text-muted mt-0.5">Pay ahead, or let us detect the lot you’re in</span>
            </span>
            <ChevronRight className="text-subtle" />
          </button>
        )}

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

      <Sheet
        open={chooser !== null}
        onClose={() => setChooser(null)}
        title={chooser === "ahead" ? "Pay ahead" : "AI Quick Scan"}
      >
        {chooser === "ahead" ? (
          <PayAheadForm onDone={() => setChooser(null)} />
        ) : (
          <div className="space-y-3">
            <ModeOption
              icon={<Zap size={22} />}
              title="Pay ahead"
              body="Auto-pay the moment you arrive. We detect your lot and send you a receipt."
              onClick={() => setChooser("ahead")}
            />
            <ModeOption
              icon={<Camera size={22} />}
              title="I’m here — scan now"
              body="In a rush? Snap your plate, choose how long, and pay."
              onClick={() => {
                setChooser(null);
                setScanning(true);
              }}
            />
          </div>
        )}
      </Sheet>

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

function ModeOption({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl border-2 border-line bg-card hover:border-brand/50 hover:bg-brand-soft/40 p-4 text-left transition"
    >
      <span className="w-12 h-12 rounded-xl bg-brand text-white grid place-items-center shrink-0">{icon}</span>
      <span className="flex-1">
        <span className="block text-[17px] font-semibold">{title}</span>
        <span className="block text-[14px] text-muted">{body}</span>
      </span>
      <ChevronRight className="text-subtle shrink-0" />
    </button>
  );
}

function PayAheadForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const { user, defaultPayment, armAutoPay } = useStore();
  const [hours, setHours] = useState(2);
  const [payment, setPayment] = useState<PaymentMethodId>(defaultPayment);

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-muted -mt-1">
        When you pull into a campus lot we&apos;ll find your stall, pay for {user.vehicle.make} {user.vehicle.model} ·{" "}
        <span className="font-mono">{user.vehicle.plate}</span>, and notify you.
      </p>
      <div>
        <Eyebrow className="mb-2">How long will you stay?</Eyebrow>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((h) => (
            <Chip key={h} active={hours === h} onClick={() => setHours(h)} className="w-full">
              {h} hr
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <Eyebrow className="mb-2">Pay with</Eyebrow>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(Object.keys(PAYMENT_METHODS) as PaymentMethodId[]).map((id) => {
            const active = payment === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => setPayment(id)}
                className={clsx(
                  "flex items-center gap-2 rounded-xl border-2 px-3 h-12 text-[14px] font-semibold transition",
                  active ? "border-brand bg-brand-soft text-ink" : "border-line opacity-45 hover:opacity-75"
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
      <Button
        block
        onClick={() => {
          armAutoPay(hours, payment);
          try {
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
              Notification.requestPermission();
            }
          } catch {
            // Notifications unsupported — the in-app banner still shows.
          }
          onDone();
          toast("Auto-pay is on — we’ll pay when you arrive");
        }}
      >
        <BellRing size={18} /> Turn on auto-pay
      </Button>
      <p className="text-[12px] text-subtle text-center">Charged only when you arrive. Turn it off any time.</p>
    </div>
  );
}

function AutoPayCard({ onArrive, onScan, onCancel }: { onArrive: () => void; onScan: () => void; onCancel: () => void }) {
  const { autoPay } = useStore();
  if (!autoPay) return null;
  return (
    <section className="rounded-card bg-brand-deep text-white p-5 shadow-lift animate-fade-up">
      <div className="flex items-center gap-2">
        <span className="relative w-3 h-3">
          <span className="absolute inset-0 rounded-full bg-accent animate-ring-pulse" />
          <span className="absolute inset-0 rounded-full bg-accent" />
        </span>
        <span className="text-[13px] font-semibold uppercase tracking-wider text-white/80">Auto-pay is on</span>
      </div>
      <p className="text-[20px] font-semibold mt-2 leading-snug">We&apos;ll pay for you when you arrive</p>
      <p className="text-[14px] text-white/70 mt-1">
        {autoPay.hours} hr · {autoPay.payment === "apple-pay" ? "Apple Pay" : "Visa 4242"} · lot detected automatically
      </p>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {/* Demo stand-in for the arrival geofence. */}
        <Button size="md" onClick={onArrive}>
          Test arrival
        </Button>
        <Button size="md" variant="outline" className="!bg-white/10 !text-white !border-white/20" onClick={onScan}>
          <Camera size={16} /> Scan now
        </Button>
      </div>
      <button onClick={onCancel} className="w-full mt-3 text-[13px] text-white/60 hover:text-white">
        Turn off auto-pay
      </button>
    </section>
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

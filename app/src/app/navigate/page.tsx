"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { ArrowUp, CornerUpLeft, CornerUpRight, ExternalLink, MapPin, ScanLine, X } from "lucide-react";
import { TrafficLight } from "@/components/icons/TrafficLight";
import { Button, IconButton } from "@/components/ui";
import { useStore } from "@/lib/store";
import {
  LatLng,
  STREETS,
  USER_LOCATION,
  availabilityAt,
  buildRoute,
  distanceKm,
  driveMinutes,
  formatTime,
  getLot,
  routeLengthKm,
  signCode,
  trafficLightsOn,
} from "@/services/mockData";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface animate-pulse" />,
});

const DRIVE_SECONDS = 20; // demo length of the simulated drive

const bearing = (a: LatLng, b: LatLng) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

/** Point and heading at a fraction of the way along the route. */
function along(route: LatLng[], t: number) {
  const lens = route.slice(1).map((p, i) => distanceKm(route[i], p));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]) : 1;
      const a = route[i];
      const b = route[i + 1];
      const at: LatLng = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      return { at, seg: i, segLeftKm: lens[i] - d, heading: bearing(a, b), traveled: [...route.slice(0, i + 1), at] };
    }
    d -= lens[i];
  }
  return { at: route[route.length - 1], seg: lens.length - 1, segLeftKm: 0, heading: 0, traveled: route };
}

function NavigateScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { reservations } = useStore();
  const reservation = reservations.find((r) => r.id === params.get("res"));
  const lot = getLot(reservation?.lotId ?? params.get("lot"));

  const route = useMemo(() => (lot ? buildRoute(USER_LOCATION, lot.location) : []), [lot]);
  const totalKm = routeLengthKm(route);
  const totalLights = trafficLightsOn(totalKm);

  const [phase, setPhase] = useState<"preview" | "driving" | "arrived">("preview");
  const [t, setT] = useState(0);
  // The lot resolves only after the store hydrates, so derive the starting count from it.
  const initialOpen = useMemo(() => (lot ? availabilityAt(lot, new Date()).open : 0), [lot]);
  const [open, setOpen] = useState(initialOpen);
  useEffect(() => setOpen(initialOpen), [initialOpen]);
  const [delta, setDelta] = useState(0);
  const startedRef = useRef(0);

  // Drive simulation.
  useEffect(() => {
    if (phase !== "driving") return;
    startedRef.current = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - startedRef.current) / (DRIVE_SECONDS * 1000));
      setT(next);
      if (next >= 1) setPhase("arrived");
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // "Anxiety reducer": live lot occupancy while en route.
  useEffect(() => {
    if (phase !== "driving") return;
    const iv = setInterval(() => {
      const r = Math.random();
      const change = r < 0.4 ? -1 : r < 0.7 ? 1 : 0;
      setOpen((o) => Math.min(initialOpen + 2, Math.max(1, initialOpen - 4, o + change)));
      setDelta(change);
    }, 3500);
    return () => clearInterval(iv);
  }, [phase, initialOpen]);

  if (!lot) {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-8 text-center">
        <div>
          <p className="text-[17px] font-semibold mb-4">Pick a lot to navigate to.</p>
          <Button href="/map">Open map</Button>
        </div>
      </main>
    );
  }

  const pos = along(route, t);
  const remainingKm = totalKm * (1 - t);
  const minutes = phase === "arrived" ? 0 : t === 0 ? driveMinutes(totalKm) : Math.max(1, Math.ceil(driveMinutes(totalKm) * (1 - t)));
  const lightsLeft = Math.max(0, Math.ceil(totalLights * (1 - t) - 0.01));
  const lastSeg = pos.seg >= route.length - 2;
  const nextHeading = lastSeg ? pos.heading : bearing(route[pos.seg + 1], route[pos.seg + 2]);
  const turn = ((nextHeading - pos.heading + 540) % 360) - 180; // + = right
  const TurnIcon = lastSeg ? ArrowUp : turn > 0 ? CornerUpRight : CornerUpLeft;
  const instruction = lastSeg
    ? `${lot.name} on the ${turn >= 0 ? "right" : "left"}`
    : `${turn > 0 ? "Turn right" : "Turn left"} onto ${STREETS[(pos.seg + 1) % STREETS.length]}`;
  const meters = Math.max(10, Math.round((pos.segLeftKm * 1000) / 10) * 10);
  const checkInHref = reservation ? `/arrive?res=${reservation.id}` : `/arrive?lot=${lot.id}`;

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-surface">
      <div className="absolute inset-0 z-0">
        <MapView
          lots={[lot]}
          selectedId={lot.id}
          route={route}
          traveled={phase === "preview" ? undefined : pos.traveled}
          car={phase === "preview" ? undefined : { at: pos.at, heading: pos.heading }}
          padBottom={300}
        />
      </div>

      {/* Turn-by-turn banner */}
      <div className="absolute top-0 inset-x-0 z-[1000] px-3 pt-[max(env(safe-area-inset-top),12px)] space-y-2">
        {phase === "preview" ? (
          <div className="flex items-center gap-3 rounded-2xl bg-band text-white px-3 py-3 shadow-lift">
            <IconButton label="Back" onClick={() => router.back()} className="hover:bg-white/10">
              <X size={22} />
            </IconButton>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/70">From your location to</p>
              <p className="text-[17px] font-semibold truncate">
                {lot.name}
                {reservation ? ` · Spot ${reservation.spotId}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-[#1E1A26] text-white px-4 py-3 shadow-lift">
            <TurnIcon size={34} strokeWidth={2.5} />
            <div className="flex-1 min-w-0">
              <p className="text-[26px] font-semibold leading-none tabular">
                {phase === "arrived" ? "Arrived" : `${meters} m`}
              </p>
              <p className="text-[15px] text-white/80 truncate mt-1">{phase === "arrived" ? lot.address : instruction}</p>
            </div>
          </div>
        )}

        {phase !== "preview" && (
          <div
            className={clsx(
              "inline-flex items-center gap-2 rounded-full bg-card text-ink pl-2 pr-4 h-10 shadow-lift transition",
              delta < 0 && "ring-2 ring-warning/40"
            )}
            aria-live="polite"
          >
            <span className="relative w-6 h-6 grid place-items-center">
              <span className="absolute inset-0 rounded-full bg-success/30 animate-ring-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
            </span>
            <span className="text-[14px] font-semibold tabular">
              {reservation ? `Spot ${reservation.spotId} held · ` : ""}
              {open} open at {signCode(lot)}
            </span>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <section className="absolute bottom-0 inset-x-0 z-[1000] bg-card rounded-t-[28px] shadow-sheet px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] animate-sheet-up">
        <div className="mx-auto h-1 w-10 rounded-full bg-line mb-4" />

        {phase === "arrived" ? (
          <div className="text-center animate-fade-up">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/15 text-success grid place-items-center mb-3">
              <MapPin size={30} />
            </div>
            <h2 className="text-[24px] font-semibold">You&apos;ve arrived</h2>
            <p className="text-muted text-[15px] mt-1 mb-5">
              {reservation ? `Park in ${reservation.spotId}, then` : "Pull into any open stall, then"} scan your plate to check in and pay.
            </p>
            <Button block href={checkInHref}>
              <ScanLine size={19} /> Scan & check in
            </Button>
            <Button block variant="ghost" size="md" className="mt-1" href="/">
              Not now
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[24px] font-semibold leading-tight">
                  <span className="text-success tabular">{minutes} min</span>{" "}
                  <span className="text-muted font-normal text-[18px] tabular">{remainingKm.toFixed(1)} km</span>
                </p>
                <p className="text-[15px] text-muted mt-0.5">
                  {formatTime(new Date(Date.now() + minutes * 60_000))} arrival · {lot.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-surface px-3 h-12">
                <TrafficLight size={30} className="text-brand" />
                <span className="text-[20px] font-semibold tabular">{lightsLeft}</span>
                <span className="text-[13px] text-muted">{lightsLeft === 1 ? "stop" : "stops"}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
              {phase === "preview" ? (
                <>
                  <Button
                    variant="outline"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lot.location[0]},${lot.location[1]}`}
                  >
                    Google Maps <ExternalLink size={16} />
                  </Button>
                  <Button className="px-10" onClick={() => setPhase("driving")}>
                    Start
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => (startedRef.current -= DRIVE_SECONDS * 300)}>
                    Skip ahead
                  </Button>
                  <Button variant="brand" className="px-8 !bg-ink !text-bg" onClick={() => router.back()}>
                    End
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-surface" />}>
      <NavigateScreen />
    </Suspense>
  );
}

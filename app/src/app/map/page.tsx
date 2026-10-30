"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { CalendarClock, Clock, Heart, LocateFixed, MapPin, Navigation, SlidersHorizontal, X } from "lucide-react";
import LotSearch from "@/components/LotSearch";
import LotsDrawer from "@/components/LotsDrawer";
import { Button, Chip, IconButton, StatusPill } from "@/components/ui";
import { useStore } from "@/lib/store";
import {
  CITY_LABEL,
  FILTERS,
  LOTS,
  LotFeature,
  ParkingLot,
  USER_LOCATION,
  availabilityAt,
  distanceKm,
  driveMinutes,
  formatMoney,
  getLot,
  rateFor,
  signCode,
  statusFor,
} from "@/services/mockData";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface animate-pulse" />,
});

const NEAR_KM = 1.1;
/** Centre slightly south of the lot so its pin sits above the bottom sheet. */
const aboveSheet = (lot: ParkingLot): [number, number] => [lot.location[0] - 0.0024, lot.location[1]];

function matches(lot: ParkingLot, f: LotFeature) {
  if (f === "Near Me") return distanceKm(USER_LOCATION, lot.location) <= NEAR_KM;
  if (f === "Low Cost") return lot.ratePerHour > 0 && lot.ratePerHour <= 4;
  return lot.features.includes(f);
}

function MapScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(params.get("lot"));
  const [filters, setFilters] = useState<LotFeature[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerH, setDrawerH] = useState(150);
  const [focus, setFocus] = useState<[number, number] | undefined>(getLot(params.get("lot")) ? aboveSheet(getLot(params.get("lot"))!) : undefined);

  useEffect(() => {
    const id = params.get("lot");
    if (id && getLot(id)) {
      setSelectedId(id);
      setFocus(aboveSheet(getLot(id)!));
    }
  }, [params]);

  const lots = useMemo(() => LOTS.filter((l) => filters.every((f) => matches(l, f))), [filters]);
  const selected = getLot(selectedId);

  const select = (lot: ParkingLot) => {
    setSelectedId(lot.id);
    setFocus(aboveSheet(lot));
    router.replace(`/map?lot=${lot.id}`, { scroll: false });
  };

  const clear = () => {
    setSelectedId(null);
    router.replace("/map", { scroll: false });
  };

  return (
    <main className="relative h-[calc(100dvh-72px-env(safe-area-inset-bottom))] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapView lots={lots} selectedId={selectedId} onSelect={select} focus={focus} />
      </div>

      {/* Header band */}
      <div className="absolute top-0 inset-x-0 z-[1000]">
        <header className="bg-band text-white px-5 pt-[max(env(safe-area-inset-top),14px)] pb-4 rounded-b-[24px] shadow-lift">
          <div className="flex justify-end mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 h-7 text-[12px] font-medium">
              <MapPin size={13} /> {CITY_LABEL}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LotSearch placeholder="Where to park?" onPick={select} className="flex-1" />
            <IconButton
              label="Filters"
              onClick={() => setShowFilters((v) => !v)}
              className={clsx("relative", showFilters ? "bg-white text-brand" : "bg-white/15 text-white")}
            >
              <SlidersHorizontal size={20} />
              {filters.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-accent-ink text-[11px] font-bold grid place-items-center">
                  {filters.length}
                </span>
              )}
            </IconButton>
          </div>
        </header>

        {showFilters && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 py-3 animate-fade-up">
            {FILTERS.map((f) => (
              <Chip
                key={f}
                active={filters.includes(f)}
                onClick={() => setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))}
                className="shadow-card"
              >
                {f}
              </Chip>
            ))}
            {filters.length > 0 && (
              <Chip onClick={() => setFilters([])} className="shadow-card">
                Clear
              </Chip>
            )}
          </div>
        )}
        {filters.length > 0 && lots.length === 0 && (
          <div className="mx-5 mt-1 rounded-2xl bg-card text-ink shadow-lift px-4 py-3 text-[14px]">
            No lots match those filters.{" "}
            <button className="font-semibold text-brand-text" onClick={() => setFilters([])}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      <IconButton
        label="Center on me"
        onClick={() => setFocus([...USER_LOCATION] as [number, number])}
        className={clsx(
          "absolute right-4 z-[1000] bg-card text-brand-text shadow-lift transition-opacity",
          !selected && drawerH > 420 && "opacity-0 pointer-events-none"
        )}
        style={{ bottom: (selected ? 360 : drawerH) + 12 }}
      >
        <LocateFixed size={20} />
      </IconButton>

      {selected ? <LotSheet lot={selected} onClose={clear} /> : <LotsDrawer onPick={select} onHeightChange={setDrawerH} />}
    </main>
  );
}

function LotSheet({ lot, onClose }: { lot: ParkingLot; onClose: () => void }) {
  const { user, favorites, toggleFavorite } = useStore();
  const { open, total } = availabilityAt(lot, new Date());
  const status = statusFor(open, total);
  const km = distanceKm(USER_LOCATION, lot.location);
  const saved = favorites.includes(lot.id);

  return (
    <section
      key={lot.id}
      className="absolute bottom-0 inset-x-0 z-[1000] bg-band text-white rounded-t-[28px] shadow-sheet px-5 pt-3 pb-5 animate-sheet-up"
      aria-label={`${lot.name} details`}
    >
      <div className="mx-auto h-1 w-10 rounded-full bg-white/40 mb-3" />
      <div className="relative h-[150px] rounded-[20px] overflow-hidden border border-white/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lot.photo} alt={`${lot.name} aerial view`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <p className="absolute left-4 bottom-3 text-[24px] font-light tracking-wide">
          {lot.kind.toUpperCase()} {signCode(lot)}
        </p>
        <div className="absolute right-2 top-2 flex gap-1">
          <IconButton
            label={saved ? "Remove from saved" : "Save lot"}
            onClick={() => toggleFavorite(lot.id)}
            className="bg-black/35 backdrop-blur"
          >
            <Heart size={20} className={saved ? "fill-accent text-accent" : ""} />
          </IconButton>
          <IconButton label="Close" onClick={onClose} className="bg-black/35 backdrop-blur">
            <X size={20} />
          </IconButton>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-[13px] text-white/70">{lot.address}</p>
          <p className="text-[13px] text-white/70 flex items-center gap-1 mt-0.5">
            <Clock size={12} /> {lot.hours}
          </p>
        </div>
        <span className="rounded-full bg-white p-0.5">
          <StatusPill status={status} open={open} total={total} />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        {[
          { k: "Rate", v: lot.ratePerHour ? `${formatMoney(rateFor(lot, user.role))}/hr` : "Free" },
          { k: "Drive", v: `${driveMinutes(km)} min` },
          { k: "Distance", v: `${km.toFixed(1)} km` },
        ].map((x) => (
          <div key={x.k} className="rounded-2xl bg-white/10 py-2.5">
            <p className="text-[12px] text-white/60">{x.k}</p>
            <p className="text-[16px] font-semibold">{x.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button variant="brand" className="!bg-brand-deep" href={`/navigate?lot=${lot.id}`} aria-disabled={status === "Full"}>
          <Navigation size={17} /> Navigate
        </Button>
        <Button href={`/reserve?lot=${lot.id}`}>
          <CalendarClock size={18} /> Reserve
        </Button>
      </div>
      {status === "Full" && <p className="text-[13px] text-white/70 mt-2 text-center">Full right now — you can still reserve for later.</p>}
    </section>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-surface" />}>
      <MapScreen />
    </Suspense>
  );
}

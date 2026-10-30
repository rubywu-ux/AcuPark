"use client";

import { Building2, MapPin, Search, X } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import {
  CampusPlace,
  LOTS,
  ParkingLot,
  availabilityAt,
  distanceKm,
  findLotByQuery,
  findPlaces,
  statusFor,
  walkMinutes,
} from "@/services/mockData";

/** Nearest lot with an open stall, and how long the walk is from it. */
const bestLotFor = (place: CampusPlace) =>
  LOTS.map((lot) => ({ lot, mins: walkMinutes(distanceKm(place.location, lot.location)), ...availabilityAt(lot, new Date()) }))
    .filter((x) => x.open > 0)
    .sort((a, b) => a.mins - b.mins)[0];

/** Pill search field from the Figma header; suggests campus places and lots as you type. */
export default function LotSearch({
  placeholder,
  onPick,
  onPickPlace,
  onQuery,
  hint,
  className,
}: {
  placeholder: string;
  /** Quiet label inside the field's right edge (e.g. the city), hidden while typing. */
  hint?: string;
  onPick: (lot: ParkingLot) => void;
  onPickPlace?: (place: CampusPlace) => void;
  onQuery?: (q: string) => void;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const places = onPickPlace ? findPlaces(q) : [];
  const lots = findLotByQuery(q);
  const open = focused && q.length > 0;

  const reset = () => {
    setQ("");
    onQuery?.("");
    setFocused(false);
  };
  const pick = (lot: ParkingLot) => {
    reset();
    onPick(lot);
  };
  const pickPlace = (place: CampusPlace) => {
    reset();
    onPickPlace?.(place);
  };

  return (
    <div className={clsx("relative", className)}>
      <label className="flex items-center gap-2 h-11 rounded-full bg-white px-4 text-[#211F27]">
        <Search size={18} className="text-[#6E6A78] shrink-0" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onQuery?.(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (places[0]) pickPlace(places[0]);
            else if (lots[0]) pick(lots[0]);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-[#8A8694]"
          aria-label={placeholder}
          enterKeyHint="search"
        />
        {hint && !q && !focused && (
          <span className="inline-flex items-center gap-1 shrink-0 text-[13px] text-[#8A8694]">
            <MapPin size={13} /> {hint}
          </span>
        )}
        {q && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              onQuery?.("");
            }}
            className="text-[#8A8694]"
          >
            <X size={18} />
          </button>
        )}
      </label>
      {open && (
        <div className="absolute z-40 left-0 right-0 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl bg-card text-ink shadow-lift border border-line animate-fade-up">
          {places.length === 0 && lots.length === 0 ? (
            <p className="px-4 py-4 text-[15px] text-muted">
              Nothing matches “{q}”. Try a building like Denny Hall or a lot code like N22.
            </p>
          ) : (
            <>
              {places.length > 0 && (
                <Group label="Campus places">
                  {places.map((place) => {
                    const best = bestLotFor(place);
                    return (
                      <Row key={place.id} onClick={() => pickPlace(place)}>
                        <span className="w-9 h-9 rounded-xl bg-brand-soft text-brand-text grid place-items-center shrink-0">
                          {place.kind === "Area" ? <MapPin size={18} /> : <Building2 size={18} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[16px] font-semibold truncate">{place.name}</span>
                          <span className="block text-[13px] text-muted truncate">
                            {best ? `${best.lot.name} · ${best.mins} min walk · ${best.open} open` : "No open lots nearby"}
                          </span>
                        </span>
                      </Row>
                    );
                  })}
                </Group>
              )}
              {lots.length > 0 && (
                <Group label={places.length ? "Parking lots" : undefined}>
                  {lots.map((lot) => {
                    const { open: free, total } = availabilityAt(lot, new Date());
                    const status = statusFor(free, total);
                    return (
                      <Row key={lot.id} onClick={() => pick(lot)}>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[16px] font-semibold truncate">{lot.name}</span>
                          <span className="block text-[13px] text-muted truncate">
                            {lot.area} · {lot.address}
                          </span>
                        </span>
                        <span
                          className={clsx(
                            "text-[13px] font-semibold shrink-0",
                            status === "Full" ? "text-danger" : status === "Busy" ? "text-warning" : "text-success"
                          )}
                        >
                          {status === "Full" ? "Full" : `${free} open`}
                        </span>
                      </Row>
                    );
                  })}
                </Group>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line last:border-0">
      {label && <p className="px-4 pt-3 pb-1 text-[12px] font-semibold uppercase tracking-wider text-subtle">{label}</p>}
      {children}
    </div>
  );
}

function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface"
    >
      {children}
    </button>
  );
}

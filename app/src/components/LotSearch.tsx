"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import { ParkingLot, availabilityAt, findLotByQuery, statusFor } from "@/services/mockData";
import { clsx } from "clsx";

/** Pill search field from the Figma header; suggests lots as you type. */
export default function LotSearch({
  placeholder,
  onPick,
  onQuery,
  className,
}: {
  placeholder: string;
  onPick: (lot: ParkingLot) => void;
  onQuery?: (q: string) => void;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const results = findLotByQuery(q);
  const open = focused && q.length > 0;

  const pick = (lot: ParkingLot) => {
    setQ("");
    onQuery?.("");
    setFocused(false);
    onPick(lot);
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
            if (e.key === "Enter" && results[0]) pick(results[0]);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-[#8A8694]"
          aria-label={placeholder}
          enterKeyHint="search"
        />
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
        <div className="absolute z-40 left-0 right-0 mt-2 rounded-2xl bg-card text-ink shadow-lift border border-line overflow-hidden animate-fade-up">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-[15px] text-muted">No lots match “{q}”. Try a code like N06.</p>
          ) : (
            results.map((lot) => {
              const { open: free, total } = availabilityAt(lot, new Date());
              const status = statusFor(free, total);
              return (
                <button
                  key={lot.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(lot)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface border-b border-line last:border-0"
                >
                  <span>
                    <span className="block text-[16px] font-semibold">{lot.name}</span>
                    <span className="block text-[13px] text-muted">{lot.area} · {lot.address}</span>
                  </span>
                  <span
                    className={clsx(
                      "text-[13px] font-semibold",
                      status === "Full" ? "text-danger" : status === "Busy" ? "text-warning" : "text-success"
                    )}
                  >
                    {status === "Full" ? "Full" : `${free} open`}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

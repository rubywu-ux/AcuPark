"use client";

import { clsx } from "clsx";
import { ArrowDown, Car } from "lucide-react";
import type { Spot } from "@/services/mockData";

/**
 * One aisle of the lot, drawn like the Figma "Select Parking" frame:
 * angled stalls on both sides of a one-way lane from Entry to Exit.
 */
export default function SpotMap({
  spots,
  selected,
  onSelect,
}: {
  spots: Spot[]; // one aisle: 6 left + 6 right
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const left = spots.filter((s) => s.side === "left");
  const right = spots.filter((s) => s.side === "right");

  return (
    <div className="grid grid-cols-[1fr_88px_1fr] rounded-card bg-card border border-line overflow-hidden">
      <Column spots={left} side="left" selected={selected} onSelect={onSelect} />
      <div className="border-x-2 border-ink/80 flex flex-col items-center justify-between py-4 bg-surface/60">
        <span className="text-[15px] font-medium text-subtle">Entry</span>
        <div className="flex flex-col gap-6 text-ink/80">
          <ArrowDown size={26} />
          <ArrowDown size={26} />
          <ArrowDown size={26} />
        </div>
        <span className="text-[15px] font-medium text-subtle">Exit</span>
      </div>
      <Column spots={right} side="right" selected={selected} onSelect={onSelect} />
    </div>
  );
}

function Column({
  spots,
  side,
  selected,
  onSelect,
}: {
  spots: Spot[];
  side: "left" | "right";
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {spots.map((s, i) => {
        const isSel = s.id === selected;
        // Stall outline in a 100×82 box: 64 for the stall + 18 of slant into the next one.
        const fill = side === "left" ? "0,0 100,18 100,82 0,64" : "100,0 0,18 0,82 100,64";
        const line = (y: number) =>
          side === "left" ? { x1: 0, y1: y, x2: 100, y2: y + 18 } : { x1: 100, y1: y, x2: 0, y2: y + 18 };
        return (
          <button
            key={s.id}
            disabled={s.occupied}
            onClick={() => onSelect(s.id)}
            aria-pressed={isSel}
            aria-label={`Spot ${s.id}${s.occupied ? ", taken" : ""}`}
            className="relative h-16 group"
          >
            <svg
              viewBox="0 0 100 82"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-0 w-full h-[82px] pointer-events-none"
              aria-hidden
            >
              {isSel && <polygon points={fill} className="fill-brand-soft" />}
              {i === 0 && <line {...line(0)} className="stroke-line" strokeWidth="2" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />}
              <line {...line(64)} className="stroke-line" strokeWidth="2" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
            </svg>
            <span
              className={clsx(
                "relative flex items-center justify-center h-full pt-3 transition-colors",
                !s.occupied && !isSel && "group-hover:text-muted"
              )}
            >
              {s.occupied ? (
                <Car size={22} className="text-subtle/70" />
              ) : (
                <span className={clsx("text-[19px]", isSel ? "text-brand-text font-semibold" : "text-subtle")}>{s.id}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

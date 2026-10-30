"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronUp, Clock, Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  ParkingLot,
  USER_LOCATION,
  availabilityAt,
  distanceKm,
  driveMinutes,
  formatMoney,
  getLot,
  statusFor,
} from "@/services/mockData";

type Tab = "recents" | "saved";

const PEEK = 150; // handle + title + tabs
const TOP_GAP = 132; // keep the purple search header visible when fully open
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag
const FLICK_VELOCITY = 0.5; // px/ms — a fast flick jumps to the next snap point

/**
 * Bottom sheet of recent and saved lots. Drag the header up or down like a native
 * sheet; it snaps to peek, half and full heights (a quick flick moves one step).
 */
export default function LotsDrawer({
  onPick,
  onHeightChange,
}: {
  onPick: (lot: ParkingLot) => void;
  onHeightChange?: (h: number) => void;
}) {
  const { favorites, recents, toggleFavorite } = useStore();
  const sheetRef = useRef<HTMLElement>(null);
  const [containerH, setContainerH] = useState(700);
  const [height, setHeight] = useState(PEEK);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState<Tab>("recents");
  const drag = useRef<{ startY: number; startH: number; lastY: number; lastT: number; v: number; moved: boolean } | null>(
    null
  );

  const snaps = [PEEK, Math.round(containerH * 0.52), Math.max(PEEK, containerH - TOP_GAP)];

  // Track the map area's height so snap points follow rotation / window resizes.
  useLayoutEffect(() => {
    const parent = sheetRef.current?.parentElement;
    if (!parent) return;
    const measure = () => setContainerH(parent.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    onHeightChange?.(height);
  }, [height, onHeightChange]);

  const snapTo = useCallback((h: number) => setHeight(h), []);

  const onPointerDown = (e: React.PointerEvent) => {
    // Let buttons inside the header (tabs, chevron) receive their own clicks.
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    drag.current = { startY: e.clientY, startH: height, lastY: e.clientY, lastT: e.timeStamp, v: 0, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - e.clientY; // up = positive
    if (!d.moved && Math.abs(dy) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.v = (d.lastY - e.clientY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    // Rubber-band slightly past the ends instead of stopping dead.
    const raw = d.startH + dy;
    const min = snaps[0];
    const max = snaps[snaps.length - 1];
    const h = raw < min ? min - (min - raw) * 0.25 : raw > max ? max + (raw - max) * 0.25 : raw;
    setHeight(h);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    setDragging(false);
    if (!d.moved) {
      // Plain tap on the header: open to half, or close back to peek.
      snapTo(height > PEEK + 10 ? PEEK : snaps[1]);
      return;
    }
    let target = snaps.reduce((best, s, i) => (Math.abs(s - height) < Math.abs(snaps[best] - height) ? i : best), 0);
    // A flick moves at least one stop in its direction, but never short of where the finger got to.
    if (d.v > FLICK_VELOCITY) {
      const up = snaps.findIndex((s) => s > d.startH + 1);
      target = Math.max(target, up === -1 ? snaps.length - 1 : up);
    } else if (d.v < -FLICK_VELOCITY) {
      target = Math.min(target, Math.max(0, snaps.findLastIndex((s) => s < d.startH - 1)));
    }
    snapTo(snaps[target]);
  };

  const ids = tab === "recents" ? recents : favorites;
  const lots = ids.map((id) => getLot(id)).filter((l): l is ParkingLot => !!l);
  const expanded = height > PEEK + 10;

  return (
    <section
      ref={sheetRef}
      aria-label="Recent and saved lots"
      className={clsx(
        "absolute bottom-0 inset-x-0 z-[1000] flex flex-col bg-band text-white rounded-t-[28px] shadow-sheet",
        !dragging && "transition-[height] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      )}
      style={{ height }}
    >
      {/* Drag area: handle, title and tabs */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="shrink-0 px-5 pt-2.5 pb-3 cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <div className="mx-auto h-1.5 w-11 rounded-full bg-white/35" />
        <div className="flex items-center justify-between mt-3">
          <div>
            <h2 className="text-[19px] font-semibold leading-tight">Your lots</h2>
            <p className="text-[13px] text-white/60">
              {recents.length} recent · {favorites.length} saved
            </p>
          </div>
          <button
            data-no-drag
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            onClick={() => snapTo(expanded ? PEEK : snaps[1])}
            className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/15"
          >
            <ChevronUp size={20} className={clsx("transition-transform", expanded && "rotate-180")} />
          </button>
        </div>

        <div data-no-drag className="mt-3 grid grid-cols-2 p-1 rounded-xl bg-black/20" role="tablist">
          {(
            [
              { id: "recents", label: "Recents", count: recents.length },
              { id: "saved", label: "Saved", count: favorites.length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                if (!expanded) snapTo(snaps[1]);
              }}
              className={clsx(
                "h-9 rounded-lg text-[14px] font-medium flex items-center justify-center gap-1.5 transition",
                tab === t.id ? "bg-white text-[#2B1A45]" : "text-white/70 hover:text-white"
              )}
            >
              {t.label}
              <span
                className={clsx(
                  "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold grid place-items-center",
                  tab === t.id ? "bg-brand text-white" : "bg-white/15"
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div
        className={clsx(
          "flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 transition-opacity",
          expanded ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        role="tabpanel"
      >
        {lots.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 py-8 text-white/60">
            <Heart size={28} className="mb-2" />
            <p className="text-[15px] font-medium text-white/80">
              {tab === "saved" ? "No saved lots yet" : "No recent lots yet"}
            </p>
            <p className="text-[13px] mt-1">
              {tab === "saved" ? "Tap the heart on any lot to keep it here." : "Lots you reserve or park at show up here."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {lots.map((lot) => (
              <LotRow
                key={lot.id}
                lot={lot}
                saved={favorites.includes(lot.id)}
                onPick={() => onPick(lot)}
                onToggleSave={() => toggleFavorite(lot.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const STATUS_TONE = {
  Available: "text-emerald-300",
  Busy: "text-amber-300",
  Full: "text-rose-300",
} as const;

function LotRow({
  lot,
  saved,
  onPick,
  onToggleSave,
}: {
  lot: ParkingLot;
  saved: boolean;
  onPick: () => void;
  onToggleSave: () => void;
}) {
  const { open, total } = availabilityAt(lot, new Date());
  const status = statusFor(open, total);
  const mins = driveMinutes(distanceKm(USER_LOCATION, lot.location));

  return (
    <li className="relative">
      <button
        onClick={onPick}
        className="w-full flex items-center gap-3 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] p-2.5 pr-12 text-left transition"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lot.photo} alt="" className="w-[84px] h-[62px] rounded-xl object-cover shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[16px] font-semibold truncate">{lot.name}</span>
          <span className="flex items-center gap-1 text-[13px] text-white/60 truncate">
            <Clock size={12} /> {mins} min · {lot.ratePerHour ? `${formatMoney(lot.ratePerHour)}/hr` : "Free"}
          </span>
          <span className={clsx("flex items-center gap-1.5 text-[13px] font-semibold mt-0.5", STATUS_TONE[status])}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status === "Full" ? "Full now" : `${open} of ${total} open`}
          </span>
        </span>
      </button>
      <button
        onClick={onToggleSave}
        aria-label={saved ? `Remove ${lot.name} from saved` : `Save ${lot.name}`}
        aria-pressed={saved}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full hover:bg-white/10"
      >
        <Heart size={18} className={saved ? "fill-accent text-accent" : "text-white/50"} />
      </button>
    </li>
  );
}

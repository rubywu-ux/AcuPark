"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronUp, Clock, Footprints, Heart, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CampusPlace,
  LOTS,
  ParkingLot,
  USER_LOCATION,
  availabilityAt,
  distanceKm,
  driveMinutes,
  formatMoney,
  getLot,
  statusFor,
  walkMinutes,
} from "@/services/mockData";

type Tab = "recents" | "saved";

const PEEK = 64; // resting: handle + one title row, so the map shows as much as possible
const TOP_GAP = 132; // keep the purple search header visible when fully open
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag
const FLICK_VELOCITY = 0.5; // px/ms — a fast flick jumps to the next snap point

/**
 * Bottom sheet of recent and saved lots. Drag the header up or down like a native
 * sheet; it snaps to peek, half and full heights (a quick flick moves one step).
 * Given a campus place, it lists the lots nearest to it by walking time instead.
 */
export default function LotsDrawer({
  onPick,
  onHeightChange,
  near,
  onClearNear,
}: {
  onPick: (lot: ParkingLot) => void;
  onHeightChange?: (h: number) => void;
  near?: CampusPlace | null;
  onClearNear?: () => void;
}) {
  const { favorites, recents, toggleFavorite } = useStore();
  const sheetRef = useRef<HTMLElement>(null);
  const [containerH, setContainerH] = useState(700);
  const [height, setHeight] = useState(PEEK);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState<Tab>("recents");
  const drag = useRef<{
    startY: number;
    startH: number;
    lastY: number;
    lastT: number;
    v: number;
    moved: boolean;
    /** A press on a button shouldn't also toggle the sheet when released without moving. */
    onButton: boolean;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Swallows the click a browser fires at the end of a drag, so dragging over a row doesn't open it.
  const suppressClick = useRef(false);

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

  // A searched building pops the sheet open so the nearby lots are visible right away.
  useEffect(() => {
    if (near) setHeight(Math.round(containerH * 0.52));
  }, [near, containerH]);

  const snapTo = useCallback((h: number) => setHeight(h), []);
  const full = snaps[snaps.length - 1];

  // One gesture engine shared by the header (pointer events) and the list (touch + mouse).
  // Refs keep the native listeners below from reading stale state.
  const live = useRef({ height, snaps });
  live.current = { height, snaps };

  const begin = useCallback((y: number, t: number, onButton = false) => {
    drag.current = { startY: y, startH: live.current.height, lastY: y, lastT: t, v: 0, moved: false, onButton };
  }, []);

  /** Returns true once the gesture is moving the sheet. */
  const update = useCallback((y: number, t: number) => {
    const d = drag.current;
    if (!d) return false;
    const dy = d.startY - y; // up = positive
    if (!d.moved && Math.abs(dy) < DRAG_THRESHOLD) return false;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    const dt = Math.max(1, t - d.lastT);
    d.v = (d.lastY - y) / dt;
    d.lastY = y;
    d.lastT = t;
    const { snaps: sn } = live.current;
    // Rubber-band slightly past the ends instead of stopping dead.
    const raw = d.startH + dy;
    const min = sn[0];
    const max = sn[sn.length - 1];
    setHeight(raw < min ? min - (min - raw) * 0.25 : raw > max ? max + (raw - max) * 0.25 : raw);
    return true;
  }, []);

  const finish = useCallback((tapToggles: boolean) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    setDragging(false);
    const { height: h, snaps: sn } = live.current;
    if (!d.moved) {
      // Plain tap on the header: open to half, or close back to peek.
      if (tapToggles && !d.onButton) setHeight(h > PEEK + 10 ? PEEK : sn[1]);
      return;
    }
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 80);
    let target = sn.reduce((best, s, i) => (Math.abs(s - h) < Math.abs(sn[best] - h) ? i : best), 0);
    // A flick moves at least one stop in its direction, but never short of where the finger got to.
    if (d.v > FLICK_VELOCITY) {
      const up = sn.findIndex((s) => s > d.startH + 1);
      target = Math.max(target, up === -1 ? sn.length - 1 : up);
    } else if (d.v < -FLICK_VELOCITY) {
      target = Math.min(target, Math.max(0, sn.findLastIndex((s) => s < d.startH - 1)));
    }
    setHeight(sn[target]);
  }, []);

  // Header: follow the pointer on the window rather than capturing it, so a tap on a tab or
  // button still lands as a click, while a drag keeps tracking after the finger leaves the header.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    begin(e.clientY, e.timeStamp, !!(e.target as HTMLElement).closest("button"));
    const id = e.pointerId;
    const move = (ev: PointerEvent) => ev.pointerId === id && update(ev.clientY, ev.timeStamp);
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      finish(true);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  // List: below full height any drag moves the sheet; at full height the list scrolls,
  // and pulling down from the very top of the list closes the sheet (like a native sheet).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let mode: "undecided" | "sheet" | "scroll" = "undecided";
    let startScroll = 0;

    const decide = (y: number) => {
      const d = drag.current;
      if (!d || mode !== "undecided") return;
      const dy = d.startY - y;
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      const { snaps: sn } = live.current;
      const atFull = d.startH >= sn[sn.length - 1] - 2;
      mode = !atFull || (dy < 0 && startScroll <= 0) ? "sheet" : "scroll";
      if (mode === "scroll") drag.current = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      mode = "undecided";
      startScroll = el.scrollTop;
      begin(e.touches[0].clientY, e.timeStamp);
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      decide(y);
      if (mode !== "sheet") return;
      if (e.cancelable) e.preventDefault();
      update(y, e.timeStamp);
    };
    const onTouchEnd = () => {
      if (mode === "sheet") finish(false);
      else drag.current = null;
      mode = "undecided";
    };

    // Mouse (desktop preview): drag anywhere on the list; the wheel still scrolls it.
    const onMouseMove = (e: MouseEvent) => update(e.clientY, e.timeStamp);
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      finish(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || drag.current) return;
      begin(e.clientY, e.timeStamp);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("mousedown", onMouseDown);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [begin, update, finish]);

  const ids = tab === "recents" ? recents : favorites;
  const nearby = near
    ? LOTS.map((lot) => ({ lot, walk: walkMinutes(distanceKm(near.location, lot.location)) })).sort((a, b) => a.walk - b.walk)
    : null;
  const lots = nearby ? nearby.map((n) => n.lot) : ids.map((id) => getLot(id)).filter((l): l is ParkingLot => !!l);
  // Closest lot that still has room gets the "Best match" tag.
  const bestId = nearby?.find((n) => availabilityAt(n.lot, new Date()).open > 0)?.lot.id;
  const expanded = height > PEEK + 10;

  return (
    <section
      ref={sheetRef}
      aria-label="Recent and saved lots"
      className={clsx(
        "absolute bottom-0 inset-x-0 z-[1000] flex flex-col overflow-hidden bg-band text-white rounded-t-[24px] shadow-sheet",
        !dragging && "transition-[height] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      )}
      style={{ height }}
      onClickCapture={(e) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Drag area: handle, title and tabs */}
      <div
        onPointerDown={onPointerDown}
        className="shrink-0 px-5 pt-2 pb-3 cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-white/35" />
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="min-w-0 flex items-baseline gap-2">
            <h2 className="text-[17px] font-semibold leading-tight truncate shrink-0 max-w-[65%]">
              {near ? `Near ${near.name}` : "Your lots"}
            </h2>
            <p className="text-[13px] text-white/60 truncate">
              {near ? "Closest walk" : `${recents.length} recent · ${favorites.length} saved`}
            </p>
          </div>
          {near && (
            <button
              aria-label={`Clear ${near.name}`}
              onClick={onClearNear}
              className="ml-auto w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/15 shrink-0"
            >
              <X size={18} />
            </button>
          )}
          <button
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            onClick={() => snapTo(expanded ? PEEK : snaps[1])}
            className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/15 shrink-0"
          >
            <ChevronUp size={18} className={clsx("transition-transform", expanded && "rotate-180")} />
          </button>
        </div>

        {!near && (
        <div className="mt-3 grid grid-cols-2 p-1 rounded-xl bg-black/20" role="tablist">
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
        )}
      </div>

      {/* List */}
      <div
        ref={listRef}
        className={clsx(
          "flex-1 min-h-0 overscroll-contain px-4 pb-4 transition-opacity select-none",
          // Only scrolls when fully open; below that, every drag moves the sheet.
          height >= full - 2 ? "overflow-y-auto touch-pan-y" : "overflow-hidden touch-none",
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
                walk={nearby?.find((n) => n.lot.id === lot.id)?.walk}
                best={lot.id === bestId}
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
  walk,
  best,
  saved,
  onPick,
  onToggleSave,
}: {
  lot: ParkingLot;
  /** Walking minutes to the searched place, when there is one. */
  walk?: number;
  best?: boolean;
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
        className={clsx(
          "w-full flex items-center gap-3 rounded-2xl p-2.5 pr-12 text-left transition",
          best ? "bg-white/[0.14] ring-2 ring-accent/70" : "bg-white/[0.07] hover:bg-white/[0.12]"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lot.photo} alt="" className="w-[84px] h-[62px] rounded-xl object-cover shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-[16px] font-semibold truncate">{lot.name}</span>
            {best && (
              <span className="shrink-0 rounded-full bg-accent text-accent-ink px-2 h-5 leading-5 text-[11px] font-bold">
                Best match
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-[13px] text-white/60 truncate">
            {walk !== undefined ? <Footprints size={12} /> : <Clock size={12} />}
            {walk !== undefined ? `${walk} min walk` : `${mins} min drive`} ·{" "}
            {lot.ratePerHour ? `${formatMoney(lot.ratePerHour)}/hr` : "Free"}
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

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { toDateKey } from "@/services/mockData";

interface CalendarProps {
  selectedDates: string[];
  onDateSelect: (date: string) => void;
  minDate?: string;
}

export default function Calendar({ selectedDates, onDateSelect, minDate }: CalendarProps) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstWeekday = month.getDay();
  const todayKey = toDateKey(new Date());
  const canGoBack = !minDate || toDateKey(month) > minDate.slice(0, 8) + "01";

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[17px] font-semibold">
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <button
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => shift(-1)}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <button aria-label="Next month" onClick={() => shift(1)} className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="h-8 grid place-items-center text-[12px] font-semibold text-subtle">
            {d}
          </div>
        ))}
        {Array.from({ length: firstWeekday }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const key = toDateKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
          const disabled = !!minDate && key < minDate;
          const selected = selectedDates.includes(key);
          return (
            <div key={key} className="grid place-items-center">
              <button
                onClick={() => !disabled && onDateSelect(key)}
                disabled={disabled}
                aria-pressed={selected}
                className={clsx(
                  "w-10 h-10 rounded-full text-[15px] font-medium transition",
                  selected
                    ? "bg-brand text-white shadow-card"
                    : disabled
                      ? "text-subtle/50"
                      : "hover:bg-brand-soft",
                  key === todayKey && !selected && "ring-1 ring-brand/40 text-brand-text"
                )}
              >
                {i + 1}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

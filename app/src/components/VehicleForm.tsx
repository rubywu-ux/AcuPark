"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Vehicle } from "@/services/mockData";

const FIELDS: { key: keyof Vehicle; label: string; placeholder: string }[] = [
  { key: "plate", label: "License plate", placeholder: "4LN54" },
  { key: "color", label: "Color", placeholder: "White" },
  { key: "make", label: "Make", placeholder: "Toyota" },
  { key: "model", label: "Model", placeholder: "Prius" },
];

export default function VehicleForm({ initial, onSave }: { initial: Vehicle; onSave: (v: Vehicle) => void }) {
  const [v, setV] = useState(initial);
  const valid = v.plate.trim().length >= 2 && v.make.trim() && v.model.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ ...v, plate: v.plate.trim().toUpperCase() });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className={f.key === "plate" ? "col-span-2" : undefined}>
            <span className="block text-[13px] font-semibold text-subtle mb-1">{f.label}</span>
            <input
              value={v[f.key]}
              onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className={`w-full h-12 rounded-xl bg-surface border border-line px-3 text-[16px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
                f.key === "plate" ? "font-mono uppercase tracking-widest" : ""
              }`}
            />
          </label>
        ))}
      </div>
      <Button type="submit" block disabled={!valid} className="mt-2">
        Save vehicle
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui";
import type { Role } from "@/services/mockData";

const ROLES: { value: Role; proof: string }[] = [
  { value: "Student", proof: "Current student ID or enrollment record" },
  { value: "Faculty", proof: "Staff or faculty ID, or employment letter" },
  { value: "Visitor", proof: "No proof needed" },
];

const MIN_REASON = 10;

/** Asks for a new status plus a reason; nothing changes until the request is reviewed. */
export default function StatusRequestForm({
  current,
  onSubmit,
}: {
  current: Role;
  onSubmit: (to: Role, reason: string) => void;
}) {
  const [to, setTo] = useState<Role | null>(null);
  const [reason, setReason] = useState("");
  const valid = to !== null && reason.trim().length >= MIN_REASON;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(to, reason.trim());
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 rounded-xl bg-surface border border-line px-4 h-12 text-[15px]">
        <Lock size={16} className="text-subtle" />
        <span className="text-muted">Current status</span>
        <span className="ml-auto font-semibold">{current}</span>
      </div>

      <fieldset>
        <legend className="text-[13px] font-semibold text-subtle mb-2">Change to</legend>
        <div className="space-y-2" role="radiogroup">
          {ROLES.filter((r) => r.value !== current).map((r) => {
            const active = to === r.value;
            return (
              <button
                type="button"
                key={r.value}
                role="radio"
                aria-checked={active}
                onClick={() => setTo(r.value)}
                className={clsx(
                  "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition",
                  active ? "border-brand bg-brand-soft" : "border-line hover:bg-surface"
                )}
              >
                <span className="flex-1">
                  <span className="block text-[16px] font-semibold">{r.value}</span>
                  <span className="block text-[13px] text-muted">{r.proof}</span>
                </span>
                {active && <Check size={20} className="text-brand-text" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="block text-[13px] font-semibold text-subtle mb-1">Why are you requesting this?</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. I started a staff position this quarter"
          className="w-full rounded-xl bg-surface border border-line px-3 py-2.5 text-[16px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
        />
      </label>

      <p className="text-[13px] text-muted">
        Campus Parking reviews every request and may ask for proof. Your current rate stays in place until it&apos;s approved.
      </p>

      <Button type="submit" block disabled={!valid}>
        Send request
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { BadgeCheck, Car, Check, ChevronRight, Clock, CreditCard, History, Moon, RotateCcw, Smartphone } from "lucide-react";
import { Button, Card, Eyebrow, Segmented, Sheet, TopBar, useToast } from "@/components/ui";
import StatusRequestForm from "@/components/StatusRequestForm";
import VehicleForm from "@/components/VehicleForm";
import { ThemePref, useStore } from "@/lib/store";
import { PAYMENT_METHODS, PaymentMethodId, formatDay, formatMoney, formatTime, getLot, signCode } from "@/services/mockData";

export default function SettingsPage() {
  const toast = useToast();
  const {
    user,
    statusRequest,
    requestStatusChange,
    cancelStatusRequest,
    updateVehicle,
    defaultPayment,
    setDefaultPayment,
    theme,
    setTheme,
    history,
    resetDemo,
  } = useStore();
  const [editVehicle, setEditVehicle] = useState(false);
  const [changeStatus, setChangeStatus] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <main className="min-h-[100dvh] bg-surface">
      <TopBar title={<span className="text-[28px] font-medium">Settings</span>} className="pb-6 rounded-b-[28px]" />

      <div className="px-5 pt-5 space-y-6 pb-8">
        {/* Profile — campus status is verified, so it's shown read-only here */}
        <Card className="overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand text-accent grid place-items-center text-[26px] font-semibold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-brand-text">
                <BadgeCheck size={14} /> {user.role}
              </span>
              <p className="text-[19px] font-semibold truncate">{user.name}</p>
              <p className="text-[14px] text-muted truncate">{user.email}</p>
            </div>
          </div>
          {statusRequest ? (
            <div className="border-t border-line px-5 py-3.5 flex items-center gap-3 bg-surface/60">
              <Clock size={18} className="text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium">Change to {statusRequest.to} requested</p>
                <p className="text-[13px] text-muted">Under review · sent {formatDay(statusRequest.requestedAt)}</p>
              </div>
              <button
                onClick={() => {
                  cancelStatusRequest();
                  toast("Status change request withdrawn");
                }}
                className="text-[14px] font-semibold text-danger shrink-0"
              >
                Withdraw
              </button>
            </div>
          ) : (
            <button
              onClick={() => setChangeStatus(true)}
              className="w-full border-t border-line px-5 py-3.5 flex items-center justify-between text-[15px] font-medium text-brand-text hover:bg-surface"
            >
              Request to change status
              <ChevronRight size={18} />
            </button>
          )}
        </Card>
        <p className="text-[13px] text-muted -mt-4 px-1">Your verified status sets the rate you pay at every lot.</p>

        {/* Vehicle */}
        <section>
          <Eyebrow className="mb-2 px-1">Vehicle</Eyebrow>
          <Card className="overflow-hidden">
            <button onClick={() => setEditVehicle(true)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface">
              <span className="w-11 h-11 rounded-xl bg-brand-soft text-brand-text grid place-items-center">
                <Car size={22} />
              </span>
              <span className="flex-1">
                <span className="block text-[16px] font-semibold">
                  {user.vehicle.color} {user.vehicle.make} {user.vehicle.model}
                </span>
                <span className="block font-mono text-[14px] text-muted tracking-wider">{user.vehicle.plate}</span>
              </span>
              <ChevronRight className="text-subtle" size={20} />
            </button>
          </Card>
        </section>

        {/* Payment */}
        <section>
          <Eyebrow className="mb-2 px-1">Default payment</Eyebrow>
          <Card className="divide-y divide-line overflow-hidden">
            {(Object.keys(PAYMENT_METHODS) as PaymentMethodId[]).map((id) => (
              <button
                key={id}
                onClick={() => setDefaultPayment(id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface"
                role="radio"
                aria-checked={defaultPayment === id}
              >
                <span
                  className={clsx(
                    "w-11 h-8 rounded-md grid place-items-center text-white",
                    id === "apple-pay" ? "bg-black" : "bg-brand"
                  )}
                >
                  {id === "apple-pay" ? <Smartphone size={16} /> : <CreditCard size={16} />}
                </span>
                <span className="flex-1">
                  <span className="block text-[16px] font-medium">{PAYMENT_METHODS[id].label}</span>
                  <span className="block text-[13px] text-muted">{PAYMENT_METHODS[id].detail}</span>
                </span>
                {defaultPayment === id && <Check size={20} className="text-brand-text" />}
              </button>
            ))}
          </Card>
        </section>

        {/* Appearance */}
        <section>
          <Eyebrow className="mb-2 px-1 flex items-center gap-1.5">
            <Moon size={14} /> Appearance
          </Eyebrow>
          <Segmented<ThemePref>
            value={theme}
            onChange={setTheme}
            options={[
              { value: "system", label: "Auto" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </section>

        {/* History */}
        <section>
          <Eyebrow className="mb-2 px-1 flex items-center gap-1.5">
            <History size={14} /> Parking history
          </Eyebrow>
          {history.length === 0 ? (
            <Card className="p-5 text-[15px] text-muted">Your past sessions will show up here.</Card>
          ) : (
            <Card className="divide-y divide-line">
              {history.slice(0, 8).map((h) => {
                const lot = getLot(h.lotId)!;
                return (
                  <div key={h.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-[16px] font-medium">
                        {signCode(lot)}/{h.spotId}
                      </p>
                      <p className="text-[13px] text-muted">
                        {formatDay(h.startedAt)} · {formatTime(h.startedAt)} – {formatTime(h.endedAt ?? h.endsAt)}
                      </p>
                    </div>
                    <p className="text-[16px] font-semibold">{formatMoney(h.amount)}</p>
                  </div>
                );
              })}
            </Card>
          )}
        </section>

        <Button variant="danger" block size="md" onClick={() => setConfirmReset(true)}>
          <RotateCcw size={17} /> Reset demo data
        </Button>
      </div>

      <Sheet open={editVehicle} onClose={() => setEditVehicle(false)} title="Edit vehicle">
        <VehicleForm
          initial={user.vehicle}
          onSave={(v) => {
            updateVehicle(v);
            setEditVehicle(false);
            toast("Vehicle saved");
          }}
        />
      </Sheet>

      <Sheet open={changeStatus} onClose={() => setChangeStatus(false)} title="Request status change">
        <StatusRequestForm
          current={user.role}
          onSubmit={(to, reason) => {
            requestStatusChange(to, reason);
            setChangeStatus(false);
            toast("Request sent — your rate stays the same until it's approved");
          }}
        />
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?">
        <p className="text-muted text-[15px] mb-5">This clears reservations, sessions and history so you can run the flow from the start.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={() => {
              resetDemo();
              setConfirmReset(false);
              toast("Demo data reset");
            }}
          >
            Reset
          </Button>
        </div>
      </Sheet>
    </main>
  );
}

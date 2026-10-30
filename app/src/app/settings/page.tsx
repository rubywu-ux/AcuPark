"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { BadgeCheck, Car, Check, ChevronRight, Clock, CreditCard, History, Moon, Plus, RotateCcw, Smartphone, Trash2 } from "lucide-react";
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
    vehicles,
    activeVehicleId,
    saveVehicle,
    removeVehicle,
    setActiveVehicle,
    defaultPayment,
    setDefaultPayment,
    theme,
    setTheme,
    history,
    resetDemo,
  } = useStore();
  // null = sheet closed; { id: null } = adding a new vehicle.
  const [vehicleSheet, setVehicleSheet] = useState<{ id: string | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = vehicleSheet?.id ? vehicles.find((v) => v.id === vehicleSheet.id) : undefined;
  const closeVehicleSheet = () => {
    setVehicleSheet(null);
    setConfirmDelete(false);
  };
  const [changeStatus, setChangeStatus] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <main className="min-h-[100dvh] bg-surface">
      <TopBar title={<span className="text-[28px] font-medium">Settings</span>} className="pb-6" />

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

        {/* Vehicles */}
        <section>
          <Eyebrow className="mb-2 px-1">Your saved vehicles</Eyebrow>
          <Card className="divide-y divide-line overflow-hidden">
            {vehicles.map((v) => {
              const inUse = v.id === activeVehicleId;
              return (
                <button
                  key={v.id}
                  onClick={() => setVehicleSheet({ id: v.id })}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface"
                >
                  <span
                    className={clsx(
                      "w-11 h-11 rounded-xl grid place-items-center shrink-0",
                      inUse ? "bg-brand text-white" : "bg-brand-soft text-brand-text"
                    )}
                  >
                    <Car size={22} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[16px] font-semibold truncate">
                      {v.color} {v.make} {v.model}
                    </span>
                    <span className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[14px] text-muted tracking-wider">{v.plate}</span>
                      {inUse && (
                        <span className="rounded-full bg-brand-soft text-brand-text px-2 h-5 leading-5 text-[11px] font-semibold">
                          In use
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight className="text-subtle shrink-0" size={20} />
                </button>
              );
            })}
            <button
              onClick={() => setVehicleSheet({ id: null })}
              className="w-full flex items-center gap-4 p-4 text-left text-brand-text font-medium hover:bg-surface"
            >
              <span className="w-11 h-11 rounded-xl border-2 border-dashed border-brand/40 grid place-items-center">
                <Plus size={20} />
              </span>
              Add vehicle
            </button>
          </Card>
          <p className="text-[13px] text-muted mt-2 px-1">The vehicle in use is the one AI Quick Scan matches and reservations are booked for.</p>
        </section>

        {/* Payment */}
        <section>
          <Eyebrow className="mb-2 px-1">Default payment</Eyebrow>
          <Card className="divide-y divide-line overflow-hidden" role="radiogroup" aria-label="Default payment">
            {(Object.keys(PAYMENT_METHODS) as PaymentMethodId[]).map((id) => {
              const selected = defaultPayment === id;
              return (
                <button
                  key={id}
                  onClick={() => setDefaultPayment(id)}
                  className={clsx(
                    "w-full flex items-center gap-4 p-4 text-left transition",
                    selected ? "bg-brand-soft/60" : "opacity-45 hover:opacity-75"
                  )}
                  role="radio"
                  aria-checked={selected}
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
                  <span
                    className={clsx(
                      "w-6 h-6 rounded-full grid place-items-center shrink-0 transition",
                      selected ? "bg-brand text-white" : "border-2 border-line"
                    )}
                  >
                    {selected && <Check size={15} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
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
          <RotateCcw size={17} /> Reset data
        </Button>
      </div>

      <Sheet
        open={vehicleSheet !== null}
        onClose={closeVehicleSheet}
        title={vehicleSheet?.id ? "Edit vehicle" : "Add vehicle"}
      >
        <VehicleForm
          key={vehicleSheet?.id ?? "new"}
          initial={editing ?? { plate: "", color: "", make: "", model: "" }}
          submitLabel={vehicleSheet?.id ? "Save vehicle" : "Add vehicle"}
          onSave={(v) => {
            saveVehicle(vehicleSheet?.id ?? null, v);
            closeVehicleSheet();
            toast(vehicleSheet?.id ? "Vehicle saved" : `${v.make} ${v.model} added`);
          }}
        />
        {editing && (
          <div className="mt-3 space-y-1">
            {editing.id !== activeVehicleId && (
              <Button
                variant="soft"
                block
                size="md"
                onClick={() => {
                  setActiveVehicle(editing.id);
                  closeVehicleSheet();
                  toast(`Now parking with ${editing.plate}`);
                }}
              >
                <Car size={17} /> Use this vehicle for parking
              </Button>
            )}
            {vehicles.length <= 1 ? (
              <p className="text-[13px] text-muted text-center pt-2">Add another vehicle before deleting this one.</p>
            ) : confirmDelete ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" size="md" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="border border-danger/30"
                  onClick={() => {
                    removeVehicle(editing.id);
                    closeVehicleSheet();
                    toast(`${editing.plate} deleted`);
                  }}
                >
                  Delete {editing.plate}
                </Button>
              </div>
            ) : (
              <Button variant="danger" block size="md" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={17} /> Delete vehicle
              </Button>
            )}
          </div>
        )}
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

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset data?">
        <p className="text-muted text-[15px] mb-5">This clears reservations, sessions, history and saved vehicles, and returns everything to the starting state.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={() => {
              resetDemo();
              setConfirmReset(false);
              toast("Data reset");
            }}
          >
            Reset
          </Button>
        </div>
      </Sheet>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Navigation, X } from "lucide-react";
import { Button, Card, IconButton, MapThumb, Sheet, TitleBlock, TopBar, useToast } from "@/components/ui";
import { useNow, useStore } from "@/lib/store";
import { formatCountdown, formatDay, formatMoney, formatTime, getLot, signCode } from "@/services/mockData";

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const now = useNow();
  const { ready, reservations, cancelReservation } = useStore();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const r = reservations.find((x) => x.id === id);
  const lot = getLot(r?.lotId);

  if (!ready) return <main className="min-h-[100dvh] bg-bg" />;
  if (!r || !lot) {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-8 text-center">
        <div>
          <p className="text-[17px] font-semibold mb-4">Reservation not found.</p>
          <Button href="/">Go home</Button>
        </div>
      </main>
    );
  }

  const untilStart = new Date(r.start).getTime() - now;
  const ended = new Date(r.end).getTime() <= now;
  const siblings = reservations.filter(
    (x) => x.id !== r.id && x.createdAt === r.createdAt && x.status === "upcoming"
  ).length;

  const heading =
    r.status === "cancelled"
      ? { strong: "Reservation", light: "Cancelled" }
      : r.status === "checked-in"
        ? { strong: "Checked in", light: "Enjoy your day" }
        : { strong: "Confirmed", light: "Parking" };

  return (
    <main className="min-h-[100dvh] bg-bg flex flex-col">
      <TopBar
        right={
          <IconButton label="Close" onClick={() => router.push("/")} className="-mr-2 hover:bg-white/10">
            <X size={24} />
          </IconButton>
        }
      />

      <div className="flex-1 px-6 pt-8 pb-36">
        <div className="flex items-center gap-3 mb-6">
          {r.status === "upcoming" && <CheckCircle2 size={34} className="text-success animate-pop" />}
          <TitleBlock strong={heading.strong} light={heading.light} />
        </div>

        <Card className="p-6 animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[14px] font-semibold text-subtle">{lot.kind}</p>
              <p className="text-[30px] leading-tight">
                {signCode(lot)}/{r.spotId}
              </p>
              <p className="text-[13px] text-muted mt-1">{lot.address}</p>
            </div>
            <MapThumb at={lot.location} className="w-[94px] h-[68px]" />
          </div>

          {r.status === "upcoming" && !ended && (
            <div className="mt-6 rounded-2xl bg-brand-deep text-white px-5 py-4">
              <p className="text-[13px] text-white/70">{untilStart > 0 ? "Starting in" : "Spot held until"}</p>
              <p className="text-[36px] font-light tabular leading-tight">
                {untilStart > 0 ? formatCountdown(untilStart) : formatTime(r.end)}
              </p>
            </div>
          )}

          <dl className="mt-5 space-y-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-subtle font-semibold text-[14px]">When</dt>
              <dd className="font-medium">
                {formatDay(r.start)} · {formatTime(r.start)} – {formatTime(r.end)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-subtle font-semibold text-[14px]">Pay upon arrival</dt>
              <dd className="font-semibold">{formatMoney(r.price)}</dd>
            </div>
          </dl>
          {siblings > 0 && (
            <p className="text-[13px] text-muted mt-3">
              +{siblings} more date{siblings > 1 ? "s" : ""} booked at this spot
            </p>
          )}
        </Card>
      </div>

      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-app px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] bg-gradient-to-t from-bg via-bg to-transparent space-y-2">
        {r.status === "upcoming" && !ended ? (
          <>
            <Button block href={`/navigate?res=${r.id}`}>
              <Navigation size={18} /> Take Me There
            </Button>
            <Button block variant="danger" size="md" onClick={() => setConfirmCancel(true)}>
              Cancel reservation
            </Button>
          </>
        ) : (
          <Button block variant="brand" href="/">
            Back to home
          </Button>
        )}
      </div>

      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this reservation?">
        <p className="text-muted text-[15px] mb-5">
          {signCode(lot)}/{r.spotId} on {formatDay(r.start)} will be released for other drivers. You haven&apos;t been charged.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmCancel(false)}>
            Keep it
          </Button>
          <Button
            variant="brand"
            onClick={() => {
              cancelReservation(r.id);
              setConfirmCancel(false);
              toast("Reservation cancelled");
            }}
          >
            Cancel it
          </Button>
        </div>
      </Sheet>
    </main>
  );
}

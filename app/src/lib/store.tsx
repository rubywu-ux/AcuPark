"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_USER,
  PaymentMethodId,
  Reservation,
  Role,
  SavedVehicle,
  Session,
  User,
  Vehicle,
  getLot,
  priceFor,
  uid,
} from "@/services/mockData";

export type ThemePref = "system" | "light" | "dark";

/** Status changes affect pricing, so they go to campus parking for review instead of applying instantly. */
export interface StatusRequest {
  to: Role;
  reason: string;
  requestedAt: string;
}

interface AppState {
  version: number;
  user: User;
  reservations: Reservation[];
  session: Session | null;
  history: Session[];
  favorites: string[];
  recents: string[];
  defaultPayment: PaymentMethodId;
  theme: ThemePref;
  statusRequest: StatusRequest | null;
  /** Saved vehicles; the active one is exposed as user.vehicle for scans and bookings. */
  vehicles: SavedVehicle[];
  activeVehicleId: string;
}

const STORAGE_KEY = "acupark:v2";
import { THEME_KEY } from "@/lib/theme";

const initialState = (): AppState => ({
  version: 2,
  user: DEFAULT_USER,
  reservations: [],
  session: null,
  history: [],
  favorites: ["lot_n22", "lot_e1"],
  recents: ["lot_n05", "lot_n22", "lot_e1"],
  defaultPayment: "apple-pay",
  theme: "system",
  statusRequest: null,
  vehicles: [{ id: "veh_default", ...DEFAULT_USER.vehicle }],
  activeVehicleId: "veh_default",
});

export interface CheckInInput {
  lotId: string;
  spotId: string;
  hours: number;
  reservationId?: string;
  payment: PaymentMethodId;
}

interface Store extends AppState {
  ready: boolean;
  /** Next reservation that hasn't ended or been used. */
  upcoming: Reservation | null;
  reserve: (input: { lotId: string; spotId: string; starts: Date[]; hours: number }) => Reservation[];
  cancelReservation: (id: string) => void;
  checkIn: (input: CheckInInput) => Session;
  extendSession: (minutes: number) => number;
  endSession: () => void;
  toggleFavorite: (lotId: string) => void;
  /** Edits the vehicle currently in use (e.g. fixing a misread plate at check-in). */
  updateVehicle: (v: Vehicle) => void;
  /** Adds a vehicle when id is null, otherwise updates it. Returns its id. */
  saveVehicle: (id: string | null, v: Vehicle) => string;
  removeVehicle: (id: string) => void;
  setActiveVehicle: (id: string) => void;
  requestStatusChange: (to: Role, reason: string) => void;
  cancelStatusRequest: () => void;
  setDefaultPayment: (p: PaymentMethodId) => void;
  setTheme: (t: ThemePref) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<Store | null>(null);

/** Lots that were renamed to match the real campus map; old saves still use the old ids. */
const RENAMED_LOTS: Record<string, string> = { lot_n09: "lot_n05", lot_n06: "lot_n22", lot_n03: "lot_e1", lot_e03: "lot_n20" };
const renameLot = (id: string) => RENAMED_LOTS[id] ?? id;

const migrateLotIds = (s: AppState): AppState => ({
  ...s,
  favorites: Array.from(new Set(s.favorites.map(renameLot))),
  recents: Array.from(new Set(s.recents.map(renameLot))),
  reservations: s.reservations.map((r) => ({ ...r, lotId: renameLot(r.lotId) })),
  session: s.session ? { ...s.session, lotId: renameLot(s.session.lotId) } : null,
  history: s.history.map((h) => ({ ...h, lotId: renameLot(h.lotId) })),
});

const pushRecent = (recents: string[], lotId: string) => [lotId, ...recents.filter((r) => r !== lotId)].slice(0, 6);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Hydrate once on the client.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AppState;
        if (saved.version === 2) {
          // Older saves only had user.vehicle — turn it into the first saved vehicle.
          if (!saved.vehicles?.length) {
            saved.vehicles = [{ id: "veh_default", ...saved.user.vehicle }];
            saved.activeVehicleId = "veh_default";
          }
          setState(migrateLotIds({ ...initialState(), ...saved }));
        }
      }
    } catch {
      // Corrupt or blocked storage — fall back to defaults.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(THEME_KEY, state.theme);
    } catch {
      // Storage unavailable (private mode) — state still works in memory.
    }
  }, [state, ready]);

  // Coarse clock so "upcoming" rolls over without every consumer polling.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const upcoming = useMemo(
    () =>
      state.reservations
        .filter((r) => r.status === "upcoming" && new Date(r.end).getTime() > now)
        .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null,
    [state.reservations, now]
  );

  const reserve: Store["reserve"] = useCallback(
    ({ lotId, spotId, starts, hours }) => {
      const lot = getLot(lotId);
      if (!lot) return [];
      const created: Reservation[] = starts.map((start) => ({
        id: uid("res"),
        lotId,
        spotId,
        start: start.toISOString(),
        end: new Date(start.getTime() + hours * 3_600_000).toISOString(),
        price: priceFor(lot, hours, state.user.role),
        status: "upcoming",
        createdAt: new Date().toISOString(),
      }));
      setState((s) => ({
        ...s,
        reservations: [...s.reservations, ...created],
        recents: pushRecent(s.recents, lotId),
      }));
      return created;
    },
    [state.user.role]
  );

  const cancelReservation = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
    }));
  }, []);

  const checkIn: Store["checkIn"] = useCallback(
    ({ lotId, spotId, hours, reservationId, payment }) => {
      const lot = getLot(lotId)!;
      const reservation = state.reservations.find((r) => r.id === reservationId);
      const startedAt = new Date();
      const session: Session = {
        id: uid("ses"),
        lotId,
        spotId,
        reservationId,
        startedAt: startedAt.toISOString(),
        // A reservation keeps its booked end time, whether the driver arrives early or late.
        endsAt: reservation
          ? new Date(Math.max(new Date(reservation.end).getTime(), startedAt.getTime() + 15 * 60_000)).toISOString()
          : new Date(startedAt.getTime() + hours * 3_600_000).toISOString(),
        amount: reservation?.price ?? priceFor(lot, hours, state.user.role),
        payment,
        extensions: 0,
      };
      setState((s) => ({
        ...s,
        // Starting a new session closes any previous one.
        history: s.session ? [{ ...s.session, endedAt: startedAt.toISOString() }, ...s.history] : s.history,
        session,
        reservations: s.reservations.map((r) => (r.id === reservationId ? { ...r, status: "checked-in" } : r)),
        recents: pushRecent(s.recents, lotId),
      }));
      return session;
    },
    [state.reservations, state.user.role]
  );

  const extendSession = useCallback(
    (minutes: number) => {
      const s = state.session;
      if (!s) return 0;
      const lot = getLot(s.lotId)!;
      const charge = priceFor(lot, minutes / 60, state.user.role);
      // Extending an expired session restarts the clock from now.
      const base = Math.max(new Date(s.endsAt).getTime(), Date.now());
      setState((st) =>
        st.session
          ? {
              ...st,
              session: {
                ...st.session,
                endsAt: new Date(base + minutes * 60_000).toISOString(),
                amount: Math.round((st.session.amount + charge) * 100) / 100,
                extensions: st.session.extensions + 1,
              },
            }
          : st
      );
      return charge;
    },
    [state.session, state.user.role]
  );

  const endSession = useCallback(() => {
    setState((s) =>
      s.session ? { ...s, history: [{ ...s.session, endedAt: new Date().toISOString() }, ...s.history], session: null } : s
    );
  }, []);

  const toggleFavorite = useCallback((lotId: string) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(lotId) ? s.favorites.filter((f) => f !== lotId) : [lotId, ...s.favorites],
    }));
  }, []);

  const updateVehicle = useCallback((vehicle: Vehicle) => {
    setState((s) => ({
      ...s,
      vehicles: s.vehicles.map((v) => (v.id === s.activeVehicleId ? { ...vehicle, id: v.id } : v)),
    }));
  }, []);

  const saveVehicle = useCallback((id: string | null, vehicle: Vehicle) => {
    const vid = id ?? uid("veh");
    setState((s) => ({
      ...s,
      vehicles: id ? s.vehicles.map((v) => (v.id === id ? { ...vehicle, id } : v)) : [...s.vehicles, { ...vehicle, id: vid }],
    }));
    return vid;
  }, []);

  const removeVehicle = useCallback((id: string) => {
    setState((s) => {
      // Always keep at least one vehicle to scan and book with.
      if (s.vehicles.length <= 1) return s;
      const vehicles = s.vehicles.filter((v) => v.id !== id);
      return { ...s, vehicles, activeVehicleId: s.activeVehicleId === id ? vehicles[0].id : s.activeVehicleId };
    });
  }, []);

  const setActiveVehicle = useCallback((id: string) => setState((s) => ({ ...s, activeVehicleId: id })), []);

  // There is deliberately no way to set user.role from the client — only a request for review.
  const requestStatusChange = useCallback((to: Role, reason: string) => {
    setState((s) => ({ ...s, statusRequest: { to, reason, requestedAt: new Date().toISOString() } }));
  }, []);

  const cancelStatusRequest = useCallback(() => setState((s) => ({ ...s, statusRequest: null })), []);

  const setDefaultPayment = useCallback((p: PaymentMethodId) => setState((s) => ({ ...s, defaultPayment: p })), []);
  const setTheme = useCallback((t: ThemePref) => setState((s) => ({ ...s, theme: t })), []);
  const resetDemo = useCallback(() => setState((s) => ({ ...initialState(), theme: s.theme })), []);

  const activeVehicle = state.vehicles.find((v) => v.id === state.activeVehicleId) ?? state.vehicles[0];

  const value: Store = {
    ...state,
    user: { ...state.user, vehicle: activeVehicle },
    ready,
    upcoming,
    reserve,
    cancelReservation,
    checkIn,
    extendSession,
    endSession,
    toggleFavorite,
    updateVehicle,
    saveVehicle,
    removeVehicle,
    setActiveVehicle,
    requestStatusChange,
    cancelStatusRequest,
    setDefaultPayment,
    setTheme,
    resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <AppProvider>");
  return ctx;
}

/** Ticking clock for countdowns. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

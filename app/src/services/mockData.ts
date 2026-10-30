// Mock data + pure helpers. Interfaces mirror a future Supabase schema
// (users, vehicles, lots, reservations, sessions) so the store can swap to real queries.

export type Role = "Student" | "Faculty" | "Visitor";
export type PaymentMethodId = "apple-pay" | "card";
export type LotFeature = "Near Me" | "Low Cost" | "Free Parking" | "Late Hours" | "Walkability" | "EV Charging";
export type LotStatus = "Available" | "Busy" | "Full";
export type LatLng = [number, number];

export interface Vehicle {
  plate: string;
  make: string;
  model: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  vehicle: Vehicle;
}

export interface ParkingLot {
  id: string;
  code: string; // "N06" — what drivers type and see on signs
  name: string; // "Lot N06"
  kind: "Lot" | "Garage";
  area: string;
  address: string;
  location: LatLng;
  aisles: number; // each aisle = 2 rows × 6 stalls
  baseOccupancy: number; // 0–1, typical share of stalls taken
  ratePerHour: number;
  hours: string;
  features: LotFeature[];
  photo: string;
}

export interface Reservation {
  id: string;
  lotId: string;
  spotId: string;
  start: string; // ISO
  end: string; // ISO
  price: number;
  status: "upcoming" | "checked-in" | "cancelled";
  createdAt: string;
}

export interface Session {
  id: string;
  lotId: string;
  spotId: string;
  reservationId?: string;
  startedAt: string;
  endsAt: string;
  amount: number;
  payment: PaymentMethodId;
  extensions: number;
  endedAt?: string;
}

export const STALLS_PER_ROW = 6;
export const STALLS_PER_AISLE = STALLS_PER_ROW * 2;

// Simulated GPS fix — north of campus, a short drive from most lots.
export const USER_LOCATION: LatLng = [47.6648, -122.313];
export const CITY_LABEL = "Seattle, WA";

export const DEFAULT_USER: User = {
  id: "user_123",
  name: "Ruby Wu",
  email: "ruby@uw.edu",
  role: "Student",
  vehicle: {
    plate: "4LN54",
    make: "Toyota",
    model: "Prius",
    color: "White",
  },
};

export const LOTS: ParkingLot[] = [
  {
    id: "lot_n06",
    code: "N06",
    name: "Lot N06",
    kind: "Lot",
    area: "North Campus",
    address: "4060 Stevens Way NE",
    location: [47.6566, -122.3058],
    aisles: 3,
    baseOccupancy: 0.82,
    ratePerHour: 5,
    hours: "6 AM – 11 PM",
    features: ["Near Me", "Walkability"],
    photo: "/lots/lot-topview.jpg",
  },
  {
    id: "lot_n09",
    code: "N09",
    name: "Garage N09",
    kind: "Garage",
    area: "North Campus",
    address: "4300 Memorial Way NE",
    location: [47.6598, -122.3086],
    aisles: 5,
    baseOccupancy: 0.6,
    ratePerHour: 6,
    hours: "Open 24 hours",
    features: ["Late Hours", "EV Charging"],
    photo: "/lots/lot-a.jpg",
  },
  {
    id: "lot_n03",
    code: "N03",
    name: "Lot N03",
    kind: "Lot",
    area: "North Campus",
    address: "4200 15th Ave NE",
    location: [47.6589, -122.3021],
    aisles: 2,
    baseOccupancy: 0.55,
    ratePerHour: 3.5,
    hours: "6 AM – 10 PM",
    features: ["Low Cost", "Walkability"],
    photo: "/lots/lot-cyclorama.jpg",
  },
  {
    id: "lot_c12",
    code: "C12",
    name: "Central Garage",
    kind: "Garage",
    area: "Central Campus",
    address: "1800 NE Campus Pkwy",
    location: [47.6548, -122.3105],
    aisles: 6,
    baseOccupancy: 0.9,
    ratePerHour: 7,
    hours: "Open 24 hours",
    features: ["Near Me", "Late Hours", "EV Charging"],
    photo: "/lots/lot-lined.jpg",
  },
  {
    id: "lot_w12",
    code: "W12",
    name: "Lot W12",
    kind: "Lot",
    area: "West Campus",
    address: "1400 NE Boat St",
    location: [47.6519, -122.3132],
    aisles: 2,
    baseOccupancy: 1,
    ratePerHour: 3,
    hours: "6 AM – 9 PM",
    features: ["Low Cost"],
    photo: "/lots/lot-car.jpg",
  },
  {
    id: "lot_e03",
    code: "E03",
    name: "Lot E03",
    kind: "Lot",
    area: "East Campus",
    address: "3900 Montlake Blvd NE",
    location: [47.6552, -122.2986],
    aisles: 4,
    baseOccupancy: 0.35,
    ratePerHour: 0,
    hours: "Free after 5 PM · 24 hours",
    features: ["Free Parking", "Late Hours"],
    photo: "/lots/lot-topview.jpg",
  },
];

export const FILTERS: LotFeature[] = ["Near Me", "Low Cost", "Free Parking", "Late Hours", "Walkability", "EV Charging"];

export const PAYMENT_METHODS: Record<PaymentMethodId, { label: string; detail: string }> = {
  "apple-pay": { label: "Apple Pay", detail: "Pay with Face ID" },
  card: { label: "Visa •••• 4242", detail: "Expires 08/28" },
};

const ROLE_MULTIPLIER: Record<Role, number> = { Student: 1, Faculty: 1.2, Visitor: 1.5 };

export const getLot = (id?: string | null) => LOTS.find((l) => l.id === id);

export const findLotByQuery = (q: string) => {
  const s = q.trim().toLowerCase().replace(/[\s-]/g, "");
  if (!s) return [];
  return LOTS.filter(
    (l) =>
      l.code.toLowerCase().includes(s) ||
      l.name.toLowerCase().replace(/[\s-]/g, "").includes(s) ||
      l.area.toLowerCase().replace(/\s/g, "").includes(s) ||
      l.address.toLowerCase().replace(/\s/g, "").includes(s)
  );
};

/** "N-06" — the hyphenated form used on signage in the Figma design. */
export const signCode = (lot: ParkingLot) => `${lot.code[0]}-${lot.code.slice(1)}`;

export const priceFor = (lot: ParkingLot, hours: number, role: Role) =>
  Math.round(lot.ratePerHour * hours * ROLE_MULTIPLIER[role] * 100) / 100;

export const rateFor = (lot: ParkingLot, role: Role) =>
  Math.round(lot.ratePerHour * ROLE_MULTIPLIER[role] * 100) / 100;

export const formatMoney = (n: number) => (n === 0 ? "Free" : `$${n % 1 === 0 ? n : n.toFixed(2)}`);

// ---------- Geometry ----------

export const distanceKm = (a: LatLng, b: LatLng) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Manhattan-style route so the path reads like streets rather than a crow-fly line. */
export const buildRoute = (from: LatLng, to: LatLng): LatLng[] => {
  const midLat = from[0] + (to[0] - from[0]) * 0.55;
  return [from, [midLat, from[1]], [midLat, to[1]], to];
};

export const routeLengthKm = (route: LatLng[]) =>
  route.slice(1).reduce((sum, p, i) => sum + distanceKm(route[i], p), 0);

/** Campus driving averages ~22 km/h with stops. */
export const driveMinutes = (km: number) => Math.max(2, Math.round((km / 22) * 60 + 1));

export const trafficLightsOn = (km: number) => Math.max(1, Math.round(km / 0.45));

export const STREETS = ["NE Pacific St", "15th Ave NE", "Stevens Way NE", "Memorial Way NE", "NE 45th St", "Montlake Blvd NE"];

// ---------- Spots ----------

const rowLetter = (i: number) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i] ?? `R${i}`;

export interface Spot {
  id: string; // "C3"
  aisle: number; // 0-based
  side: "left" | "right";
  index: number; // 0–5 within row
  occupied: boolean;
}

/** Small deterministic PRNG so a lot's occupancy is stable within the same hour. */
const seeded = (seedStr: string) => {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const totalSpots = (lot: ParkingLot) => lot.aisles * STALLS_PER_AISLE;

/** Busier mid-day, quieter early and late. */
const occupancyAt = (lot: ParkingLot, when: Date) => {
  if (lot.baseOccupancy >= 1) return 1;
  const h = when.getHours() + when.getMinutes() / 60;
  const curve = h < 7 || h > 21 ? 0.45 : h < 9 || h > 18 ? 0.8 : 1;
  return Math.min(0.97, lot.baseOccupancy * curve);
};

export const spotsFor = (lot: ParkingLot, when: Date, takenByMe: string[] = []): Spot[] => {
  const rand = seeded(`${lot.id}:${when.toDateString()}:${when.getHours()}`);
  const occ = occupancyAt(lot, when);
  const spots: Spot[] = [];
  for (let a = 0; a < lot.aisles; a++) {
    (["left", "right"] as const).forEach((side, s) => {
      for (let i = 0; i < STALLS_PER_ROW; i++) {
        spots.push({
          id: `${rowLetter(a * 2 + s)}${i + 1}`,
          aisle: a,
          side,
          index: i,
          occupied: rand() < occ,
        });
      }
    });
  }
  // Always leave at least one open stall unless the lot is marked full.
  if (occ < 1 && spots.every((s) => s.occupied)) spots[Math.floor(rand() * spots.length)].occupied = false;
  takenByMe.forEach((id) => {
    const s = spots.find((x) => x.id === id);
    if (s) s.occupied = true;
  });
  return spots;
};

export const availabilityAt = (lot: ParkingLot, when: Date) => {
  const spots = spotsFor(lot, when);
  const open = spots.filter((s) => !s.occupied).length;
  return { open, total: spots.length };
};

export const statusFor = (open: number, total: number): LotStatus =>
  open === 0 ? "Full" : open / total <= 0.15 ? "Busy" : "Available";

// ---------- Time ----------

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Parse "YYYY-MM-DD" as a local date (new Date("YYYY-MM-DD") is UTC and shifts a day west of GMT). */
export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const formatDay = (d: Date | string) => {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

export const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h && m) return `${h}h ${m}m`;
  return h ? `${h}h` : `${m}m`;
};

export const splitClock = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return {
    h: Math.floor(t / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
  };
};

export const formatCountdown = (ms: number) => {
  const { h, m, s } = splitClock(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}:${pad(m)}:${pad(s)}`;
};

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

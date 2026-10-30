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

export interface SavedVehicle extends Vehicle {
  id: string;
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
  code: string; // "N22" — what drivers type and see on signs
  name: string; // "Lot N22"
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

// N01, N02, N05, N22, E1, E12, E19 and Padelford Garage are real UW lots, positioned from OpenStreetMap; the rest are fictional.
export const LOTS: ParkingLot[] = [
  {
    id: "lot_n01",
    code: "N01",
    name: "Lot N01",
    kind: "Lot",
    area: "North Campus",
    address: "NE Stevens Ln · next to the Burke Museum",
    location: [47.66052, -122.3107],
    aisles: 2,
    baseOccupancy: 0.7,
    ratePerHour: 4,
    hours: "6 AM – 10 PM",
    features: ["Walkability", "Low Cost"],
    // Photo: Lucas Hobbs on Unsplash (Unsplash License) — unsplash.com/photos/gEHSvDMHnEA
    photo: "/lots/lot-n01.jpg",
  },
  {
    id: "lot_n02",
    code: "N02",
    name: "Lot N02",
    kind: "Lot",
    area: "North Campus",
    address: "NE Clallam Pl · between Denny and Paccar Hall",
    location: [47.6589, -122.30924],
    aisles: 1,
    baseOccupancy: 0.85,
    ratePerHour: 5,
    hours: "6 AM – 10 PM",
    features: ["EV Charging", "Walkability"],
    // Photo: Raban Haaijk on Unsplash (Unsplash License) — unsplash.com/photos/wftNpcjCHT4
    photo: "/lots/lot-n02.jpg",
  },
  {
    id: "lot_n22",
    code: "N22",
    name: "Lot N22",
    kind: "Lot",
    area: "North Campus",
    address: "King Ln NE · north of the HUB",
    location: [47.65629, -122.30506],
    aisles: 3,
    baseOccupancy: 0.82,
    ratePerHour: 5,
    hours: "6 AM – 11 PM",
    features: ["Near Me", "Walkability", "EV Charging"],
    // Placeholder until there's a free photo of the real lot.
    // Photo: John Mosquera on Unsplash (Unsplash License) — unsplash.com/photos/yJPzFyWGrO0
    photo: "/lots/lot-n22.jpg",
  },
  {
    id: "lot_n05",
    code: "N05",
    name: "Lot N05",
    kind: "Lot",
    area: "North Campus",
    address: "Clallam Ln NE",
    location: [47.66039, -122.30883],
    aisles: 5,
    baseOccupancy: 0.6,
    ratePerHour: 6,
    hours: "Open 24 hours",
    features: ["Late Hours", "EV Charging"],
    photo: "/lots/lot-topview.jpg",
  },
  {
    id: "lot_e1",
    code: "E1",
    name: "Lot E1",
    kind: "Lot",
    area: "East Campus",
    address: "Walla Walla Rd NE",
    location: [47.65884, -122.29972],
    aisles: 6,
    baseOccupancy: 0.55,
    ratePerHour: 3.5,
    hours: "6 AM – 10 PM",
    features: ["Low Cost", "Late Hours"],
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
    // Photo: Aalo Lens on Unsplash (Unsplash License) — unsplash.com/photos/HfSJz23_BOM
    photo: "/lots/central-garage.jpg",
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
    id: "lot_n20",
    code: "N20",
    name: "Padelford Garage",
    kind: "Garage",
    area: "Central Campus",
    address: "4112 Mason Rd NE",
    location: [47.65714, -122.30326],
    aisles: 4,
    baseOccupancy: 0.35,
    ratePerHour: 0,
    hours: "Free after 5 PM · 24 hours",
    features: ["Free Parking", "Late Hours"],
    // Photo: Holiday Extras on Unsplash (Unsplash License) — unsplash.com/photos/uElZ2-OT83c
    photo: "/lots/padelford-garage.jpg",
  },
  {
    id: "lot_e12",
    code: "E12",
    name: "Lot E12",
    kind: "Lot",
    area: "East Campus",
    address: "Walla Walla Rd NE · by the Sports Medicine Center",
    location: [47.64858, -122.30224],
    aisles: 6,
    baseOccupancy: 0.5,
    ratePerHour: 4,
    hours: "6 AM – 11 PM",
    features: ["Low Cost"],
    // Photo: m (@brydoncreative) on Unsplash (Unsplash License) — unsplash.com/photos/vMneecAwo34
    photo: "/lots/lot-e12.jpg",
  },
  {
    id: "lot_e19",
    code: "E19",
    name: "Lot E19",
    kind: "Lot",
    area: "East Campus",
    address: "Walla Walla Rd NE · north of Lot E12",
    location: [47.64943, -122.30355],
    aisles: 2,
    baseOccupancy: 0.75,
    ratePerHour: 5,
    hours: "6 AM – 10 PM",
    features: ["Walkability"],
    // Photo: Sara Kurfeß on Unsplash (Unsplash License) — unsplash.com/photos/xCm3FGX8lb8
    photo: "/lots/lot-e19.jpg",
  },
];

export interface CampusPlace {
  id: string;
  name: string;
  kind: "Building" | "Area";
  location: LatLng;
  /** Other names people type, e.g. "CSE" for the Allen Center. */
  aliases?: string[];
}

// Approximate coordinates of UW Seattle landmarks — good enough to rank nearby lots.
export const PLACES: CampusPlace[] = [
  { id: "denny-hall", name: "Denny Hall", kind: "Building", location: [47.6584, -122.30882] },
  { id: "burke-museum", name: "Burke Museum", kind: "Building", location: [47.66052, -122.31156], aliases: ["burke", "museum"] },
  { id: "art-building", name: "Art Building", kind: "Building", location: [47.6583, -122.3063], aliases: ["art"] },
  { id: "suzzallo", name: "Suzzallo Library", kind: "Building", location: [47.6557, -122.3081], aliases: ["suzz", "library"] },
  { id: "odegaard", name: "Odegaard Library", kind: "Building", location: [47.6565, -122.3104], aliases: ["ode", "library"] },
  { id: "kane-hall", name: "Kane Hall", kind: "Building", location: [47.6567, -122.3091] },
  { id: "red-square", name: "Red Square", kind: "Building", location: [47.656, -122.3095] },
  { id: "hub", name: "Husky Union Building (HUB)", kind: "Building", location: [47.6553, -122.305], aliases: ["hub", "student union"] },
  { id: "mary-gates", name: "Mary Gates Hall", kind: "Building", location: [47.655, -122.3077], aliases: ["mgh"] },
  { id: "allen-center", name: "Paul G. Allen Center", kind: "Building", location: [47.6534, -122.3058], aliases: ["cse", "computer science"] },
  { id: "husky-stadium", name: "Husky Stadium", kind: "Building", location: [47.6503, -122.3016], aliases: ["stadium"] },
  { id: "uw-medical", name: "UW Medical Center", kind: "Building", location: [47.6498, -122.3092], aliases: ["hospital", "uwmc"] },
  { id: "north-campus", name: "North Campus", kind: "Area", location: [47.6597, -122.3058] },
  { id: "central-campus", name: "Central Campus", kind: "Area", location: [47.6556, -122.3078] },
  { id: "east-campus", name: "East Campus", kind: "Area", location: [47.6555, -122.2992] },
  { id: "west-campus", name: "West Campus", kind: "Area", location: [47.6538, -122.3148] },
  { id: "south-campus", name: "South Campus", kind: "Area", location: [47.6497, -122.3098] },
];

export const getPlace = (id?: string | null) => PLACES.find((p) => p.id === id);

const squash = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

export const findPlaces = (q: string) => {
  const s = squash(q);
  if (s.length < 2) return [];
  return PLACES.filter((p) => squash(p.name).includes(s) || p.aliases?.some((a) => squash(a).startsWith(s)));
};

/** Average walking pace, ~4.8 km/h. */
export const walkMinutes = (km: number) => Math.max(1, Math.round((km / 4.8) * 60));

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

/** Big title on a lot's photo: "LOT N-22", or the lot's own name for named garages. */
export const displayTitle = (lot: ParkingLot) =>
  (lot.name === `${lot.kind} ${lot.code}` ? `${lot.kind} ${signCode(lot)}` : lot.name).toUpperCase();

/** "N-22" — the hyphenated form used on signage in the Figma design. */
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

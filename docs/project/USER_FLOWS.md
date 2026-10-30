# AcuPark — User Flows

How each path through the app works today. Screens live under `app/src/app/`; shared state is in `app/src/lib/store.tsx`.

## Tabs

| Tab | Route | What's there |
|---|---|---|
| Home | `/` | Greeting, pay-now search, AI Quick Scan (or the auto-pay card), then the live session, the next reservation, or nearby lots |
| Map | `/map` | Lot pins with open counts, search, filters, the lots drawer, lot details |
| Settings | `/settings` | Campus status, saved vehicles, default payment, theme, parking history, Reset data |

The bottom nav only shows on these three; flow screens are full-screen.

---

## 1. Pay ahead (auto-pay on arrival)

For drivers who want parking handled before they get there.

1. **Home → AI Quick Scan → Pay ahead.**
2. Pick how long (1–4 hr) and pay with Apple Pay or the saved card → **Turn on auto-pay**. Nothing is charged yet. The browser may ask once to allow notifications.
3. Home shows an **Auto-pay is on** card (duration, payment, *lot detected automatically*) with **Test arrival**, **Scan now**, and **Turn off auto-pay**.
4. **Arrival is detected** when:
   - a navigation finishes (the destination lot, or the reserved lot and stall), or
   - **Test arrival** is tapped (demo stand-in for a geofence).
5. AcuPark picks the lot (destination/reservation, otherwise the nearest lot with room) and the first open stall, pays, and starts the session.
6. A notification slides in: **All set, parking paid!** — *Lot N22 · stall A1 · $10 until 12:08 AM.* **Review here** opens the receipt (`/success?…&review=1`), which stays open until **Done**.

## 2. I'm here — scan now

For drivers already parked and in a rush.

1. **Home → AI Quick Scan → I'm here — scan now.**
2. The camera opens; line up the plate and capture. Without a camera (desktop, or HTTP on a phone) use **Use sample photo**.
3. **Located at** (`/arrive`) shows the lot and detected stall, the photo with **Plate … matched**, and the vehicle (with **Edit Details**).
4. Choose **how long** and **Pay with**, then **Confirm Payment · $X** — one screen, no separate payment page.
5. Receipt → Home timer.

If the driver has a reservation starting within two hours, the scan opens that reservation instead (duration fixed, price already set).

## 3. Search to pay now

For drivers who'd rather type the lot number than scan.

1. **Home search** — *Not scanning? Search by lot #* — type a code (`N05`) and pick it (or press Enter).
2. **Checkout · Pay as you park** (`/pay?lot=…`): confirm **Your stall #** (pre-filled with an open stall, editable — *Printed on the ground or on lot sign*), pick **How long?**, choose payment.
3. **Confirm Payment** → receipt → Home timer.

Typing a building in the Home search (e.g. *Denny Hall*) opens the map near that building instead, since a building isn't a single lot.

## 4. Find and reserve

1. **Map**: tap a pin, or search a lot code or a building/area.
   - Searching a building drops a labelled pin, frames it with its three closest lots, and opens the drawer as **Near Denny Hall**, sorted by walking time with the closest open lot tagged **Best match**.
2. **Lot details** sheet: photo, address, hours, open count, rate, drive time, and walk (when a building was searched) or distance. Drag down to close.
3. **Reserve** (`/reserve?lot=…`):
   1. **Select spot** on the aisle layout (Entry → Exit, slanted bays; taken stalls show a car).
   2. **Date & time**: one or more dates, start time on the timeline, 1–4 hr.
   3. **Review**: *Book your car Parking*, price for the driver's status → **Start Reservation**.
4. **Confirmed Parking** (`/reservation/[id]`): *Starting in* countdown, **Take Me There**, **Cancel reservation**.

## 5. Navigate

1. **Take Me There** or **Navigate** → route preview (`/navigate`) with drive time, distance and traffic-light count → **Start**.
2. Simulated drive: turn-by-turn banner, live **spot held · N open** badge, **Skip ahead** for demos.
3. On arrival:
   - auto-pay on → **All set, parking paid!** with **Review payment**;
   - otherwise → **Scan & check in**, which opens the *I'm here* screen.

## 6. While parked

- Home shows **Time remaining** with **+30 min** (charged at the driver's rate), **Parked at** with a map thumbnail, **View on map**, and **End parking**.
- A reminder appears 10 minutes before time runs out.
- Ended sessions appear under **Settings → Parking history**.

## 7. Settings

- **Campus status** is verified and read-only. **Request to change status** asks for the new status and a reason; the request shows as *Under review* and can be withdrawn. Pricing doesn't change until approved (in the demo, requests stay pending).
- **Your saved vehicles**: add, edit, delete (with confirmation; at least one is kept), and **Use this vehicle for parking**.
- **Default payment**: the selected method is highlighted with a check; the other is dimmed.
- **Appearance**: Auto / Light / Dark.
- **Reset data** clears reservations, sessions, history and vehicles.

## Demo limits

- Payments, plate recognition and arrival detection are simulated; there is no backend.
- Lot availability is generated per hour from a seeded random, so it's stable within an hour.
- Status and all other data live in `localStorage`, so editing it by hand bypasses the status lock; real enforcement needs a server.

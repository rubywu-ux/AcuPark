# AcuPark — Portfolio Notes

A starting point for the portfolio case study. Sections marked *To fill* need your own words (research, timeline, outcomes); everything else describes the shipped app as of October 30, 2026.

## At a glance

| | |
|---|---|
| **What** | A mobile-first campus parking app for the University of Washington: find a lot, reserve a stall, get there, and pay. |
| **Live** | https://acupark-ten.vercel.app (open it on a phone; *Add to Home Screen* for full screen) |
| **Code** | https://github.com/rubywu-ux/AcuPark |
| **Design source** | Figma file `xNxxO1wX7Dclk6eTpPYOxn`, page "Central" |
| **Stack** | Next.js 14 (App Router), TypeScript, Tailwind, Leaflet + OpenStreetMap, Vercel |
| **Data** | Mock data in the browser (`localStorage`); real UW lot positions from OpenStreetMap |
| **Role** | *To fill* (e.g. product design, UX, front-end build) |
| **Timeline** | *To fill* |

## The problem

*To fill:* your framing. Starting points from how the product evolved:

- Drivers are paying at different moments: some plan ahead, some are already parked and late for class, some just want to type a lot number.
- Finding parking near a *building* (not a lot code) is what people actually think in.
- Discounted student and faculty rates invite misuse if anyone can switch their own status.

## Key main flows

Each flow is written up step by step in [USER_FLOWS.md](USER_FLOWS.md).

### 0. Launch
Every open starts on a UW-purple splash: a sticker-style **Dubs** springs in, barks once, and a slanted **"Go Dawgs!"** pops out. Then the AcuPark logo rises in and the app fades up after about 3.4 s.
*Screenshot:* `app/public/screenshots/splash.png` · *Replay:* `/preview/splash` (with loop and slow motion)

### 1. Pay ahead: auto-pay on arrival
**Home → AI Quick Scan → Pay ahead** → pick a duration and card → **Turn on auto-pay**.
On arrival, detected when navigation finishes or by *Test arrival* in the demo, AcuPark picks the lot and stall, pays, and sends **"All set, parking paid!"** with *Review here*.
*For:* planners who want parking handled before they arrive.

### 2. I'm here: scan now
**Home → AI Quick Scan → I'm here** → snap the plate (or *Use sample photo*). The lot, stall and vehicle are detected → choose how long → **Confirm Payment**, all on one screen.
*For:* drivers already parked and in a rush.
*Screenshot:* `scan.png`

### 3. Search to pay now
Home search, *"Not scanning? Search by lot #"* → **Checkout · Pay as you park**: confirm the stall, pick a duration and payment → **Confirm Payment**.
*For:* drivers who'd rather type than scan.
*Screenshot:* `payment.png`

### 4. Find near a building → reserve → navigate
**Map**: search a building (e.g. *Denny Hall*). The map frames its closest lots, and the drawer lists them by walking time, with the closest open lot tagged **Best match** → **Lot details** → **Reserve**: pick a stall on the aisle layout, then a date, time and duration → **Confirmed Parking** with a countdown → **Take Me There**, a simulated turn-by-turn drive with a live open-spots badge.
*Screenshots:* `map.png`, `reservation.png`, `navigation.png`

### 5. While parked
Home shows a live timer with **+30 min**, a 10-minute reminder, **End parking**, and parking history in Settings.
*Screenshot:* `home.png` (the idle state; start a session to see the timer)

### 6. Verified status and vehicles (Settings)
Campus status (Student / Faculty / Visitor) is **read-only**. Changes go through **Request to change status** with a reason, and pricing doesn't change until the request is approved. Settings also holds multiple saved vehicles (one is *In use*), the default payment, Auto / Light / Dark theme, and **Reset data**.

## Design decisions and iterations

- **Three pay paths instead of one**: each matches a different moment (planning, rushing, typing). Search goes straight to checkout, while scan and auto-pay handle detection.
- **Locked campus status**: status sits as a verified label above the name, and changes go through a request, to prevent rate abuse.
- **Search by building**: people think "near Denny Hall", not "N22". Building search ranks nearby lots by walking time.
- **Selection clarity**: chosen options (payment, duration) are highlighted with a check, and the others dim, so the hierarchy is obvious.
- **Map gets the screen**: the header shrank (the city moved into the search field), the lots drawer rests as a one-line bar with ⟲ / ♥ counts, the nav went from 72 to 60px, and the headers are square.
- **Brand moment**: a refreshed AcuPark mark (a rounded triangle with a centered parking "P") and an original Dubs mascot drawn as a matte retro sticker, in the app's ink and UW purple with a mustard bandana. Dubs was iterated many times (eyes, legs, haunches, fur) to match the reference proportions.
- **Real places**: UW lots N01, N02, N05, N22, E1, E12, E19 and Padelford Garage sit at their real OpenStreetMap positions, with free Unsplash photos and no credit overlays.

## Technical highlights

- **Splash performance on iPhone**: Dubs's sticker look first came from a live SVG filter, which Safari redraws on the CPU every frame. It was rebuilt from plain shapes (shadow, border and grain layers that move with each body part). Measured in WebKit at iPhone size, it went from about **31 fps with 40+ dropped frames to 60 fps with none**.
- **iOS 26 Safari fixes**: Safari 26 ignores `theme-color`, so the page background behind the status bar now matches the header purple. The floating toolbar also broke `100dvh`/`env()` math, so the nav publishes its measured height (`--nav-total`) and the map sizes itself from that.
- **One client store**: all state (reservations, sessions, vehicles, auto-pay, status requests) lives in `app/src/lib/store.tsx` on `localStorage`, with migrations for renamed lots. The shape is ready for a later Supabase swap.
- **Ship by merging**: Vercel deploys `main` automatically, and each PR gets a preview build plus a *Build and Lint* check.

## Assets for the case study

| Asset | Where |
|---|---|
| Screenshots (dark mode, 390×844 @2x) | `app/public/screenshots/`: `splash`, `home`, `scan`, `reservation`, `map`, `navigation`, `payment` |
| Splash animation, replayable and slow-mo | https://acupark-ten.vercel.app/preview/splash |
| Mascot and logo source (SVG in code) | `app/src/components/DubsBark.tsx`, `app/src/components/Logo.tsx` |
| Figma designs | Figma file `xNxxO1wX7Dclk6eTpPYOxn`, page "Central" |
| Full flow write-up | [USER_FLOWS.md](USER_FLOWS.md) |
| Photo and mascot credits | [../CREDITS.md](../CREDITS.md) |

## Demo limits (worth stating in the case study)

Payments, plate recognition and arrival detection are simulated. There's no backend, data lives in each browser, and lot availability is generated, so it's stable within an hour. Dubs is an original drawing of UW's mascot for a student project. The app isn't affiliated with or endorsed by UW.

## Outcomes and reflection

*To fill:* what you learned, what you'd test with real drivers, and next steps (e.g. a real backend, payments, campus geofencing).

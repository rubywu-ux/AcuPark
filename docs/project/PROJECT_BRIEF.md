# AcuPark - Project Brief & Prompt

## 1. The "Elevator Pitch"
**What is AcuPark?**
> AcuPark is a stress-free campus parking mobile web app that caters to students, faculty, and visitors. It features an AI Quick Scan for automatic vehicle and location detection, real-time lot availability maps with filtering, and a reservation system to secure spots in advance. The goal is to make campus parking hassle-free with seamless navigation and "pay upon arrival" functionality.

## 2. Core Features
**What can users do?**
- [x] **AI Quick Scan:** Automatically detect vehicle details, registration status, and location via camera.
- [x] **Real-time Map:** View lot availability, filter by preferences (Near Me, Late Hours, etc.), and save favorite locations.
- [x] **Reservations:** Secure a spot for specific dates/times with a countdown timer.
- [x] **Smart Navigation:** Route preview with "Anxiety Reducer" (live lot occupancy updates en route) and traffic light counters.
- [x] **Hassle-Free Payment:** Pay upon arrival using **Apple Pay** or **Saved Credit Card** (UI only).
- [x] **User Profiles:** Manage vehicle details and campus status (Student/Faculty/Visitor).

## 3. The Tech Stack (Preferences)
**Frontend:**
- [x] Next.js (App Router) - Optimized for Mobile Web / PWA
- [ ] React Native (Mobile)
- [ ] Flutter

**Backend:**
- [x] Mock Data Service (Architected for easy switch to Supabase later)
- [ ] Node.js / Express
- [ ] Python / FastAPI

**Maps:**
- [ ] Google Maps JS API (with mock markers) — *replaced by Leaflet + OpenStreetMap, no API key needed*
- [x] Leaflet + OpenStreetMap tiles, with real UW lot positions

## 4. Design & Style
**What should it look like?**
> Mobile-first portrait design. Clean, stress-free aesthetic. Auto-switching Light/Dark mode. Focus on high usability for drivers (large buttons, clear status indicators).

## 5. The "Golden Prompt"
*Once you fill out the above, we will generate a master prompt below that you can use to bootstrap the entire project.*


## 6. Current status (October 2026)

Everything in section 2 is built and working end to end with mock data. Since the brief, the app has also gained:

- **Three ways to pay**: *Pay ahead* (auto-pay on arrival with an "All set, parking paid!" notification), *I'm here* (scan, choose duration, pay on one screen), and *search to pay now* by lot number.
- **Campus building search** that lists nearby lots by walking time with a *Best match*.
- **Real UW lots** (N01, N02, N05, N22, E1, E12, E19, Padelford Garage) at their OpenStreetMap positions.
- **Verified campus status** that can only change through a reviewed request.
- **Multiple saved vehicles**, a draggable lots drawer, drag-to-dismiss lot cards, and Auto / Light / Dark themes.
- **A branded launch screen**: on UW purple, a sticker-style Dubs barks "Go Dawgs!" above the refreshed AcuPark logo, on every open. It runs at 60 fps in mobile Safari.
- **Live on Vercel** at https://acupark-ten.vercel.app, with auto-deploys from `main` and tuned for phones: purple status bar, compact map header, slim lots drawer and a shorter nav.

See [USER_FLOWS.md](USER_FLOWS.md) for the flows step by step.

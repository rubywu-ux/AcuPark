# AcuPark - Master Prompt

You are an expert Senior Frontend Engineer and UX Designer. Your task is to build "AcuPark," a mobile-first web application for campus parking management.

## 1. Project Overview
**Name:** AcuPark
**Type:** Mobile Web App (PWA capable) - **Optimized for Mobile Portrait Mode**
**Stack:** Next.js (App Router), React, Tailwind CSS.
**Data Strategy:** Use a **Mock Service Layer** for all data (Users, Lots, Reservations) to simulate a backend. Structure interfaces to easily swap in Supabase later.
**Maps:** Google Maps JS API.
**Vibe:** Stress-free, accessible, smart, and reassuring.

## 2. Core Features & Requirements

### A. Authentication & User Profile
- **Mock Auth:** Simulate login for Student/Faculty/Visitor roles.
- **Profile:** Store vehicle details (License Plate, Make, Model) and User Status.
- **Payment:** **UI-Only** implementation. Provide two options: **Apple Pay** and **Saved/Preferred Payment Method** (Credit Card). No real processing.

### B. Home Screen ("MainPage")
- **AI Quick Scan:**
    - Use the device camera (via HTML5 Media Capture or `react-webcam`).
    - **Mock AI Logic:** When a photo is taken, simulate a 2-second "Scanning..." state, then return the user's stored vehicle info and current location.
- **Active Parking:**
    - Display a countdown timer if a session is active.
    - "Extend +30min" button.
- **Navigation Bar:** Bottom fixed bar with Icons: Home (P), Map, Profile.

### C. Map & Discovery
- **Google Maps Integration:**
    - Show user location ("Seattle, WA").
    - Display **Mock Markers** for Parking Lots.
    - **Markers:** Color-coded by availability (Green > 50%, Yellow < 10%, Red = Full).
- **Filtering:**
    - Horizontal scrollable chips: "Near Me", "Distance to Destination", "Walkability", "Late Hours", "Free Parking", "Low Cost".
- **Lot Details:**
    - Clicking a marker opens a drawer/modal.
    - Actions: "Start Navigation" or "Make Reservation".

### D. Reservation Flow
1.  **Spot Selection:** Visual grid representing a lot (e.g., Lot N06). User clicks a cell (Spot C3).
2.  **Time Setup:** Calendar picker + Time Range slider (Start/End). Toggle for AM/PM.
3.  **Confirmation:** Summary card with Map Preview, Price ($10), and "Start Reservation" button.
4.  **Countdown:** "Starting in: 1:30:56".
5.  **Action:** "Take me there" button triggers Navigation Mode.

### E. Navigation Mode (The "Vibe" Feature)
- **Route Info:** Show distance (16km) and time (6 min).
- **Stop Light Counter:** Mock data showing "2 traffic lights en route".
- **Live Anxiety Reducer:** A prominent badge showing real-time lot availability decrementing (simulate this: "6 Available" -> "5 Available" every few seconds).
- **Arrival:** Upon arrival, trigger "Quick AI Scan" flow to confirm spot and process "Payment".

## 3. Technical Implementation Steps

### Step 1: Setup & Infrastructure
- Initialize Next.js project with Tailwind CSS.
- Create `src/services/mockData.ts` to handle all data fetching (Lots, User, Reservations).
- Define TypeScript interfaces that mirror a future Supabase schema.

### Step 2: Components & UI (Figma-to-Code)
- **Figma Integration:**
    - **File Key:** `xNxxO1wX7Dclk6eTpPYOxn`
    - **Link:** [Figma Design File](https://www.figma.com/design/xNxxO1wX7Dclk6eTpPYOxn/Parking-App?node-id=261-1981&t=Ld5a43VYPAc5drt6-1)
    - Use Figma MCP to inspect designs.
- Create reusable components: `BottomNav`, `MapMarker`, `FilterChip`, `ReservationCard`.
- **Mobile First:** Ensure all touch targets are min 44px. Use responsive classes to ensure layout looks perfect on mobile portrait.

### Step 3: Feature Logic
- **Camera:** Implement `react-webcam` for the "Scan" feature.
- **Maps:** Integrate `@react-google-maps/api` with custom markers.
- **State:** Use React Context or Zustand to manage the "Active Reservation" and "Navigation State" across pages.

## 4. Design System (Tailwind)
- **Colors:**
    - Primary: Deep Campus Blue (e.g., `bg-blue-600`)
    - Status Green: `text-green-500` (Available)
    - Status Red: `text-red-500` (Full/Busy)
- **Typography:** Sans-serif, large readable headings for drivers.
- **Theme:** Auto-detect system preference (Light/Dark).

## 5. Getting Started
Please start by setting up the **Next.js project structure** and creating the **Mock Data Service** (`src/services/mockData.ts`) with realistic seed data for Lots and Users.

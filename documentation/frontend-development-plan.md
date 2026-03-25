# Frontend Development Plan — Ultra Rider Web App

**Version**: 1.0  
**Date**: March 25, 2026  
**Status**: Planning Phase  
**Target Audience**: Development team, project leads

---

## Executive Summary

This document outlines the complete frontend development roadmap for the Ultra rider-facing web application. The MVP targets core flows: rider authentication, ride booking & tracking, and pricing discovery (Ride Pass subscriptions and fare splitting).

**Tech Stack**: React 18 + TypeScript + Vite  
**Platform**: Web browsers (responsive: 375px mobile to 1920px desktop)  
**Timeline**: 7 phases, estimated 6-8 weeks for full MVP  
**Backend Integration**: Abstracted service layer for seamless mock ↔ real API swapping

---

## Part 1: Architecture & Technical Decisions

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React 18 + TypeScript | Modern, type-safe, large ecosystem |
| Build Tool | Vite | Fast HMR, optimized bundle sizes |
| State Management | Context API + hooks | Lightweight for MVP; can upgrade to Redux if needed |
| Maps Library | Leaflet + react-leaflet | Open-source, lightweight, no API key required |
| Maps Tiles | OpenStreetMap | Community-maintained, free, global coverage |
| Payments | Stripe Checkout (hosted form) | PCI-DSS compliant, mobile-friendly, no frontend card data handling |
| Forms | React Hook Form + Zod | Lightweight validation, excellent DX |
| Testing | Jest + React Testing Library | Standard React testing approach |
| Styling | CSS variables + modern CSS | No external component library for MVP |

---

### Design Decisions & Rationale

#### **Decision 1: Maps Integration — OpenStreetMap + Leaflet**

**Choice**: OpenStreetMap with Leaflet JS library wrapped in React via `react-leaflet`

**Why**:
- Open-source and free (no API key required, no rate limits)
- Lightweight (~40KB gzipped) compared to Google Maps (~200KB)
- Excellent React support via `react-leaflet`
- Sufficient features for MVP: markers, polylines, routing via Leaflet Routing Machine

**Implementation**:
```
Frontend Uses:
- MapContainer component with Leaflet TileLayer (OSM)
- Markers for rider pickup/dropoff locations
- Polyline (route) rendered from backend distance/routing response
- Click handlers for location selection

Backend Provides:
- Distance calculations (from Maps/Routing API)
- Estimated ETA based on distance
- Route geometry (for polyline rendering in frontend)
```

**Dependencies**:
```json
{
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.x",
  "leaflet-routing-machine": "^3.x"
}
```

**Assumption**: Backend will provide route geometry in GeoJSON format or as array of [lat, lng] coordinates for efficient frontend rendering.

---

#### **Decision 2: Payment Processing — Stripe Checkout (Hosted Form)**

**Choice**: Stripe Checkout with hosted form redirect pattern

**Why**:
- **Zero PCI liability** for frontend (card data stays on Stripe domain)
- **Mobile-friendly** hosted form (Stripe optimizes for all devices)
- **Strong authentication** (3D Secure, fraud detection handled by Stripe)
- **Compliance**: Backend handles all PCI DSS requirements

**User Flow**:
```
1. User clicks "Subscribe" or "Confirm Payment"
2. Frontend calls POST /api/payment/create-session
   - Backend creates Stripe CheckoutSession with amount, success_url, cancel_url
3. Backend returns { stripe_url: "https://checkout.stripe.com/..." }
4. Frontend redirects to Stripe-hosted form
5. User enters card details on Stripe domain (secure)
6. On success, Stripe redirects to /payment/success?session_id={id}
7. Frontend calls GET /api/payment/verify?session_id={id}
8. Backend confirms payment.status = "succeeded"
9. Frontend completes subscription/ride booking locally
```

**Frontend Component**:
```typescript
// src/pages/PaymentSuccessPage.tsx
- Extract session_id from URL params
- Call paymentService.verifySession(sessionId)
- Show success message with subscription confirmation
- Redirect to home after 3 seconds

// src/pages/PaymentCancelPage.tsx
- Show cancellation message
- "Retry" button redirects back to booking
```

**Assumptions**:
- Backend provides `POST /api/payment/create-session` endpoint
- Stripe environment variables configured in backend
- Webhook handlers set up for payment_intent.succeeded events (backend responsibility)

---

#### **Decision 3: Real-Time Updates — Mocked with Abstraction Layer**

**Choice**: Mock real-time features with hardcoded delays in MVP; abstract via service interface for WebSocket swap later

**Mocked Features**:
- Driver acceptance (auto-accept after 2-3 second delay)
- Ride status progression (Matching → Accepted → In Transit → Complete, each 10 sec)
- Co-rider acceptance (auto-accept after 2 seconds)
- Location updates (mock driver movement hardcoded every 5 sec)

**Service Layer Abstraction**:
```typescript
// src/services/rideService.ts (shared interface)
export interface RideServiceInterface {
  createRide(pickup: Location, dropoff: Location): Promise<Ride>
  subscribeToUpdates(rideId: string, callback: (ride: Ride) => void): Unsubscribe
  cancelRide(rideId: string): Promise<void>
}

// src/mocks/mockRideService.ts (MVP: uses setTimeout)
class MockRideService implements RideServiceInterface {
  subscribeToUpdates(rideId: string, callback: (ride: Ride) => void) {
    let currentStatus = 'matching'
    const interval = setInterval(() => {
      currentStatus = nextStatus(currentStatus)
      callback({ ...ride, status: currentStatus })
    }, 10000)
    return () => clearInterval(interval)
  }
}

// src/services/rideService.ts (future: uses WebSocket)
class RealRideService implements RideServiceInterface {
  subscribeToUpdates(rideId: string, callback: (ride: Ride) => void) {
    const ws = new WebSocket(`wss://api.ultra.com/rides/${rideId}`)
    ws.onmessage = (e) => callback(JSON.parse(e.data))
    return () => ws.close()
  }
}
```

**Benefit**: UI code never changes when swapping mocks for real APIs.

---

#### **Decision 4: Session Management — JWT + localStorage with Refresh Tokens**

**Token Storage**:
```typescript
// On successful login
localStorage.setItem('accessToken', jwt)
localStorage.setItem('refreshToken', refreshToken)
localStorage.setItem('expiresAt', expiresAtTimestamp)
```

**Token Refresh Strategy**:
```typescript
// src/hooks/useAuth.ts
useEffect(() => {
  if (isTokenExpired()) {
    authService.refreshToken().then(newToken => {
      localStorage.setItem('accessToken', newToken)
    })
  }
}, [isTokenExpired()])
```

**Assumption**: Backend provides `POST /api/auth/refresh` endpoint that accepts refreshToken and returns new accessToken.

**Security Note**: This is MVP-level. Production should upgrade to secure HttpOnly cookies set by backend.

---

#### **Decision 5: Error Handling — Assume Happy Path for MVP**

**Approach**: 
- All mock services succeed
- No network error simulation
- Add error boundaries for React errors
- Log all API errors to console

**Will Be Added in Phase 2+**:
- Retry logic for failed requests
- Error modals for server errors (500, 503)
- Validation error display (form-level)
- Network connectivity detection (navigator.onLine)

---

#### **Decision 6: Notifications — In-App Toasts Only**

**Approach**:
- No push notifications in MVP (browser Notification API not enabled)
- Toast notifications (top-right corner, auto-dismiss after 5 sec)
- Service layer abstraction for future Firebase Cloud Messaging integration

**Implementation**:
```typescript
// src/context/NotificationContext.tsx
export interface Notification { id: string; message: string; type: 'success' | 'error' | 'info' }

// Usage in components
const { addNotification } = useNotification()
addNotification({ message: 'Ride confirmed!', type: 'success' })
```

---

### API Contracts

All backend endpoints implement standard REST patterns with JSON request/response bodies.

#### **New Endpoints for Rider Web Frontend**

**Payment API** (not in original architecture; added for Stripe integration):
```
POST /api/payment/create-session
  Request: { subscription_id?, ride_id?, amount: number, currency: "USD" }
  Response: { checkout_url: string (Stripe), session_id: string }
  
GET /api/payment/verify
  Query: ?session_id={stripe_session_id}
  Response: { status: "succeeded" | "failed", payment_id: string }
```

**Updated Endpoints**:
```
GET /api/rider/analytics
  Response: {
    avgWeeklySpend: number,
    topRoute: { from: string, to: string, distance_mi: number, count: int },
    frequencyByDay: { 'Mon': int, 'Tue': int, ... },
    totalRideHours: number
  }
  Purpose: Supports US05 Panel 2 (spending comparison)
```

---

## Part 2: Implementation Roadmap (7 Phases)

### Phase 1: Foundation & Setup *(Prerequisite)*

**Objective**: Establish project scaffolding, TypeScript types, and development environment.

**1A. Project Initialization**
- `npm create vite@latest ultra-web -- --template react-ts`
- Install dependencies:
  - React 18, React Router DOM (v6+)
  - TypeScript, ESLint, Prettier
  - Jest, React Testing Library, Vitest
  - react-leaflet, leaflet (maps)
  - react-hook-form, zod (forms)
  - axios (HTTP client)
- Create folder structure:
  ```
  src/
    components/          — Reusable UI components
    pages/               — Route pages (Login, Home, RidePass, etc.)
    services/            — API clients (auth, rides, pricing, payment)
    mocks/               — Mock service implementations
    context/             — Global state (AuthContext, RideContext, NotificationContext)
    hooks/               — Custom hooks (useAuth, useRide, useForm)
    types/               — TypeScript interfaces
    config.ts            — App configuration & constants
    App.tsx              — Root router and layout
    main.tsx             — Entry point
  public/
    index.html
  .env.example           — Template for environment variables
  vite.config.ts
  tsconfig.json
  vitest.config.ts
  ```

**1B. Type Definitions & API Contracts**
- Create TypeScript interfaces for all data models:
  ```typescript
  // src/types/index.ts
  export interface User { id: string; email: string; phone: string; name: string }
  export interface Ride { id: string; rider_id: string; driver_id?: string; pickup: Location; dropoff: Location; status: RideStatus; estimated_fare: number; actual_fare?: number; created_at: string; accepted_at?: string; completed_at?: string }
  export interface RidePass { id: string; rider_id: string; type: "weekly" | "monthly"; rides_included: number; price: number; purchase_date: string; renews_on: string; used_rides: number }
  export interface Location { lat: number; lng: number; address: string }
  ```
- Document API request/response contracts (OpenAPI YAML or JSON schema)

**1C. Configuration & Environment**
- Create `.env.example`:
  ```
  VITE_API_BASE_URL=http://localhost:3000/api
  VITE_USE_MOCKS=true
  VITE_STRIPE_PUBLIC_KEY=pk_test_...
  VITE_MAP_ATTRIBUTION=...
  ```
- Create `src/config.ts` with environment-based service selection

**Deliverable**: Runnable dev environment (`npm run dev`), zero TypeScript errors

---

### Phase 2: Authentication & Navigation *(~1 week)*

**Objective**: Implement login/register flows with session persistence.

**2A. Auth Service Layer**
- `AuthService` interface with methods:
  ```typescript
  register(email: string, password: string, name: string): Promise<{ token: string, user: User }>
  login(email: string, password: string): Promise<{ token: string, user: User }>
  logout(): Promise<void>
  getCurrentUser(): Promise<User> // calls GET /api/auth/me
  refreshToken(): Promise<string>
  ```
- `MockAuthService` implementation returning hardcoded users + JWT tokens
- Token storage + refresh logic in `useAuth()` hook

**2B. Login/Register Pages**
- `LoginPage.tsx`: Email/password form, "Forgot Password" link, error display
- `RegisterPage.tsx`: Email, password, confirm password, name, terms checkbox
- Form validation: email regex, password strength (8+, uppercase, number), required fields
- Links between pages (Login ↔ Register)
- Auto-redirect to home on successful login

**2C. Route Protection**
- `PrivateRoute` wrapper component
- Redirect unauthenticated users to `/login`
- Check token validity on app load via `useEffect`
- Graceful logout if token expired

**Deliverable**: Complete auth flow, persistent sessions, protected routes

---

### Phase 3: Core Rider Flows — Home & Basic Booking *(~1.5 weeks)*

**Objective**: Implement ride booking core loop (request → tracking → complete).

**3A. Home Screen**
- Map display (Leaflet MapContainer with OSM tiles)
- "Where to?" search input with autocomplete (mock: hardcoded locations)
- Ride type selector (single option for MVP: "UberX equivalent")
- Estimated fare input field (calls `GET /api/pricing/estimate` with mocked return)
- Saved locations shortcuts: "Home" and "Office" (mocked)
- **Discover Ride Pass** banner (links to Phase 4B)
- User profile icon in top-right (logout, account settings stubs)

**3B. Booking Request Flow**
- User taps destination field → location picker modal
- Map updates to show route (backend provides route geometry)
- Display estimate: `GET /api/pricing/estimate` returns `{ fare: 18.50, duration_min: 12, distance_mi: 3.2 }`
- "Confirm & Request" button → `POST /api/rides` with pickup/dropoff
- On success, transition to trip tracking screen (3C)
- **Mock**: Hardcoded driver assignment: { name: "John", rating: 4.8, vehicle: "Toyota Prius", license_plate: "ABC123" }

**3C. Trip Tracking Screen**
- Display current ride status badge (Matching → Accepted → In Transit → Completed)
- Driver card: photo, name, rating, vehicle details, ETA countdown
- Map showing: current ride location (mock), driver position (mock), route to destination
- Cancel button (disabled after driver accepts)
- Mock state progression:
  - Status: "Matching" (3 sec) → "Accepted" (auto-accept) → "In Transit" (10 sec) → "Complete"
  - ETA countdown: 12 → 11 → 10 ... → 0
  - Driver position animation (mock: hardcoded steps along route)

**Deliverable**: End-to-end booking, realistic status transitions, responsive maps

---

### Phase 4: Pricing & Subscription Features *(~1.5 weeks)*

**Objective**: Implement Ride Pass marketplace and fare splitting (US05 & US06 from storyboard).

**4A. Ride Pass Discovery** (US05 Panels 1-2)
- Banner on home screen: "Ride Pass — Save up to 25%"
- `RidePassMarketplacePages.tsx`:
  - Call `GET /api/pricing/packages` (mock returns: 5-ride/$75, 10-ride/$140, 20-ride/$250)
  - Display plan cards with:
    - Number of rides included
    - Weekly/monthly price
    - Per-ride breakdown
    - "BEST" badge on recommended plan
  - Spending comparison chart (mock: "Your avg: $100/week" vs. "With pass: $75/week")
  - "Select Plan" button per card

**4B. Subscribe Flow** (US05 Panels 3-4)
- Review page: Route, pricing tier, cancellation policy, renewal date
- Payment method selector (pre-filled with default, mock: "Visa ···· 4821")
- `POST /api/payment/create-session` with subscription details
- Redirect to Stripe hosted form
- On return from Stripe (`/payment/success?session_id=xxx`):
  - Verify session via `GET /api/payment/verify?session_id={id}`
  - Show confirmation: "Subscription Active" badge, renewal date, savings tracker
  - Redirect to home after 3 sec or user clicks "Start Booking"

**4C. Fare Splitting** (US06 simplified)
- "Split Fare" button on booking screen (alternative to standard ride)
- Co-rider selection modal:
  - Search/filter contacts
  - Mock contact list: hard-coded 3-4 people (all registered Ultra users)
  - Show contact name, profile pic, "nearby?" indicator
- Fare breakdown card: Original fare → split ÷ 2
- "Send Invite" button → mock `POST /api/split-fare-invite`
- Co-rider acceptance (mock: auto-accept after 2 sec delay)
- Confirmation screen: Both rider profiles, shared route, per-person cost locked in
- **Assumption**: All contacts already registered with Ultra (no invite-friend flow yet)

**Deliverable**: Full Ride Pass flow, Stripe integration redirect, simplified fare split

---

### Phase 5: Mock Services & Abstraction *(~1 week)*

**Objective**: Finalize service layer, enable real/mock toggle.

**5A. Complete Mock Services**
- `MockAuthService` — login, register, logout, refresh
- `MockRideService` — create ride, get ride, status updates (mocked state machine)
- `MockPricingService` — estimate, packages, subscribe
- `MockPaymentService` — create session (mock Stripe URL), verify session (mock success)
- `MockNotificationService` — toast notifications
- All services implement identically-named `Interface` classes
- Simulate network delay: 200–500ms random setTimeout

**5B. Service Factory & Toggle**
- `src/services/index.ts`:
  ```typescript
  const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
  export const authService = USE_MOCKS ? new MockAuthService() : new AuthService(apiBaseUrl)
  ```
- Environment variable: `VITE_USE_MOCKS=true` (dev default)
- Zero UI code awareness of mock vs. real distinction

**Deliverable**: Swappable service layer, mocks complete, easy backend integration

---

### Phase 6: UI/Styling & Responsive Design *(~1.5 weeks)*

**Objective**: Polish UI, ensure mobile/desktop responsiveness, accessibility baseline.

**6A. Design System**
- CSS variables in `src/styles/variables.css`:
  ```css
  --color-primary: #0066cc
  --color-success: #28a745
  --color-error: #dc3545
  --color-text: #333
  --color-bg: #fff
  --spacing-xs: 4px
  --spacing-sm: 8px
  --spacing-md: 16px
  --spacing-lg: 24px
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
  ```
- Reusable component set: `Button`, `Card`, `Modal`, `Input`, `Badge`, `Toast`, `Spinner`
- Focus states, hover states, disabled states for all interactive elements

**6B. Responsive Layouts**
- Mobile-first approach (375px baseline)
- Breakpoints: `sm: 576px, md: 768px, lg: 992px, xl: 1200px`
- Navigation:
  - Mobile: Bottom tab nav (Home, Passes, Account)
  - Desktop: Left sidebar nav (persistent)
- Booking form:
  - Mobile: Stacked inputs
  - Desktop: Side-by-side location fields
- Ride tracking:
  - Mobile: Map 60/40 with card below
  - Desktop: Map 70/30 with card sidebar

**6C. Accessibility (WCAG 2.1 AA)**
- Semantic HTML: `<button>`, not `<div class="button">`
- Form labels: `<label htmlFor="email">` linked to inputs
- ARIA attributes on custom components: `aria-label`, `aria-describedby`, `role`
- Keyboard navigation:
  - Tab order follows visual flow
  - Modals trap focus (Escape closes)
  - Form submission on Enter
- Color contrast: Text 4.5:1, UI elements 3:1 (verified via WCAG AA checker)
- Images: `alt` text on all maps/avatars

**Deliverable**: Polished, responsive, accessible UI on all screen sizes

---

### Phase 7: Testing & Documentation *(~1 week)*

**Objective**: Comprehensive test coverage, developer onboarding docs.

**7A. Unit Tests** (`vitest` + `@testing-library/react`)
- **Services**:
  - `authService.test.ts`: login success/failure, token refresh, logout
  - `rideService.test.ts`: create ride, status progression, cancellation
  - `pricingService.test.ts`: estimate calculation, package selection
- **Utilities**:
  - `utils/validation.test.ts`: email/password/phone validation
  - `utils/locationUtils.test.ts`: distance calculation, coordinate parsing
- **Target Coverage**: 70% (services + utils; skip snapshots)

**7B. Component Tests**
- `pages/LoginPage.test.tsx`: Form submission, error display, navigation
- `pages/BookingForm.test.tsx`: Location selection, estimate display, submit
- `components/RideStatusCard.test.tsx`: Status transitions, cancellation
- **Test Patterns**: User interactions (click, type), assertions on screen output

**7C. Documentation** (Markdown in `/documentation/`)
1. **API Contracts** (`api-contracts.md`)
   - All endpoints with request/response examples
   - Error codes and status meanings
   - Auth header format (Bearer token)

2. **Developer Setup Guide** (`frontend-setup.md`)
   - Clone repo, install dependencies, env variables
   - `npm run dev` (Vite dev server)
   - `npm run test` (vitest watch mode)
   - `npm run build` (production build)

3. **Project Architecture** (`frontend-architecture.md`)
   - Service layer design
   - Context structure (AuthContext, RideContext, NotificationContext)
   - Key component hierarchy
   - How to integrate real backend API

4. **Component Documentation** (JSDoc comments)
   - Props documentation on all components
   - Usage examples for complex components

5. **Environment Configuration** (`.env.example`)
   - All required variables
   - Local development defaults

**Deliverable**: 70% test coverage, comprehensive onboarding documentation

---

## Part 3: MVP Scope & Assumptions

### Features INCLUDED

- ✅ Rider registration & login (email/password)
- ✅ Session persistence (token storage + refresh)
- ✅ Home screen with location input
- ✅ Ride fare estimation and booking
- ✅ Live ride tracking with status updates
- ✅ Ride Pass subscription browsing and checkout (Stripe redirect)
- ✅ Fare splitting (invite + mock co-rider acceptance)
- ✅ Toast notifications (in-app only)
- ✅ Responsive design (mobile 375px–desktop 1920px)
- ✅ Accessibility baseline (WCAG AA)
- ✅ Mock service layer for rapid iteration

### Features DELIBERATELY EXCLUDED

- ❌ Driver app (separate application)
- ❌ Admin portal (separate application)
- ❌ Real-time WebSocket updates (mocked with delays)
- ❌ Push/browser notifications
- ❌ Ride cancellation after driver accepts
- ❌ Change payment method during booking
- ❌ Driver ratings & reviews
- ❌ Safety features (PIN verification, trip sharing)
- ❌ Email verification
- ❌ Multi-language support
- ❌ Offline capability
- ❌ Advanced search (filtering by driver, vehicle type, etc.)
- ❌ Promo codes

### Assumptions

1. **Users have valid payment methods on file** — No new card entry during booking (handled during registration).
2. **Ride history data exists** — `GET /api/rider/analytics` returns pre-computed spending stats.
3. **All co-riders already registered** — Contact list is other Ultra users (no invite-friend workflow).
4. **Zero network failures** — All mock API calls succeed; no retry logic yet.
5. **Single ride type** — Standard UberX equivalent only; no UberXL, Uber Eats, etc.
6. **US geography only** — Location formats, currencies, phone numbers assume US.
7. **No background geolocation** — Browser-based location sharing (requires permission on each ride).

---

## Part 4: Success Criteria & Verification

### MVP Acceptance Criteria

| Criteria | Verification Method |
|----------|-------------------|
| User can register with email/password | Manual test: Register flow → check localStorage for token |
| User stays logged in after browser refresh | Manual test: Login → refresh page → still authenticated |
| Can request a ride with destination | Manual test: Home → enter destination → confirm → ride created |
| Ride status updates in real-time (mocked) | Manual test: Watch status progress Matching → Accepted → In Transit → Complete |
| Ride fare estimate displays before booking | Manual test: Home → enter destination → estimate shown |
| Can subscribe to Ride Pass | Manual test: Browse passes → Select → Confirm → Redirected to Stripe → Return → Subscription confirmed |
| Can initiate fare split with co-rider | Manual test: Booking → Split Fare → Invite co-rider → See breakdown → Mock acceptance |
| Responsive on mobile (375px) | DevTools: Set viewport to 375px → all UI readable, buttons tappable |
| Responsive on desktop (1920px) | DevTools: Set viewport to 1920px → layout adapts, no horizontal scroll |
| No TypeScript errors | CI: `tsc --noEmit` passes, no warnings |
| No React errors in console | Manual: Open DevTools → zero errors/warnings on all pages |
| Keyboard navigation works | Manual: Tab through form fields, Escape closes modals, Enter submits forms |
| Color contrast passes WCAG AA | Automated: axe DevTools or similar WCAG checker |

### Testing Targets

- **Unit test coverage**: 70% (services + utilities)
- **Component tests**: At least 3 user flows from home → completion
- **Manual regression checklist**: 10-point checklist covering all Phase 3-4 features

---

## Part 5: Development Timeline & Milestones

| Phase | Duration | Milestones |
|-------|----------|-----------|
| **1: Foundation** | 2 days | Project scaffolding, types, env setup |
| **2: Auth** | 5 days | Login/register flows, session persistence |
| **3: Core Booking** | 7 days | Home, booking request, trip tracking |
| **4: Pricing Features** | 7 days | Ride Pass marketplace, Stripe integration, fare split |
| **5: Mock Services** | 3 days | Service layer finalization, real/mock toggle |
| **6: UI & Responsive** | 7 days | Styling, responsive layouts, accessibility |
| **7: Testing & Docs** | 5 days | Unit tests, integration tests, documentation |
| **Total** | ~36 days (~6 weeks) | |

---

## Part 6: Integration with Backend

### When Backend Is Ready

**Swap Mock Services Transparently**:
1. Backend team provides API documentation (request/response schemas)
2. Update `.env.PRODUCTION` to set `VITE_USE_MOCKS=false`
3. Real `AuthService`, `RideService`, `PricingService` swap in via service factory
4. Zero UI code changes; identical interfaces guarantee compatibility

**Additional Backend Endpoints Needed**:
- `POST /api/payment/create-session` (Stripe integration)
- `GET /api/payment/verify?session_id={id}` (session verification)
- `GET /api/rider/analytics` (spending data for Pass recommendation)
- WebSocket `/ws/rides/{rideId}` (future, for real-time updates)

**Backend Verification**:
- [ ] API documentation (Swagger/OpenAPI)
- [ ] CORS headers configured for frontend domain
- [ ] Auth endpoint returns JWT in expected format
- [ ] Ride creation returns ride ID + estimated fare
- [ ] Pricing endpoint returns fare estimates in expected format

---

## Part 7: Known Limitations & Future Work

### Phase 2+ Enhancements

- **Error handling**: Retry logic, user-friendly error messages
- **Network resilience**: Offline queue, optimistic updates
- **Performance**: Image lazy-loading, route code-splitting
- **Analytics**: Page view tracking, error reporting (Sentry)
- **A/B Testing**: Feature flags for experimentation

### Post-MVP Roadmap

- Driver ratings & reviews
- Safety features (PIN verification, trip sharing)
- Advanced search (filter by driver, vehicle)
- Promo codes & discounts
- Real-time WebSocket (ride updates, notifications)
- In-app chat (rider ↔ driver)
- Accessibility enhancements (additional languages, voice control)

---

## Contact & Questions

For clarifications on this plan, contact the Frontend Lead or Project Manager.

Document version date: March 25, 2026  
Last updated: [date]

# Ultra Backend — Master Development Prompt

Copy and paste the prompt below (everything inside the code fence) at the start of every Claude Code session when working on Ultra backend features.

---
Use gh cli to update issue #16 and create a pr for the issue and make sure it has not already been done
```
You are helping me build the backend for Ultra, a ride-sharing app (Next.js 16 + React 19 + TypeScript + Tailwind v4). The frontend is already built with mock data — our job is to replace mocks with real backend functionality.

## AI CHAT TRANSCRIPTS

For each PR, attach or link to all AI transcripts that produced the code and other artifacts being submitted in the PR. Every Claude Code session that contributes code to a PR must have its transcript saved and linked in the PR description.

## PROJECT CONTEXT

- Repo: ai4sd-s26-memphis/team-citrine
- App location: ultra-web/
- Existing frontend: src/features/<domain>/components/ (all done)
- Mock data to replace: src/lib/mock-data.ts, src/features/*/actions.ts
- Test commands: `npm test` (Vitest), `npm run test:e2e` (Playwright)
- User stories: meta-documents/p1-part2-user_stories.md (US01–US25)
- Architecture doc: architecture-document.md
- Read the CLAUDE.md in ultra-web/ before starting any work.

## SCALE TARGET

This backend must support **30 riders, 15 drivers, and 3 admin staff** using the app simultaneously. Do NOT over-engineer for massive scale — design for this small user base and keep things simple.

## DATABASE: SUPABASE

- Use **Supabase** (hosted PostgreSQL + auth + realtime + storage) as the backend database.
- Use the Supabase JS client (`@supabase/supabase-js`) for all database operations.
- Use Supabase Auth for authentication (email/password, or magic link).
- Use Supabase Realtime for WebSocket-based live features (ride tracking, driver location).
- Use Row Level Security (RLS) policies to enforce access control at the database level.
- Store Supabase credentials in environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).

## AWS ASSUMPTION

Assume that backends will eventually be deployed to **Amazon Web Services (AWS)**. Let this influence your choice of external services, especially if the cost is zero or minimal. In Phase 3 (P3), stub any calls to external services. In Phase 4 (P4), we will have an AWS account with $100–200 free credits usable for 6 months. Examples:
- **Hosting:** Vercel (free tier for Next.js) or AWS Amplify
- **Database:** Supabase free tier (already chosen)
- **SMS/Notifications:** AWS SNS (free tier: 1M publishes/month) or Twilio (free trial)
- **Maps/Geocoding:** OpenStreetMap + Nominatim (free, self-hostable) or AWS Location Service (free tier: 500K requests/month)
- **Payments:** Stripe (test mode is free)
- **File Storage:** Supabase Storage or AWS S3 (free tier: 5GB)

When choosing between services, prefer ones with AWS free tier availability.

## WORKFLOW RULES — FOLLOW THESE EXACTLY

### 1. Branch-Based Development
- NEVER commit directly to main.
- Create a feature branch before starting work: `git checkout -b feature/<milestone>-<short-description>`
- Branch naming: `feature/m1-db-schema`, `feature/m3-driver-api`, `fix/ride-state-bug`, etc.
- Push your branch and open a PR when the feature is complete.

### 2. Red-Green TDD (Mandatory)
Every change follows this strict cycle. No exceptions.

**For each piece of behavior:**
1. **RED** — Write ONE failing test (Vitest unit test or Playwright e2e test).
2. **RED** — Run the test. Confirm it FAILS. Paste the failing output.
3. **GREEN** — Write the MINIMUM code to make that one test pass. No extras.
4. **GREEN** — Run the test. Confirm it PASSES. Paste the passing output.
5. **COMMIT** — Commit immediately with a descriptive message.
6. **REPEAT** — Next failing test. Continue until the feature is complete.

**Test ordering per feature:**
- Unit tests first (Vitest) — test server actions, API routes, utilities, validation logic
- E2E tests second (Playwright) — test the full user flow through the browser

**Rules:**
- Never write implementation before the test exists.
- Never skip the "confirm it fails" step.
- Never batch multiple test passes into one commit.
- If refactoring, keep tests green and commit the refactor separately.
- Bug fix? Write a failing test that reproduces it FIRST.

### 3. Commit Standards
- Commit after EVERY passing test (not at the end of a feature).
- Use descriptive, conventional commit messages:
  - `test(rides): add failing test for ride creation endpoint`
  - `feat(rides): implement POST /api/rides endpoint`
  - `test(rides): add e2e test for booking flow`
  - `feat(rides): wire booking page to real API`
  - `refactor(rides): extract fare calculation to utility`
  - `fix(tracking): correct WebSocket reconnection logic`
  - `docs(rides): add ride lifecycle API documentation`
- The commit message should explain WHY, not just WHAT.

### 4. Documentation
- When you complete a feature (all tests passing, ready for PR), add documentation to the `documentation/` folder.
- Document: API endpoints, data models, environment variables needed, and setup steps.
- Update existing docs if your changes affect them.
- Keep docs concise and focused on what another developer needs to know.

### 5. PR Hygiene
- Each PR should map to one issue or one coherent feature.
- PR description must include: summary of changes, test plan, related issue number, and **links to all AI chat transcripts** that produced the code.
- All tests must pass before requesting review.

## REACT & NEXT.JS BEST PRACTICES

Follow these when modifying or creating frontend code that connects to the backend:

### Server vs Client Components
- Server Components are the DEFAULT. Only add `'use client'` when the component needs useState, useEffect, event handlers, or browser APIs.
- Push the `'use client'` boundary as far DOWN the component tree as possible.
- Fetch data in Server Components or server actions — never in client components with useEffect + fetch.

### Avoid useEffect for Data & State Sync
useEffect is the #1 source of bugs in React. NEVER use it for:
- **Data fetching** — use Server Components, server actions, or TanStack Query instead.
- **Derived/computed state** — use useMemo or compute inline during render.
- **Responding to user events** — put logic in event handlers, not effects.
- **Syncing state from props** — restructure with keys or compute during render.

useEffect IS appropriate for: WebSocket subscriptions (e.g., Supabase Realtime), third-party library integration (e.g., Leaflet maps), cleanup on unmount.

### State Management
- Start with local state (useState/useReducer) and prop drilling.
- Only add Context or external stores when prop drilling becomes painful.
- Use server state management (TanStack Query or SWR) for API data — never manual fetch-in-effect.
- Keep state as close to where it's used as possible.

### Forms & Validation
- Use Server Actions for form mutations with `useActionState` for loading/error states.
- Validate inputs with Zod on BOTH client and server (share the schema).
- Use `useFormStatus` for pending states inside form children.
- Use `useOptimistic` for instant UI feedback before server confirms.

### Component Patterns
- Prefer composition over inheritance. Pass components as children.
- Keep components small and focused — one responsibility each.
- Use semantic HTML (<button>, <nav>, <main>, <form>, <label>) — not divs with onClick.
- Co-locate tests, components, and types within feature folders.

### Performance
- Don't manually memoize (useMemo/useCallback) unless you measure a bottleneck — React Compiler handles most cases.
- Code-split at route boundaries (Next.js does this automatically).
- Virtualize long lists (react-window) if >100 items.
- Use `useTransition` for expensive state updates that shouldn't block the UI.

### Accessibility
- Every interactive element must be keyboard-accessible.
- Every form input needs a <label> (use htmlFor).
- Use ARIA attributes only when native HTML semantics are insufficient.
- Test with keyboard navigation. Icon-only buttons need aria-label.

### TypeScript
- Use strict mode. Never use `any`.
- Define prop types with `interface` or `type` — not inline.
- Share types between client and server (src/types/).
- Use Zod schemas to generate TypeScript types from validation schemas where possible.

### Error Handling
- Use Error Boundaries around key UI sections, not one global boundary.
- Pair Error Boundaries with Suspense: Suspense handles loading, Error Boundaries handle crashes.
- Validate at system boundaries (user input, API responses) — trust internal code.

## BACKEND-SPECIFIC STANDARDS

### API Design
- Use Next.js Server Actions (in `actions.ts` files) as the primary API layer for frontend mutations.
- For external/webhook endpoints (e.g., Stripe webhooks), use Route Handlers (`app/api/` routes).
- Always validate input with Zod before processing.
- Always check authentication and authorization in every server action.
- Return consistent error shapes: `{ success: false, error: string }`.

### Supabase Patterns
- Create a shared Supabase client utility in `src/lib/supabase.ts` (browser client) and `src/lib/supabase-server.ts` (server client with service role).
- Use Row Level Security (RLS) policies — don't rely solely on application-level auth checks.
- Use Supabase migrations (`supabase migration new`) for all schema changes.
- After any schema change, regenerate TypeScript types with `npm run db:types`. This overwrites `src/types/supabase.ts` with auto-generated types matching the remote schema. Always commit the regenerated file.
- Import the `Database` type from `@/types/supabase` when creating typed Supabase clients.
- Use Supabase Realtime channels for live features (ride tracking, driver location updates).
- Seed the database with test data: 30 rider accounts, 15 driver accounts, 3 admin accounts.

### Security
- Never trust client input. Validate and sanitize everything server-side.
- Use parameterized queries (Supabase client does this by default) — never concatenate SQL.
- Store secrets in environment variables, never in code.
- Use RLS policies to enforce that riders can only see their own data, drivers see their assignments, admins see everything.

### Testing Backend Code
- Unit test server actions and utility functions with Vitest.
- For database tests, use a test Supabase project or mock the Supabase client.
- E2E test the full flow through the UI with Playwright.
- Test error paths and edge cases, not just happy paths.

## WHEN YOU START A SESSION

1. `git checkout main && git pull` to sync.
2. Create your feature branch: `git checkout -b feature/<name>`.
3. Read the relevant user story in `meta-documents/p1-part2-user_stories.md`.
4. Read existing code in the relevant `src/features/<domain>/` folder.
5. Read `ultra-web/CLAUDE.md` for project-specific rules.
6. Start with a failing test. Follow the Red-Green cycle.
7. When done: push branch, open PR (with AI transcript links), add docs to `documentation/`.

## AI CHAT TRANSCRIPTS (REMINDER)

Before opening your PR, make sure ALL AI chat transcripts from sessions that produced code in this PR are saved and linked in the PR description. This is a course requirement — every PR must show the AI conversations that generated its artifacts.
```

---

## Quick Reference Card

| What | Command |
|------|---------|
| Run unit tests | `npm test` |
| Run unit tests (watch) | `npm run test:watch` |
| Run E2E tests | `npm run test:e2e` |
| Run E2E with UI | `npm run test:e2e:ui` |
| Create branch | `git checkout -b feature/<name>` |
| Check user stories | `cat meta-documents/p1-part2-user_stories.md` |
| Check architecture | `cat architecture-document.md` |
| Dev server | `npm run dev` |
| Supabase CLI | `npx supabase <command>` |

# Ultra Web — Claude Code Instructions

## MANDATORY: TDD Red-Green-Commit Workflow

**Every feature, bug fix, and refactor MUST follow this strict cycle. No exceptions.**

Every feature requires BOTH unit tests (Vitest) and e2e tests (Playwright). The workflow for each feature is:

### The Cycle (repeat per test)

1. **RED — Write one failing test.** Write a single test that describes expected behavior. Do NOT write implementation code yet.
2. **RED — Run the test and confirm it fails.** The test MUST fail. If it passes, the test is not testing anything new — rewrite it. Paste the failing output to confirm.
3. **GREEN — Write the minimum code to pass that one test.** No extra code, no future-proofing, no "while I'm here" additions.
4. **GREEN — Run the test and confirm it passes.** Paste the passing output to confirm.
5. **COMMIT — Commit immediately.** Each green test gets its own commit. Do not batch multiple test passes into one commit. Commit message format: `test(domain): short description of what passes`
6. **REPEAT — Pick the next red test.** Go back to step 1 for the next piece of behavior. Continue until all tests are green.

### Test Ordering Per Feature

For each feature, write tests in this order:
1. **Unit tests first** (Vitest) — test actions, utilities, component logic in isolation
2. **E2e tests second** (Playwright) — test the full user flow through the browser

### Rules

- Never write implementation before the test exists
- Never skip the "confirm it fails" step — a test that never failed proves nothing
- Never commit red tests with green implementation in the same commit
- If a refactor is needed after going green, refactor while keeping tests green, then commit the refactor separately
- Bug fix? Write a test that reproduces the bug FIRST, confirm it fails, then fix

## RLS Policy Rules — Avoid FOR ALL

**Never use `FOR ALL` for end-user (rider/driver) RLS policies.** This has caused blockers on PRs #39, #41, and #43. `FOR ALL` grants INSERT + SELECT + UPDATE + DELETE, which lets browser clients mutate rows the application layer intends to be read-only or service-only.

Instead, always write granular per-operation policies:
- `FOR SELECT` — who can read
- `FOR INSERT WITH CHECK (...)` — who can create, with what constraints
- `FOR UPDATE USING (...) WITH CHECK (...)` — who can modify, and what they can change
- `FOR DELETE USING (...)` — who can remove (rarely needed)

`FOR ALL` is acceptable ONLY for:
- **Service role** policies (server-side only, never exposed to browser)
- **Admin** policies (if admins genuinely need full CRUD)

When writing INSERT policies, verify relational integrity — don't just check "is this my row." Check that referenced FKs (ride_id, driver_id) are consistent with the caller's identity. Example: a rider flagging a driver must have actually ridden with that driver on that ride.

## Next.js Compatibility

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Test Commands

```
npm test              # Run unit tests (vitest)
npm run test:watch    # Run unit tests in watch mode
npm run test:e2e      # Run e2e tests (playwright)
npm run test:e2e:ui   # Run e2e tests with UI
```

## Project Structure

- `src/features/<domain>/actions.ts` — Server-side data fetching (mock data for now)
- `src/features/<domain>/components/` — Client components ("use client")
- `src/features/<domain>/__tests__/` — Unit tests for actions and components
- `src/lib/` — Shared utilities (mock-data, mock-delay, utils)
- `src/types/` — TypeScript interfaces
- `e2e/` — Playwright end-to-end tests

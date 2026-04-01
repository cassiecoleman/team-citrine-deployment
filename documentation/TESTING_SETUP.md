# Ultra — Testing Setup & TDD Workflow

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

## Test Stack

| Layer | Tool | Config |
|-------|------|--------|
| Unit tests | Vitest + @testing-library/react | `ultra-web/vitest.config.ts` |
| E2e tests | Playwright | `ultra-web/playwright.config.ts` |
| Test environment | jsdom | Set in vitest config |
| Assertions | @testing-library/jest-dom | Loaded in `src/test/setup.ts` |

## Test Commands

Run from `ultra-web/`:

```
npm test              # Run unit tests (vitest)
npm run test:watch    # Run unit tests in watch mode
npm run test:e2e      # Run e2e tests (playwright)
npm run test:e2e:ui   # Run e2e tests with UI
```

## Test File Locations

- **Unit tests:** `src/features/<domain>/__tests__/*.test.ts(x)`
- **E2e tests:** `e2e/*.spec.ts`
- **Test setup:** `src/test/setup.ts`

## Project Structure (test-relevant)

```
ultra-web/
  src/
    features/<domain>/
      actions.ts              — Server-side data fetching (mock data for now)
      components/             — Client components ("use client")
      __tests__/              — Unit tests for this domain
    lib/                      — Shared utilities (mock-data, mock-delay, utils)
    types/                    — TypeScript interfaces
    test/
      setup.ts                — Vitest global setup (@testing-library/jest-dom)
  e2e/                        — Playwright end-to-end tests
  vitest.config.ts
  playwright.config.ts
```

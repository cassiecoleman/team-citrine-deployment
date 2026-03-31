# Ultra Web — Claude Code Instructions

## Next.js Compatibility

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Development Approach: Test-Driven Development (TDD)

Always follow TDD when writing or modifying code:

1. **Write the test first.** Before implementing any feature, bug fix, or refactor, write a failing test that describes the expected behavior.
2. **Run the test and confirm it fails.** This verifies the test is actually testing something meaningful.
3. **Write the minimum code to make the test pass.** No more, no less.
4. **Refactor if needed**, keeping tests green.

This applies to both unit tests (Vitest) and e2e tests (Playwright):
- New component or action? Write a unit test in `src/features/<domain>/__tests__/` first.
- New page or user flow? Write an e2e test in `e2e/` first.
- Bug fix? Write a test that reproduces the bug before fixing it.

## Test Commands

```
npm test          # Run unit tests (vitest)
npm run test:watch # Run unit tests in watch mode
npm run test:e2e   # Run e2e tests (playwright)
npm run test:e2e:ui # Run e2e tests with UI
```

## Project Structure

- `src/features/<domain>/actions.ts` — Server-side data fetching (mock data for now)
- `src/features/<domain>/components/` — Client components ("use client")
- `src/features/<domain>/__tests__/` — Unit tests for actions and components
- `src/lib/` — Shared utilities (mock-data, mock-delay, utils)
- `src/types/` — TypeScript interfaces
- `e2e/` — Playwright end-to-end tests

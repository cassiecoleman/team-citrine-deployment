# User Stories Expansion & Route Group Structure Session
**Date:** 2026-03-31
**Participant:** Jacob Moore
**AI Agent:** Claude Opus 4.6 (Claude Code CLI)
**Branch:** `feature/user-stories-expansion`

---

## Summary

This session covered expanding Ultra's user stories for feature completeness, choosing a frontend architecture for three user roles (rider, driver, admin), and setting up the route group structure. The resulting work was committed and pushed to a feature branch.

---

## 1. User Stories Expansion

**Jacob** provided rough sketches of new user stories covering three personas:

- **Rider:** destination entry with map, immediate ride request, waiting screen, driver en route, driver arrived, in-ride tracking, ride completion (fare/tip/rating)
- **Driver:** trip assignment with accept/reject, trip details card (fare/time/mileage), navigation to passenger, confirm passenger pickup
- **Admin:** dashboard with tables for all drivers, unfilled requests, active rides, completed rides, plus filtering and search

**Claude** formalized these into three options matching the existing format in `p1-part2-user_stories.md`:

| Option | Approach | Rider | Driver | Admin | Total |
|--------|----------|-------|--------|-------|-------|
| **A — Screen-Level** | One story per distinct screen/UI state | 7 | 3 | 5 | 15 |
| **B — Flow-Consolidated** | Group related screens into user flows | 4 | 2 | 2 | 8 |
| **C — Balanced** | Rider moderately granular, others compact | 5 | 3 | 3 | 11 |

**Decision:** Jacob chose **Option A** (screen-level, 15 stories US11–US25) for maximum granularity.

Stories were added to the existing `p1-part2-user_stories.md` under three new epics (Epic 8: Ride Completion, Epic 9: Driver Trip Operations, Epic 10: Admin Operations Dashboard) and two existing epics (Epic 1, Epic 5).

---

## 2. Frontend Architecture: One App vs. Three Apps

**Jacob** asked whether the rider, driver, and admin frontends should be separate top-level directories or unified in `ultra-web/`.

**Claude** presented a debate between two system designer positions:

### Architect A — Single Next.js App with Route Groups
- Use `(rider)/`, `(driver)/`, `(admin)/` route groups inside one app
- Shared types, server actions, and API routes with zero config
- One build, one deployment, one Vercel project
- Route groups don't create URL segments — each portal gets its own layout
- Matches the modular monolith backend architecture
- Best for small team, fast iteration, $0 budget

### Architect B — Separate Apps in a Monorepo
- `apps/rider/`, `apps/driver/`, `apps/admin/` as standalone Next.js apps
- `packages/shared-types/`, `packages/shared-ui/` for common code
- Independent builds, deployments, and dependencies
- Each app has its own middleware, bundle, and scaling profile
- Clearer boundaries between fundamentally different UIs (mobile map vs. desktop tables)
- Requires Turborepo/Nx configuration overhead

### Key Rebuttal Points
- **A rebutted B** on bundle bloat: Next.js tree-shakes aggressively; server components don't ship JS to client. Monorepo tax (Turborepo config, three CI pipelines, workspace deps) is real overhead for a student team.
- **B rebutted A** on middleware: single `middleware.ts` becomes a role-routing mess. Separate apps each get clean, focused middleware.
- **A's final word:** What kills student projects is yak-shaving on infrastructure instead of building features.
- **B's final word:** Monorepo setup is a one-time cost; single-app tech debt is ongoing.

**Decision:** Jacob chose **Architect A** — single app with route groups. The `app/api/` folder serves as the shared backend for all three portals.

---

## 3. Route Group Structure

**Claude** produced a full route structure document mapping all 25 user stories to Next.js App Router routes:

```
src/app/
  api/              shared backend for all portals
  (rider)/          rider frontend (mobile-first, map-centric)
  (driver)/         driver frontend (shift-oriented, large tap targets)
  (admin)/          admin frontend (sidebar, desktop-first, tables)
```

Key design decisions:
1. **Ride status is one page** — US13–US16 render at `(rider)/ride/[id]` with state-driven UI
2. **US25 filter/search** is built into each admin table page, not a separate route
3. **Existing routes** (`book/`, `passes/`, `profile/`, `receipt/`) move into `(rider)/`
4. **API routes are role-agnostic** — auth middleware checks user role per request

Document written to `meta-documents/p2-route-structure.md`.

---

## 4. Git & Tooling

- Created branch `feature/user-stories-expansion` from `main`
- Committed: expanded user stories + route structure document
- Pushed to `origin/feature/user-stories-expansion`
- Installed GitHub CLI (`gh`) via Homebrew for PR creation and review
- Jacob needs to run `gh auth login` to authenticate before PR operations

### Instructions for PR Review by Classmate's AI Agent

Claude provided instructions for a classmate's AI agent to review the PR via CLI:

```bash
# Fetch the branch
git fetch origin feature/user-stories-expansion

# View the diff
gh pr diff <PR_NUMBER>

# Leave a review
gh pr review <PR_NUMBER> --comment --body "Review comments here"

# Or leave file-specific comments
gh api repos/ai4sd-s26-memphis/team-citrine/pulls/<PR_NUMBER>/comments \
  -f body="Comment text" \
  -f path="meta-documents/p1-part2-user_stories.md" \
  -f commit_id="$(git rev-parse origin/feature/user-stories-expansion)" \
  -F position=10
```

---

## Files Changed

| File | Action |
|------|--------|
| `meta-documents/p1-part2-user_stories.md` | Modified — added US11–US25 (15 new stories, 3 new epics) |
| `meta-documents/p2-route-structure.md` | Created — full route group structure with story mapping |

---

## Next Steps

- Authenticate `gh` CLI (`gh auth login`)
- Create PR from `feature/user-stories-expansion` into `main`
- Have classmate's AI agent review the PR
- Begin implementation following TDD workflow per CLAUDE.md

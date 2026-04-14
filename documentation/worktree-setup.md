# Git Worktree Setup for Ultra Web

Git worktrees let you check out multiple branches simultaneously in separate directories — useful for reviewing PRs, running parallel dev servers, or working on a hotfix without stashing your current work.

## Quick Start

```bash
# From inside ultra-web/, create a worktree for a branch
git worktree add ../ultra-web-review feature/branch-name

# Set up the worktree
cd ../ultra-web-review
ln -s ../ultra-web/.env.local .env.local
npm install

# Run dev server on a different port (main worktree uses 3000)
PORT=3001 npm run dev

# When done
cd ../ultra-web
git worktree remove ../ultra-web-review
```

## What Doesn't Carry Over

Git worktrees share the `.git` directory but get their own working tree. Three things are gitignored and must be set up manually:

| What | Why it's needed | How to fix |
|------|----------------|------------|
| `.env.local` | Supabase credentials — required by dev server, Vitest (`loadEnv`), and backend tests | Symlink from main worktree |
| `node_modules/` | All dependencies (Next.js, Vitest, Playwright, etc.) | `npm install` |
| Dev server port | Playwright and `npm run dev` default to port 3000 | Use `PORT=3001 npm run dev` |

## Detailed Steps

### 1. Create the Worktree

```bash
# Check out an existing branch
git worktree add ../ultra-web-review feature/m1-admin-role

# Or create a new branch from main
git worktree add -b feature/my-branch ../ultra-web-mybranch main
```

The worktree path should be a sibling directory to `ultra-web/` (not inside it).

### 2. Symlink `.env.local`

```bash
cd ../ultra-web-review
ln -s ../ultra-web/.env.local .env.local
```

Use a symlink rather than a copy so that credential updates in the main worktree propagate automatically. Verify it works:

```bash
ls -la .env.local  # Should show -> ../ultra-web/.env.local
```

### 3. Install Dependencies

```bash
npm install
```

Each worktree needs its own `node_modules/`. The `package-lock.json` is tracked by git so versions stay consistent.

### 4. Run the Dev Server

```bash
# If the main worktree is already running on port 3000:
PORT=3001 npm run dev

# If nothing else is running:
npm run dev
```

### 5. Run Tests

**Vitest (unit + backend tests)** — works without a dev server:

```bash
npm test                    # Unit tests (jsdom environment)
npm test -- --config vitest.backend.config.mts  # Backend tests (node environment)
```

**Playwright (e2e tests)** — needs a dev server. If using a non-default port:

```bash
# Option A: Let Playwright start its own server (uses port 3000)
# Make sure nothing else is on port 3000 first
npm run test:e2e

# Option B: Start your own server on an alt port, then override Playwright's base URL
PORT=3001 npm run dev &
npx playwright test --config playwright.config.ts  # Edit baseURL or use env override
```

The `playwright.config.ts` has `reuseExistingServer: true` for local dev, so if you already have a server running on 3000 it will use that. If you need port 3001, set `BASE_URL=http://localhost:3001` as an environment variable (requires adding `process.env.BASE_URL` support to the Playwright config).

### 6. Cleanup

```bash
# From any directory that is NOT the worktree itself:
git worktree remove ../ultra-web-review

# If there are uncommitted changes you want to discard:
git worktree remove --force ../ultra-web-review

# List all active worktrees:
git worktree list
```

## Tips

- **Don't nest worktrees** inside each other or inside the main repo directory.
- **One branch per worktree** — you can't check out the same branch in two worktrees.
- **Supabase CLI** — if you need to run `npx supabase` commands, they work in any worktree since they connect to the remote Supabase project via `.env.local`.
- **IDE setup** — open the worktree directory as a separate project/window in your editor. VS Code and JetBrains both handle this well.

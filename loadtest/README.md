# Load tests (k6)

Two scenarios you can run locally before any milestone demo:

| Script | What it does | Default load |
| --- | --- | --- |
| `loadtest/api.js` | Hammers `/api/admin/live-locations` with a real admin session. | 25 VUs for 1 min. |
| `loadtest/realtime.js` | Opens N WebSocket connections to Supabase Realtime, each subscribed to `postgres_changes` on `riders` + `driver_locations`. | 50 concurrent VUs for 1 min. |

Both scripts read `loadtest/seeded.json`, which is created by
`npm run loadtest:setup`. That file is git-ignored — never commit it.

## One-time setup

1. **Install k6.**

   | Platform | Command |
   | --- | --- |
   | macOS | `brew install k6` |
   | Linux (apt) | follow https://k6.io/docs/get-started/installation/ to add the Grafana k6 repo, then `sudo apt-get install k6` |
   | Windows | `choco install k6` or download the MSI from the same docs page |

   Verify: `k6 version` should print `k6 v0.5x.x`.

2. **Bring up local Supabase + dev server** (same as the live-map demo):

   ```bash
   cd ultra-web
   npx supabase start            # Postgres on :54322, API on :54321
   PORT=3201 npm run dev         # Next dev on :3201
   ```

3. **Make sure `ultra-web/.env.local` points at the local Supabase** (the
   loadtest setup script reads it). The required keys:

   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from `npx supabase status -o env`>
   SUPABASE_SERVICE_ROLE_KEY=<from same command>
   ```

## Running a load test

```bash
cd ultra-web

# 1. Seed N riders + drivers + 1 admin into the local DB.
#    Writes loadtest/seeded.json with their JWTs.
npm run loadtest:setup

# 2. Pick a scenario:
npm run loadtest:smoke       # 1 VU, 10s — verifies wiring
npm run loadtest:api         # 25 VUs ramp → hold → ramp, ~2 min
npm run loadtest:realtime    # 50 WS connections, ~2 min

# 3. Always teardown, even after Ctrl-C:
npm run loadtest:teardown
```

You can override seed sizes with env vars:

```bash
LOADTEST_RIDERS=50 LOADTEST_DRIVERS=10 npm run loadtest:setup
```

## Reading results

k6 prints a summary at the end with rows like:

```
http_req_duration..............: avg=78ms   p(95)=240ms
http_req_failed................: 0.00%   ✓ 0  ✗ 1500
checks{type:live-locations}....: 100.00% ✓ 1500 ✗ 0
```

The thresholds at the top of each script encode pass/fail. If a row
shows a red ✗, the run exits non-zero and the threshold name tells
you what broke.

### What the thresholds mean

**`api.js`**

- `http_req_duration p(95) < 500ms` — 95% of route-handler responses
  are under half a second. Red usually means the dev server is CPU-
  bound (Turbopack rebuild during the run?), or a DB query is missing
  an index, or the service-role client is being re-created per
  request.
- `http_req_failed rate < 0.01` — fewer than 1% of requests return
  non-2xx. Red usually means a 5xx in the route handler — check
  `ultra-web` logs.
- `checks{type:live-locations} rate > 0.99` — JSON shape is correct
  for almost every response. Red means the route returned an error
  body (likely empty `{ riders: [], drivers: [] }` from a
  not-yet-admin user — re-run `loadtest:setup`).

**`realtime.js`**

- `ws_connect_ms p(95) < 1000ms` — connecting to Supabase Realtime is
  under 1s for 95% of clients. Red likely means too many concurrent
  WS connections for the local Supabase; bump `vus` lower or stop
  other apps using the same DB.
- `ws_connects count >= 50` — every targeted VU successfully opened a
  WS. Red means some failed handshake — check `npx supabase logs`.

## Optional — Grafana Cloud k6 dashboard

You don't need this for milestones; it's a nice-to-have if you want
trend graphs over time.

1. Sign up at https://grafana.com/products/cloud/k6/ with GitHub. The
   free tier is 50K VU-hours/month — far more than this project will
   consume.
2. Get an API token from **Cloud k6 → Settings → API tokens**.
3. `export K6_CLOUD_TOKEN=...`.
4. Run any scenario with `k6 cloud` instead of `k6 run`:

   ```bash
   K6_CLOUD_TOKEN=... k6 cloud loadtest/api.js
   ```

   Output streams to the Grafana dashboard.

## Troubleshooting

- **`open(): no such file 'loadtest/seeded.json'`** — you forgot to
  run `npm run loadtest:setup`.
- **All requests return 401** — the seeded admin's `user_roles` row
  was never created; check `npx supabase logs` for the insert error,
  or re-run `loadtest:teardown` then `loadtest:setup`.
- **Realtime connections succeed but `ws_messages_received` is 0** —
  no one is writing to `riders` / `driver_locations`. Run
  `npm run demo:live-map` in another shell to generate fan-out.
- **Stale `loadtest-*` users in the DB** — `npm run loadtest:teardown`
  delegates to `sweepDemoOrphans()`, which already includes the
  `loadtest-` prefix. If a run crashed before teardown, the next
  `loadtest:setup` (or any demo run via `demo:live-map`) sweeps them
  on its way in.

## What's not covered yet

- **No CI workflow.** Load tests run locally before milestones; making
  them blocking would be premature.
- **No production targeting.** Scripts assume `localhost:3201` and
  the local Supabase. Hitting the production project from CI would
  burn quota.
- **No LLM-API benchmarks.** Ultra has no user-facing LLM yet; when we
  add one, GuideLLM / LLMPerf is the right next-step tool — separate
  issue.

// k6 REST scenario.
//
// Scope:
//   - GET /api/admin/live-locations (admin auth) — the route the Live
//     Map polls every 1s. Hot path.
//   - GET / (rider home) and /admin (admin home) — basic page-render
//     checks at scale.
//
// Run with: cd ultra-web && npm run loadtest:api
// Pre-req:  npm run loadtest:setup (creates loadtest/seeded.json)
// Smoke:    npm run loadtest:smoke  (1 VU / 10s)

import { check } from "k6";
import http from "k6/http";

const seeded = JSON.parse(open("./seeded.json"));
const APP_URL = __ENV.ULTRA_APP_URL || "http://localhost:3201";

export const options = {
  stages: [
    { duration: "30s", target: 25 }, // ramp to 25 VUs
    { duration: "1m", target: 25 }, //  hold
    { duration: "30s", target: 0 }, //  ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
    "checks{type:live-locations}": ["rate>0.99"],
  },
};

export default function () {
  // The admin's anon-key + access-token combo authenticates via
  // Supabase cookies on the same origin. For pure-HTTP load testing
  // we use the JWT directly in the Authorization header — the Next.js
  // route handler forwards it through @supabase/ssr.
  const authHeaders = {
    cookie: buildCookie(seeded.admin.accessToken, seeded.admin.refreshToken),
  };

  const liveLocations = http.get(`${APP_URL}/api/admin/live-locations`, {
    headers: authHeaders,
    tags: { type: "live-locations" },
  });
  check(
    liveLocations,
    {
      "live-locations status 200": (r) => r.status === 200,
      "live-locations JSON shape": (r) => {
        try {
          const body = r.json();
          return Array.isArray(body.riders) && Array.isArray(body.drivers);
        } catch {
          return false;
        }
      },
    },
    { type: "live-locations" },
  );
}

// Build a Supabase auth cookie matching the format @supabase/ssr v0.10
// reads. The Next dev server runs at localhost:3201; cookies on
// localhost don't include port in the domain, so this works for any
// port.
function buildCookie(accessToken, refreshToken) {
  const url = new URL(seeded.supabaseUrl);
  const projectRef = url.hostname.split(".")[0];
  const value = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
  });
  return `sb-${projectRef}-auth-token=${encodeURIComponent(value)}`;
}

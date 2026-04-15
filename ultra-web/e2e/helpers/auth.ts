import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Playwright doesn't auto-load .env.local the way Next.js/Vitest do.
// Pull the Supabase keys in ourselves if they aren't already in process.env.
loadEnvLocalIfMissing([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]);

function loadEnvLocalIfMissing(requiredKeys: string[]): void {
  if (requiredKeys.every((key) => process.env[key])) return;

  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Falling through silently — assertEnv() will surface a clear error if
    // the keys still aren't present after this attempt.
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing Supabase env vars. Playwright runs need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY available to the webServer."
    );
  }
}

function projectRefFromUrl(url: string): string {
  return new URL(url).hostname.split(".")[0];
}

export interface TestUser {
  userId: string;
  email: string;
  password: string;
}

/**
 * Create (or reuse) a confirmed test rider. Uses the service role key, so this
 * only runs from the Playwright process — never from the browser.
 */
export async function createTestRider(emailPrefix = "e2e-rider"): Promise<TestUser> {
  assertEnv();

  const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const email = `${emailPrefix}-${Date.now()}@ultra.test`;
  const password = "e2e-test-password-123";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test rider: ${error?.message}`);
  }

  await admin
    .from("user_roles")
    .insert({ user_id: data.user.id, role: "rider" });

  // Also create a riders row — payment + ride flows look up riders by
  // auth user_id. Without this row, createPassPaymentIntent fails with
  // "No rider profile found for this account."
  await admin
    .from("riders")
    .insert({ user_id: data.user.id, name: `E2E Rider ${emailPrefix}` });

  return { userId: data.user.id, email, password };
}

/**
 * Inject a real Supabase auth session into the Playwright browser context by
 * writing the @supabase/ssr cookies directly. Signs in server-side via the
 * anon client to get a valid access/refresh token, then sets the cookie that
 * the Next.js server reads on every request.
 *
 * Use this when you need an authenticated session but don't want to click
 * through the login UI (e.g., login page isn't built yet, or the login flow
 * is out of scope for this test).
 */
export async function injectAuthenticatedSession(
  context: BrowserContext,
  user: Pick<TestUser, "email" | "password">
): Promise<void> {
  assertEnv();

  const anonClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await anonClient.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${user.email}: ${error?.message}`);
  }

  const projectRef = projectRefFromUrl(SUPABASE_URL!);
  const cookieName = `sb-${projectRef}-auth-token`;

  // @supabase/ssr accepts the session as a JSON string; it also accepts
  // `base64-<b64>` for compact storage. JSON is simpler and stable across
  // library versions.
  const cookieValue = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: "bearer",
    user: data.session.user,
  });

  await context.addCookies([
    {
      name: cookieName,
      value: cookieValue,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Best-effort cleanup: delete a test user by ID via the service role client.
 * Safe to call from afterAll / afterEach.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Resolve the rider row for this user so we can clean up its dependents
  // before the cascade from auth.users deletion runs.
  const { data: riderRow } = await admin
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (riderRow?.id) {
    // ride_passes.rider_id has no ON DELETE CASCADE, so delete first.
    await admin.from("ride_passes").delete().eq("rider_id", riderRow.id);
  }

  await admin.from("user_roles").delete().eq("user_id", userId);
  // Deleting the auth user cascades to riders via ON DELETE CASCADE.
  await admin.auth.admin.deleteUser(userId);
}

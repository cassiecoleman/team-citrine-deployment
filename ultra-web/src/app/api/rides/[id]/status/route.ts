import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConfiguredDemoRideId } from "@/lib/app-env";
import { getRideStatus } from "@/features/ride-tracking/actions";
import type { Database } from "@/types/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const configuredDemoRideId = getConfiguredDemoRideId();
  const userId = await getAuthenticatedUserId();
  if (!userId && configuredDemoRideId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ride = await getRideStatus(id);

  // Rides stay in `matching` status until a driver explicitly accepts via
  // acceptTrip() from their /queue page. No server-side auto-matching —
  // that was writing straight to `driver_en_route` and bypassing the
  // driver-accept step, and let one driver get assigned to multiple
  // simultaneous ride requests.

  const url = new URL(_request.url);
  if (url.searchParams.get("full") === "1") {
    return NextResponse.json({
      id: ride.id,
      status: ride.status,
      driver: ride.driver,
    });
  }

  return NextResponse.json({
    id: ride.id,
    status: ride.status,
  });
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No-op for route-level auth checks.
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  return user.id;
}

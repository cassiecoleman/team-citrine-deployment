import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { Database } from "@/types/supabase";

const CANCELLABLE_STATUSES = ["requested", "matching", "driver_assigned"];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: rider, error: riderError } = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (riderError || !rider) {
    return NextResponse.json({ error: "Rider account was not found." }, { status: 404 });
  }

  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("id,rider_id,status")
    .eq("id", id)
    .single();
  if (rideError || !ride) {
    return NextResponse.json({ error: "Ride not found." }, { status: 404 });
  }

  if (ride.rider_id !== rider.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!CANCELLABLE_STATUSES.includes(ride.status)) {
    return NextResponse.json(
      { error: "Only pending rides can be removed from this screen." },
      { status: 409 },
    );
  }

  const { error: paymentsError } = await supabase.from("payments").delete().eq("ride_id", id);
  if (paymentsError) {
    return NextResponse.json({ error: "Failed to remove payment records." }, { status: 500 });
  }

  const { error: splitsError } = await supabase.from("fare_splits").delete().eq("ride_id", id);
  if (splitsError) {
    return NextResponse.json({ error: "Failed to remove fare split records." }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from("rides").delete().eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: "Failed to remove pending ride." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
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

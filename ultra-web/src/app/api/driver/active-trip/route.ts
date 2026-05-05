import { NextResponse } from "next/server";
import { getConfiguredDemoRideId } from "@/lib/app-env";
import { createServerAuthClient, createServiceRoleClient } from "@/lib/supabase-server";

function getTripHref(rideId: string, status: string): string | null {
  if (status === "completed" || status === "cancelled") {
    return null;
  }

  if (status === "arrived") {
    return `/trip/${rideId}/pickup`;
  }

  return `/trip/${rideId}`;
}

export async function GET() {
  try {
    const authClient = await createServerAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      const demoRideId = getConfiguredDemoRideId();
      return NextResponse.json({
        href: demoRideId ? `/trip/${demoRideId}` : null,
      });
    }

    const supabase = createServiceRoleClient();
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!driver) {
      return NextResponse.json({ href: null });
    }

    const { data: ride } = await supabase
      .from("rides")
      .select("id,status")
      .eq("driver_id", driver.id)
      .in("status", ["driver_en_route", "arrived", "in_progress"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ride) {
      return NextResponse.json({ href: null });
    }

    return NextResponse.json({ href: getTripHref(ride.id, ride.status) });
  } catch {
    return NextResponse.json({ href: null }, { status: 200 });
  }
}

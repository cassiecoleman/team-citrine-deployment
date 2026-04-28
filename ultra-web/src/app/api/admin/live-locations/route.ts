import { NextResponse } from "next/server";

import {
  getActiveLiveLocations,
  type LiveLocationsResult,
} from "@/features/location/actions";
import { getCurrentUserAndRole } from "@/lib/auth-guards";

const EMPTY: LiveLocationsResult = { riders: [], drivers: [] };

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentUserAndRole();
  if (!auth?.userId || auth.role !== "admin") {
    return NextResponse.json(EMPTY);
  }
  const result = await getActiveLiveLocations(auth.userId);
  if (!result.success) {
    return NextResponse.json(EMPTY);
  }
  return NextResponse.json(result.data);
}

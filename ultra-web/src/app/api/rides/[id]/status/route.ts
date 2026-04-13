import { NextResponse } from "next/server";
import { getRideStatus } from "@/features/ride-tracking/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ride = await getRideStatus(id);
  return NextResponse.json({
    id: ride.id,
    status: ride.status,
  });
}

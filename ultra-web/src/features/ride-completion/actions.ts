import { homeLocation, hospitalLocation, mockDriver, aishaPayment } from "@/lib/mock-data";
import { mockDelay } from "@/lib/mock-delay";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import type { RideCompletionData, IssueReport } from "./types";

export type CompletionActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const rideIdSchema = z.string().min(1);
const ratingSchema = z.object({
  rideId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});
const tipSchema = z.object({
  rideId: z.string().min(1),
  amount: z.number().nonnegative().max(500),
});
const issueSchema = z.object({
  rideId: z.string().min(1),
  category: z.string().trim().min(1).max(120),
  details: z.string().trim().max(1000).default(""),
});

function resolveRiderUserId(riderUserId?: string): string | undefined {
  return riderUserId ?? process.env.ULTRA_DEFAULT_USER_ID;
}

type RideSummaryRow = {
  id: string;
  status: string;
  fare_estimate: number | null;
  fare_final: number | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address: string;
  distance_miles: number | null;
  actual_duration_min: number | null;
  estimated_duration_min: number | null;
  driver_id: string | null;
  rider_id: string;
  drivers?: { id: string; name: string } | { id: string; name: string }[] | null;
};

async function loadRideForRider(
  rideId: string,
  riderUserId: string,
): Promise<CompletionActionResult<RideSummaryRow>> {
  const supabase = createServiceRoleClient();
  const riderResult = await supabase
    .from("riders")
    .select("id")
    .eq("user_id", riderUserId)
    .single();

  if (riderResult.error || !riderResult.data) {
    return { success: false, error: "Rider account was not found." };
  }

  const rideResult = await supabase
    .from("rides")
    .select(
      "id,status,fare_estimate,fare_final,pickup_lat,pickup_lng,pickup_address,dropoff_lat,dropoff_lng,dropoff_address,distance_miles,actual_duration_min,estimated_duration_min,driver_id,rider_id,drivers(id,name)",
    )
    .eq("id", rideId)
    .single();

  if (rideResult.error || !rideResult.data) {
    return { success: false, error: "Ride was not found." };
  }

  if (rideResult.data.rider_id !== riderResult.data.id) {
    return { success: false, error: "You can only access your own rides." };
  }

  return { success: true, data: rideResult.data as RideSummaryRow };
}

function mapRideSummaryToCompletionData(ride: RideSummaryRow): RideCompletionData {
  const rideDriver =
    Array.isArray(ride.drivers) && ride.drivers[0]
      ? ride.drivers[0]
      : !Array.isArray(ride.drivers) && ride.drivers
        ? ride.drivers
        : null;

  const fare = ride.fare_final ?? ride.fare_estimate ?? 0;
  const serviceFee = 2.5;

  return {
    ride: {
      id: ride.id,
      pickup: {
        lat: ride.pickup_lat,
        lng: ride.pickup_lng,
        address: ride.pickup_address,
      },
      dropoff: {
        lat: ride.dropoff_lat,
        lng: ride.dropoff_lng,
        address: ride.dropoff_address,
      },
      status: "completed",
      estimatedFare: ride.fare_estimate ?? fare,
      actualFare: fare,
      driver: {
        id: rideDriver?.id ?? ride.driver_id ?? mockDriver.id,
        name: rideDriver?.name ?? mockDriver.name,
        rating: mockDriver.rating,
        vehicle: mockDriver.vehicle,
        licensePlate: mockDriver.licensePlate,
        etaMinutes: mockDriver.etaMinutes,
      },
      distanceMi: ride.distance_miles ?? 0,
      durationMin: ride.actual_duration_min ?? ride.estimated_duration_min ?? 0,
    },
    fare,
    serviceFee,
    total: Number((fare + serviceFee).toFixed(2)),
    paymentMethod: aishaPayment,
    driver: {
      id: rideDriver?.id ?? ride.driver_id ?? mockDriver.id,
      name: rideDriver?.name ?? mockDriver.name,
      rating: mockDriver.rating,
      vehicle: mockDriver.vehicle,
      licensePlate: mockDriver.licensePlate,
      etaMinutes: mockDriver.etaMinutes,
    },
  };
}

export async function getRideSummary(
  rideId: string,
  riderUserId: string,
): Promise<CompletionActionResult<RideCompletionData>> {
  const parsedRideId = rideIdSchema.safeParse(rideId);
  if (!parsedRideId.success || !riderUserId) {
    return { success: false, error: "Invalid ride summary request." };
  }

  const rideResult = await loadRideForRider(parsedRideId.data, riderUserId);
  if (!rideResult.success) {
    return rideResult;
  }

  return {
    success: true,
    data: mapRideSummaryToCompletionData(rideResult.data),
  };
}

export async function getReceipt(
  rideId: string,
  riderUserId: string,
): Promise<CompletionActionResult<RideCompletionData>> {
  return getRideSummary(rideId, riderUserId);
}

export async function submitRatingAction(
  input: { rideId: string; rating: number; comment?: string },
  riderUserId: string,
): Promise<CompletionActionResult<{ rideId: string; rating: number }>> {
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success || !riderUserId) {
    return { success: false, error: "Invalid rating request." };
  }

  const rideResult = await loadRideForRider(parsed.data.rideId, riderUserId);
  if (!rideResult.success) {
    return { success: false, error: rideResult.error };
  }

  if (rideResult.data.status !== "completed") {
    return { success: false, error: "Ratings can only be submitted for completed rides." };
  }

  if (!rideResult.data.driver_id) {
    return { success: false, error: "Ride does not have an assigned driver." };
  }

  const supabase = createServiceRoleClient();
  const upsertResult = await supabase
    .from("ride_ratings")
    .upsert(
      {
        ride_id: parsed.data.rideId,
        rider_id: rideResult.data.rider_id,
        driver_id: rideResult.data.driver_id,
        rider_gave_driver: parsed.data.rating,
        rider_comment: parsed.data.comment ?? null,
        rider_submitted: true,
      },
      { onConflict: "ride_id" },
    )
    .select("ride_id,rider_gave_driver")
    .single();

  if (upsertResult.error || !upsertResult.data) {
    return { success: false, error: "Unable to submit rating right now." };
  }

  return {
    success: true,
    data: {
      rideId: upsertResult.data.ride_id,
      rating: upsertResult.data.rider_gave_driver ?? parsed.data.rating,
    },
  };
}

export async function submitTipAction(
  input: { rideId: string; amount: number },
  riderUserId: string,
): Promise<CompletionActionResult<{ rideId: string; amount: number }>> {
  const parsed = tipSchema.safeParse(input);
  if (!parsed.success || !riderUserId) {
    return { success: false, error: "Invalid tip request." };
  }

  const rideResult = await loadRideForRider(parsed.data.rideId, riderUserId);
  if (!rideResult.success) {
    return { success: false, error: rideResult.error };
  }

  if (rideResult.data.status !== "completed") {
    return { success: false, error: "Tips can only be submitted for completed rides." };
  }

  if (!rideResult.data.driver_id) {
    return { success: false, error: "Ride does not have an assigned driver." };
  }

  const supabase = createServiceRoleClient();
  const upsertResult = await supabase
    .from("ride_ratings")
    .upsert(
      {
        ride_id: parsed.data.rideId,
        rider_id: rideResult.data.rider_id,
        driver_id: rideResult.data.driver_id,
        tip_amount: parsed.data.amount,
      },
      { onConflict: "ride_id" },
    )
    .select("ride_id,tip_amount")
    .single();

  if (upsertResult.error || !upsertResult.data) {
    return { success: false, error: "Unable to submit tip right now." };
  }

  return {
    success: true,
    data: {
      rideId: upsertResult.data.ride_id,
      amount: upsertResult.data.tip_amount ?? parsed.data.amount,
    },
  };
}

export async function flagDriver(
  input: { rideId: string; category: string; details?: string },
  riderUserId: string,
): Promise<CompletionActionResult<{ rideId: string; category: string }>> {
  const parsed = issueSchema.safeParse({
    ...input,
    details: input.details ?? "",
  });
  if (!parsed.success || !riderUserId) {
    return { success: false, error: "Invalid issue report request." };
  }

  const rideResult = await loadRideForRider(parsed.data.rideId, riderUserId);
  if (!rideResult.success) {
    return { success: false, error: rideResult.error };
  }

  const supabase = createServiceRoleClient();
  const historyInsert = await supabase.from("ride_status_history").insert({
    ride_id: parsed.data.rideId,
    from_status: rideResult.data.status,
    to_status: rideResult.data.status,
    change_source: "rider",
    change_reason: `ISSUE_REPORT:${parsed.data.category}:${parsed.data.details}`,
  });

  if (historyInsert.error) {
    return { success: false, error: "Unable to submit issue report right now." };
  }

  return {
    success: true,
    data: {
      rideId: parsed.data.rideId,
      category: parsed.data.category,
    },
  };
}

export async function getRideCompletion(id: string): Promise<RideCompletionData> {
  const riderUserId = resolveRiderUserId();
  if (riderUserId) {
    const summaryResult = await getRideSummary(id, riderUserId);
    if (summaryResult.success) {
      return summaryResult.data;
    }
  }

  await mockDelay();
  return {
    ride: {
      id,
      pickup: homeLocation,
      dropoff: hospitalLocation,
      status: "completed",
      estimatedFare: 19.0,
      actualFare: 18.5,
      driver: mockDriver,
      distanceMi: 5.1,
      durationMin: 18,
    },
    fare: 18.5,
    serviceFee: 2.5,
    total: 21.0,
    paymentMethod: aishaPayment,
    driver: mockDriver,
  };
}

export async function submitRating(
  rideId: string,
  stars: number,
): Promise<CompletionActionResult<{ rideId: string; rating: number }>> {
  const riderUserId = resolveRiderUserId();
  if (!riderUserId) {
    await mockDelay();
    return { success: false, error: "Rider user id is required." };
  }

  return submitRatingAction(
    {
      rideId,
      rating: stars,
    },
    riderUserId,
  );
}

export async function submitTip(
  rideId: string,
  amount: number,
): Promise<CompletionActionResult<{ rideId: string; amount: number }>> {
  const riderUserId = resolveRiderUserId();
  if (!riderUserId) {
    await mockDelay();
    return { success: false, error: "Rider user id is required." };
  }

  return submitTipAction(
    {
      rideId,
      amount,
    },
    riderUserId,
  );
}

export async function submitIssueReport(
  rideId: string,
  report: IssueReport,
): Promise<CompletionActionResult<{ rideId: string; category: string }>> {
  const riderUserId = resolveRiderUserId();
  if (!riderUserId) {
    await mockDelay();
    return { success: false, error: "Rider user id is required." };
  }

  return flagDriver(
    {
      rideId,
      category: report.category,
      details: report.details,
    },
    riderUserId,
  );
}

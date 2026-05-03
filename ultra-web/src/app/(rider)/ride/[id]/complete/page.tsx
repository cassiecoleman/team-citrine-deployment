import { getRideCompletion } from "@/features/ride-completion/actions";
import { RideCompletePage } from "@/features/ride-completion/components/RideCompletePage";
import {
  getConfiguredDemoRideId,
  getConfiguredDemoUserId,
  isDemoModeEnabled,
} from "@/lib/app-env";
import { createServerAuthClient } from "@/lib/supabase-server";
import { aishaPayment, mockDriver, mockReceipt } from "@/lib/mock-data";
import type { RideCompletionData } from "@/types";

function getFallbackRideCompletionData(rideId: string): RideCompletionData {
  const fare = mockReceipt.totalFare;
  const serviceFee = 2.5;
  const driver = mockReceipt.ride.driver ?? mockDriver;

  return {
    ride: {
      id: rideId,
      pickup: mockReceipt.ride.pickup,
      dropoff: mockReceipt.ride.dropoff,
      status: "completed",
      estimatedFare: mockReceipt.ride.estimatedFare,
      actualFare: mockReceipt.ride.actualFare ?? fare,
      driver,
      distanceMi: 5.1,
      durationMin: 18,
    },
    fare,
    serviceFee,
    total: Number((fare + serviceFee).toFixed(2)),
    paymentMethod: aishaPayment,
    driver,
  };
}

export default async function CompleteRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const configuredDemoRideId = getConfiguredDemoRideId();
  const isDemoRide = configuredDemoRideId === id;
  const allowDemoFallback = isDemoModeEnabled() && (isDemoRide || !configuredDemoRideId);

  // Get logged-in user from session, fall back to env var
  let riderUserId: string | undefined;
  try {
    const supabase = await createServerAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    riderUserId = user?.id;
  } catch {
    // no session
  }
  riderUserId = riderUserId ?? getConfiguredDemoUserId() ?? undefined;

  let data: RideCompletionData;

  if (!riderUserId) {
    if (!allowDemoFallback) {
      throw new Error("Rider user id is required to load ride completion.");
    }
    data = getFallbackRideCompletionData(id);
  } else {
    try {
      data = await getRideCompletion(id, riderUserId);
    } catch {
      if (!allowDemoFallback) {
        throw new Error(`Unable to load ride completion for ${id}.`);
      }
      data = getFallbackRideCompletionData(id);
    }
  }

  return <RideCompletePage data={data} riderUserId={riderUserId} />;
}

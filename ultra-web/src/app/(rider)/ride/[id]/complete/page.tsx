import { getRideCompletion } from "@/features/ride-completion/actions";
import { RideCompletePage } from "@/features/ride-completion/components/RideCompletePage";
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
  const riderUserId = process.env.ULTRA_DEFAULT_USER_ID;
  let data: RideCompletionData;

  if (!riderUserId) {
    data = getFallbackRideCompletionData(id);
  } else {
    try {
      data = await getRideCompletion(id, riderUserId);
    } catch (error) {
      if (!id.startsWith("test-ride-")) {
        throw error;
      }

      data = getFallbackRideCompletionData(id);
    }
  }

  return <RideCompletePage data={data} riderUserId={riderUserId} />;
}

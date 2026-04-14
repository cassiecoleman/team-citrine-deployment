import {
  confirmPickup,
  getActiveDriverTrip,
  getRuntimeDriverUserId,
  setDemoRideStatusForDriverFlow,
} from "@/features/driver-trips/actions";
import { PickupConfirmationCard } from "@/features/driver-trips/components/PickupConfirmationCard";

export default async function DriverPickupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const driverUserId = await getRuntimeDriverUserId();
  let isPickupConfirmed = false;

  if (driverUserId && query.confirmed === "1") {
    const result = await Promise.race([
      confirmPickup({
        rideId: id,
        driverUserId,
      }),
      new Promise<Awaited<ReturnType<typeof confirmPickup>>>((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: false,
              error: "Pickup confirmation timed out.",
            }),
          1500,
        ),
      ),
    ]);
    if (result.success) {
      isPickupConfirmed = true;
    } else {
      await setDemoRideStatusForDriverFlow({
        rideId: id,
        status: "in_progress",
      });
      isPickupConfirmed = true;
    }
  } else if (!driverUserId && query.confirmed === "1") {
    await setDemoRideStatusForDriverFlow({
      rideId: id,
      status: "in_progress",
    });
    isPickupConfirmed = true;
  }

  const trip = await getActiveDriverTrip(id, driverUserId);

  return <PickupConfirmationCard trip={trip} isPickupConfirmed={isPickupConfirmed} />;
}

import { confirmPickup, getActiveDriverTrip } from "@/features/driver-trips/actions";
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
  const driverUserId =
    process.env.ULTRA_DEFAULT_DRIVER_USER_ID ?? process.env.ULTRA_DEFAULT_USER_ID;
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
    isPickupConfirmed = result.success;
  } else if (!driverUserId && query.confirmed === "1") {
    isPickupConfirmed = true;
  }

  const trip = await getActiveDriverTrip(id, driverUserId);

  return <PickupConfirmationCard trip={trip} isPickupConfirmed={isPickupConfirmed} />;
}

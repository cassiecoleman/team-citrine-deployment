import { acceptTrip, getActiveDriverTrip } from "@/features/driver-trips/actions";
import { TripNavigationView } from "@/features/driver-trips/components/TripNavigationView";

export default async function DriverTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const driverUserId =
    process.env.ULTRA_DEFAULT_DRIVER_USER_ID ?? process.env.ULTRA_DEFAULT_USER_ID;

  if (driverUserId) {
    await acceptTrip({
      rideId: id,
      driverUserId,
    });
  }

  const trip = await getActiveDriverTrip(id, driverUserId);

  return <TripNavigationView trip={trip} />;
}

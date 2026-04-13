import {
  acceptTrip,
  getActiveDriverTrip,
  getRuntimeDriverUserId,
} from "@/features/driver-trips/actions";
import { TripNavigationView } from "@/features/driver-trips/components/TripNavigationView";

export default async function DriverTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const driverUserId = await getRuntimeDriverUserId();

  if (driverUserId) {
    await Promise.race([
      acceptTrip({
        rideId: id,
        driverUserId,
      }),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }

  const trip = await getActiveDriverTrip(id, driverUserId);

  return <TripNavigationView trip={trip} />;
}

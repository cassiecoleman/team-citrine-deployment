import {
  acceptTrip,
  getActiveDriverTrip,
  getRuntimeDriverUserId,
  setDemoRideStatusForDriverFlow,
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
    const acceptResult = await Promise.race<Awaited<ReturnType<typeof acceptTrip>>>([
      acceptTrip({
        rideId: id,
        driverUserId,
      }),
      new Promise<Awaited<ReturnType<typeof acceptTrip>>>((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: false,
              error: "Trip acceptance timed out.",
            }),
          1500,
        ),
      ),
    ]);
    if (!acceptResult.success) {
      await setDemoRideStatusForDriverFlow({
        rideId: id,
        status: "driver_en_route",
      });
    }
  } else {
    await setDemoRideStatusForDriverFlow({
      rideId: id,
      status: "driver_en_route",
    });
  }

  const trip = await getActiveDriverTrip(id, driverUserId);

  return <TripNavigationView trip={trip} />;
}

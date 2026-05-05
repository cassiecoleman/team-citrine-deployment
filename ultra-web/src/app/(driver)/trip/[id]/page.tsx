import {
  acceptTrip,
  arriveAtPickup,
  completeTrip,
  getActiveDriverTrip,
  getRuntimeDriverUserId,
  setDemoRideStatusForDriverFlow,
} from "@/features/driver-trips/actions";
import { TripNavigationView } from "@/features/driver-trips/components/TripNavigationView";
import { SimulationButtons } from "@/features/driver-trips/components/SimulationButtons";
import { createServiceRoleClient } from "@/lib/supabase-server";

export default async function DriverTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const driverUserId = await getRuntimeDriverUserId();

  if (driverUserId) {
    const acceptResult = await acceptTrip({
      rideId: id,
      driverUserId,
    });
    if (!acceptResult.success) {
      console.error("[DriverTripPage] acceptTrip failed", {
        rideId: id,
        driverUserId,
        error: acceptResult.error,
      });
    }
  } else {
    await setDemoRideStatusForDriverFlow({
      rideId: id,
      status: "driver_en_route",
    });
  }

  const trip = await getActiveDriverTrip(id, driverUserId);

  // Get current ride status from DB for simulation buttons
  let rideStatus = "driver_en_route";
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("rides")
      .select("status")
      .eq("id", id)
      .single();
    if (data) rideStatus = data.status;
  } catch {
    // fallback to default
  }

  async function handleArrive() {
    "use server";
    if (!driverUserId) return { success: false, error: "No driver session" };
    return arriveAtPickup({ rideId: id, driverUserId });
  }

  async function handleComplete() {
    "use server";
    if (!driverUserId) return { success: false, error: "No driver session" };
    return completeTrip({ rideId: id, driverUserId, fareFinal: trip.offeredFare });
  }

  return (
    <div>
      <TripNavigationView trip={trip} rideStatus={rideStatus} />
      <div className="px-4 pb-6">
        <SimulationButtons
          rideId={id}
          rideStatus={rideStatus}
          arriveAction={handleArrive}
          completeAction={handleComplete}
        />
      </div>
    </div>
  );
}

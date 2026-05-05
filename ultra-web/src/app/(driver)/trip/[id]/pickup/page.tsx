import {
  completeTrip,
  confirmPickup,
  getActiveDriverTrip,
  getRuntimeDriverUserId,
  setDemoRideStatusForDriverFlow,
} from "@/features/driver-trips/actions";
import { PickupConfirmationCard } from "@/features/driver-trips/components/PickupConfirmationCard";
import { SimulationButtons } from "@/features/driver-trips/components/SimulationButtons";
import { redirect } from "next/navigation";

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
  if (driverUserId && query.confirmed === "1") {
    const result = await confirmPickup({
      rideId: id,
      driverUserId,
    });
    if (result.success) {
      redirect(`/trip/${id}`);
    } else {
      console.error("[DriverPickupPage] confirmPickup failed", {
        rideId: id,
        driverUserId,
        error: result.error,
      });
    }
  } else if (!driverUserId && query.confirmed === "1") {
    await setDemoRideStatusForDriverFlow({
      rideId: id,
      status: "in_progress",
    });
    redirect(`/trip/${id}`);
  }

  const trip = await getActiveDriverTrip(id, driverUserId);

  async function handleNoOp() {
    "use server";
    return { success: false, error: "Not applicable" };
  }

  async function handleComplete() {
    "use server";
    if (!driverUserId) return { success: false, error: "No driver session" };
    return completeTrip({ rideId: id, driverUserId, fareFinal: trip.offeredFare });
  }

  return (
    <div>
      <PickupConfirmationCard trip={trip} />
      <div className="px-4 pb-6">
        <SimulationButtons
          rideId={id}
          rideStatus="arrived"
          arriveAction={handleNoOp}
          completeAction={handleComplete}
        />
      </div>
    </div>
  );
}

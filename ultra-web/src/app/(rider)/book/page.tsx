import { getFareEstimate } from "@/features/fare-split/actions";
import { createRide } from "@/features/ride-scheduling/actions";
import { homeLocation, hospitalLocation } from "@/lib/mock-data";
import { redirect } from "next/navigation";
import { BookingClient } from "./BookingClient";

export default async function BookingPage() {
  const estimate = await getFareEstimate();
  const defaultUserId = process.env.ULTRA_DEFAULT_USER_ID;

  async function requestRideAction() {
    "use server";

    let result: Awaited<ReturnType<typeof createRide>>;
    try {
      result = await Promise.race([
        createRide(
          {
            pickup: homeLocation,
            dropoff: hospitalLocation,
          },
          defaultUserId,
        ),
        new Promise<Awaited<ReturnType<typeof createRide>>>((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: false,
                error: "Ride request timed out.",
              }),
            1500,
          ),
        ),
      ]);
    } catch {
      result = {
        success: false,
        error: "Unable to request ride right now.",
      };
    }

    if (!result.success) {
      redirect("/ride/new-ride");
    }

    redirect(`/ride/${result.data.id}`);
  }

  return <BookingClient estimate={estimate} requestRideAction={requestRideAction} />;
}

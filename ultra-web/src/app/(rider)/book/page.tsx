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

    const result = await createRide(
      {
        pickup: homeLocation,
        dropoff: hospitalLocation,
      },
      defaultUserId,
    );

    if (!result.success) {
      redirect("/ride/new-ride");
    }

    redirect(`/ride/${result.data.id}`);
  }

  return <BookingClient estimate={estimate} requestRideAction={requestRideAction} />;
}

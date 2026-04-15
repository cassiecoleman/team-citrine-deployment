import { getFareEstimate } from "@/features/fare-split/actions";
import { createRide } from "@/features/ride-scheduling/actions";
import { createServerAuthClient } from "@/lib/supabase-server";
import { homeLocation, hospitalLocation } from "@/lib/mock-data";
import { redirect } from "next/navigation";
import { BookingClient } from "./BookingClient";

export default async function BookingPage() {
  const estimate = await getFareEstimate();

  async function requestRideAction(formData: FormData) {
    "use server";

    // Get logged-in user from session
    let userId: string | undefined;
    try {
      const supabase = await createServerAuthClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // no session
    }
    // Fall back to env var for dev
    userId = userId ?? process.env.ULTRA_DEFAULT_USER_ID;

    const pickup = {
      lat: Number(formData.get("pickupLat")) || homeLocation.lat,
      lng: Number(formData.get("pickupLng")) || homeLocation.lng,
      address: String(formData.get("pickupAddress") || homeLocation.address),
    };
    const dropoff = {
      lat: Number(formData.get("dropoffLat")) || hospitalLocation.lat,
      lng: Number(formData.get("dropoffLng")) || hospitalLocation.lng,
      address: String(formData.get("dropoffAddress") || hospitalLocation.address),
    };

    let result: Awaited<ReturnType<typeof createRide>>;
    try {
      result = await Promise.race([
        createRide(
          {
            pickup,
            dropoff,
          },
          userId,
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

  return (
    <BookingClient
      estimate={estimate}
      pickup={homeLocation}
      initialDropoff={hospitalLocation}
      requestRideAction={requestRideAction}
    />
  );
}

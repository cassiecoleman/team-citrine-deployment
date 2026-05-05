import { getFareEstimate } from "@/features/fare-split/actions";
import { createRide } from "@/features/ride-scheduling/actions";
import {
  getConfiguredDemoRideId,
  getConfiguredDemoUserId,
} from "@/lib/app-env";
import { createServerAuthClient } from "@/lib/supabase-server";
import { homeLocation, hospitalLocation, officeLocation } from "@/lib/mock-data";
import { redirect } from "next/navigation";
import { BookingClient, type BookingRequestState } from "./BookingClient";

const savedHomeDestination = {
  lat: 35.1277,
  lng: -89.9765,
  address: "2145 Young Ave",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    to?: string;
    address?: string;
    lat?: string;
    lng?: string;
  }>;
}) {
  const query = await searchParams;
  const estimate = await getFareEstimate();
  const customLat = Number(query.lat);
  const customLng = Number(query.lng);
  const hasValidCustomCoordinates =
    Number.isFinite(customLat) && Number.isFinite(customLng);
  const customDestination =
    query.to === "custom" &&
    hasValidCustomCoordinates &&
    typeof query.address === "string" &&
    query.address.trim().length > 0
      ? {
          lat: customLat,
          lng: customLng,
          address: query.address.trim(),
        }
      : null;
  const selectedDropoff =
    customDestination ??
    (query.to === "home"
      ? savedHomeDestination
      : query.to === "hospital"
        ? hospitalLocation
        : officeLocation);

  async function requestRideAction(
    _prevState: BookingRequestState,
    formData: FormData,
  ): Promise<BookingRequestState> {
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
    userId = userId ?? getConfiguredDemoUserId() ?? undefined;

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
      result = await createRide(
        {
          pickup,
          dropoff,
        },
        userId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[requestRideAction] createRide threw", {
        userId,
        pickup,
        dropoff,
        error: message,
      });
      result = {
        success: false,
        error: "Unable to request ride right now.",
      };
    }

    if (!result.success) {
      console.error("[requestRideAction] ride request failed", {
        userId,
        pickup,
        dropoff,
        error: result.error,
      });
      const demoRideId = getConfiguredDemoRideId();
      if (demoRideId) {
        return {
          success: false,
          error: `${result.error} Demo fallback ride is available at /ride/${demoRideId}.`,
        };
      }
      return {
        success: false,
        error: result.error,
      };
    }

    redirect(`/ride/${result.data.id}`);
  }

  return (
    <BookingClient
      estimate={estimate}
      pickup={homeLocation}
      initialDropoff={selectedDropoff}
      requestRideAction={requestRideAction}
    />
  );
}

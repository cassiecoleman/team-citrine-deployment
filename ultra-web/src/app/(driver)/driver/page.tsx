import {
  getDriverShiftSummary,
  toggleDriverAvailability,
} from "@/features/driver-trips/actions";
import { DriverShiftBoard } from "@/features/driver-trips/components/DriverShiftBoard";

export default async function DriverHomePage({
  searchParams,
}: {
  searchParams: Promise<{ availability?: "available" | "offline" }>;
}) {
  const driverUserId =
    process.env.ULTRA_DEFAULT_DRIVER_USER_ID ?? process.env.ULTRA_DEFAULT_USER_ID;
  const params = await searchParams;

  if (
    driverUserId &&
    (params.availability === "available" || params.availability === "offline")
  ) {
    await toggleDriverAvailability({
      driverUserId,
      nextStatus: params.availability,
    });
  }

  const summary = await getDriverShiftSummary(driverUserId);
  const summaryWithFallbackToggle =
    !driverUserId &&
    (params.availability === "available" || params.availability === "offline")
      ? {
          ...summary,
          status: params.availability === "offline" ? "offline" : "online",
        }
      : summary;

  return <DriverShiftBoard summary={summaryWithFallbackToggle} />;
}

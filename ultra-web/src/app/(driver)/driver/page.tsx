import {
  getRuntimeDriverUserId,
  getDriverShiftSummary,
  toggleDriverAvailability,
} from "@/features/driver-trips/actions";
import { DriverShiftBoard } from "@/features/driver-trips/components/DriverShiftBoard";
import type { DriverShiftSummary } from "@/features/driver-trips/types";

export default async function DriverHomePage({
  searchParams,
}: {
  searchParams: Promise<{ availability?: "available" | "offline" }>;
}) {
  const driverUserId = await getRuntimeDriverUserId();
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
  const summaryWithFallbackToggle: DriverShiftSummary =
    !driverUserId &&
    (params.availability === "available" || params.availability === "offline")
      ? {
          ...summary,
          status: params.availability === "offline" ? "offline" : "online",
        }
      : summary;

  return (
    <div className="flex flex-col gap-4">
      <DriverShiftBoard summary={summaryWithFallbackToggle} />
    </div>
  );
}

import {
  getQueuedTrip,
  getRuntimeDriverUserId,
  rejectTrip,
} from "@/features/driver-trips/actions";
import { TripAssignmentCard } from "@/features/driver-trips/components/TripAssignmentCard";

export default async function DriverQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ rejected?: string }>;
}) {
  const driverUserId = await getRuntimeDriverUserId();
  const params = await searchParams;
  const rejectedRideId = params.rejected;

  if (driverUserId && rejectedRideId) {
    await rejectTrip({
      rideId: rejectedRideId,
      driverUserId,
      reason: "Rejected from driver queue UI",
    });
  }

  const assignment = await getQueuedTrip(driverUserId);

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[60vh]">
        <p className="text-4xl">🕐</p>
        <h2 className="text-lg font-semibold">No ride requests right now</h2>
        <p className="text-sm text-muted">Waiting for riders. New requests will appear here.</p>
        <a href="/queue" className="text-sm text-primary font-medium mt-4">↻ Refresh</a>
      </div>
    );
  }

  return (
    <TripAssignmentCard
      assignment={assignment}
      showRejectedNotice={Boolean(rejectedRideId)}
    />
  );
}

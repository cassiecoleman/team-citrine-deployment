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

  return (
    <TripAssignmentCard
      assignment={assignment}
      showRejectedNotice={Boolean(rejectedRideId)}
    />
  );
}

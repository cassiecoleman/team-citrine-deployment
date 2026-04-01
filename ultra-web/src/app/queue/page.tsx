import { getQueuedTrip } from "@/features/driver-trips/actions";
import { TripAssignmentCard } from "@/features/driver-trips/components/TripAssignmentCard";

export default async function DriverQueuePage() {
  const assignment = await getQueuedTrip();

  return <TripAssignmentCard assignment={assignment} />;
}

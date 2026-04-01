import { getQueuedTrip } from "@/features/driver-trips/actions";
import { TripAssignmentCard } from "@/features/driver-trips/components/TripAssignmentCard";
import { DriverScreenHeader } from "../_components/DriverScreenHeader";

export default async function DriverQueuePage() {
  const assignment = await getQueuedTrip();

  return (
    <>
      <DriverScreenHeader
        eyebrow="Driver queue"
        title="Incoming assignment"
        description="Compare fare, trip time, and route details before you accept or reject."
        actions={[
          {
            href: "/driver",
            label: "Back to shift",
          },
          {
            href: `/trip/${assignment.id}`,
            label: "Open active trip",
            variant: "primary",
          },
        ]}
      />
      <TripAssignmentCard assignment={assignment} />
    </>
  );
}

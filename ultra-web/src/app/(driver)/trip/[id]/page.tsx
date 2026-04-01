import { getActiveDriverTrip } from "@/features/driver-trips/actions";
import { TripNavigationView } from "@/features/driver-trips/components/TripNavigationView";
import { DriverScreenHeader } from "../../_components/DriverScreenHeader";

export default async function DriverTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getActiveDriverTrip(id);

  return (
    <>
      <DriverScreenHeader
        eyebrow="Active trip"
        title="Navigation to rider"
        description="Keep the pickup route, rider details, and arrival checklist in view."
        actions={[
          {
            href: "/queue",
            label: "Review queue",
          },
          {
            href: `/trip/${trip.id}/pickup`,
            label: "Arrived at pickup",
            variant: "primary",
          },
        ]}
      />
      <TripNavigationView trip={trip} />
    </>
  );
}

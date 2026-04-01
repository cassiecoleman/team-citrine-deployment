import { getActiveDriverTrip } from "@/features/driver-trips/actions";
import { PickupConfirmationCard } from "@/features/driver-trips/components/PickupConfirmationCard";
import { DriverScreenHeader } from "../../../_components/DriverScreenHeader";

export default async function DriverPickupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getActiveDriverTrip(id);

  return (
    <>
      <DriverScreenHeader
        eyebrow="Pickup check"
        title="Passenger verification"
        description="Confirm the rider name and pin before you start the trip."
        actions={[
          {
            href: `/trip/${trip.id}`,
            label: "Back to map",
          },
          {
            href: `/trip/${trip.id}/pickup`,
            label: "Confirm pickup",
            variant: "primary",
          },
        ]}
      />
      <PickupConfirmationCard trip={trip} />
    </>
  );
}

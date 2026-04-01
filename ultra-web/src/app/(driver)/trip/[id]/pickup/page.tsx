import { getActiveDriverTrip } from "@/features/driver-trips/actions";
import { PickupConfirmationCard } from "@/features/driver-trips/components/PickupConfirmationCard";

export default async function DriverPickupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getActiveDriverTrip(id);

  return <PickupConfirmationCard trip={trip} />;
}

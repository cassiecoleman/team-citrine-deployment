import { getActiveDriverTrip } from "@/features/driver-trips/actions";
import { TripNavigationView } from "@/features/driver-trips/components/TripNavigationView";

export default async function DriverTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getActiveDriverTrip(id);

  return <TripNavigationView trip={trip} />;
}

import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import { LiveMapShell } from "@/features/admin-live-map/components/LiveMapShell";
import {
  getActiveLiveLocations,
  type LiveLocationsResult,
} from "@/features/location/actions";
import { getCurrentUserAndRole } from "@/lib/auth-guards";

const EMPTY: LiveLocationsResult = { riders: [], drivers: [], activeRides: [] };

export default async function AdminLiveMapPage() {
  const auth = await getCurrentUserAndRole();
  let initialLocations: LiveLocationsResult = EMPTY;
  if (auth?.userId) {
    const result = await getActiveLiveLocations(auth.userId);
    if (result.success) {
      initialLocations = result.data;
    }
  }

  return (
    <AdminPageShell
      title="Live Map"
      description="Riders (blue) and drivers (orange) in real time. Dotted lines show the nearest available driver for each rider."
    >
      <LiveMapShell initialLocations={initialLocations} />
    </AdminPageShell>
  );
}

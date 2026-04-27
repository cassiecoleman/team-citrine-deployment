import dynamic from "next/dynamic";

import AdminPageShell from "@/features/admin-dashboard/components/AdminPageShell";
import {
  getActiveLiveLocations,
  type LiveLocationsResult,
} from "@/features/location/actions";
import { getCurrentUserAndRole } from "@/lib/auth-guards";

const LiveMapClient = dynamic(
  () =>
    import("@/features/admin-live-map/components/LiveMapClient").then(
      (mod) => mod.LiveMapClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-xl border border-border bg-primary-light" />
    ),
  },
);

const EMPTY: LiveLocationsResult = { riders: [], drivers: [] };

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
      <LiveMapClient initialLocations={initialLocations} />
    </AdminPageShell>
  );
}

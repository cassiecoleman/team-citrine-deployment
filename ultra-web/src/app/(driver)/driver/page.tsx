import { getDriverShiftSummary } from "@/features/driver-trips/actions";
import { DriverShiftBoard } from "@/features/driver-trips/components/DriverShiftBoard";
import { DriverScreenHeader } from "../_components/DriverScreenHeader";

export default async function DriverHomePage() {
  const summary = await getDriverShiftSummary();

  return (
    <>
      <DriverScreenHeader
        eyebrow="Driver home"
        title="Shift dashboard"
        description="Review earnings, acceptance, and your next pickup before you head out."
        actions={[
          {
            href: "/queue",
            label: "Review queue",
            variant: "primary",
          },
          {
            href: "/trip/trip-204",
            label: "Open active trip",
          },
        ]}
      />
      <DriverShiftBoard summary={summary} />
    </>
  );
}

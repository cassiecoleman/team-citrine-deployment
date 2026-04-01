import { getDriverShiftSummary } from "@/features/driver-trips/actions";
import { DriverShiftBoard } from "@/features/driver-trips/components/DriverShiftBoard";

export default async function DriverHomePage() {
  const summary = await getDriverShiftSummary();

  return <DriverShiftBoard summary={summary} />;
}

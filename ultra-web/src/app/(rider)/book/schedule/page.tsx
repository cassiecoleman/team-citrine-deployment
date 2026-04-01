import { getScheduleDefaults, getRiderProfiles } from "@/features/ride-scheduling/actions";
import { ScheduleForm } from "@/features/ride-scheduling/components/ScheduleForm";

export default async function SchedulePage() {
  const [defaults, profiles] = await Promise.all([
    getScheduleDefaults(),
    getRiderProfiles(),
  ]);
  return (
    <ScheduleForm
      pickup={defaults.pickup}
      dropoff={defaults.dropoff}
      fare={defaults.fare}
      profiles={profiles}
    />
  );
}

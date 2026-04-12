import {
  createRecurringRide,
  getScheduleDefaults,
  getRiderProfiles,
  scheduleRide,
} from "@/features/ride-scheduling/actions";
import { redirect } from "next/navigation";
import { ScheduleForm } from "@/features/ride-scheduling/components/ScheduleForm";

const BY_DAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export default async function SchedulePage() {
  const [defaults, profiles] = await Promise.all([
    getScheduleDefaults(),
    getRiderProfiles(),
  ]);
  const defaultUserId = process.env.ULTRA_DEFAULT_USER_ID;

  async function submitScheduleAction(formData: FormData) {
    "use server";

    const isRecurring = formData.get("isRecurring") === "true";
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");

    if (!date || !time) {
      redirect("/book/schedule");
    }

    const scheduledFor = new Date(`${date}T${time}`).toISOString();

    if (isRecurring) {
      const recurringDaysRaw = String(formData.get("recurringDays") ?? "");
      const recurringDays = recurringDaysRaw
        .split(",")
        .filter(Boolean)
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
      const recurrenceRule = `FREQ=WEEKLY;BYDAY=${recurringDays
        .map((day) => BY_DAY[day])
        .join(",")}`;

      const recurringResult = await createRecurringRide(
        {
          pickup: defaults.pickup,
          dropoff: defaults.dropoff,
          scheduledFor,
          recurrenceRule,
        },
        defaultUserId,
      );

      if (!recurringResult.success) {
        redirect("/book/schedule");
      }

      redirect(`/ride/${recurringResult.data.id}`);
    }

    const result = await scheduleRide(
      {
        pickup: defaults.pickup,
        dropoff: defaults.dropoff,
        scheduledFor,
      },
      defaultUserId,
    );

    if (!result.success) {
      redirect("/book/schedule");
    }

    redirect(`/ride/${result.data.id}`);
  }

  return (
    <ScheduleForm
      pickup={defaults.pickup}
      dropoff={defaults.dropoff}
      fare={defaults.fare}
      profiles={profiles}
      submitScheduleAction={submitScheduleAction}
    />
  );
}

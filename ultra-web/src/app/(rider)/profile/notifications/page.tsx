import { getNotificationPreferences } from "@/features/rider-safety/actions";
import { NotificationSettings } from "@/features/rider-safety/components/NotificationSettings";

export default async function NotificationsPage() {
  const prefs = await getNotificationPreferences();
  return <NotificationSettings preferences={prefs} />;
}

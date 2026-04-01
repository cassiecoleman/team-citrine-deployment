import {
  getEmergencyContacts,
  getTripSharingSettings,
} from "@/features/rider-safety/actions";
import { SafetySettings } from "@/features/rider-safety/components/SafetySettings";

export default async function SafetyPage() {
  const [contacts, sharing] = await Promise.all([
    getEmergencyContacts(),
    getTripSharingSettings(),
  ]);
  return <SafetySettings contacts={contacts} sharing={sharing} />;
}

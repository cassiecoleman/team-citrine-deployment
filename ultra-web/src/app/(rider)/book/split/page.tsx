import { getContacts, getFareEstimate } from "@/features/fare-split/actions";
import { SplitInviteClient } from "./SplitInviteClient";

export default async function SplitFarePage() {
  const [contacts, estimate] = await Promise.all([
    getContacts(),
    getFareEstimate(),
  ]);
  return <SplitInviteClient contacts={contacts} estimate={estimate} />;
}

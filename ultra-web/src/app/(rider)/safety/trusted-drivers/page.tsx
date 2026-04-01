import { getTrustedDrivers } from "@/features/rider-safety/actions";
import { TrustedDriversList } from "@/features/rider-safety/components/TrustedDriversList";

export default async function TrustedDriversPage() {
  const drivers = await getTrustedDrivers();
  return <TrustedDriversList drivers={drivers} />;
}

import { getRideStatus } from "@/features/ride-tracking/actions";
import { RideStatusPage } from "@/features/ride-tracking/components/RideStatusPage";

export default async function RidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ride = await getRideStatus(id);
  return <RideStatusPage ride={ride} />;
}

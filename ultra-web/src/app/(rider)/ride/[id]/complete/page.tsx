import { getRideCompletion } from "@/features/ride-completion/actions";
import { RideCompletePage } from "@/features/ride-completion/components/RideCompletePage";

export default async function CompleteRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getRideCompletion(id);
  return <RideCompletePage data={data} />;
}

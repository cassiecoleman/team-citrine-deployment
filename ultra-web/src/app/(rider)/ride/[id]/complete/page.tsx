import { getRideCompletion } from "@/features/ride-completion/actions";
import { RideCompletePage } from "@/features/ride-completion/components/RideCompletePage";

export default async function CompleteRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const riderUserId = process.env.ULTRA_DEFAULT_USER_ID;
  const data = await getRideCompletion(id, riderUserId);
  return <RideCompletePage data={data} riderUserId={riderUserId} />;
}

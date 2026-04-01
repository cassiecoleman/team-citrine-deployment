import { getActivePass } from "@/features/ride-pass/actions";
import { PassDashboard } from "@/features/ride-pass/components/PassDashboard";
import Link from "next/link";

export default async function ActivePassPage() {
  const pass = await getActivePass();

  if (!pass) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted">No active Ride Pass</p>
        <Link
          href="/passes"
          className="rounded-xl bg-primary px-6 py-3 text-white font-semibold text-sm"
        >
          Browse Passes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PassDashboard pass={pass} />
    </div>
  );
}

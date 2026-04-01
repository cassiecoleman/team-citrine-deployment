import { getRidePassPlans, getSpendingData } from "@/features/ride-pass/actions";
import { PassCard } from "@/features/ride-pass/components/PassCard";
import { SpendingChart } from "@/features/ride-pass/components/SpendingChart";

export default async function RidePassMarketplace() {
  const [plans, spending] = await Promise.all([
    getRidePassPlans(),
    getSpendingData(),
  ]);

  const recommended = plans.find((p) => p.recommended);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Detected route */}
      <div className="text-sm">
        <p className="text-muted mb-1">Your Route</p>
        <p className="font-medium">
          {"\uD83C\uDFE0"} Home → {"\uD83C\uDFE2"} Office
        </p>
        <p className="text-xs text-muted">4.2 mi &middot; ~18 min</p>
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <PassCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* Spending comparison */}
      <SpendingChart spending={spending} selectedPlan={recommended} />
    </div>
  );
}

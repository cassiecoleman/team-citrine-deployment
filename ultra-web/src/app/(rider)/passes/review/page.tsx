import { getRidePassPlans } from "@/features/ride-pass/actions";
import { SubscribeButton } from "@/features/ride-pass/components/SubscribeButton";
import { formatCurrency } from "@/lib/utils";

export default async function PlanReview({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planId } = await searchParams;
  const plans = await getRidePassPlans();
  const plan = plans.find((p) => p.id === planId) ?? plans[0];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Plan header */}
      <div className="text-center">
        <p className="text-lg font-semibold">{"\u2726"} Weekly Commute Pass</p>
      </div>

      {/* Plan details */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <span>{"\uD83D\uDCCD"}</span>
          <span className="text-sm">Home → Office</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span>{"\uD83D\uDCC5"}</span>
          <span className="text-sm">Mon - Fri</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span>{"\uD83D\uDD50"}</span>
          <span className="text-sm">7-9 AM / 5-7 PM</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span>{"\uD83C\uDFAB"}</span>
          <span className="text-sm">{plan.ridesPerWeek} rides included</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span>{"\uD83D\uDEE1\uFE0F"}</span>
          <span className="text-sm">Surge protection</span>
        </div>
      </div>

      {/* Pricing summary */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span>Price</span>
          <span className="font-semibold">{formatCurrency(plan.pricePerWeek)}/week</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span>Billed</span>
          <span>Every Monday</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span>Cancel</span>
          <span>Anytime</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-xl border border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{"\uD83D\uDCB3"}</span>
            <span className="text-sm">Visa ····4821</span>
          </div>
          <button className="text-xs text-primary">[Change method]</button>
        </div>
      </div>

      {/* Subscribe button */}
      <SubscribeButton planId={plan.id} pricePerWeek={plan.pricePerWeek} />
    </div>
  );
}

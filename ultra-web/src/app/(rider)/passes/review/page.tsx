import Link from "next/link";
import { getRidePassPlans } from "@/features/ride-pass/actions";
import { createPassPaymentIntent } from "@/features/payments/actions";
import { PassCheckoutForm } from "@/features/payments/components/PassCheckoutForm";
import { createServerAuthClient } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";

export default async function PlanReview({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planId } = await searchParams;
  const plans = await getRidePassPlans();
  const plan = plans.find((p) => p.id === planId) ?? plans[0];

  // Resolve the signed-in rider (Pre-M2 auth pattern). If there's no
  // session we can't create a PaymentIntent; surface a sign-in prompt.
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const intentResult = user
    ? await createPassPaymentIntent({ planId: plan.id, userId: user.id })
    : null;

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
          <span>One-time weekly payment</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span>Cancel</span>
          <span>Anytime</span>
        </div>
      </div>

      {/* Payment form (or sign-in prompt if not authenticated) */}
      {!user ? (
        <div className="rounded-xl border border-border bg-neutral-50 p-4 text-sm">
          You need to <Link href="/login" className="text-primary underline">sign in</Link> to purchase a pass.
        </div>
      ) : !intentResult?.success ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Unable to start checkout: {intentResult?.error ?? "Unknown error"}.
        </div>
      ) : (
        <PassCheckoutForm
          clientSecret={intentResult.data.clientSecret}
          amountCents={intentResult.data.amountCents}
        />
      )}
    </div>
  );
}

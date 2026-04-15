import Link from "next/link";
import { createSetupIntent } from "@/features/payments/actions";
import { SavePaymentMethodForm } from "@/features/payments/components/SavePaymentMethodForm";
import { createServerAuthClient, createServiceRoleClient } from "@/lib/supabase-server";

export default async function AddPaymentMethodPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-lg font-semibold">{"\u2726"} Add payment method</p>
        <div className="rounded-xl border border-border bg-neutral-50 p-4 text-sm">
          You need to <Link href="/login" className="text-primary underline">sign in</Link> to add a payment method.
        </div>
      </div>
    );
  }

  // Resolve the rider row id from the auth user id.
  const serviceClient = createServiceRoleClient();
  const rider = await serviceClient
    .from("riders")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (rider.error || !rider.data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-lg font-semibold">{"\u2726"} Add payment method</p>
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          No rider profile found for this account.
        </div>
      </div>
    );
  }

  const intent = await createSetupIntent(rider.data.id);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-center">
        <p className="text-lg font-semibold">{"\uD83D\uDCB3"} Add a payment method</p>
        <p className="mt-1 text-sm text-gray-600">
          Your card is saved securely with Stripe. We never see your card number.
        </p>
      </div>

      {!intent.success ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Unable to start setup: {intent.error}
        </div>
      ) : (
        <SavePaymentMethodForm clientSecret={intent.data.clientSecret} />
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { formatCurrency } from "@/lib/utils";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

interface PaymentFormProps {
  clientSecret: string;
  amountCents: number;
  buttonLabel: string;
  /**
   * Called after stripe.confirmPayment() resolves with the PaymentIntent in
   * a terminal success state. Implementations should perform the server-side
   * record (e.g., confirmPassPurchase) and navigate the rider forward.
   */
  onSuccess: (paymentIntentId: string) => Promise<void> | void;
}

export function PaymentForm(props: PaymentFormProps) {
  // Memoize loadStripe so we don't reinitialize on every render.
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  if (!stripePromise) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
        Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in
        your environment.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret }}>
      <InnerPaymentForm
        amountCents={props.amountCents}
        buttonLabel={props.buttonLabel}
        onSuccess={props.onSuccess}
      />
    </Elements>
  );
}

function InnerPaymentForm({
  amountCents,
  buttonLabel,
  onSuccess,
}: {
  amountCents: number;
  buttonLabel: string;
  onSuccess: (paymentIntentId: string) => Promise<void> | void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // `redirect: "if_required"` keeps most payments in-page; Stripe only
    // redirects for 3DS challenges that require it.
    //
    // Billing address is disabled on the PaymentElement (we don't need it
    // for ride-pass purchases), so we pass a minimal `billing_details`
    // here to satisfy Stripe's minimum requirements for card payments.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            // When the Element is configured with fields.billingDetails.address
            // = "never", Stripe requires a complete address here. Riders can't
            // enter one in the form, so we use a placeholder that satisfies
            // Stripe's validation for card payments. If real address-on-file
            // becomes a requirement, flip billingDetails to "auto" or wire a
            // separate address collection step.
            address: {
              line1: "N/A",
              city: "N/A",
              state: "CA",
              postal_code: "00000",
              country: "US",
            },
          },
        },
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      setError(`Payment did not complete (status: ${paymentIntent?.status ?? "unknown"}).`);
      setSubmitting(false);
      return;
    }

    try {
      await onSuccess(paymentIntent.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Payment succeeded but recording failed: ${message}`);
      setSubmitting(false);
    }
  }

  const priceLabel = formatCurrency(amountCents / 100);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement
        options={{
          // Skip address collection (country, postal code, etc). We don't
          // need a billing address on file for ride-pass purchases.
          fields: { billingDetails: { address: "never" } },
          // Expand the accordion immediately so card inputs are visible.
          layout: { type: "accordion", defaultCollapsed: false },
          // Disable digital wallets that require HTTPS + domain verification.
          wallets: { applePay: "never", googlePay: "never" },
          terms: { card: "never" },
        }}
      />

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-xl bg-success py-4 text-white font-semibold text-base transition-opacity disabled:opacity-60"
      >
        {submitting ? "Processing\u2026" : `${buttonLabel} ${priceLabel}`}
      </button>
    </form>
  );
}

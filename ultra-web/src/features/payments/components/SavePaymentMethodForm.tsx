"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { recordSavedPaymentMethod } from "../actions";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

interface SavePaymentMethodFormProps {
  clientSecret: string;
}

/**
 * Thin client-side wrapper over @stripe/react-stripe-js in SetupIntent mode.
 * Rider enters a card; on submit we call stripe.confirmSetup() which
 * attaches the payment method to their Stripe Customer.
 */
export function SavePaymentMethodForm({ clientSecret }: SavePaymentMethodFormProps) {
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
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <InnerForm />
    </Elements>
  );
}

function InnerForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // Mirror PaymentForm's confirm configuration: stub billing address
    // (fields.billingDetails.address is "never" on the Element), in-page
    // confirmation when 3DS isn't required.
    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
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
      setError(confirmError.message ?? "Unable to save payment method.");
      setSubmitting(false);
      return;
    }

    if (setupIntent?.status !== "succeeded") {
      setError(`Setup did not complete (status: ${setupIntent?.status ?? "unknown"}).`);
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id ?? null;

    if (paymentMethodId) {
      await recordSavedPaymentMethod(paymentMethodId);
    }

    setSavedPaymentMethodId(paymentMethodId);
    setSubmitting(false);
  }

  if (savedPaymentMethodId) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800"
      >
        <p>Card saved. You can now use it for ride passes and rides.</p>
        <a href="/profile/payment-methods" className="font-semibold underline">
          View saved payment methods
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement
        options={{
          fields: { billingDetails: { address: "never" } },
          layout: { type: "accordion", defaultCollapsed: false },
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
        {submitting ? "Saving\u2026" : "Save card"}
      </button>
    </form>
  );
}

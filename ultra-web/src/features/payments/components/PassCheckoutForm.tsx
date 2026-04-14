"use client";

import { useRouter } from "next/navigation";
import { PaymentForm } from "./PaymentForm";
import { confirmPassPurchase } from "../actions";

interface PassCheckoutFormProps {
  clientSecret: string;
  amountCents: number;
}

/**
 * Thin pass-specific wrapper around PaymentForm. Handles the post-success
 * side effects: call confirmPassPurchase() to create the ride_passes row,
 * then route the rider to /passes/active.
 */
export function PassCheckoutForm({ clientSecret, amountCents }: PassCheckoutFormProps) {
  const router = useRouter();

  async function handleSuccess(paymentIntentId: string) {
    const result = await confirmPassPurchase({ paymentIntentId });
    if (!result.success) {
      throw new Error(result.error);
    }
    router.push("/passes/active");
  }

  return (
    <PaymentForm
      clientSecret={clientSecret}
      amountCents={amountCents}
      buttonLabel="\u2713 Subscribe"
      onSuccess={handleSuccess}
    />
  );
}

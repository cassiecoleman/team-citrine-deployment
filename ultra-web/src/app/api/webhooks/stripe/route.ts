import { NextResponse } from "next/server";

/**
 * Stripe webhook handler — placeholder.
 *
 * The real handler (signature verification + event dispatch to update the
 * payments and ride_passes tables) is tracked in issue #60. Until then,
 * payment success is recorded optimistically from the client via
 * confirmPassPurchase() and friends after stripe.confirmPayment() resolves.
 *
 * Stripe retries 4xx responses, so we deliberately return 200 here — the
 * events are effectively ignored during the demo phase.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: true,
      message: "Stripe webhook stub — real handler lands in issue #60.",
    },
    { status: 200 }
  );
}

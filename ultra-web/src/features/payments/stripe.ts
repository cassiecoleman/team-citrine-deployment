import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazily initialize a Stripe client using the server-side secret key.
 * Do not import this module from client components — it would leak the
 * secret key into the browser bundle.
 */
export function getStripeClient(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to .env.local (see .env.local.example)."
      );
    }
    cached = new Stripe(key);
  }
  return cached;
}

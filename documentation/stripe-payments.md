# Stripe Payments Architecture

This document describes how Ultra integrates with Stripe. It applies across all payment flows: ride pass purchases, ride fare capture, fare-split invitee payments, and saved payment method management.

## Integration mode: Stripe Elements (embedded)

Ultra uses **Stripe Elements** — Stripe-hosted iframes embedded inside Ultra pages — rather than Stripe Checkout (the `checkout.stripe.com` redirect). Rationale:

- The existing Ultra UI was designed for in-page payment (Subscribe button on `/passes/review`, fare-split receipt on `/ride/[id]/complete`, saved card display in the profile).
- Riders never leave `ultra.app` during a payment, which keeps the visual continuity of the Ultra brand.
- Elements is still PCI-compliant: card numbers are entered inside Stripe's iframe, so raw PANs never touch Ultra's servers.

## Components of the integration

### Stripe Customer

- One Stripe Customer per rider, identified by `riders.stripe_customer_id` (text column, nullable).
- Created **lazily** on the rider's first "add payment method" attempt. Not created at signup.
- Server-side helper: `ensureStripeCustomer(riderId)` (issue #32).

### Payment Intent (one-time payments)

Used for: ride pass purchase, ride fare capture, fare split invitee pay.

Flow:

1. Server action `createPaymentIntent({ riderId, amount, currency, metadata })` creates a PaymentIntent via the Stripe secret key and returns its `client_secret`.
2. Client component `<PaymentForm>` mounts `<PaymentElement />` with that `client_secret`.
3. Rider enters card (or selects saved method) and clicks Pay.
4. Client calls `stripe.confirmPayment()` with a `return_url` of the success page.
5. On success, the client calls server action `recordPaymentSuccess(paymentIntentId)` to mark the local `payments` row captured.
6. Webhook replaces step 5 once issue #38 lands (production hardening).

### Setup Intent (saving a card without a charge)

Used for: adding a payment method to a profile when no immediate payment is due.

Flow:

1. Server action `createSetupIntent(riderId)` creates a SetupIntent and returns its `client_secret`.
2. Client mounts `<PaymentElement />` in setup mode.
3. Rider enters card. On success, `stripe.confirmSetup()` attaches the payment method to the rider's Stripe Customer.
4. Client calls `recordSavedPaymentMethod(paymentMethodId)` so Ultra's backend can sync any local state (currently just a no-op; reserved for future caching).

### Saved payment methods

- Stripe is the source of truth — queried on demand.
- Server action `listPaymentMethods(riderId)` calls `stripe.paymentMethods.list({ customer, type: 'card' })`.
- Default method is tracked via `customer.invoice_settings.default_payment_method`.
- No local `payment_methods` table (yet). Add one later if audit/perf needs arise.

### Webhook handler

**Demo**: stubbed. Client-side `confirmPayment()` return value is the success signal; `recordPaymentSuccess()` updates the DB optimistically.

**Production** (issue #38): `/api/webhooks/stripe/route.ts`
- Verifies signature against `STRIPE_WEBHOOK_SECRET`
- Handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_method.attached`, `payment_method.detached`
- Idempotent upserts against the `payments` table
- Replaces the optimistic client-side recording

## Environment variables

| Variable | Visibility | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server only | Stripe API calls |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client + Server | `loadStripe()` in the browser for Elements |
| `STRIPE_WEBHOOK_SECRET` | Server only | Signature verification (added with issue #38) |

Use Stripe **test mode** keys (`sk_test_...`, `pk_test_...`) throughout development and demo.

## Test cards (Stripe test mode)

| Card number | Behavior |
|---|---|
| `4242 4242 4242 4242` | Succeeds every time |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Declines with `insufficient_funds` |

Any future expiration, any 3-digit CVC, any postal code.

## Data flow summary

```
+----------+              +------------------+        +--------+
|  Rider   | --fills--> | PaymentElement   | --> Stripe
|          |              |  (iframe)        |        +--------+
+----------+              +------------------+             |
     |                           |                         |
     | clicks Pay                | confirmPayment()        |
     v                           v                         |
+------------------+   createPaymentIntent()  +---------+  |
| /passes/review   | ----------------------> | Stripe  |  |
| (server action)  | <--------- client_secret | (API)   |  |
+------------------+                          +---------+  |
     |                                                     |
     | recordPaymentSuccess(pi_id)                         |
     v                                                     |
+------------------+                                       |
| payments table   | <-- (future: webhook replaces this) --+
+------------------+
```

## Related issues

| Issue | Scope |
|---|---|
| #31 | Ride pass purchase via Payment Element |
| #32 | Add a payment method (Setup Intent + lazy Customer) |
| #33 | List saved payment methods |
| #34 | Set default / remove saved payment methods |
| #35 | Use saved default in payment flows |
| #36 | Ride fare capture (authorize + capture + refund) |
| #37 | Fare split invitee payment |
| #38 | Stripe webhook handler (production hardening) |

## Related user stories

- US05 — Lock In a Predictable Weekly Rate
- US06 — Split a Fare with Another Rider
- US26 — Add a Payment Method to My Profile
- US27 — See My Saved Payment Methods
- US28 — Manage My Saved Payment Methods
- US29 — Pay with My Saved Card

-- ============================================================
-- Migration: add_stripe_customer_to_riders
-- Issue: #54 — Add a payment method via Stripe Setup Intents
--
-- Attaches each rider to a Stripe Customer (lazily created the first
-- time they save a payment method). Stripe holds the saved cards;
-- we only track the customer id locally to look them up.
-- ============================================================

ALTER TABLE public.riders
    ADD COLUMN stripe_customer_id TEXT;

-- Fast lookup when resolving a rider from a Stripe webhook event.
CREATE INDEX idx_riders_stripe_customer_id
    ON public.riders(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

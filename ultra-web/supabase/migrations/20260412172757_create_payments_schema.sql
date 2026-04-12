-- ============================================================
-- Migration: create_payments_schema
-- Issue: #14 — Design and create payments and ride passes schema
-- Tables: payments, ride_passes, fare_splits
-- ============================================================

-- ============================================================
-- payments
-- ============================================================
CREATE TABLE public.payments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id                     UUID NOT NULL REFERENCES public.rides(id),
    rider_id                    UUID NOT NULL REFERENCES public.riders(id),
    amount                      NUMERIC(10,2) NOT NULL,
    currency                    TEXT NOT NULL DEFAULT 'usd',
    status                      TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','authorized','captured','refunded','failed')),
    stripe_payment_intent_id    TEXT,
    stripe_charge_id            TEXT,
    payment_method              TEXT DEFAULT 'card'
                                CHECK (payment_method IN ('card','ride_pass','split')),
    failure_reason              TEXT,
    authorized_at               TIMESTAMPTZ,
    captured_at                 TIMESTAMPTZ,
    refunded_at                 TIMESTAMPTZ,
    failed_at                   TIMESTAMPTZ,
    created_by                  UUID REFERENCES auth.users(id),
    updated_by                  UUID REFERENCES auth.users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                  TIMESTAMPTZ,
    version                     INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_payments_ride_id ON public.payments(ride_id);
CREATE INDEX idx_payments_rider_id ON public.payments(rider_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_stripe_pi ON public.payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders read own payments" ON public.payments FOR SELECT
    USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all payments" ON public.payments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Service role full access on payments" ON public.payments FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- ride_passes
-- ============================================================
CREATE TABLE public.ride_passes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id                UUID NOT NULL REFERENCES public.riders(id),
    plan_name               TEXT NOT NULL,
    plan_description        TEXT,
    rides_total             INT NOT NULL,
    rides_remaining         INT NOT NULL,
    price_paid              NUMERIC(10,2) NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','expired','cancelled','exhausted')),
    stripe_subscription_id  TEXT,
    purchased_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at              TIMESTAMPTZ NOT NULL,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    created_by              UUID REFERENCES auth.users(id),
    updated_by              UUID REFERENCES auth.users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    version                 INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_ride_passes_rider_id ON public.ride_passes(rider_id);
CREATE INDEX idx_ride_passes_status ON public.ride_passes(status);

CREATE TRIGGER set_ride_passes_updated_at
    BEFORE UPDATE ON public.ride_passes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.ride_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders manage own passes" ON public.ride_passes FOR ALL
    USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))
    WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all passes" ON public.ride_passes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Service role full access on ride_passes" ON public.ride_passes FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- fare_splits
-- ============================================================
CREATE TABLE public.fare_splits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id         UUID NOT NULL REFERENCES public.rides(id),
    inviter_id      UUID NOT NULL REFERENCES public.riders(id),
    invitee_id      UUID NOT NULL REFERENCES public.riders(id),
    inviter_amount  NUMERIC(10,2) NOT NULL,
    invitee_amount  NUMERIC(10,2) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','declined','expired')),
    responded_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_by      UUID REFERENCES auth.users(id),
    updated_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fare_splits_ride_id ON public.fare_splits(ride_id);

CREATE TRIGGER set_fare_splits_updated_at
    BEFORE UPDATE ON public.fare_splits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.fare_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Split participants manage their splits" ON public.fare_splits FOR ALL
    USING (
        inviter_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
        OR invitee_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    )
    WITH CHECK (
        inviter_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
        OR invitee_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role full access on fare_splits" ON public.fare_splits FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

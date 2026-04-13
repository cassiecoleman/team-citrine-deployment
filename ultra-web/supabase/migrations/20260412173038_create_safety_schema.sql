-- ============================================================
-- Migration: create_safety_schema
-- Issue: #15 — Design and create safety and notifications schema
-- Tables: trusted_drivers, trip_shares, driver_flags
-- Note: notification_preferences already exists from riders schema (#11)
-- ============================================================

-- ============================================================
-- trusted_drivers
-- ============================================================
CREATE TABLE public.trusted_drivers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id    UUID NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
    driver_id   UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    nickname    TEXT,
    created_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE(rider_id, driver_id)
);

CREATE INDEX idx_trusted_drivers_rider_id ON public.trusted_drivers(rider_id);

CREATE TRIGGER set_trusted_drivers_updated_at
    BEFORE UPDATE ON public.trusted_drivers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.trusted_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders manage own trusted drivers" ON public.trusted_drivers FOR ALL
    USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()))
    WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Service role read for matching" ON public.trusted_drivers FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access on trusted_drivers" ON public.trusted_drivers FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- trip_shares
-- ============================================================
CREATE TABLE public.trip_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id         UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    share_token     TEXT NOT NULL UNIQUE,
    recipient_name  TEXT NOT NULL,
    recipient_phone TEXT,
    recipient_email TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    view_count      INT NOT NULL DEFAULT 0,
    last_viewed_at  TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_shares_ride_id ON public.trip_shares(ride_id);
CREATE INDEX idx_trip_shares_token ON public.trip_shares(share_token);

CREATE TRIGGER set_trip_shares_updated_at
    BEFORE UPDATE ON public.trip_shares
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders manage own trip shares" ON public.trip_shares FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.rides
        JOIN public.riders ON riders.id = rides.rider_id
        WHERE rides.id = trip_shares.ride_id AND riders.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.rides
        JOIN public.riders ON riders.id = rides.rider_id
        WHERE rides.id = trip_shares.ride_id AND riders.user_id = auth.uid()
    ));

CREATE POLICY "Service role full access on trip_shares" ON public.trip_shares FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- driver_flags
-- ============================================================
CREATE TABLE public.driver_flags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id       UUID NOT NULL REFERENCES public.drivers(id),
    reporter_id     UUID NOT NULL REFERENCES public.riders(id),
    ride_id         UUID REFERENCES public.rides(id),
    reason          TEXT NOT NULL CHECK (reason IN ('safety','behavior','vehicle','other')),
    details         TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','under_review','resolved','dismissed')),
    admin_notes     TEXT,
    reviewed_by     UUID REFERENCES auth.users(id),
    reviewed_at     TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    created_by      UUID REFERENCES auth.users(id),
    updated_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_flags_driver_id ON public.driver_flags(driver_id);
CREATE INDEX idx_driver_flags_status ON public.driver_flags(status);

CREATE TRIGGER set_driver_flags_updated_at
    BEFORE UPDATE ON public.driver_flags
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.driver_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders create flags" ON public.driver_flags FOR INSERT
    WITH CHECK (reporter_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Riders read own flags" ON public.driver_flags FOR SELECT
    USING (reporter_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage all flags" ON public.driver_flags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Service role full access on driver_flags" ON public.driver_flags FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

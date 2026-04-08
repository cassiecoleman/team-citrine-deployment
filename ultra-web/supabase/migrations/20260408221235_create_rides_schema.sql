-- ============================================================
-- Migration: create_rides_schema
-- Issue: #13 — Design and create rides table schema
-- Tables: rides, ride_stops, ride_status_history, ride_ratings
-- ============================================================

-- ============================================================
-- rides
-- ============================================================
CREATE TABLE public.rides (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id                UUID NOT NULL REFERENCES public.riders(id),
    rider_profile_id        UUID REFERENCES public.rider_profiles(id),
    driver_id               UUID REFERENCES public.drivers(id),
    pickup_lat              DOUBLE PRECISION NOT NULL,
    pickup_lng              DOUBLE PRECISION NOT NULL,
    pickup_address          TEXT NOT NULL,
    dropoff_lat             DOUBLE PRECISION NOT NULL,
    dropoff_lng             DOUBLE PRECISION NOT NULL,
    dropoff_address         TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'requested'
                            CHECK (status IN (
                                'requested','matching','driver_en_route',
                                'arrived','in_progress','completed','cancelled'
                            )),
    fare_estimate           NUMERIC(10,2),
    fare_final              NUMERIC(10,2),
    distance_miles          NUMERIC(10,2),
    estimated_duration_min  INT,
    actual_duration_min     INT,
    cancel_reason           TEXT,
    cancelled_by            UUID REFERENCES auth.users(id),
    scheduled_for           TIMESTAMPTZ,
    is_recurring            BOOLEAN NOT NULL DEFAULT false,
    recurrence_rule         TEXT,
    is_child_safe_required  BOOLEAN NOT NULL DEFAULT false,
    prefer_trusted_driver   BOOLEAN NOT NULL DEFAULT false,
    pin_hash                TEXT,
    pin_attempts            INT NOT NULL DEFAULT 0,
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    matched_at              TIMESTAMPTZ,
    driver_arrived_at       TIMESTAMPTZ,
    pickup_at               TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    created_by              UUID REFERENCES auth.users(id),
    updated_by              UUID REFERENCES auth.users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    version                 INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_rides_rider_id ON public.rides(rider_id);
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_scheduled_for ON public.rides(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE TRIGGER set_rides_updated_at
    BEFORE UPDATE ON public.rides
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders read own rides" ON public.rides FOR SELECT
    USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Riders insert own rides" ON public.rides FOR INSERT
    WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Drivers read assigned rides" ON public.rides FOR SELECT
    USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers update assigned rides" ON public.rides FOR UPDATE
    USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
    WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access on rides" ON public.rides FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins read all rides" ON public.rides FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ============================================================
-- ride_stops
-- ============================================================
CREATE TABLE public.ride_stops (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id     UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    stop_order  INT NOT NULL,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    address     TEXT NOT NULL,
    label       TEXT,
    arrived_at  TIMESTAMPTZ,
    departed_at TIMESTAMPTZ,
    created_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(ride_id, stop_order)
);

CREATE TRIGGER set_ride_stops_updated_at
    BEFORE UPDATE ON public.ride_stops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.ride_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants read stops" ON public.ride_stops FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.rides WHERE rides.id = ride_stops.ride_id
        AND (
            rides.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
            OR rides.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
        )
    ));

CREATE POLICY "Service role full access on ride_stops" ON public.ride_stops FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- ride_status_history
-- ============================================================
CREATE TABLE public.ride_status_history (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id        UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    from_status    TEXT,
    to_status      TEXT NOT NULL,
    changed_by     UUID REFERENCES auth.users(id),
    change_reason  TEXT,
    change_source  TEXT NOT NULL CHECK (change_source IN ('rider','driver','system','admin')),
    changed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ride_status_history_ride_id ON public.ride_status_history(ride_id);

ALTER TABLE public.ride_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants read history" ON public.ride_status_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.rides WHERE rides.id = ride_status_history.ride_id
        AND (
            rides.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
            OR rides.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
        )
    ));

CREATE POLICY "Admins read all history" ON public.ride_status_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Service role full access on ride_status_history" ON public.ride_status_history FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- ride_ratings
-- ============================================================
CREATE TABLE public.ride_ratings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id           UUID NOT NULL UNIQUE REFERENCES public.rides(id) ON DELETE CASCADE,
    rider_id          UUID NOT NULL REFERENCES public.riders(id),
    driver_id         UUID NOT NULL REFERENCES public.drivers(id),
    rider_gave_driver INT CHECK (rider_gave_driver BETWEEN 1 AND 5),
    driver_gave_rider INT CHECK (driver_gave_rider BETWEEN 1 AND 5),
    rider_comment     TEXT,
    driver_comment    TEXT,
    tip_amount        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    rider_submitted   BOOLEAN NOT NULL DEFAULT false,
    driver_submitted  BOOLEAN NOT NULL DEFAULT false,
    created_by        UUID REFERENCES auth.users(id),
    updated_by        UUID REFERENCES auth.users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_ride_ratings_updated_at
    BEFORE UPDATE ON public.ride_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants manage ratings" ON public.ride_ratings FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.rides WHERE rides.id = ride_ratings.ride_id
        AND (
            rides.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
            OR rides.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.rides WHERE rides.id = ride_ratings.ride_id
        AND (
            rides.rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
            OR rides.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
        )
    ));

CREATE POLICY "Service role full access on ride_ratings" ON public.ride_ratings FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

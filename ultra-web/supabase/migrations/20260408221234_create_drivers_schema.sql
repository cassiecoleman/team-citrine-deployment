-- ============================================================
-- Migration: create_drivers_schema
-- Issue: #12 — Design and create drivers table schema
-- Tables: drivers, driver_safety_certs, driver_locations
-- ============================================================

-- ============================================================
-- drivers
-- ============================================================
CREATE TABLE public.drivers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    phone           TEXT,
    avatar_url      TEXT,
    vehicle_make    TEXT,
    vehicle_model   TEXT,
    vehicle_year    INT,
    vehicle_color   TEXT,
    license_plate   TEXT UNIQUE,
    is_child_safe   BOOLEAN NOT NULL DEFAULT false,
    rating          NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    total_ratings   INT NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'offline'
                    CHECK (status IN ('offline', 'available', 'on_trip')),
    created_by      UUID REFERENCES auth.users(id),
    updated_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    version         INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_child_safe ON public.drivers(is_child_safe) WHERE is_child_safe = true;

CREATE TRIGGER set_drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers read own profile" ON public.drivers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Drivers update own profile" ON public.drivers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Riders read driver profiles" ON public.drivers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('rider', 'admin')
    ));

CREATE POLICY "Admins full access on drivers" ON public.drivers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Service role full access on drivers" ON public.drivers FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- driver_safety_certs
-- ============================================================
CREATE TABLE public.driver_safety_certs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id           UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    cert_type           TEXT NOT NULL,
    cert_number         TEXT,
    issuing_authority   TEXT,
    verified_at         TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    verified_by         UUID REFERENCES auth.users(id),
    created_by          UUID REFERENCES auth.users(id),
    updated_by          UUID REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_driver_certs_driver_id ON public.driver_safety_certs(driver_id);

CREATE TRIGGER set_driver_safety_certs_updated_at
    BEFORE UPDATE ON public.driver_safety_certs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.driver_safety_certs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers read own certs" ON public.driver_safety_certs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.drivers WHERE drivers.id = driver_safety_certs.driver_id AND drivers.user_id = auth.uid()
    ));

CREATE POLICY "Admins manage certs" ON public.driver_safety_certs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Service role full access on driver_safety_certs" ON public.driver_safety_certs FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- driver_locations
-- ============================================================
CREATE TABLE public.driver_locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id   UUID NOT NULL UNIQUE REFERENCES public.drivers(id) ON DELETE CASCADE,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    heading     DOUBLE PRECISION,
    speed_mph   DOUBLE PRECISION,
    source      TEXT NOT NULL DEFAULT 'gps' CHECK (source IN ('gps', 'manual', 'simulated')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_driver_locations_updated_at
    BEFORE UPDATE ON public.driver_locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers upsert own location" ON public.driver_locations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.drivers WHERE drivers.id = driver_locations.driver_id AND drivers.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.drivers WHERE drivers.id = driver_locations.driver_id AND drivers.user_id = auth.uid()
    ));

CREATE POLICY "Riders read driver locations" ON public.driver_locations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('rider', 'admin')
    ));

CREATE POLICY "Service role full access on driver_locations" ON public.driver_locations FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

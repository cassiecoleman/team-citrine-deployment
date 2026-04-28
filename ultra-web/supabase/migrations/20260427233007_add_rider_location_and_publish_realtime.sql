-- ============================================================
-- Migration: add_rider_location_and_publish_realtime
--
-- Adds current-location columns to riders so the upcoming admin
-- Live Map tab can plot riders alongside drivers. Drivers continue
-- using the existing driver_locations table.
--
-- Also publishes both location-bearing tables on supabase_realtime
-- so the admin map can subscribe via postgres_changes.
--
-- The existing per-row policies on riders ("Riders update own
-- profile", "Riders read own profile", "Admins read all riders")
-- already cover the new columns — they apply to the row, not to
-- specific columns. The only new access we need is "drivers can
-- see a rider's current location while they have an active
-- assigned ride", which mirrors the rider→driver_locations rule
-- from 20260413162000_tighten_driver_location_rls.sql.
-- ============================================================

ALTER TABLE public.riders
    ADD COLUMN current_lat NUMERIC,
    ADD COLUMN current_lng NUMERIC,
    ADD COLUMN current_location_updated_at TIMESTAMPTZ;

-- Drivers can read the rider row (and therefore the new location
-- columns) only for an active assigned ride. SELECT-only — no
-- UPDATE, INSERT, or DELETE granted.
CREATE POLICY "Drivers read assigned rider for active rides"
    ON public.riders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.rides
        WHERE rides.rider_id = riders.id
          AND rides.status IN ('matching', 'driver_en_route', 'arrived', 'in_progress')
          AND rides.driver_id IN (
              SELECT id FROM public.drivers WHERE user_id = auth.uid()
          )
    ));

-- Publish riders + driver_locations to Realtime so the admin Live
-- Map tab can subscribe to postgres_changes UPDATE events.
ALTER PUBLICATION supabase_realtime ADD TABLE public.riders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

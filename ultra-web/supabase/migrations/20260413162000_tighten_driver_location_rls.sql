-- ============================================================
-- Migration: tighten_driver_location_rls
-- Issue: #28 — Live driver location broadcasting (US08)
-- Purpose: limit rider access to location rows for their active rides only
-- ============================================================

DROP POLICY IF EXISTS "Riders read driver locations" ON public.driver_locations;

CREATE POLICY "Riders read assigned active driver locations"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.rides
    WHERE rides.driver_id = driver_locations.driver_id
      AND rides.status IN ('matching', 'driver_en_route', 'arrived', 'in_progress')
      AND rides.rider_id IN (
        SELECT id FROM public.riders WHERE user_id = auth.uid()
      )
  )
);

CREATE POLICY "Admins read all driver locations"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
  )
);

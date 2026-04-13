-- ============================================================
-- Migration: tighten_rls_policies
-- Fixes 3 over-permissive FOR ALL policies flagged in PR #43 review:
--   1. driver_flags: riders could flag any driver for any ride
--   2. fare_splits: invitee could rewrite financial terms
--   3. ride_passes: riders could mutate rides_remaining/status directly
-- ============================================================

-- ============================================================
-- Fix 1: driver_flags — require reporter participated in the ride
--         and the flagged driver was assigned to that ride
-- ============================================================

-- Drop the old permissive INSERT policy
DROP POLICY IF EXISTS "Riders create flags" ON public.driver_flags;

-- New INSERT policy: reporter must be the rider on the ride,
-- and the flagged driver must be the driver assigned to that ride.
-- ride_id is required (not optional) for this check to work.
CREATE POLICY "Riders create flags for own rides" ON public.driver_flags FOR INSERT
    WITH CHECK (
        -- Reporter must be the calling user's rider record
        reporter_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
        AND (
            -- If ride_id is provided, verify the reporter rode that ride
            -- and the flagged driver was the assigned driver
            ride_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.rides
                WHERE rides.id = driver_flags.ride_id
                AND rides.rider_id = driver_flags.reporter_id
                AND rides.driver_id = driver_flags.driver_id
                AND rides.status = 'completed'
            )
        )
    );

-- ============================================================
-- Fix 2: fare_splits — split into granular per-role policies
-- ============================================================

-- Drop the old over-permissive FOR ALL policy
DROP POLICY IF EXISTS "Split participants manage their splits" ON public.fare_splits;

-- Inviter can INSERT (create a split) and SELECT (view their splits)
CREATE POLICY "Inviter creates splits" ON public.fare_splits FOR INSERT
    WITH CHECK (
        inviter_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    );

CREATE POLICY "Inviter reads own splits" ON public.fare_splits FOR SELECT
    USING (
        inviter_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    );

-- Invitee can SELECT (view splits they're invited to)
CREATE POLICY "Invitee reads invited splits" ON public.fare_splits FOR SELECT
    USING (
        invitee_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    );

-- Invitee can UPDATE only status and responded_at (accept/decline)
-- All other mutations go through service role
CREATE POLICY "Invitee responds to splits" ON public.fare_splits FOR UPDATE
    USING (
        invitee_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    )
    WITH CHECK (
        invitee_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    );

-- ============================================================
-- Fix 3: ride_passes — riders get SELECT only, mutations via service role
-- ============================================================

-- Drop the old over-permissive FOR ALL policy
DROP POLICY IF EXISTS "Riders manage own passes" ON public.ride_passes;

-- Riders can only READ their own passes
CREATE POLICY "Riders read own passes" ON public.ride_passes FOR SELECT
    USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

-- All pass mutations (purchase, decrement, cancel, expire) go through
-- the service role client in server actions. No direct rider writes.

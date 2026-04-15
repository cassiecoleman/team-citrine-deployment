-- ============================================================
-- Migration: enable_realtime_on_rides
--
-- Enables Supabase Realtime publication on the rides table so admin
-- pages can subscribe to ride state changes (status transitions,
-- driver assignments, etc.) and refresh live without polling.
--
-- Consumers today:
--   - /admin/rides (active rides table, auto-refresh on any change)
--   - /admin/requests (pending requests table, auto-refresh)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;

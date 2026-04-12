-- ============================================================
-- Migration: guard_fare_split_invitee_updates
-- Fixes remaining PR #43 blocker:
--   invitees could still rewrite fare split financial fields because
--   RLS WITH CHECK does not limit which columns change on UPDATE.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_fare_split_invitee_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Service role updates are trusted and may adjust any fields.
    IF auth.jwt()->>'role' = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Non-service callers may only respond to an existing invite.
    IF NEW.invitee_id IS DISTINCT FROM OLD.invitee_id THEN
        RAISE EXCEPTION 'invitee_id is immutable';
    END IF;

    IF NEW.inviter_id IS DISTINCT FROM OLD.inviter_id THEN
        RAISE EXCEPTION 'inviter_id is immutable';
    END IF;

    IF NEW.ride_id IS DISTINCT FROM OLD.ride_id THEN
        RAISE EXCEPTION 'ride_id is immutable';
    END IF;

    IF NEW.inviter_amount IS DISTINCT FROM OLD.inviter_amount THEN
        RAISE EXCEPTION 'inviter_amount is immutable';
    END IF;

    IF NEW.invitee_amount IS DISTINCT FROM OLD.invitee_amount THEN
        RAISE EXCEPTION 'invitee_amount is immutable';
    END IF;

    IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
        RAISE EXCEPTION 'expires_at is immutable';
    END IF;

    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
        RAISE EXCEPTION 'created_by is immutable';
    END IF;

    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'created_at is immutable';
    END IF;

    IF OLD.status <> 'pending' THEN
        RAISE EXCEPTION 'only pending fare splits can be updated by invitees';
    END IF;

    IF NEW.status NOT IN ('accepted', 'declined') THEN
        RAISE EXCEPTION 'invitees may only accept or decline fare splits';
    END IF;

    IF NEW.responded_at IS NULL THEN
        RAISE EXCEPTION 'responded_at is required when invitees respond to fare splits';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_fare_split_invitee_response ON public.fare_splits;

CREATE TRIGGER enforce_fare_split_invitee_response
    BEFORE UPDATE ON public.fare_splits
    FOR EACH ROW EXECUTE FUNCTION public.enforce_fare_split_invitee_response();

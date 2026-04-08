-- ============================================================
-- Migration: create_riders_schema
-- Issue: #11 — Design and create riders table schema
-- Tables: user_roles, riders, rider_profiles, emergency_contacts, notification_preferences
-- ============================================================

-- Auto-update trigger function (shared by all tables)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- user_roles
-- ============================================================
CREATE TABLE public.user_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('rider', 'driver', 'admin')),
    created_by  UUID REFERENCES auth.users(id),
    updated_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    version     INT NOT NULL DEFAULT 1
);

CREATE TRIGGER set_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins read all roles"
    ON public.user_roles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ));

CREATE POLICY "Service role full access"
    ON public.user_roles FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- riders
-- ============================================================
CREATE TABLE public.riders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT,
    avatar_url  TEXT,
    created_by  UUID REFERENCES auth.users(id),
    updated_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    version     INT NOT NULL DEFAULT 1
);

CREATE TRIGGER set_riders_updated_at
    BEFORE UPDATE ON public.riders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders read own profile"
    ON public.riders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Riders update own profile"
    ON public.riders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all riders"
    ON public.riders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Service role full access on riders"
    ON public.riders FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- rider_profiles (child profiles under a rider account)
-- ============================================================
CREATE TABLE public.rider_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id    UUID NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    photo_url   TEXT,
    is_child    BOOLEAN NOT NULL DEFAULT false,
    notes       TEXT,
    created_by  UUID REFERENCES auth.users(id),
    updated_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    version     INT NOT NULL DEFAULT 1
);

CREATE TRIGGER set_rider_profiles_updated_at
    BEFORE UPDATE ON public.rider_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders manage own child profiles"
    ON public.rider_profiles FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.riders
        WHERE riders.id = rider_profiles.rider_id AND riders.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.riders
        WHERE riders.id = rider_profiles.rider_id AND riders.user_id = auth.uid()
    ));

CREATE POLICY "Service role full access on rider_profiles"
    ON public.rider_profiles FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- emergency_contacts
-- ============================================================
CREATE TABLE public.emergency_contacts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_profile_id  UUID NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    phone             TEXT NOT NULL,
    relationship      TEXT,
    is_primary        BOOLEAN NOT NULL DEFAULT false,
    created_by        UUID REFERENCES auth.users(id),
    updated_by        UUID REFERENCES auth.users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

CREATE TRIGGER set_emergency_contacts_updated_at
    BEFORE UPDATE ON public.emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders manage contacts for own profiles"
    ON public.emergency_contacts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.rider_profiles
        JOIN public.riders ON riders.id = rider_profiles.rider_id
        WHERE rider_profiles.id = emergency_contacts.rider_profile_id
        AND riders.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.rider_profiles
        JOIN public.riders ON riders.id = rider_profiles.rider_id
        WHERE rider_profiles.id = emergency_contacts.rider_profile_id
        AND riders.user_id = auth.uid()
    ));

CREATE POLICY "Service role full access on emergency_contacts"
    ON public.emergency_contacts FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- notification_preferences
-- ============================================================
CREATE TABLE public.notification_preferences (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    sms_enabled   BOOLEAN NOT NULL DEFAULT true,
    push_enabled  BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_by    UUID REFERENCES auth.users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prefs"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on notification_preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

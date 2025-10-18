-- Scam Dunk Supabase bootstrap
-- Run this once against the target Supabase project (SQL Editor or psql)

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table expected by the Express API
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    first_name text,
    last_name text,
    phone text,
    role text NOT NULL DEFAULT 'user',
    preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    profile jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Scans table used for comprehensive scans
CREATE TABLE IF NOT EXISTS public.scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    type text,
    status text DEFAULT 'PROCESSING',
    input jsonb,
    result jsonb,
    processing_started_at timestamptz,
    processing_ended_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans (user_id);

-- Contact verification history written by /api/contact-verification
CREATE TABLE IF NOT EXISTS public.contact_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    contact_type text NOT NULL,
    contact_value text NOT NULL,
    is_scammer boolean NOT NULL DEFAULT false,
    risk_score numeric(5,2),
    risk_level text,
    confidence integer,
    verification_sources jsonb DEFAULT '[]'::jsonb,
    flags jsonb DEFAULT '[]'::jsonb,
    recommendations text[] DEFAULT array[]::text[],
    recorded_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_contact_verifications_user ON public.contact_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_verifications_value ON public.contact_verifications (contact_value);

-- Telemetry log for detection requests
CREATE TABLE IF NOT EXISTS public.detection_telemetry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route text NOT NULL,
    user_id uuid,
    created_at timestamptz NOT NULL,
    duration_ms integer NOT NULL,
    cached boolean NOT NULL,
    success boolean NOT NULL,
    status_code integer NOT NULL,
    error text,
    metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_detection_telemetry_route ON public.detection_telemetry (route);
CREATE INDEX IF NOT EXISTS idx_detection_telemetry_user ON public.detection_telemetry (user_id);
CREATE INDEX IF NOT EXISTS idx_detection_telemetry_created_at ON public.detection_telemetry (created_at DESC);

-- Minimal seed (optional)
INSERT INTO public.users (email, password_hash, first_name, last_name, role)
VALUES ('admin@scamdunk.com', '$2a$12$P28G.YCdMYvuVHMXaQrHNeHJ8d731XmdxAxKm0h0PmiEy62PPSfUy', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Helper to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_scans_updated_at') THEN
    CREATE TRIGGER set_scans_updated_at
    BEFORE UPDATE ON public.scans
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

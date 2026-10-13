-- Gut Audit: private 60-day gut log at teambenlee.com/gut.
-- One JSON document per local day (shape in the build spec, section 4.1). Owner-only, and only
-- accounts on the gut_access allowlist can read or write, so a normal Dailys/coaching login sees nothing.

CREATE TABLE IF NOT EXISTS gut_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gut_days (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- local calendar date, never converted from UTC
  doc JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS gut_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  doc JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SECURITY DEFINER so policies can check the allowlist without recursing through RLS
CREATE OR REPLACE FUNCTION public.has_gut_access()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM gut_access WHERE user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.has_gut_access() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_gut_access() TO authenticated;

ALTER TABLE gut_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE gut_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE gut_config ENABLE ROW LEVEL SECURITY;

-- Allowlist: you can see your own row (so the app can tell you're in). No write policies:
-- access is granted from the Supabase dashboard / SQL only.
CREATE POLICY "gut access: read own" ON gut_access FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "gut days: select" ON gut_days FOR SELECT USING (user_id = auth.uid() AND public.has_gut_access());
CREATE POLICY "gut days: insert" ON gut_days FOR INSERT WITH CHECK (user_id = auth.uid() AND public.has_gut_access());
CREATE POLICY "gut days: update" ON gut_days FOR UPDATE
  USING (user_id = auth.uid() AND public.has_gut_access())
  WITH CHECK (user_id = auth.uid() AND public.has_gut_access());
CREATE POLICY "gut days: delete" ON gut_days FOR DELETE USING (user_id = auth.uid() AND public.has_gut_access());

CREATE POLICY "gut config: select" ON gut_config FOR SELECT USING (user_id = auth.uid() AND public.has_gut_access());
CREATE POLICY "gut config: insert" ON gut_config FOR INSERT WITH CHECK (user_id = auth.uid() AND public.has_gut_access());
CREATE POLICY "gut config: update" ON gut_config FOR UPDATE
  USING (user_id = auth.uid() AND public.has_gut_access())
  WITH CHECK (user_id = auth.uid() AND public.has_gut_access());

CREATE OR REPLACE FUNCTION public.gut_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER gut_days_touch BEFORE UPDATE ON gut_days
  FOR EACH ROW EXECUTE FUNCTION public.gut_touch_updated_at();
CREATE TRIGGER gut_config_touch BEFORE UPDATE ON gut_config
  FOR EACH ROW EXECUTE FUNCTION public.gut_touch_updated_at();

-- First (and only) allowlisted account: Ben.
INSERT INTO gut_access (user_id)
SELECT id FROM auth.users WHERE email = 'ben@benlee.ventures'
ON CONFLICT DO NOTHING;

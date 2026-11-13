-- Polar sync: stores the Polar AccessLink token for the Gut Audit owner so a daily cron can pull
-- sleep, Nightly Recharge, steps and workouts into Gut Audit and Dailys.
-- Same pattern as gut_ingest: RLS on with no policies, and two SECURITY DEFINER functions that only
-- work with a valid gut token (gut_token_user). The Polar token is never readable through the API
-- without that key.

CREATE TABLE IF NOT EXISTS polar_links (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

ALTER TABLE polar_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.polar_link_save(p_token TEXT, p_polar_user TEXT, p_access TEXT, p_expires TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := public.gut_token_user(p_token);
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  INSERT INTO polar_links (user_id, polar_user_id, access_token, expires_at)
  VALUES (uid, p_polar_user, p_access, p_expires)
  ON CONFLICT (user_id) DO UPDATE
    SET polar_user_id = EXCLUDED.polar_user_id, access_token = EXCLUDED.access_token,
        expires_at = EXCLUDED.expires_at, connected_at = NOW();
  RETURN true;
END;
$$;

-- Returns {"ok": false} for a bad token, {"ok": true} with no access_token when not connected.
CREATE OR REPLACE FUNCTION public.polar_link_get(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := public.gut_token_user(p_token);
  link polar_links%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT * INTO link FROM polar_links WHERE user_id = uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true); END IF;
  UPDATE polar_links SET last_sync_at = NOW() WHERE user_id = uid;
  RETURN jsonb_build_object('ok', true, 'access_token', link.access_token, 'polar_user_id', link.polar_user_id,
                            'expires_at', link.expires_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.polar_link_save(TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM public;
REVOKE EXECUTE ON FUNCTION public.polar_link_get(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.polar_link_save(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.polar_link_get(TEXT) TO anon;

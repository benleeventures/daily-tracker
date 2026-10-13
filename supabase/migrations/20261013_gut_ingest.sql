-- Gut Audit ingest: lets an outside tool (Instinct) push a daily note with a bare token, no Supabase login
-- and no service key. Only a SHA-256 hash of each token is stored. The token is checked inside two
-- SECURITY DEFINER functions that can only read and write that token owner's gut_days rows.

CREATE TABLE IF NOT EXISTS gut_tokens (
  token_hash TEXT PRIMARY KEY, -- hex sha256 of the token; the token itself is never stored
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- RLS on with no policies: the API can't read or list tokens. Manage them from the dashboard / SQL.
ALTER TABLE gut_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.gut_token_user(p_token TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.user_id
  FROM gut_tokens t
  JOIN gut_access a ON a.user_id = t.user_id
  WHERE t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;
REVOKE EXECUTE ON FUNCTION public.gut_token_user(TEXT) FROM anon, authenticated, public;

-- Returns {"ok": false} for a bad token, else {"ok": true, "doc": {...}} ({} if the day has no entry yet).
CREATE OR REPLACE FUNCTION public.gut_ingest_read(p_token TEXT, p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := public.gut_token_user(p_token);
  existing JSONB;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT doc INTO existing FROM gut_days WHERE user_id = uid AND date = p_date;
  RETURN jsonb_build_object('ok', true, 'doc', COALESCE(existing, '{}'::jsonb));
END;
$$;

-- Returns true when written, false for a bad token or an out-of-range request.
CREATE OR REPLACE FUNCTION public.gut_ingest_write(p_token TEXT, p_date DATE, p_doc JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := public.gut_token_user(p_token);
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF p_date < DATE '2026-01-01' OR p_date > CURRENT_DATE + 1 THEN RETURN false; END IF;
  IF pg_column_size(p_doc) > 200000 THEN RETURN false; END IF;
  INSERT INTO gut_days (user_id, date, doc) VALUES (uid, p_date, p_doc)
  ON CONFLICT (user_id, date) DO UPDATE SET doc = EXCLUDED.doc;
  UPDATE gut_tokens SET last_used_at = NOW()
  WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  RETURN true;
END;
$$;

-- The ingest route calls these with the public anon key (no session), so only anon needs them
REVOKE EXECUTE ON FUNCTION public.gut_ingest_read(TEXT, DATE) FROM public;
REVOKE EXECUTE ON FUNCTION public.gut_ingest_write(TEXT, DATE, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.gut_ingest_read(TEXT, DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.gut_ingest_write(TEXT, DATE, JSONB) TO anon;

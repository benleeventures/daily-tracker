-- WhatsApp brief summary for Instinct: a read-only key that returns the latest brief, so Instinct can paste
-- the top 3 into its 4:30pm message. Write keys (the Mac scan) and read keys are kept apart by scope.

ALTER TABLE wa_tokens ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'write' CHECK (scope IN ('write', 'read'));

CREATE OR REPLACE FUNCTION public.wa_brief_ingest(p_token TEXT, p_doc JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  hash TEXT := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  uid UUID;
BEGIN
  SELECT t.user_id INTO uid FROM wa_tokens t JOIN gut_access a ON a.user_id = t.user_id
  WHERE t.token_hash = hash AND t.scope = 'write';
  IF uid IS NULL THEN RETURN false; END IF;
  IF pg_column_size(p_doc) > 200000 THEN RETURN false; END IF;
  INSERT INTO wa_briefs (user_id, doc) VALUES (uid, p_doc);
  UPDATE wa_tokens SET last_used_at = NOW() WHERE token_hash = hash;
  RETURN true;
END;
$$;

-- Returns {"ok": false} for a bad key, else {"ok": true, "doc": latest brief or null}.
CREATE OR REPLACE FUNCTION public.wa_brief_latest(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  hash TEXT := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  uid UUID;
  latest JSONB;
BEGIN
  SELECT t.user_id INTO uid FROM wa_tokens t JOIN gut_access a ON a.user_id = t.user_id
  WHERE t.token_hash = hash AND t.scope = 'read';
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT doc INTO latest FROM wa_briefs WHERE user_id = uid ORDER BY created_at DESC LIMIT 1;
  UPDATE wa_tokens SET last_used_at = NOW() WHERE token_hash = hash;
  RETURN jsonb_build_object('ok', true, 'doc', latest);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.wa_brief_latest(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.wa_brief_latest(TEXT) TO anon;

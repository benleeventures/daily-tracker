-- WhatsApp brief: a scheduled scan on Ben's Mac reads WhatsApp Web, sorts unread chats into buckets with
-- draft replies, and posts the result here. Only accounts on the gut_access allowlist (Ben) can read it,
-- because chat previews are private. Writes come in with a bare token checked inside a SECURITY DEFINER
-- function, same pattern as gut_tokens: only a SHA-256 hash is stored, no service key in Vercel.

CREATE TABLE IF NOT EXISTS wa_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  doc JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS wa_briefs_user_created ON wa_briefs (user_id, created_at DESC);

ALTER TABLE wa_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa briefs: select" ON wa_briefs FOR SELECT USING (user_id = auth.uid() AND public.has_gut_access());

CREATE TABLE IF NOT EXISTS wa_tokens (
  token_hash TEXT PRIMARY KEY, -- hex sha256 of the token; the token itself is never stored
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);
-- RLS on with no policies: the API can't read or list tokens. Manage them from SQL.
ALTER TABLE wa_tokens ENABLE ROW LEVEL SECURITY;

-- Returns true when stored, false for a bad token or an oversized brief.
CREATE OR REPLACE FUNCTION public.wa_brief_ingest(p_token TEXT, p_doc JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  hash TEXT := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  uid UUID;
BEGIN
  SELECT t.user_id INTO uid FROM wa_tokens t JOIN gut_access a ON a.user_id = t.user_id WHERE t.token_hash = hash;
  IF uid IS NULL THEN RETURN false; END IF;
  IF pg_column_size(p_doc) > 200000 THEN RETURN false; END IF;
  INSERT INTO wa_briefs (user_id, doc) VALUES (uid, p_doc);
  UPDATE wa_tokens SET last_used_at = NOW() WHERE token_hash = hash;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.wa_brief_ingest(TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.wa_brief_ingest(TEXT, JSONB) TO anon;

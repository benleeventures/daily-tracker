-- Connection point so Instinct can push a day's note into Dailys (same pattern as the Gut Audit import).
-- The access key is stored only as a sha256 hash. Tokens and imports are reachable only through the
-- SECURITY DEFINER functions below: RLS is on with no policies, so the anon role can't read them directly.

CREATE TABLE IF NOT EXISTS public.dailies_tokens (
  token_hash   text PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
ALTER TABLE public.dailies_tokens ENABLE ROW LEVEL SECURITY;

-- One row per note already imported, so resending the same note changes nothing.
CREATE TABLE IF NOT EXISTS public.dailies_imports (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_hash   text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, note_hash)
);
ALTER TABLE public.dailies_imports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.dailies_token_user(p_token text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.user_id FROM dailies_tokens t
  WHERE t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

-- Returns that day's entry and meetings, and whether this exact note was already imported.
CREATE OR REPLACE FUNCTION public.dailies_ingest_read(p_token text, p_date text, p_hash text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := public.dailies_token_user(p_token);
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'seen', EXISTS (SELECT 1 FROM dailies_imports WHERE user_id = uid AND note_hash = p_hash),
    'entry', (SELECT to_jsonb(e) FROM daily_entries e WHERE e.user_id = uid AND e.date = p_date),
    'meetings', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.created_at) FROM meetings m WHERE m.user_id = uid AND m.date = p_date), '[]'::jsonb)
  );
END;
$$;

-- Writes the merged result in one transaction. p_entry is null when the note had no day fields or tasks.
-- p_meetings is an array of {id, person, notes, granola_link, action_items}; an existing id is updated, a new one inserted.
CREATE OR REPLACE FUNCTION public.dailies_ingest_write(p_token text, p_date text, p_hash text, p_entry jsonb, p_meetings jsonb)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := public.dailies_token_user(p_token);
  m jsonb;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF p_date !~ '^\d{4}-\d{2}-\d{2}$' THEN RETURN false; END IF;
  IF p_date < '2026-01-01' OR p_date > to_char(CURRENT_DATE + 1, 'YYYY-MM-DD') THEN RETURN false; END IF;
  IF pg_column_size(COALESCE(p_entry, '{}'::jsonb)) + pg_column_size(COALESCE(p_meetings, '[]'::jsonb)) > 400000 THEN RETURN false; END IF;

  IF p_entry IS NOT NULL THEN
    INSERT INTO daily_entries (user_id, date, reflection, energy, observations, habits, tasks, updated_at)
    VALUES (
      uid, p_date,
      COALESCE(p_entry->>'reflection', ''),
      COALESCE(p_entry->>'energy', ''),
      COALESCE(p_entry->>'observations', ''),
      COALESCE(p_entry->'habits', '{}'::jsonb),
      COALESCE(p_entry->'tasks', '[]'::jsonb),
      now()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      reflection = EXCLUDED.reflection,
      energy = EXCLUDED.energy,
      observations = EXCLUDED.observations,
      habits = EXCLUDED.habits,
      tasks = EXCLUDED.tasks,
      updated_at = now();
  END IF;

  FOR m IN SELECT * FROM jsonb_array_elements(COALESCE(p_meetings, '[]'::jsonb)) LOOP
    IF EXISTS (SELECT 1 FROM meetings WHERE id = (m->>'id')::uuid AND user_id = uid) THEN
      UPDATE meetings SET
        notes = COALESCE(m->>'notes', ''),
        granola_link = COALESCE(m->>'granola_link', ''),
        action_items = COALESCE(m->'action_items', '[]'::jsonb),
        updated_at = now()
      WHERE id = (m->>'id')::uuid AND user_id = uid;
    ELSE
      INSERT INTO meetings (id, user_id, date, person, notes, granola_link, action_items)
      VALUES (
        (m->>'id')::uuid, uid, p_date, m->>'person',
        COALESCE(m->>'notes', ''), COALESCE(m->>'granola_link', ''), COALESCE(m->'action_items', '[]'::jsonb)
      );
    END IF;
  END LOOP;

  INSERT INTO dailies_imports (user_id, note_hash) VALUES (uid, p_hash) ON CONFLICT DO NOTHING;
  UPDATE dailies_tokens SET last_used_at = now()
  WHERE token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.dailies_token_user(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dailies_ingest_read(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dailies_ingest_write(text, text, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dailies_ingest_read(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dailies_ingest_write(text, text, text, jsonb, jsonb) TO anon, authenticated;

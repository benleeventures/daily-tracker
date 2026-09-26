-- Action items (shared between coach and client), session notes (coach writes, client reads),
-- and leads from the public Energy Audit (anyone can submit, only the coach can read).

CREATE TABLE IF NOT EXISTS coaching_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  due_date DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  recording_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS energy_audit_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT '',
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 254),
  note TEXT DEFAULT '' CHECK (length(note) <= 4000),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(answers) < 100000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_action_items_client ON coaching_action_items(client_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_client ON coaching_sessions(client_id, session_date DESC);

ALTER TABLE coaching_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_audit_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action items: client or coach reads" ON coaching_action_items FOR SELECT
  USING (client_id = auth.uid() OR public.is_coach());
CREATE POLICY "action items: client or coach adds" ON coaching_action_items FOR INSERT
  WITH CHECK (client_id = auth.uid() OR public.is_coach());
CREATE POLICY "action items: client or coach updates" ON coaching_action_items FOR UPDATE
  USING (client_id = auth.uid() OR public.is_coach())
  WITH CHECK (client_id = auth.uid() OR public.is_coach());
CREATE POLICY "action items: client or coach deletes" ON coaching_action_items FOR DELETE
  USING (client_id = auth.uid() OR public.is_coach());

CREATE POLICY "sessions: client or coach reads" ON coaching_sessions FOR SELECT
  USING (client_id = auth.uid() OR public.is_coach());
CREATE POLICY "sessions: coach inserts" ON coaching_sessions FOR INSERT WITH CHECK (public.is_coach());
CREATE POLICY "sessions: coach updates" ON coaching_sessions FOR UPDATE USING (public.is_coach()) WITH CHECK (public.is_coach());
CREATE POLICY "sessions: coach deletes" ON coaching_sessions FOR DELETE USING (public.is_coach());

-- Public lead magnet: anyone may submit; nobody but the coach can read back.
CREATE POLICY "leads: anyone submits" ON energy_audit_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "leads: coach reads" ON energy_audit_leads FOR SELECT TO authenticated USING (public.is_coach());

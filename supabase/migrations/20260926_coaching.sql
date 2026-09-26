-- Coaching portal: clients, assignments, and exercise responses.
-- Exercise content itself lives in code (app/coaching/exercises.ts); the DB only stores who's doing what.

CREATE TABLE IF NOT EXISTS coaching_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'coach')),
  name TEXT DEFAULT '',
  focus TEXT DEFAULT '', -- coach-written "this season" focus shown at the top of the client's hub
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coaching_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_slug TEXT NOT NULL,
  due_date DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, exercise_slug)
);

CREATE TABLE IF NOT EXISTS coaching_responses (
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_slug TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  coach_comment TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, exercise_slug)
);

-- SECURITY DEFINER so policies can check the caller's role without recursing through RLS
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM coaching_profiles WHERE user_id = auth.uid() AND role = 'coach');
$$;

ALTER TABLE coaching_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_responses ENABLE ROW LEVEL SECURITY;

-- Profiles: you see yours, the coach sees all. Anyone signed in can create their own client row;
-- only the coach can change roles or write focus.
CREATE POLICY "profiles: read own or coach" ON coaching_profiles FOR SELECT
  USING (user_id = auth.uid() OR public.is_coach());
CREATE POLICY "profiles: create own as client" ON coaching_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() AND role = 'client');
CREATE POLICY "profiles: coach updates" ON coaching_profiles FOR UPDATE
  USING (public.is_coach()) WITH CHECK (public.is_coach());

-- Assignments: clients read theirs; only the coach writes.
CREATE POLICY "assignments: read own or coach" ON coaching_assignments FOR SELECT
  USING (client_id = auth.uid() OR public.is_coach());
CREATE POLICY "assignments: coach inserts" ON coaching_assignments FOR INSERT
  WITH CHECK (public.is_coach());
CREATE POLICY "assignments: coach updates" ON coaching_assignments FOR UPDATE
  USING (public.is_coach()) WITH CHECK (public.is_coach());
CREATE POLICY "assignments: coach deletes" ON coaching_assignments FOR DELETE
  USING (public.is_coach());

-- Responses: clients read/write their own; the coach reads all and can comment.
CREATE POLICY "responses: read own or coach" ON coaching_responses FOR SELECT
  USING (client_id = auth.uid() OR public.is_coach());
CREATE POLICY "responses: client inserts own" ON coaching_responses FOR INSERT
  WITH CHECK (client_id = auth.uid());
CREATE POLICY "responses: client or coach updates" ON coaching_responses FOR UPDATE
  USING (client_id = auth.uid() OR public.is_coach())
  WITH CHECK (client_id = auth.uid() OR public.is_coach());

CREATE OR REPLACE FUNCTION public.coaching_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER coaching_responses_touch
  BEFORE UPDATE ON coaching_responses
  FOR EACH ROW EXECUTE FUNCTION public.coaching_touch_updated_at();

-- Clients can set their own display name without being able to touch role/focus.
CREATE OR REPLACE FUNCTION public.set_my_coaching_name(new_name TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE coaching_profiles SET name = left(trim(new_name), 80) WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.set_my_coaching_name(TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_my_coaching_name(TEXT) TO authenticated;

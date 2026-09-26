-- The live DB was created from MINIMAL.sql, which skipped RLS. Without it, the public anon key
-- (shipped in the client bundle) could read and write every user's entries and meetings.

CREATE POLICY "own daily entries: select" ON daily_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own daily entries: insert" ON daily_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily entries: update" ON daily_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily entries: delete" ON daily_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "own meetings: select" ON meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own meetings: insert" ON meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own meetings: update" ON meetings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own meetings: delete" ON meetings FOR DELETE USING (auth.uid() = user_id);
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

REVOKE EXECUTE ON FUNCTION public.is_coach() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_coach() TO authenticated;

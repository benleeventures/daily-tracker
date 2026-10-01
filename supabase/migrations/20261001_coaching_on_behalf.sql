-- Coach can create clients (via the coaching-add-client edge function) and fill exercises in on
-- their behalf, so responses can be inserted by the coach for any client.
ALTER TABLE coaching_profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
DROP POLICY IF EXISTS "responses: client inserts own" ON coaching_responses;
CREATE POLICY "responses: client or coach inserts" ON coaching_responses FOR INSERT
  WITH CHECK (client_id = auth.uid() OR public.is_coach());

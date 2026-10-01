// Creates a coaching client account on the coach's behalf.
// Only callable by a signed-in user whose coaching_profiles.role = 'coach'.
// The account is created confirmed and silent (no email), so the coach can fill exercises in
// for the client first. The coach sends a sign-in link from the portal when they're ready.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller?.user) return json({ error: 'Not signed in' }, 401);

  const { data: coach } = await admin.from('coaching_profiles').select('role').eq('user_id', caller.user.id).maybeSingle();
  if (coach?.role !== 'coach') return json({ error: 'Only the coach can add clients' }, 403);

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || '').trim().slice(0, 80);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'That email doesn’t look right' }, 400);

  // Reuse the account if this email already exists
  let userId: string | undefined;
  const created = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name } });
  if (created.data?.user) {
    userId = created.data.user.id;
  } else {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list?.users.find((u) => (u.email || '').toLowerCase() === email)?.id;
    if (!userId) return json({ error: created.error?.message || 'Could not create the account' }, 400);
  }

  const { data: existing } = await admin.from('coaching_profiles').select('role').eq('user_id', userId).maybeSingle();
  if (existing?.role === 'coach') return json({ error: 'That’s a coach account' }, 400);

  const { error: upErr } = await admin
    .from('coaching_profiles')
    .upsert({ user_id: userId, role: 'client', name, email }, { onConflict: 'user_id' });
  if (upErr) return json({ error: upErr.message }, 500);

  return json({ user_id: userId, name, email });
});

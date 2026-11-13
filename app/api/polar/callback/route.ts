import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { POLAR_API, POLAR_TOKEN_URL } from '@/lib/polar';

// Step 2 of linking Polar: Polar sends the browser back here with a code. We swap it for an access
// token, register the user with AccessLink (once), and store the token via polar_link_save.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const done = (q: string) => {
    const res = NextResponse.redirect(`${origin}/polar?${q}`, 303);
    res.cookies.delete({ name: 'polar_state', path: '/api/polar' });
    return res;
  };

  const { POLAR_CLIENT_ID: id, POLAR_CLIENT_SECRET: secret, GUT_TOKEN: gutToken } = process.env;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!id || !secret || !gutToken || !sbUrl || !anon) return done('e=not_configured');

  const state = (await cookies()).get('polar_state')?.value;
  if (!state || state !== url.searchParams.get('state')) return done('e=bad_state');
  const code = url.searchParams.get('code');
  if (!code) return done(`e=${encodeURIComponent(url.searchParams.get('error') ?? 'no_code')}`);

  const tokenRes = await fetch(POLAR_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: `${origin}/api/polar/callback` }),
  });
  if (!tokenRes.ok) return done('e=token_failed');
  const tok = (await tokenRes.json()) as { access_token?: string; expires_in?: number; x_user_id?: number | string };
  if (!tok.access_token || tok.x_user_id == null) return done('e=token_failed');

  // Register with AccessLink. 409 means already registered, which is fine.
  const reg = await fetch(`${POLAR_API}/users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ 'member-id': `teambenlee-${tok.x_user_id}` }),
  });
  if (!reg.ok && reg.status !== 409) return done('e=register_failed');

  const expires = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
  const db = createClient(sbUrl, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const save = await db.rpc('polar_link_save', {
    p_token: gutToken,
    p_polar_user: String(tok.x_user_id),
    p_access: tok.access_token,
    p_expires: expires,
  });
  if (save.error || save.data !== true) return done('e=save_failed');
  return done('ok=1');
}

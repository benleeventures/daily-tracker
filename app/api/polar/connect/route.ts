import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { POLAR_AUTH_URL } from '@/lib/polar';

// Step 1 of linking Polar: the /polar form posts the Gut access key here. If it matches GUT_TOKEN we
// send the browser to Polar to approve, with a one-time state cookie so the callback knows it's us.

const sha = (s: string) => createHash('sha256').update(s).digest();

export async function POST(request: Request) {
  const clientId = process.env.POLAR_CLIENT_ID;
  const gutToken = process.env.GUT_TOKEN;
  const origin = new URL(request.url).origin;
  if (!clientId || !gutToken) return NextResponse.redirect(`${origin}/polar?e=not_configured`, 303);

  const form = await request.formData();
  const key = String(form.get('key') ?? '').trim();
  if (!key || !timingSafeEqual(sha(key), sha(gutToken))) return NextResponse.redirect(`${origin}/polar?e=bad_key`, 303);

  const state = randomBytes(24).toString('hex');
  const auth = new URL(POLAR_AUTH_URL);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', `${origin}/api/polar/callback`);
  auth.searchParams.set('scope', 'accesslink.read_all');
  auth.searchParams.set('state', state);

  const res = NextResponse.redirect(auth.toString(), 303);
  res.cookies.set('polar_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/polar', maxAge: 600 });
  return res;
}

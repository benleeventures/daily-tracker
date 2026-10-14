import { NextResponse } from 'next/server';
import { buildReportEmail } from '@/lib/energy-audit-email';

const FROM = 'Ben Lee <audit@send.teambenlee.com>';
const REPLY_TO = 'ben@benlee.ventures';
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

// Best-effort only: serverless instances don't share memory, so this slows down
// repeat hits on one instance but isn't a hard guarantee.
const hits = new Map<string, number[]>();
function overLimit(key: string, windowMs: number, max: number) {
  const now = Date.now();
  for (const [k, ts] of hits) {
    const kept = ts.filter((t) => now - t < 3600_000);
    if (kept.length) hits.set(k, kept);
    else hits.delete(k);
  }
  const inWindow = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (inWindow.length >= max) return true;
  hits.set(key, [...inWindow, now]);
  return false;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 100_000) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 });

  let body: { name?: unknown; email?: unknown; answers?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'bad_email' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.slice(0, 100) : '';
  const answers =
    typeof body.answers === 'object' && body.answers !== null && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (overLimit(`email:${email}`, 60_000, 1) || overLimit(`ip:${ip}`, 3600_000, 10)) {
    return NextResponse.json({ ok: false, error: 'slow_down' }, { status: 429 });
  }

  const { subject, html, text } = buildReportEmail(name, answers);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [email], reply_to: REPLY_TO, subject, html, text }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text().catch(() => ''));
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { emptyDay, normalize } from '@/app/gut/day';
import { applyNote, hasScores, parseNote } from '@/app/gut/parse-note';
import type { Day } from '@/app/gut/types';

// POST a daily note (the same markdown the Day tab imports) and it is merged into that day's log.
//
//   curl -X POST https://www.teambenlee.com/api/gut/import \
//     -H "Authorization: Bearer $GUT_TOKEN" --data-binary @gut-2026-10-14.md
//
// Accepts the note as a raw body (text/markdown or text/plain), multipart form data (a "file" field),
// or JSON ({"note": "..."}). The token can also be sent as an x-gut-token header or a ?key= query
// parameter, but a header keeps it out of request logs. Repeating the same note is a no-op unless
// ?force=1 is added.

const MAX_CHARS = 200_000;
const TZ = 'America/Costa_Rica';

const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

// Best effort only (serverless instances don't share memory): slows down repeated bad-token guessing.
const misses = new Map<string, number[]>();
function tooManyMisses(ip: string) {
  const now = Date.now();
  const recent = (misses.get(ip) ?? []).filter((t) => now - t < 3600_000);
  misses.set(ip, recent);
  return recent.length >= 20;
}
const recordMiss = (ip: string) => misses.set(ip, [...(misses.get(ip) ?? []), Date.now()]);

const todayInCostaRica = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

function tokenFrom(request: Request): string {
  const auth = request.headers.get('authorization') ?? '';
  const bearer = /^Bearer\s+(.+)$/i.exec(auth);
  return (bearer?.[1] ?? request.headers.get('x-gut-token') ?? new URL(request.url).searchParams.get('key') ?? '').trim();
}

async function noteFrom(request: Request): Promise<string | null> {
  const type = (request.headers.get('content-type') ?? '').toLowerCase();
  if (type.includes('multipart/form-data')) {
    const form = await request.formData();
    for (const value of form.values()) {
      if (typeof value !== 'string') return await value.text();
    }
    for (const name of ['note', 'text', 'content', 'markdown']) {
      const v = form.get(name);
      if (typeof v === 'string') return v;
    }
    return null;
  }
  if (type.includes('application/json')) {
    const json = (await request.json()) as Record<string, unknown>;
    for (const name of ['note', 'text', 'content', 'markdown']) {
      if (typeof json?.[name] === 'string') return json[name] as string;
    }
    return null;
  }
  return await request.text();
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return reply({ status: 'error', error: 'not_configured' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooManyMisses(ip)) return reply({ status: 'error', error: 'slow_down' }, 429);

  const token = tokenFrom(request);
  if (!token) {
    recordMiss(ip);
    return reply({ status: 'error', error: 'unauthorized' }, 401);
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_CHARS * 4) return reply({ status: 'error', error: 'too_large' }, 413);

  let text: string | null;
  try {
    text = await noteFrom(request);
  } catch {
    return reply({ status: 'error', error: 'unreadable_body' }, 400);
  }
  if (!text || !text.trim()) return reply({ status: 'error', error: 'empty_note' }, 400);
  if (text.length > MAX_CHARS) return reply({ status: 'error', error: 'too_large' }, 413);

  const parsed = parseNote(text);
  if (!parsed.ok) return reply({ status: 'error', error: 'not_template', message: parsed.error }, 422);
  const note = parsed.note;

  // Same rule as the app: a missing or future date means today (Costa Rica time)
  const today = todayInCostaRica();
  const date = note.date && note.date <= today ? note.date : today;

  const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

  const read = await db.rpc('gut_ingest_read', { p_token: token, p_date: date });
  if (read.error) return reply({ status: 'error', error: 'read_failed' }, 502);
  const readData = read.data as { ok: boolean; doc?: Partial<Day> };
  if (!readData?.ok) {
    recordMiss(ip);
    return reply({ status: 'error', error: 'unauthorized' }, 401);
  }

  const existing = readData.doc && Object.keys(readData.doc).length ? normalize(readData.doc, date) : emptyDay(date);
  const force = new URL(request.url).searchParams.get('force') === '1';
  if (!force && existing.imports?.includes(note.hash)) {
    return reply({ status: 'duplicate', date, message: 'This note was already imported into that day. Nothing changed.' });
  }

  const merged = { ...applyNote(existing, note, () => crypto.randomUUID()), updatedAt: new Date().toISOString() };
  const write = await db.rpc('gut_ingest_write', { p_token: token, p_date: date, p_doc: merged });
  if (write.error || write.data !== true) return reply({ status: 'error', error: 'write_failed' }, 502);

  return reply({
    status: 'imported',
    date,
    meals: note.meals.length,
    bms: note.bms.length,
    scores: hasScores(note),
    flag: note.flag ?? null,
    message: `Imported into ${date}: ${note.meals.length} meals, ${note.bms.length} BMs${hasScores(note) ? ', plus check-in scores' : ''}.`,
  });
}

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { applyNote, parseNote, type DayDoc } from '@/lib/dailies-note';

// POST a day's note (format: docs/dailies-note-format.md) and it is merged into that day in Dailys.
//
//   curl -X POST https://www.teambenlee.com/api/dailies/import \
//     -H "Authorization: Bearer $DAILIES_TOKEN" --data-binary @dailies-2026-10-14.md
//
// Accepts the note as a raw body (text/markdown or text/plain), multipart form data, or JSON ({"note": "..."}).
// Nothing already in Dailys is overwritten: text is appended, habits only turn on, tasks and action items are
// added by text. Repeating the same note is a no-op unless ?force=1 is added.

const MAX_CHARS = 100_000;
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
  return (bearer?.[1] ?? request.headers.get('x-dailies-token') ?? '').trim();
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

const newTaskId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

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

  // A missing or future date means today (Costa Rica time)
  const today = todayInCostaRica();
  const date = note.date && note.date <= today ? note.date : today;
  const hash = createHash('sha256').update(text.replace(/\r\n?/g, '\n').trim()).digest('hex').slice(0, 32);

  const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

  const read = await db.rpc('dailies_ingest_read', { p_token: token, p_date: date, p_hash: hash });
  if (read.error) return reply({ status: 'error', error: 'read_failed' }, 502);
  const data = read.data as { ok: boolean; seen?: boolean; entry?: DayDoc['entry']; meetings?: DayDoc['meetings'] };
  if (!data?.ok) {
    recordMiss(ip);
    return reply({ status: 'error', error: 'unauthorized' }, 401);
  }

  const force = new URL(request.url).searchParams.get('force') === '1';
  if (!force && data.seen) {
    return reply({ status: 'duplicate', date, message: 'This note was already imported. Nothing changed.' });
  }

  const { entry, meetings } = applyNote(
    { entry: data.entry ?? null, meetings: data.meetings ?? [] },
    note,
    newTaskId,
    () => crypto.randomUUID(),
  );

  const write = await db.rpc('dailies_ingest_write', {
    p_token: token,
    p_date: date,
    p_hash: hash,
    p_entry: entry,
    p_meetings: meetings,
  });
  if (write.error || write.data !== true) return reply({ status: 'error', error: 'write_failed' }, 502);

  const parts = [
    entry ? 'the day' : null,
    note.tasks.length ? `${note.tasks.length} task${note.tasks.length === 1 ? '' : 's'}` : null,
    note.meetings.length ? `${note.meetings.length} meeting${note.meetings.length === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

  return reply({
    status: 'imported',
    date,
    tasks: note.tasks.length,
    meetings: note.meetings.length,
    message: `Imported into ${date}: ${parts.join(', ')}.`,
  });
}

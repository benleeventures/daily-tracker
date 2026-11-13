import { createClient } from '@supabase/supabase-js';
import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { emptyDay, normalize } from '@/app/gut/day';
import type { Day } from '@/app/gut/types';
import { applyNote, parseNote, type DayDoc } from '@/lib/dailies-note';
import { PolarAuthError, dailiesNote, fetchPolarDay, shiftDate, todayInCostaRica, type PolarDay } from '@/lib/polar';

// Daily Polar pull (Vercel cron, see vercel.json). Auth: Authorization: Bearer $CRON_SECRET.
//
//  - Gut Audit: today and yesterday get a `polar` block (sleep, HRV, RHR, steps, workouts). Bed, wake and
//    training are filled only when Ben left them empty; nothing he typed is overwritten.
//  - Dailys: yesterday (a finished day) gets one "Polar: ..." observations line, plus the movement habit
//    when a workout was logged. Same content twice is a no-op, so re-running is safe.
//
// ?date=YYYY-MM-DD syncs that one day instead (backfill, up to Polar's 28-day window).

const sha = (s: string) => createHash('sha256').update(s).digest();
const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });
const newTaskId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

function mergeGut(existing: Day, p: PolarDay): Day {
  const am = { ...existing.am };
  if (!am.bed && p.bed) am.bed = p.bed;
  if (!am.wake && p.wake) am.wake = p.wake;
  const pm = { ...existing.pm };
  if (!pm.training && p.workouts?.length) pm.training = p.workouts.map((w) => `${w.minutes} min ${w.sport}`).join(', ');
  return { ...existing, am, pm, polar: p, updatedAt: new Date().toISOString() };
}

export async function GET(request: Request) {
  const { CRON_SECRET: cron, GUT_TOKEN: gutToken, DAILIES_TOKEN: dailiesToken } = process.env;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!cron || !gutToken || !sbUrl || !anon) return reply({ status: 'error', error: 'not_configured' }, 503);

  const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]?.trim() ?? '';
  if (!bearer || !timingSafeEqual(sha(bearer), sha(cron))) return reply({ status: 'error', error: 'unauthorized' }, 401);

  const db = createClient(sbUrl, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const link = await db.rpc('polar_link_get', { p_token: gutToken });
  const linkData = link.data as { ok: boolean; access_token?: string } | null;
  if (link.error || !linkData?.ok) return reply({ status: 'error', error: 'gut_token_rejected' }, 502);
  if (!linkData.access_token) return reply({ status: 'error', error: 'polar_not_connected' }, 409);
  const polarToken = linkData.access_token;

  const today = todayInCostaRica();
  const asked = new URL(request.url).searchParams.get('date');
  if (asked && (!/^\d{4}-\d{2}-\d{2}$/.test(asked) || asked > today)) return reply({ status: 'error', error: 'bad_date' }, 400);
  const yesterday = shiftDate(today, -1);
  const gutDates = asked ? [asked] : [yesterday, today];
  const dailiesDate = asked ?? yesterday;

  const results: Record<string, unknown> = {};
  const polar: Record<string, PolarDay> = {};
  try {
    for (const date of new Set([...gutDates, dailiesDate])) polar[date] = await fetchPolarDay(polarToken, date);
  } catch (e) {
    if (e instanceof PolarAuthError) return reply({ status: 'error', error: 'polar_reconnect_needed' }, 409);
    return reply({ status: 'error', error: 'polar_failed', message: (e as Error).message }, 502);
  }

  for (const date of gutDates) {
    const p = polar[date];
    if (Object.keys(p).length <= 1) { results[`gut ${date}`] = 'nothing from Polar'; continue; }
    const read = await db.rpc('gut_ingest_read', { p_token: gutToken, p_date: date });
    const doc = (read.data as { ok: boolean; doc?: Partial<Day> } | null)?.doc;
    const existing = doc && Object.keys(doc).length ? normalize(doc, date) : emptyDay(date);
    const write = await db.rpc('gut_ingest_write', { p_token: gutToken, p_date: date, p_doc: mergeGut(existing, p) });
    results[`gut ${date}`] = write.data === true ? 'synced' : 'write failed';
  }

  const text = dailiesToken ? dailiesNote(dailiesDate, polar[dailiesDate]) : null;
  if (!dailiesToken) results[`dailys ${dailiesDate}`] = 'skipped (no DAILIES_TOKEN)';
  else if (!text) results[`dailys ${dailiesDate}`] = 'nothing from Polar';
  else {
    const parsed = parseNote(text);
    const hash = createHash('sha256').update(text.trim()).digest('hex').slice(0, 32);
    const read = await db.rpc('dailies_ingest_read', { p_token: dailiesToken, p_date: dailiesDate, p_hash: hash });
    const data = read.data as { ok: boolean; seen?: boolean; entry?: DayDoc['entry']; meetings?: DayDoc['meetings'] } | null;
    if (!parsed.ok || !data?.ok) results[`dailys ${dailiesDate}`] = 'dailies token rejected';
    else if (data.seen) results[`dailys ${dailiesDate}`] = 'already synced';
    else {
      const { entry, meetings } = applyNote(
        { entry: data.entry ?? null, meetings: data.meetings ?? [] }, parsed.note, newTaskId, () => crypto.randomUUID(),
      );
      const write = await db.rpc('dailies_ingest_write', {
        p_token: dailiesToken, p_date: dailiesDate, p_hash: hash, p_entry: entry, p_meetings: meetings,
      });
      results[`dailys ${dailiesDate}`] = write.data === true ? 'synced' : 'write failed';
    }
  }

  return reply({ status: 'ok', results });
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeBrief } from '@/app/whatsapp/types';

// POST a WhatsApp brief (JSON, see app/whatsapp/types.ts) from the scheduled scan on Ben's Mac.
//
//   curl -X POST https://www.teambenlee.com/api/whatsapp/import \
//     -H "Authorization: Bearer $WA_TOKEN" -H "Content-Type: application/json" --data-binary @brief.json

const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return reply({ status: 'error', error: 'not_configured' }, 503);

  const token = (/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')?.[1] ?? '').trim();
  if (!token) return reply({ status: 'error', error: 'unauthorized' }, 401);

  if (Number(request.headers.get('content-length') ?? 0) > 400_000) return reply({ status: 'error', error: 'too_large' }, 413);

  let brief;
  try {
    brief = normalizeBrief(await request.json());
  } catch {
    return reply({ status: 'error', error: 'unreadable_body' }, 400);
  }
  if (!brief) return reply({ status: 'error', error: 'empty_brief' }, 422);

  const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('wa_brief_ingest', { p_token: token, p_doc: brief });
  if (error) return reply({ status: 'error', error: 'write_failed' }, 502);
  if (data !== true) return reply({ status: 'error', error: 'unauthorized' }, 401);

  return reply({
    status: 'imported',
    link: 'https://www.teambenlee.com/whatsapp',
    today: brief.today.length,
    week: brief.week.length,
    read: brief.read.length,
  });
}

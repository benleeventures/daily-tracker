import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Brief } from '@/app/whatsapp/types';

// POST with a read key (bearer token) and get back a short WhatsApp-ready message: the top 3 "Reply today"
// chats with their drafts, plus the link. Instinct uses it through the /whatsapp/summary form.

const LINK = 'https://www.teambenlee.com/whatsapp';
const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

function summaryText(brief: Brief): string {
  const top = brief.today.slice(0, 3);
  const lines = [`WhatsApp brief: ${brief.today.length} to answer today.`, ''];
  top.forEach((chat, i) => {
    lines.push(`${i + 1}. ${chat.name}: ${chat.need}`);
    if (chat.draft) lines.push(`   Reply: "${chat.draft}"`);
  });
  const more = brief.today.length - top.length;
  if (more > 0) lines.push('', `+${more} more today, ${brief.week.length} this week.`);
  lines.push('', LINK);
  return lines.join('\n');
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return reply({ status: 'error', error: 'not_configured' }, 503);

  const token = (/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')?.[1] ?? '').trim();
  if (!token) return reply({ status: 'error', error: 'unauthorized' }, 401);

  const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('wa_brief_latest', { p_token: token });
  if (error) return reply({ status: 'error', error: 'read_failed' }, 502);
  const result = data as { ok: boolean; doc: Brief | null };
  if (!result?.ok) return reply({ status: 'error', error: 'unauthorized' }, 401);
  if (!result.doc) return reply({ status: 'empty', text: `No WhatsApp brief yet.\n\n${LINK}` });

  const hours = (Date.now() - Date.parse(result.doc.scannedAt)) / 3600_000;
  const stale = hours > 30 ? `\n\n(Note: this brief is from ${Math.round(hours / 24)} day(s) ago. The last scan may have been skipped.)` : '';
  return reply({ status: 'ok', scannedAt: result.doc.scannedAt, text: summaryText(result.doc) + stale });
}

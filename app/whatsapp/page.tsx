'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { Mark, c, font, s } from '../coaching/ui';
import type { Brief, Chat } from './types';

type State =
  | { status: 'loading' }
  | { status: 'denied'; email: string }
  | { status: 'ready'; brief: Brief | null };

const SECTIONS = [
  { key: 'today', title: 'Reply today', hint: 'Team, partners, money, anyone blocked on you' },
  { key: 'week', title: 'This week', hint: 'Real people with real asks' },
  { key: 'read', title: 'Mark read', hint: 'Groups and noise. Mute or archive these.' },
] as const;

const signOut = () => supabase.auth.signOut().then(() => window.location.replace('/login?next=/whatsapp'));

// Same owner-only rule as the Gut Audit: the gut_access allowlist, enforced again by RLS in the database.
export default function WhatsAppPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.replace('/login?next=%2Fwhatsapp');
        return;
      }
      const { id, email = '' } = data.session.user;
      const { data: access } = await supabase.from('gut_access').select('user_id').eq('user_id', id).maybeSingle();
      if (!access) return setState({ status: 'denied', email });
      const { data: row } = await supabase
        .from('wa_briefs')
        .select('doc')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setState({ status: 'ready', brief: (row?.doc as Brief) ?? null });
    })();
  }, []);

  if (state.status === 'loading') return <Frame><p style={{ ...s.small, textAlign: 'center', marginTop: '4rem' }}>Loading…</p></Frame>;
  if (state.status === 'denied') {
    return (
      <Frame>
        <h1 style={s.h1}>This one is private</h1>
        <p style={s.body}>You’re signed in as {state.email}, but this account can’t see the WhatsApp brief.</p>
        <button onClick={signOut} style={s.button}>Sign out</button>
      </Frame>
    );
  }
  const brief = state.brief;
  if (!brief) {
    return (
      <Frame>
        <h1 style={s.h1}>No brief yet</h1>
        <p style={s.body}>The first scan runs Monday, Wednesday or Friday at 4pm, while your Mac is awake with WhatsApp Web open in Chrome.</p>
      </Frame>
    );
  }

  const when = new Date(brief.scannedAt).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Costa_Rica' });
  return (
    <Frame>
      <p style={s.eyebrow}>Scanned {when}</p>
      <h1 style={s.h1}>{brief.today.length} to answer today</h1>
      <p style={s.small}>
        {brief.unreadChats} unread chats · {brief.scanned} sorted. Drafts are suggestions; you send them yourself.
      </p>
      {brief.note && <p style={{ ...s.small, color: c.alert }}>{brief.note}</p>}
      {SECTIONS.map(({ key, title, hint }) => (
        <section key={key} style={{ marginTop: '2rem' }}>
          <h2 style={s.h2}>{title} <span style={{ color: c.muted, fontWeight: 400 }}>{brief[key].length}</span></h2>
          <p style={{ ...s.small, margin: '0 0 0.75rem' }}>{hint}</p>
          {key === 'read'
            ? <p style={{ ...s.body, fontSize: 14 }}>{brief.read.map((x) => x.name).join(' · ') || 'Nothing here.'}</p>
            : brief[key].map((chat, i) => <Card key={i} chat={chat} />)}
        </section>
      ))}
    </Frame>
  );
}

function Card({ chat }: { chat: Chat }) {
  const [copied, setCopied] = useState(false);
  const copy = () => chat.draft && navigator.clipboard.writeText(chat.draft).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <strong style={{ fontSize: 16 }}>{chat.name}</strong>
        {chat.unread > 0 && <span style={s.small}>{chat.unread} unread</span>}
      </div>
      {chat.need && <p style={{ ...s.body, fontSize: 14, margin: '0.35rem 0 0' }}>{chat.need}</p>}
      {chat.draft && (
        <div style={{ marginTop: '0.6rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <p style={{ ...s.body, fontSize: 14, margin: 0, flex: 1, fontStyle: 'italic', color: c.goldDeep }}>“{chat.draft}”</p>
          <button onClick={copy} style={s.ghost}>{copied ? 'Copied' : 'Copy'}</button>
        </div>
      )}
    </div>
  );
}

const card: CSSProperties = { background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 6, padding: '12px 14px', marginBottom: 10 };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', background: c.bg, color: c.ink, fontFamily: font, padding: '2rem 16px 4rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Mark />
        {children}
      </div>
    </main>
  );
}

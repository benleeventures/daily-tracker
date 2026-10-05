'use client';

import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exerciseBySlug } from '../coaching/exercises';
import { ExerciseBody } from '../coaching/fields';
import type { Answers } from '../coaching/types';
import { Mark, c, font, s } from '../coaching/ui';

const serif = Playfair_Display({ subsets: ['latin'], weight: ['500', '600'] });

const STORAGE_KEY = 'energy-audit-v1';

// Page-only copy for the public lead magnet. The coaching portal keeps using the exercise text in exercises.ts.
const COPY = {
  eyebrow: 'Free · No sign-up · 45 minutes',
  title: 'Your calendar looks fine. You’re still exhausted.',
  sub: 'The Energy Audit shows you where it’s all going: what fills you up, what drains you, and what you’ve quietly stopped questioning.',
  who: 'You already work out. You already meditate. You’re the one everyone leans on. This is the missing piece: finding out which parts of your week are costing you more than they give.',
  story: [
    'I’ve done this every quarter since 2021. It’s the first thing I have every client do.',
    'Time management is the wrong frame. You can have an empty calendar and still be wiped out. Energy is the real currency.',
    'When I ran mine, meditation and surfing were at the top. Managing people, vendor calls and back-to-back meetings were at the bottom. That’s where most of my week was going.',
  ],
  story2: [
    'I learned this after I burned out and had to rehab from my last business. It became part of my quarterly ritual, and I’ve never looked back.',
    'I’ve walked hundreds of founders through it. My whole leadership team does it. It’s changed my life, and a lot of other people’s.',
    'It’s completely free. Questions? Use the note box at the end, and I’ll help.',
  ],
  promise: 'You’ll leave with three things: what to keep, what to hand off, and the one thing you’ve been putting up with that’s costing you most.',
  permission: 'Forty-five minutes, just for you. You don’t need a better reason than being tired.',
  together: 'Doing this with a partner? Each of you fill in your own, then swap. It’s one of the most honest conversations you’ll have all month.',
  steps: [
    'List what takes your time each week. Rough hours are fine.',
    'Tap −3 if it drains you, +3 if it lights you up.',
    'Decide: keep it, change it, hand it off or drop it.',
    'Name what you’re putting up with.',
    'See your results. The math is done for you.',
  ],
  cta: 'Start my audit',
  ctaNote: 'Your answers stay on this device. Close the tab and come back anytime.',
  ritual: 'Do this again in three months. I do it every quarter, and it never shows me the same week twice.',
  footer: 'Go get your energy back.',
};
const exercise = exerciseBySlug('energy-audit')!;
const toolOnly = { ...exercise, intro: [], steps: undefined, videos: undefined };

function embedUrl(url: string) {
  return url.includes('loom.com/share/') ? url.replace('/share/', '/embed/').split('?')[0] : url;
}

// Public lead magnet. Answers live in this browser until the visitor chooses to send them.
export default function PublicEnergyAudit() {
  const [answers, setAnswers] = useState<Answers>({});
  const [restored, setRestored] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && Object.keys(saved).length > 0) {
        setAnswers(saved);
        setRestored(true);
      }
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {}
  }, [answers]);

  const startOver = () => {
    if (!confirm('Clear everything and start over?')) return;
    setAnswers({});
    setRestored(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendState('sending');
    const { error } = await supabase.from('energy_audit_leads').insert({
      name: name.trim(),
      email: email.trim(),
      note: note.trim(),
      answers,
    });
    setSendState(error ? 'error' : 'sent');
  };

  const leadForm = (
    <section className="no-print" style={{ marginTop: '2.5rem' }}>
      <p style={{ ...s.body, fontStyle: 'italic' }}>{COPY.ritual}</p>
      {sendState === 'sent' ? (
        <>
          <h2 style={s.h2}>Got it.</h2>
          <p style={s.body}>I’ll read through your audit. Your answers are still saved on this device if you want to keep working.</p>
        </>
      ) : (
        <form onSubmit={send}>
          <h2 style={s.h2}>Want a second set of eyes?</h2>
          <p style={s.body}>Send it to me. I read every one, and I’ll reach out if I see something.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" style={s.input} autoComplete="name" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              type="email"
              required
              style={s.input}
              autoComplete="email"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything I should know? (optional)"
              aria-label="Note"
              rows={3}
              style={{ ...s.input, resize: 'vertical' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              marginTop: 12,
              flexWrap: 'wrap',
            }}
          >
            <button type="submit" disabled={sendState === 'sending'} style={s.button}>
              {sendState === 'sending' ? 'Sending…' : 'Send it to Ben'}
            </button>
            <button type="button" onClick={() => window.print()} style={s.ghost}>
              Save as PDF
            </button>
          </div>
          {sendState === 'error' && <p style={{ ...s.small, color: c.alert, marginTop: 8 }}>That didn’t go through. Check your email address and try again.</p>}
        </form>
      )}
    </section>
  );

  return (
    <main style={{ minHeight: '100vh', background: c.bg, color: c.ink, fontFamily: font, padding: '1.75rem 1rem 5rem' }}>
      <style>{`
        @media print { .no-print { display: none !important; } main { padding: 0 !important; } .tool-card { border: 0 !important; box-shadow: none !important; padding: 0 !important; } }
        .ea-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; list-style: none; padding: 0; margin: 0; }
        @media (max-width: 640px) { .ea-steps { grid-template-columns: 1fr; gap: 8px; } .ea-step { display: flex; align-items: center; gap: 12px; text-align: left !important; } .ea-hero h1 { font-size: 34px !important; } .ea-meta { gap: 14px !important; } }
        .ea-details > summary { list-style: none; cursor: pointer; }
        .ea-details > summary::-webkit-details-marker { display: none; }
      `}</style>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '3rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}>
            <Mark />
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>Ben Lee</span>
          </Link>
          <span className="no-print" style={{ fontSize: 12, color: c.muted }}>Saves on this device</span>
        </header>

        <section className="ea-hero" style={{ marginBottom: '2.25rem' }}>
          <p style={{ ...s.eyebrow, color: c.goldDeep, letterSpacing: '1.4px', marginBottom: 14 }}>{COPY.eyebrow}</p>
          <h1 className={serif.className} style={{ fontSize: 46, fontWeight: 500, letterSpacing: '-1.2px', lineHeight: 1.1, margin: '0 0 1.1rem' }}>
            {COPY.title}
          </h1>
          <p className={serif.className} style={{ fontSize: 22, lineHeight: 1.4, color: c.muted, margin: 0, maxWidth: 560 }}>
            {COPY.sub}
          </p>
          <div className="ea-meta no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 22, fontSize: 13, color: c.muted }}>
            {['5 short steps', 'Math done for you', 'Private until you send it'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: c.gold }} />
                {t}
              </span>
            ))}
          </div>
          <a
            href="#start"
            className="no-print"
            style={{ display: 'inline-block', marginTop: 24, background: c.ink, color: c.bg, borderRadius: 999, padding: '12px 22px', fontSize: 15, textDecoration: 'none' }}
          >
            {COPY.cta} ↓
          </a>
          <p className="no-print" style={{ ...s.small, margin: '10px 0 0' }}>{COPY.ctaNote}</p>
        </section>

        <p style={{ ...s.body, fontSize: 17, marginBottom: '1.75rem' }}>{COPY.who}</p>

        <section style={{ borderLeft: `2px solid ${c.gold}`, paddingLeft: 18, margin: '0 0 1.75rem' }}>
          {COPY.story.map((t, i) => (
            <p key={i} style={{ ...s.body, margin: i === COPY.story.length - 1 ? 0 : '0 0 0.9rem', color: i === 0 ? c.ink : c.muted, fontSize: i === 0 ? 17 : 16 }}>{t}</p>
          ))}
        </section>

        {COPY.story2.map((t, i) => (
          <p key={i} style={{ ...s.body, marginBottom: '0.9rem' }}>{t}</p>
        ))}

        <p style={{ ...s.body, marginBottom: '0.5rem' }}>{COPY.promise}</p>
        <p style={{ ...s.body, fontWeight: 600, marginBottom: '0.75rem' }}>{COPY.permission}</p>
        <p style={{ ...s.body, color: c.muted, marginBottom: '1.5rem' }}>{COPY.together}</p>

        <ol className="ea-steps no-print" aria-label="How this works">
          {COPY.steps.map((st, i) => (
            <li key={st} className="ea-step" style={{ background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
              <span
                className={serif.className}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 99, border: `1px solid ${c.gold}`, color: c.goldDeep, fontSize: 14, flexShrink: 0, marginBottom: 8 }}
              >
                {i + 1}
              </span>
              <span style={{ display: 'block', fontSize: 13, lineHeight: 1.4, color: c.ink }}>{st}</span>
            </li>
          ))}
        </ol>

        {exercise.videos && (
          <details className="ea-details no-print" style={{ margin: '1.5rem 0 0.5rem' }}>
            <summary style={{ fontSize: 14, color: c.goldDeep }}>▸ Watch me do it first (older spreadsheet version, same steps)</summary>
            <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
              {exercise.videos.map((v) => (
                <figure key={v.url} style={{ margin: 0 }}>
                  <div style={{ position: 'relative', paddingTop: '56.25%', background: c.line, borderRadius: 10, overflow: 'hidden' }}>
                    <iframe src={embedUrl(v.url)} title={v.label} allowFullScreen loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                  </div>
                  <figcaption style={{ ...s.small, marginTop: 6 }}>{v.label}</figcaption>
                </figure>
              ))}
            </div>
          </details>
        )}

        <div id="start" className="tool-card" style={{ scrollMarginTop: 16, marginTop: '2.25rem', background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 16, padding: '4px 20px 24px', boxShadow: '0 1px 2px rgba(61,58,51,0.04), 0 12px 32px -16px rgba(61,58,51,0.12)' }}>
          {restored && (
            <p className="no-print" style={{ ...s.small, margin: '16px 0 0' }}>
              Welcome back. Picking up where you left off.{' '}
              <button onClick={startOver} style={{ ...s.ghost, fontSize: 13 }}>Start over</button>
            </p>
          )}
          <ExerciseBody exercise={toolOnly} answers={answers} onChange={(id, v) => setAnswers((prev) => ({ ...prev, [id]: v }))} resultsExtra={leadForm} />
        </div>

        <p className="no-print" style={{ ...s.small, textAlign: 'center', marginTop: '2.5rem' }}>
          {COPY.footer} Built by Ben Lee, founder of <a href="https://www.recenterlife.com" style={{ color: c.goldDeep }}>re:center</a>.
        </p>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exerciseBySlug } from '../coaching/exercises';
import { ExerciseBody } from '../coaching/fields';
import type { Answers } from '../coaching/types';
import { Mark, c, font, s } from '../coaching/ui';

const STORAGE_KEY = 'energy-audit-v1';
const exercise = exerciseBySlug('energy-audit')!;

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
    <main
      style={{
        minHeight: '100vh',
        background: c.bg,
        color: c.ink,
        fontFamily: font,
        padding: '2rem 1rem 5rem',
      }}
    >
      <style>{`@media print { .no-print { display: none !important; } main { padding: 0 !important; } }`}</style>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: '2.5rem',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <Mark />
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>Ben Lee</span>
          </Link>
          <span className="no-print" style={{ fontSize: 12, color: c.muted }}>
            Saves on this device
          </span>
        </header>

        <p style={s.eyebrow}>Free tool · {exercise.minutes} min</p>
        <h1 style={s.h1}>{exercise.title}</h1>

        {restored && (
          <p className="no-print" style={{ ...s.small, margin: '0 0 1.25rem' }}>
            Welcome back. Picking up where you left off.{' '}
            <button onClick={startOver} style={{ ...s.ghost, fontSize: 13 }}>
              Start over
            </button>
          </p>
        )}

        <ExerciseBody exercise={exercise} answers={answers} onChange={(id, v) => setAnswers((prev) => ({ ...prev, [id]: v }))} resultsExtra={leadForm} />
      </div>
    </main>
  );
}

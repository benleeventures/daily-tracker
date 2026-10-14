'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Mark, c, font, s } from '../coaching/ui';
import { classes, course, hard, learn, techniques, type PracticeClass, type Technique } from './content';

// Quiet on purpose: no streaks, no counters, no locks. We only remember the last day you practiced each class.
const KEY = 'practice:last';
type Last = Record<string, string>;

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const rawLast = () => {
  try {
    return localStorage.getItem(KEY) || '{}';
  } catch {
    return '{}';
  }
};
const saveLast = (v: Last) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
  listeners.forEach((l) => l());
};

const when = (iso?: string) => {
  if (!iso) return 'Not yet';
  const days = Math.round((new Date(new Date().toDateString()).getTime() - new Date(iso + 'T00:00:00').getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const TABS = ['Practice', 'Learn', 'Breathe'] as const;
type Tab = (typeof TABS)[number];

export default function PracticePage() {
  const [tab, setTab] = useState<Tab>('Practice');
  const [open, setOpen] = useState<PracticeClass | null>(null);
  const last: Last = JSON.parse(useSyncExternalStore(subscribe, rawLast, () => '{}'));

  const done = (id: string) => saveLast({ ...last, [id]: today() });

  return (
    <main style={{ minHeight: '100vh', background: c.bg, color: c.ink, fontFamily: font, padding: '2rem 1rem 6rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
          <Mark />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>re:center</span>
        </header>

        {open ? (
          <Session cls={open} last={last[open.id]} onBack={() => setOpen(null)} onDone={() => done(open.id)} />
        ) : (
          <>
            <p style={s.eyebrow}>{course.eyebrow}</p>
            <h1 style={s.h1}>{course.title}</h1>
            <p style={{ ...s.body, color: c.muted, fontStyle: 'italic' }}>“{course.quote}”</p>
            <p style={{ ...s.small, marginBottom: '1.75rem' }}>
              {course.teacher} · {course.teacherLine}. Everything is open. Start anywhere.
            </p>

            <nav role="tablist" style={{ display: 'flex', gap: 4, borderBottom: `0.5px solid ${c.line}`, marginBottom: '1.75rem' }}>
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  style={{
                    ...s.ghost,
                    fontSize: 15,
                    padding: '10px 14px',
                    minHeight: 44,
                    color: tab === t ? c.ink : c.muted,
                    fontWeight: tab === t ? 600 : 400,
                    borderBottom: `2px solid ${tab === t ? c.gold : 'transparent'}`,
                    marginBottom: -1,
                  }}
                >
                  {t}
                </button>
              ))}
            </nav>

            {tab === 'Practice' && <PracticeTab last={last} onOpen={setOpen} />}
            {tab === 'Learn' && <LearnTab />}
            {tab === 'Breathe' && <Breathe />}
          </>
        )}
      </div>
    </main>
  );
}

function PracticeTab({ last, onOpen }: { last: Last; onOpen: (c: PracticeClass) => void }) {
  return (
    <>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `0.5px solid ${c.line}` }}>
        {classes.map((k, i) => (
          <li key={k.id} style={{ borderBottom: `0.5px solid ${c.line}` }}>
            <button onClick={() => onOpen(k)} style={row}>
              <span style={{ flex: 1 }}>
                <span style={s.eyebrow}>
                  Class {i + 1} · {k.minutes} min · suggested {k.suggested}
                </span>
                <span style={{ display: 'block', fontSize: 17, fontWeight: 600, margin: '4px 0 2px', letterSpacing: '-0.2px' }}>{k.title}</span>
                <span style={s.small}>{k.steps.join(' · ')}</span>
              </span>
              <span style={{ ...s.small, whiteSpace: 'nowrap', textAlign: 'right' }}>
                Last: {when(last[k.id])}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <h2 style={{ ...s.h2, marginTop: '2.5rem' }}>When practice gets hard</h2>
      {hard.map((h) => (
        <Fold key={h.q} title={h.q}>
          <p style={{ ...s.body, margin: 0 }}>{h.a}</p>
        </Fold>
      ))}
    </>
  );
}

function Session({ cls, last, onBack, onDone }: { cls: PracticeClass; last?: string; onBack: () => void; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <button onClick={onBack} style={{ ...s.ghost, marginBottom: '1.5rem', minHeight: 44 }}>← All classes</button>
      <p style={s.eyebrow}>{cls.minutes} min · suggested {cls.suggested}</p>
      <h1 style={s.h1}>{cls.title}</h1>
      <p style={s.small}>Last practiced: {when(last)}</p>

      <ol style={{ margin: '1.75rem 0', padding: 0, listStyle: 'none', borderTop: `0.5px solid ${c.line}` }}>
        {cls.steps.map((st, i) => (
          <li key={st} style={{ display: 'flex', gap: 14, alignItems: 'baseline', padding: '16px 0', borderBottom: `0.5px solid ${c.line}` }}>
            <span style={{ ...s.small, width: 18 }}>{i + 1}</span>
            <span style={{ fontSize: 17 }}>{st}</span>
          </li>
        ))}
      </ol>

      {saved ? (
        <p style={{ ...s.body, color: c.goldDeep }}>Session complete. Nothing else to do.</p>
      ) : (
        <button
          style={{ ...s.button, minHeight: 44, padding: '10px 22px' }}
          onClick={() => {
            onDone();
            setSaved(true);
          }}
        >
          I practiced
        </button>
      )}
    </>
  );
}

function LearnTab() {
  return (
    <>
      {learn.map((l) => (
        <Fold key={l.id} kicker={l.kicker} title={l.title}>
          {l.paras.map((p) => (
            <p key={p} style={s.body}>{p}</p>
          ))}
          {l.list && (
            <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', lineHeight: 1.65 }}>
              {l.list.map((x) => (
                <li key={x} style={{ marginBottom: 6 }}>{x}</li>
              ))}
            </ul>
          )}
          {l.quote && <p style={{ ...s.small, fontStyle: 'italic', margin: 0 }}>{l.quote}</p>}
        </Fold>
      ))}
    </>
  );
}

function Fold({ kicker, title, children }: { kicker?: string; title: string; children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  return (
    <div style={{ borderBottom: `0.5px solid ${c.line}` }}>
      <button onClick={() => setOn(!on)} aria-expanded={on} style={{ ...row, borderTop: 0 }}>
        <span style={{ flex: 1 }}>
          {kicker && <span style={{ ...s.eyebrow, display: 'block' }}>{kicker}</span>}
          <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        </span>
        <span aria-hidden style={{ color: c.muted }}>{on ? '–' : '+'}</span>
      </button>
      {on && <div style={{ padding: '0 0 18px' }}>{children}</div>}
    </div>
  );
}

function Breathe() {
  const [tech, setTech] = useState<Technique>(techniques[0]);
  const [cycles, setCycles] = useState(10);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setRunning(false);
    setPhase(0);
    setCycle(0);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = (p: number, cy: number, t: Technique) => {
    setPhase(p);
    setCycle(cy);
    timer.current = setTimeout(() => {
      const np = p + 1;
      if (np < t.phases.length) return run(np, cy, t);
      if (cy + 1 < cycles) return run(0, cy + 1, t);
      stop();
    }, t.phases[p].secs * 1000);
  };

  const start = () => {
    setRunning(true);
    run(0, 0, tech);
  };

  const label = tech.phases[phase].label;
  const growing = running && /^(In|Top up)/.test(label);
  const shrinking = running && /out/i.test(label);
  const secs = tech.phases[phase].secs;

  const orb: CSSProperties = {
    width: 160,
    height: 160,
    borderRadius: 999,
    border: `1px solid ${c.gold}`,
    background: c.paper,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    color: c.goldDeep,
    margin: '1.5rem auto',
    transform: growing ? 'scale(1.35)' : shrinking ? 'scale(0.8)' : 'scale(1)',
    transition: running ? `transform ${secs}s ease-in-out` : 'transform 0.4s ease',
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {techniques.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              stop();
              setTech(t);
            }}
            style={{
              ...s.ghost,
              fontSize: 14,
              minHeight: 44,
              padding: '8px 14px',
              borderRadius: 999,
              border: `0.5px solid ${t.id === tech.id ? c.gold : c.line}`,
              color: t.id === tech.id ? c.ink : c.muted,
              background: t.id === tech.id ? c.paper : 'transparent',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <p style={{ ...s.small, textAlign: 'center', marginTop: '1.25rem' }}>
        {tech.pattern} · {tech.note}
      </p>
      <div style={orb} aria-live="polite">{running ? label : 'Ready'}</div>
      <p style={{ ...s.small, textAlign: 'center' }}>
        {running ? `Cycle ${cycle + 1} of ${cycles}` : `${cycles} cycles`}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: '1rem', alignItems: 'center' }}>
        {running ? (
          <button style={{ ...s.button, minHeight: 44 }} onClick={stop}>Stop</button>
        ) : (
          <button style={{ ...s.button, minHeight: 44 }} onClick={start}>Start</button>
        )}
        {!running && (
          <label style={{ ...s.small, display: 'flex', alignItems: 'center', gap: 6 }}>
            Cycles
            <input
              type="number"
              min={1}
              max={60}
              value={cycles}
              onChange={(e) => setCycles(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
              style={{ ...s.input, width: 64, padding: '8px' }}
            />
          </label>
        )}
      </div>
    </>
  );
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  padding: '18px 0',
  fontFamily: font,
  color: c.ink,
  cursor: 'pointer',
  minHeight: 44,
};

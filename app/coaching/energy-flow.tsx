'use client';

import { useRef, useState, type ReactNode } from 'react';
import type { Answers, Field, Row } from './types';
import { FieldInput } from './fields';
import { EnergySummary } from './visuals';
import { c, s } from './ui';

// The Energy Audit as five short steps instead of one long form. Same data shape as before
// (tasks / tolerating / start), so saved answers, the example, and the coach view all still work.

const STEPS = [
  { id: 'list', label: 'List' },
  { id: 'rate', label: 'Rate' },
  { id: 'decide', label: 'Decide' },
  { id: 'tolerate', label: 'Reflect' },
  { id: 'results', label: 'Results' },
] as const;

const ACTIONS = ['Keep doing', 'Do differently', 'Automate', 'Delegate', 'Drop', 'Not sure'];
const RATINGS = [-3, -2, -1, 0, 1, 2, 3];

// Red → neutral → green, all dark enough to read on cream.
const ratingColor = (v: number) =>
  v <= -3 ? '#9a3f2b' : v === -2 ? '#a0523a' : v === -1 ? '#a8705c' : v === 0 ? '#6b6a60' : v === 1 ? '#6f8456' : v === 2 ? '#5a7340' : '#46612f';

const asRows = (v: Answers[string] | undefined): Row[] =>
  Array.isArray(v) ? (v as unknown[]).filter((r): r is Row => typeof r === 'object' && r !== null) : [];

export function EnergyFlow({ answers, onChange, readOnly, startAtResults, fields, resultsExtra, closing }: {
  answers: Answers;
  onChange: (id: string, value: Answers[string]) => void;
  readOnly: boolean;
  startAtResults?: boolean;
  fields: { tolerating?: Field; start?: Field };
  resultsExtra?: ReactNode;
  closing?: string;
}) {
  const [step, setStep] = useState(startAtResults ? 4 : 0);
  const top = useRef<HTMLDivElement>(null);
  const go = (n: number) => {
    setStep(n);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stored = asRows(answers.tasks);
  const tasks: Row[] = stored.length >= 5 ? stored : [...stored, ...Array.from({ length: 5 - stored.length }, () => ({}))];
  const named = tasks.map((t, i) => ({ t, i })).filter(({ t }) => typeof t.task === 'string' && t.task.trim());

  const setTask = (i: number, key: string, v: string | number) => {
    if (readOnly) return;
    onChange('tasks', tasks.map((t, j) => (j === i ? { ...t, [key]: v } : t)));
  };

  const rated = named.filter(({ t }) => typeof t.energy === 'number').length;
  const next = [
    { label: 'Next: rate them', ok: named.length > 0 },
    { label: 'Next: decide', ok: rated > 0 },
    { label: 'Next: what you’re tolerating', ok: true },
    { label: 'See your results', ok: true },
  ][step];

  return (
    <div ref={top} style={{ scrollMarginTop: 70 }}>
      {/* Step indicator */}
      <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, listStyle: 'none', padding: 0, margin: '1.5rem 0 1.75rem' }}>
        {STEPS.map((st, i) => (
          <li key={st.id}>
            <button
              onClick={() => go(i)}
              aria-current={step === i ? 'step' : undefined}
              style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center' }}
            >
              <span style={{ display: 'block', height: 4, borderRadius: 2, background: i <= step ? c.ink : c.line, marginBottom: 6 }} />
              <span style={{ fontSize: 12, color: i === step ? c.ink : c.muted, fontWeight: i === step ? 600 : 400 }}>
                {i + 1}. {st.label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <h2 style={s.h2}>What takes your time each week?</h2>
          <p style={{ ...s.body, fontSize: 15 }}>
            Work and life. Look at your last two weeks of calendar. Be specific: “weekly check-in with the contractor,” not “meetings.” Rough hours are fine.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  aria-label={`Task ${i + 1}`}
                  value={typeof t.task === 'string' ? t.task : ''}
                  onChange={(e) => setTask(i, 'task', e.target.value)}
                  placeholder={i === 0 ? 'e.g. Answering guest messages' : i === 1 ? 'e.g. Morning surf' : ''}
                  readOnly={readOnly}
                  style={{ ...s.input, flex: 1 }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <input
                    aria-label={`Hours per week for task ${i + 1}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={typeof t.hours === 'number' ? t.hours : ''}
                    onChange={(e) => setTask(i, 'hours', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    readOnly={readOnly}
                    style={{ ...s.input, width: 62, textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 13, color: c.muted }}>hrs/wk</span>
                </span>
              </div>
            ))}
          </div>
          {!readOnly && (
            <button onClick={() => onChange('tasks', [...tasks, {}])} style={{ ...s.ghost, marginTop: 10 }}>+ Add another</button>
          )}
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 style={s.h2}>How does each one make you feel?</h2>
          <p style={{ ...s.body, fontSize: 15 }}>Go with your gut. Tap one number per line.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.muted, margin: '0 0 6px' }}>
            <span>← Drains me</span>
            <span>Lights me up →</span>
          </div>
          {named.length === 0 && <p style={s.small}>Add a few things in step 1 first.</p>}
          {named.map(({ t, i }) => {
            const current = typeof t.energy === 'number' ? t.energy : null;
            return (
              <div key={i} style={{ padding: '12px 0', borderTop: `0.5px solid ${c.line}` }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{t.task as string}</div>
                <div role="radiogroup" aria-label={`Energy for ${t.task}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {RATINGS.map((v) => {
                    const on = current === v;
                    return (
                      <button
                        key={v}
                        role="radio"
                        aria-checked={on}
                        disabled={readOnly}
                        onClick={() => setTask(i, 'energy', v)}
                        style={{
                          height: 40,
                          borderRadius: 4,
                          border: `1px solid ${on ? ratingColor(v) : c.line}`,
                          background: on ? ratingColor(v) : '#fff',
                          color: on ? '#fff' : ratingColor(v),
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          fontVariantNumeric: 'tabular-nums',
                          cursor: readOnly ? 'default' : 'pointer',
                          padding: 0,
                        }}
                      >
                        {v > 0 ? `+${v}` : v}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 style={s.h2}>What will you do about it?</h2>
          <p style={{ ...s.body, fontSize: 15 }}>
            Start with the ones that drain you. For each, pick one move. If it’s not “keep doing,” write who does what, by when.
          </p>
          {named
            .filter(({ t }) => typeof t.energy === 'number' && (t.energy as number) <= 0)
            .sort((a, b) => (a.t.energy as number) * ((a.t.hours as number) || 0) - (b.t.energy as number) * ((b.t.hours as number) || 0))
            .map(({ t, i }) => {
              const action = typeof t.action === 'string' ? t.action : '';
              return (
                <div key={i} style={{ padding: '14px 0', borderTop: `0.5px solid ${c.line}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{t.task as string}</span>
                    <span style={{ fontSize: 13, color: ratingColor(t.energy as number), whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {(t.energy as number) > 0 ? '+' : ''}{t.energy as number}{typeof t.hours === 'number' && t.hours ? ` · ${t.hours} hrs` : ''}
                    </span>
                  </div>
                  <div role="radiogroup" aria-label={`What you'll do about ${t.task}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {ACTIONS.map((a) => (
                      <button
                        key={a}
                        role="radio"
                        aria-checked={action === a}
                        disabled={readOnly}
                        onClick={() => setTask(i, 'action', action === a ? '' : a)}
                        style={{
                          minHeight: 34,
                          padding: '0 12px',
                          borderRadius: 999,
                          border: `1px solid ${action === a ? c.ink : c.line}`,
                          background: action === a ? c.ink : '#fff',
                          color: action === a ? c.bg : c.ink,
                          fontSize: 13,
                          fontFamily: 'inherit',
                          cursor: readOnly ? 'default' : 'pointer',
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  {action && action !== 'Keep doing' && (
                    <input
                      aria-label={`Who, what, by when for ${t.task}`}
                      value={typeof t.www === 'string' ? t.www : ''}
                      onChange={(e) => setTask(i, 'www', e.target.value)}
                      placeholder="Who, what, by when?"
                      readOnly={readOnly}
                      style={{ ...s.input, marginTop: 8 }}
                    />
                  )}
                </div>
              );
            })}
          {named.some(({ t }) => typeof t.energy === 'number' && (t.energy as number) > 0) && (
            <div style={{ marginTop: '1.5rem', padding: '12px 14px', background: '#eef2e6', borderRadius: 6 }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: '#46612f' }}>These fuel you. Protect them.</p>
              <p style={{ fontSize: 14, margin: 0 }}>
                {named.filter(({ t }) => typeof t.energy === 'number' && (t.energy as number) > 0).map(({ t }) => t.task as string).join(' · ')}
              </p>
            </div>
          )}
          {rated === 0 && <p style={s.small}>Rate your list in step 2 first.</p>}
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 style={s.h2}>What are you putting up with?</h2>
          <p style={{ ...s.body, fontSize: 15 }}>
            The stuff that isn’t on your calendar but drains you anyway. The broken process, the thing you keep avoiding, the belief that you don’t deserve it yet.
          </p>
          {fields.tolerating && <FieldInput field={fields.tolerating} value={answers.tolerating} onChange={(v) => onChange('tolerating', v)} readOnly={readOnly} showLabel={false} />}
          <h2 style={{ ...s.h2, marginTop: '2.5rem' }}>What will you start?</h2>
          <p style={{ ...s.body, fontSize: 15 }}>You just freed up time and energy. Where does it go? This is the fun part.</p>
          {fields.start && <FieldInput field={fields.start} value={answers.start} onChange={(v) => onChange('start', v)} readOnly={readOnly} showLabel={false} />}
        </section>
      )}

      {step === 4 && (
        <section>
          <h2 style={s.h2}>Your results</h2>
          <p style={{ ...s.body, fontSize: 15 }}>Calculated from your answers: hours × how it makes you feel.</p>
          <EnergySummary answers={answers} />
          {closing && <p style={{ ...s.body, fontStyle: 'italic' }}>{closing}</p>}
          {resultsExtra}
        </section>
      )}

      {step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: '2rem' }}>
          {step > 0 ? <button onClick={() => go(step - 1)} style={{ ...s.ghost, color: c.muted, fontSize: 14 }}>← Back</button> : <span />}
          <button onClick={() => go(step + 1)} disabled={!next.ok} style={{ ...s.button, opacity: next.ok ? 1 : 0.4, padding: '12px 20px', fontSize: 15 }}>
            {next.label} →
          </button>
        </div>
      )}
      {step === 4 && !resultsExtra && (
        <button onClick={() => go(0)} style={{ ...s.ghost, marginTop: '1rem' }}>← Back to your list</button>
      )}
    </div>
  );
}

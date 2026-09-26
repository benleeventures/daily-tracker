'use client';

import { useState, type ReactNode } from 'react';
import { EnergyFlow } from './energy-flow';
import type { Answers, Column, Exercise, Field, Row } from './types';
import { EnergySummary, IkigaiVisual, WheelVisual } from './visuals';
import { c, s } from './ui';

function embedUrl(url: string) {
  if (url.includes('loom.com/share/')) return url.replace('/share/', '/embed/').split('?')[0];
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return url;
}

// Everything between the title and the "mark as done" footer: how-it-works, a switch to Ben's
// example, videos, prompts, and the auto-built visual. Shared by the portal and public pages.
export function ExerciseBody({ exercise, answers, onChange, readOnly = false, resultsExtra }: {
  exercise: Exercise;
  answers: Answers;
  onChange: (id: string, value: Answers[string]) => void;
  readOnly?: boolean;
  resultsExtra?: ReactNode; // guided flows: shown on the final results step (e.g. the public lead form)
}) {
  const [showExample, setShowExample] = useState(false);
  const viewing = showExample && exercise.example ? exercise.example.answers : answers;
  const locked = readOnly || showExample;
  const scaleFields = exercise.sections.flatMap((sec) => sec.fields).filter((f) => f.kind === 'scale');

  const visual =
    exercise.visual === 'ikigai' ? <IkigaiVisual answers={viewing} />
    : exercise.visual === 'wheel' ? <WheelVisual answers={viewing} fields={scaleFields} />
    : exercise.visual === 'energy' ? <EnergySummary answers={viewing} />
    : null;

  return (
    <>
      {exercise.intro.map((p, i) => <p key={i} style={s.body}>{p}</p>)}

      {exercise.steps && !readOnly && (
        <div style={{ background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 6, padding: '14px 16px', margin: '1.5rem 0' }}>
          <p style={{ ...s.eyebrow, margin: '0 0 8px' }}>How this works</p>
          <ol style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6, listStyle: 'decimal' }}>
            {exercise.steps.map((st) => <li key={st}>{st}</li>)}
          </ol>
        </div>
      )}

      {exercise.videos?.map((v) => (
        <figure key={v.url} style={{ margin: '1.5rem 0' }}>
          <div style={{ position: 'relative', paddingTop: '56.25%', background: c.line, borderRadius: 4, overflow: 'hidden' }}>
            <iframe src={embedUrl(v.url)} title={v.label} allowFullScreen loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          </div>
          <figcaption style={{ ...s.small, marginTop: 6 }}>{v.label}</figcaption>
        </figure>
      ))}

      {exercise.example && !readOnly && (
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: c.bg, padding: '10px 0', margin: '2rem 0 0' }}>
          <div role="tablist" aria-label="Whose answers" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `0.5px solid ${c.ink}`, borderRadius: 6, overflow: 'hidden' }}>
            {[{ on: false, label: 'Your answers' }, { on: true, label: 'See Ben’s example' }].map((t) => (
              <button
                key={t.label}
                role="tab"
                aria-selected={showExample === t.on}
                onClick={() => setShowExample(t.on)}
                style={{ padding: '10px 8px', fontSize: 14, fontFamily: 'inherit', border: 'none', cursor: 'pointer', background: showExample === t.on ? c.ink : 'transparent', color: showExample === t.on ? c.bg : c.ink }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {showExample && (
            <p style={{ ...s.small, color: c.ink, margin: '8px 0 0' }}>
              {exercise.example.note} Read-only. <button onClick={() => setShowExample(false)} style={{ ...s.ghost, fontSize: 13 }}>Back to yours →</button>
            </p>
          )}
        </div>
      )}

      {exercise.flow === 'energy' && (
        <EnergyFlow
          key={showExample ? 'example' : 'mine'}
          answers={viewing}
          onChange={(id, v) => !locked && onChange(id, v)}
          readOnly={locked}
          startAtResults={showExample || readOnly}
          fields={{
            tolerating: exercise.sections.flatMap((sec) => sec.fields).find((f) => f.id === 'tolerating'),
            start: exercise.sections.flatMap((sec) => sec.fields).find((f) => f.id === 'start'),
          }}
          resultsExtra={showExample ? undefined : resultsExtra}
          closing={showExample ? undefined : exercise.closing}
        />
      )}

      {!exercise.flow && exercise.visualTop && visual}

      {!exercise.flow && exercise.sections.map((sec) => (
        <section key={sec.title} style={{ marginTop: '2.75rem' }}>
          <h2 style={s.h2}>{sec.title}</h2>
          {sec.intro && <p style={{ ...s.small, fontSize: 14, margin: '0 0 1rem' }}>{sec.intro}</p>}
          {sec.fields.map((f) => (
            <FieldInput
              key={`${showExample ? 'ex' : 'me'}-${f.id}`}
              field={f}
              value={viewing[f.id]}
              onChange={(v) => !locked && onChange(f.id, v)}
              readOnly={locked}
              showLabel={sec.fields.length > 1 || (f.kind !== 'list' && f.kind !== 'table')}
            />
          ))}
        </section>
      ))}

      {!exercise.flow && !exercise.visualTop && visual}

      {exercise.closing && !showExample && !exercise.flow && <p style={{ ...s.body, marginTop: '2.5rem', fontStyle: 'italic' }}>{exercise.closing}</p>}
    </>
  );
}

export function FieldInput({ field, value, onChange, readOnly, showLabel }: {
  field: Field;
  value: Answers[string] | undefined;
  onChange: (v: Answers[string]) => void;
  readOnly: boolean;
  showLabel: boolean;
}) {
  const label = (
    <label htmlFor={field.id} style={{ display: 'block', fontSize: 15, fontWeight: 500, margin: '0 0 4px' }}>
      {field.label}
    </label>
  );
  const hint = field.hint ? <p style={{ ...s.small, margin: '0 0 8px' }}>{field.hint}</p> : null;
  const wrap = { margin: '1.1rem 0' };

  if (field.kind === 'short') {
    return (
      <div style={wrap}>
        {label}{hint}
        <input id={field.id} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} readOnly={readOnly} style={s.input} />
      </div>
    );
  }

  if (field.kind === 'long') {
    return (
      <div style={wrap}>
        {label}{hint}
        <textarea id={field.id} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} readOnly={readOnly} rows={field.rows || 4} style={{ ...s.input, resize: 'vertical' }} />
      </div>
    );
  }

  if (field.kind === 'list') {
    const items = Array.isArray(value) ? (value as unknown[]).map((x) => (typeof x === 'string' ? x : '')) : [];
    const rows = Array.from({ length: Math.max(field.count, items.length) }, (_, i) => items[i] || '');
    return (
      <div style={wrap}>
        {showLabel && label}{hint}
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          {rows.map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 16, fontSize: 12, color: c.muted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              <input
                id={i === 0 ? field.id : undefined}
                aria-label={`${field.label} ${i + 1}`}
                value={item}
                placeholder={i === 0 ? field.placeholder : undefined}
                readOnly={readOnly}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                style={s.input}
              />
            </li>
          ))}
        </ol>
        {!readOnly && <button onClick={() => onChange([...rows, ''])} style={{ ...s.ghost, marginTop: 8, marginLeft: 26 }}>+ Add another</button>}
      </div>
    );
  }

  if (field.kind === 'table') {
    return (
      <div style={wrap}>
        {showLabel && label}{hint}
        <TableField field={field} value={value} onChange={onChange} readOnly={readOnly} />
      </div>
    );
  }

  // scale
  const n = typeof value === 'number' ? value : 0;
  return (
    <div style={wrap} role="group" aria-labelledby={`${field.id}-label`}>
      <span id={`${field.id}-label`} style={{ display: 'block', fontSize: 15, fontWeight: 500, margin: '0 0 6px' }}>{field.label}</span>
      {hint}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            onClick={() => !readOnly && onChange(v)}
            aria-pressed={n === v}
            disabled={readOnly}
            style={chip(n === v, v <= n, readOnly, { height: 36 })}
          >
            {v}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.muted, marginTop: 4 }}>
        <span>{field.low}</span>
        <span>{field.high}</span>
      </div>
    </div>
  );
}

function chip(active: boolean, filled: boolean, readOnly: boolean, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    border: `0.5px solid ${active ? c.ink : c.line}`,
    background: active ? c.ink : filled ? '#efe6d4' : c.paper,
    color: active ? c.bg : c.ink,
    borderRadius: 3,
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: readOnly ? 'default' : 'pointer',
    padding: '0 10px',
    minHeight: 32,
    ...extra,
  };
}

const ratingColor = (v: number) => (v > 0 ? '#5a7340' : v < 0 ? c.alert : c.muted);

function TableField({ field, value, onChange, readOnly }: {
  field: Extract<Field, { kind: 'table' }>;
  value: Answers[string] | undefined;
  onChange: (v: Answers[string]) => void;
  readOnly: boolean;
}) {
  const stored = Array.isArray(value) ? (value as unknown[]).filter((r): r is Row => typeof r === 'object' && r !== null) : [];
  const rows: Row[] = stored.length >= field.minRows ? stored : [...stored, ...Array.from({ length: field.minRows - stored.length }, () => ({}))];

  const update = (i: number, col: string, v: string | number) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [col]: v } : r));
    onChange(next);
  };
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ border: `0.5px solid ${c.line}`, borderRadius: 4, background: c.paper, padding: '12px 12px 10px' }}>
          {field.columns.map((col) => (
            <TableCell key={col.id} col={col} row={row} rowIndex={i} fieldLabel={field.label} onChange={(v) => update(i, col.id, v)} readOnly={readOnly} />
          ))}
          {!readOnly && rows.length > 1 && (
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => remove(i)} style={{ ...s.ghost, color: c.muted, fontSize: 12 }} aria-label={`Remove row ${i + 1}`}>Remove</button>
            </div>
          )}
        </div>
      ))}
      {!readOnly && (
        <button onClick={() => onChange([...rows, {}])} style={{ ...s.ghost, justifySelf: 'start' }}>+ {field.addLabel || 'Add another'}</button>
      )}
    </div>
  );
}

function TableCell({ col, row, rowIndex, fieldLabel, onChange, readOnly }: {
  col: Column;
  row: Row;
  rowIndex: number;
  fieldLabel: string;
  onChange: (v: string | number) => void;
  readOnly: boolean;
}) {
  const aria = `${fieldLabel} ${rowIndex + 1}: ${col.label}`;
  const small = { fontSize: 11, color: c.muted, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '8px 0 4px' };

  if (col.type === 'text') {
    if (col.showUnless && (!row[col.showUnless.column] || col.showUnless.values.includes(String(row[col.showUnless.column])))) return null;
    return (
      <div>
        {!col.primary && <div style={small}>{col.label}</div>}
        <input
          aria-label={aria}
          value={typeof row[col.id] === 'string' ? (row[col.id] as string) : ''}
          placeholder={col.placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...s.input, background: '#fff', ...(col.primary ? { fontWeight: 500 } : {}) }}
        />
      </div>
    );
  }

  if (col.type === 'number') {
    const v = row[col.id];
    return (
      <div style={{ display: 'inline-block', marginRight: 16, verticalAlign: 'top' }}>
        <div style={small}>{col.label}</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            aria-label={aria}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={v === undefined || v === '' ? '' : String(v)}
            placeholder={col.placeholder}
            readOnly={readOnly}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            style={{ ...s.input, background: '#fff', width: 76 }}
          />
          {col.suffix && <span style={{ fontSize: 13, color: c.muted }}>{col.suffix}</span>}
        </span>
      </div>
    );
  }

  if (col.type === 'rating') {
    const current = typeof row[col.id] === 'number' ? (row[col.id] as number) : null;
    const values = Array.from({ length: col.max - col.min + 1 }, (_, k) => col.min + k);
    return (
      <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
        <div style={small}>{col.label}</div>
        <div role="radiogroup" aria-label={aria} style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {values.map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={current === v}
              disabled={readOnly}
              onClick={() => onChange(v)}
              style={{
                ...chip(current === v, false, readOnly, { minWidth: 38, padding: 0 }),
                color: current === v ? c.bg : ratingColor(v),
                background: current === v ? ratingColor(v) : '#fff',
                borderColor: current === v ? ratingColor(v) : c.line,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {v > 0 ? `+${v}` : v}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // choice
  const current = typeof row[col.id] === 'string' ? (row[col.id] as string) : '';
  return (
    <div>
      <div style={small}>{col.label}</div>
      <div role="radiogroup" aria-label={aria} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {col.options.map((o) => (
          <button key={o} role="radio" aria-checked={current === o} disabled={readOnly} onClick={() => onChange(current === o ? '' : o)} style={chip(current === o, false, readOnly)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

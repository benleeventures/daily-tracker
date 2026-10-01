'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EXERCISES, exerciseBySlug } from '../exercises';
import { useCoachingSession, type Response } from '../data';
import type { Answers, Exercise, Field, Row } from '../types';
import { EnergySummary, IkigaiVisual, WheelVisual } from '../visuals';
import { Loading, Mark, c, font, s } from '../ui';

type ActionItem = { id: string; text: string; due_date: string | null; done: boolean };

// A print-ready summary of a client's finished work: answers as plain text (not form boxes) plus
// the auto-built graphics. "Download PDF" uses the browser's Save-as-PDF. Coach: ?client=<id>.
// Either way: ?slug=<exercise> for a single exercise.
export default function ReportPage() {
  const { profile } = useCoachingSession();
  const [params] = useState(() => (typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)));
  const requestedClient = params.get('client');
  const onlySlug = params.get('slug');
  const clientId = profile ? (profile.role === 'coach' && requestedClient ? requestedClient : profile.user_id) : null;

  const [name, setName] = useState('');
  const [responses, setResponses] = useState<Response[]>([]);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      let rq = supabase.from('coaching_responses').select('*').eq('client_id', clientId);
      if (onlySlug) rq = rq.eq('exercise_slug', onlySlug);
      const [r, p, a] = await Promise.all([
        rq,
        supabase.from('coaching_profiles').select('name').eq('user_id', clientId).maybeSingle(),
        supabase.from('coaching_action_items').select('id, text, due_date, done').eq('client_id', clientId).eq('done', false).order('due_date'),
      ]);
      setResponses((r.data || []) as Response[]);
      setName(p.data?.name || '');
      setItems((a.data || []) as ActionItem[]);
      setLoaded(true);
    })();
  }, [clientId, onlySlug]);

  const done = EXERCISES.filter((ex) => responses.some((r) => r.exercise_slug === ex.slug && hasContent(r.answers)));
  const single = onlySlug ? exerciseBySlug(onlySlug) : undefined;
  const title = single ? single.title : 'Coaching report';
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // The PDF's default filename comes from the page title
  useEffect(() => {
    if (loaded) document.title = [name, title, 'Ben Lee Coaching'].filter(Boolean).join(' – ');
  }, [loaded, name, title]);

  if (!profile || !loaded) return <main style={{ fontFamily: font, background: c.bg, minHeight: '100vh' }}><Loading /></main>;

  const backHref = profile.role === 'coach' && requestedClient
    ? single ? `/coaching/${single.slug}?client=${requestedClient}` : '/coaching/clients'
    : single ? `/coaching/${single.slug}` : '/coaching';

  return (
    <main className="report" style={{ background: c.bg, color: c.ink, fontFamily: font, minHeight: '100vh', padding: '2rem 1rem 4rem' }}>
      <style>{`
        @page { margin: 16mm 14mm; }
        @media print {
          .no-print { display: none !important; }
          .report { background: #fff !important; padding: 0 !important; }
          .report * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-section { break-before: page; }
          .report-section:first-of-type { break-before: auto; }
          .avoid-break { break-inside: avoid; }
        }
      `}</style>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '0 0 2rem', flexWrap: 'wrap' }}>
          <Link href={backHref} style={{ fontSize: 13, color: c.muted, textDecoration: 'none' }}>← Back</Link>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, color: c.muted }}>Choose “Save as PDF” in the print window</span>
            <button onClick={() => window.print()} disabled={done.length === 0} style={s.button}>Download PDF</button>
          </span>
        </div>

        <header style={{ borderBottom: `0.5px solid ${c.line}`, paddingBottom: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <Mark size={26} />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.3px' }}>Ben Lee Coaching</span>
          </div>
          <p style={{ ...s.eyebrow, margin: 0 }}>{name ? `Prepared for ${name}` : 'Your report'} · {today}</p>
          <h1 style={{ ...s.h1, margin: '0.35rem 0 0' }}>{title}</h1>
          {!single && done.length > 0 && <p style={{ ...s.small, margin: '0.5rem 0 0' }}>{done.map((d) => d.title).join(' · ')}</p>}
        </header>

        {done.length === 0 && <p style={s.body}>Nothing filled in yet. Answers show up here once an exercise is started.</p>}

        {done.map((ex) => {
          const r = responses.find((x) => x.exercise_slug === ex.slug)!;
          return (
            <section key={ex.slug} className="report-section" style={{ marginBottom: '3rem' }}>
              {!single && <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', margin: '0 0 0.25rem' }}>{ex.title}</h2>}
              <p style={{ ...s.small, margin: '0 0 1.25rem' }}>
                {r.status === 'submitted' && r.submitted_at
                  ? `Completed ${new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'In progress'}
              </p>
              <AnswerView exercise={ex} answers={r.answers || {}} />
              {r.coach_comment && (
                <div className="avoid-break" style={{ borderLeft: `2px solid ${c.gold}`, padding: '2px 0 2px 14px', marginTop: '1.5rem' }}>
                  <p style={{ ...s.eyebrow, marginBottom: 4 }}>Ben’s feedback</p>
                  <p style={{ ...s.body, margin: 0, whiteSpace: 'pre-wrap' }}>{r.coach_comment}</p>
                </div>
              )}
            </section>
          );
        })}

        {!single && items.length > 0 && (
          <section className="report-section avoid-break">
            <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', margin: '0 0 1rem' }}>Next steps</h2>
            <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc', lineHeight: 1.7 }}>
              {items.map((i) => (
                <li key={i.id}>
                  {i.text}
                  {i.due_date && <span style={{ color: c.muted }}> · by {new Date(i.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function hasContent(a: Answers | undefined) {
  if (!a) return false;
  return Object.values(a).some((v) =>
    Array.isArray(v) ? v.some((x) => (typeof x === 'string' ? x.trim() : x && Object.keys(x).length)) : typeof v === 'number' || (typeof v === 'string' && v.trim())
  );
}

const asRows = (v: Answers[string] | undefined): Row[] =>
  Array.isArray(v) ? (v as unknown[]).filter((r): r is Row => typeof r === 'object' && r !== null && Object.values(r).some((x) => x !== '')) : [];

const label = { fontSize: 13, fontWeight: 600, margin: '0 0 4px' } as const;
const text = { fontSize: 15, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' as const };

function AnswerView({ exercise, answers }: { exercise: Exercise; answers: Answers }) {
  const fields = exercise.sections.flatMap((sec) => sec.fields);

  if (exercise.flow === 'energy') {
    const tasks = asRows(answers.tasks).filter((t) => typeof t.task === 'string' && t.task.trim());
    return (
      <>
        <EnergySummary answers={answers} />
        {tasks.length > 0 && (
          <div className="avoid-break" style={{ marginTop: '1.5rem' }}>
            <p style={label}>Every task, with the call</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: c.muted }}>
                  <th style={th}>Task</th><th style={{ ...th, textAlign: 'right' }}>Hrs/wk</th><th style={{ ...th, textAlign: 'right' }}>Energy</th><th style={th}>Call</th><th style={th}>Who, what, by when</th>
                </tr>
              </thead>
              <tbody>
                {[...tasks].sort((a, b) => num(a.hours) * num(a.energy) - num(b.hours) * num(b.energy)).map((t, i) => (
                  <tr key={i} style={{ borderTop: `0.5px solid ${c.line}`, verticalAlign: 'top' }}>
                    <td style={td}>{t.task as string}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{t.hours ?? ''}</td>
                    <td style={{ ...td, textAlign: 'right', color: num(t.energy) < 0 ? c.alert : num(t.energy) > 0 ? '#5a7340' : c.muted }}>
                      {typeof t.energy === 'number' ? (t.energy > 0 ? `+${t.energy}` : t.energy) : ''}
                    </td>
                    <td style={td}>{(t.action as string) || ''}</td>
                    <td style={td}>{(t.www as string) || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <RowList title="What you’re tolerating" rows={asRows(answers.tolerating)} main="what" extra={(r) => [r.action, r.www].filter(Boolean).join(' · ')} />
        <RowList title="What you’ll start" rows={asRows(answers.start)} main="what" extra={(r) => (r.www as string) || ''} />
      </>
    );
  }

  return (
    <>
      {exercise.visual === 'ikigai' && <IkigaiVisual answers={answers} caption={false} />}
      {exercise.visual === 'wheel' && <WheelVisual answers={answers} fields={fields.filter((f) => f.kind === 'scale')} />}
      {fields.map((f) => <FieldAnswer key={f.id} field={f} value={answers[f.id]} skipScale={exercise.visual === 'wheel'} />)}
    </>
  );
}

const th = { padding: '4px 6px 6px', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.4px' };
const td = { padding: '7px 6px' };
const num = (v: unknown) => (typeof v === 'number' ? v : 0);

function RowList({ title, rows, main, extra }: { title: string; rows: Row[]; main: string; extra: (r: Row) => string }) {
  const filled = rows.filter((r) => typeof r[main] === 'string' && (r[main] as string).trim());
  if (filled.length === 0) return null;
  return (
    <div className="avoid-break" style={{ marginTop: '1.5rem' }}>
      <p style={label}>{title}</p>
      <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc', lineHeight: 1.6, fontSize: 15 }}>
        {filled.map((r, i) => (
          <li key={i}>
            {r[main] as string}
            {extra(r) && <span style={{ color: c.muted }}> · {extra(r)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldAnswer({ field, value, skipScale }: { field: Field; value: Answers[string] | undefined; skipScale: boolean }) {
  const wrap = { margin: '0 0 1.1rem' };
  if (field.kind === 'short' || field.kind === 'long') {
    if (typeof value !== 'string' || !value.trim()) return null;
    return <div className="avoid-break" style={wrap}><p style={label}>{field.label}</p><p style={text}>{value}</p></div>;
  }
  if (field.kind === 'list') {
    const items = Array.isArray(value) ? (value as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];
    if (items.length === 0) return null;
    return (
      <div className="avoid-break" style={wrap}>
        <p style={label}>{field.label}</p>
        <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc', lineHeight: 1.6, fontSize: 15 }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>
    );
  }
  if (field.kind === 'scale') {
    if (skipScale || typeof value !== 'number') return null;
    return <div className="avoid-break" style={wrap}><p style={label}>{field.label}</p><p style={text}>{value} / 10</p></div>;
  }
  if (field.kind === 'table') {
    const rows = asRows(value);
    if (rows.length === 0) return null;
    const primary = field.columns.find((col) => col.type === 'text' && col.primary)?.id || field.columns[0].id;
    return (
      <RowList
        title={field.label}
        rows={rows}
        main={primary}
        extra={(r) => field.columns.filter((col) => col.id !== primary && r[col.id] !== undefined && r[col.id] !== '').map((col) => String(r[col.id])).join(' · ')}
      />
    );
  }
  return null;
}

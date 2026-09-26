'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exerciseBySlug } from '../exercises';
import { formatDue, useCoachingSession, type Assignment, type Response } from '../data';
import type { Answers, Field } from '../types';
import { IkigaiVisual, WheelVisual } from '../visuals';
import { Loading, Shell, c, s } from '../ui';

function embedUrl(url: string) {
  if (url.includes('loom.com/share/')) return url.replace('/share/', '/embed/').split('?')[0];
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return url;
}

export default function ExercisePage() {
  const { slug } = useParams<{ slug: string }>();
  const exercise = exerciseBySlug(slug);
  const { profile } = useCoachingSession();

  // The coach opens a client's answers with ?client=<id>; everyone else sees their own.
  const [requestedClient] = useState(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('client')
  );
  const clientId = profile ? (profile.role === 'coach' && requestedClient ? requestedClient : profile.user_id) : null;
  const [clientName, setClientName] = useState('');
  const [response, setResponse] = useState<Response | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [comment, setComment] = useState('');
  const dirty = useRef(false);

  const viewingOther = !!profile && !!clientId && clientId !== profile.user_id;

  useEffect(() => {
    if (!clientId || !exercise) return;
    (async () => {
      const [r, a, p] = await Promise.all([
        supabase.from('coaching_responses').select('*').eq('client_id', clientId).eq('exercise_slug', exercise.slug).maybeSingle(),
        supabase.from('coaching_assignments').select('*').eq('client_id', clientId).eq('exercise_slug', exercise.slug).maybeSingle(),
        supabase.from('coaching_profiles').select('name').eq('user_id', clientId).maybeSingle(),
      ]);
      if (r.data) {
        setResponse(r.data as Response);
        setAnswers((r.data as Response).answers || {});
        setComment((r.data as Response).coach_comment || '');
      }
      if (a.data) setAssignment(a.data as Assignment);
      setClientName(p.data?.name || '');
      setLoaded(true);
    })();
  }, [clientId, exercise]);

  const save = useCallback(async (next: Answers, status?: Response['status']) => {
    if (!clientId || !exercise || viewingOther) return;
    setSaveState('saving');
    const row: Record<string, unknown> = { client_id: clientId, exercise_slug: exercise.slug, answers: next };
    if (status) {
      row.status = status;
      row.submitted_at = status === 'submitted' ? new Date().toISOString() : null;
    }
    const { data, error } = await supabase
      .from('coaching_responses')
      .upsert(row, { onConflict: 'client_id,exercise_slug' })
      .select()
      .single();
    if (error) {
      console.error('Error saving exercise:', error);
      setSaveState('error');
      dirty.current = true;
      return;
    }
    setResponse(data as Response);
    setSaveState('saved');
  }, [clientId, exercise, viewingOther]);

  // Autosave a second after typing stops, and before the tab goes away
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => { dirty.current = false; save(answers); }, 1000);
    return () => clearTimeout(t);
  }, [answers, save]);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && dirty.current) { dirty.current = false; save(answersRef.current); }
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [save]);

  const setField = (id: string, value: Answers[string]) => {
    if (viewingOther) return;
    dirty.current = true;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const saveComment = async () => {
    if (!response) return;
    const { error } = await supabase
      .from('coaching_responses')
      .update({ coach_comment: comment })
      .eq('client_id', response.client_id)
      .eq('exercise_slug', response.exercise_slug);
    setSaveState(error ? 'error' : 'saved');
  };

  if (!exercise) {
    return <Shell back={{ href: '/coaching', label: 'All exercises' }}><p style={s.body}>That exercise doesn’t exist.</p></Shell>;
  }
  if (!profile || !loaded) return <Shell><Loading /></Shell>;

  const status = response?.status || 'in_progress';
  const scaleFields = exercise.sections.flatMap((sec) => sec.fields).filter((f) => f.kind === 'scale');

  return (
    <Shell
      back={viewingOther ? { href: '/coaching/clients', label: 'Clients' } : { href: '/coaching', label: 'All exercises' }}
      right={
        <span aria-live="polite" style={{ color: saveState === 'error' ? c.alert : c.muted }}>
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Not saved — check your connection' : ''}
        </span>
      }
    >
      {viewingOther && (
        <p style={{ ...s.small, background: c.paper, border: `0.5px solid ${c.line}`, padding: '8px 12px', borderRadius: 4 }}>
          Viewing {clientName || 'client'}’s answers (read-only).
        </p>
      )}

      <p style={s.eyebrow}>{exercise.minutes} min{assignment?.due_date ? ` · Due ${formatDue(assignment.due_date)}` : ''}</p>
      <h1 style={s.h1}>{exercise.title}</h1>

      {assignment?.note && (
        <div style={{ borderLeft: `2px solid ${c.gold}`, padding: '2px 0 2px 14px', margin: '0 0 1.5rem' }}>
          <p style={{ ...s.eyebrow, marginBottom: 4 }}>Note from Ben</p>
          <p style={{ ...s.body, margin: 0, whiteSpace: 'pre-wrap' }}>{assignment.note}</p>
        </div>
      )}

      {response?.coach_comment && !viewingOther && (
        <div style={{ borderLeft: `2px solid ${c.gold}`, padding: '2px 0 2px 14px', margin: '0 0 1.5rem' }}>
          <p style={{ ...s.eyebrow, marginBottom: 4 }}>Ben’s feedback</p>
          <p style={{ ...s.body, margin: 0, whiteSpace: 'pre-wrap' }}>{response.coach_comment}</p>
        </div>
      )}

      {exercise.intro.map((p, i) => <p key={i} style={s.body}>{p}</p>)}

      {exercise.video && (
        <div style={{ position: 'relative', paddingTop: '56.25%', margin: '1.5rem 0', background: c.line, borderRadius: 4, overflow: 'hidden' }}>
          <iframe src={embedUrl(exercise.video)} title={`${exercise.title} walkthrough`} allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      )}

      {exercise.sections.map((sec) => (
        <section key={sec.title} style={{ marginTop: '2.75rem' }}>
          <h2 style={s.h2}>{sec.title}</h2>
          {sec.intro && <p style={{ ...s.small, fontSize: 14, margin: '0 0 1rem' }}>{sec.intro}</p>}
          {sec.fields.map((f) => (
            <FieldInput key={f.id} field={f} value={answers[f.id]} onChange={(v) => setField(f.id, v)} readOnly={viewingOther} showLabel={sec.fields.length > 1 || f.kind !== 'list'} />
          ))}
        </section>
      ))}

      {exercise.visual === 'ikigai' && <IkigaiVisual answers={answers} />}
      {exercise.visual === 'wheel' && <WheelVisual answers={answers} fields={scaleFields} />}

      {exercise.closing && <p style={{ ...s.body, marginTop: '2.5rem', fontStyle: 'italic' }}>{exercise.closing}</p>}

      <hr style={s.rule} />

      {viewingOther ? (
        <section>
          <h2 style={s.h2}>Feedback for {clientName || 'client'}</h2>
          {response ? (
            <>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} style={{ ...s.input, resize: 'vertical' }} placeholder="They’ll see this at the top of the exercise." />
              <button onClick={saveComment} style={{ ...s.button, marginTop: 10 }}>Save feedback</button>
            </>
          ) : (
            <p style={s.small}>They haven’t started this one yet.</p>
          )}
        </section>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {status === 'submitted' ? (
            <>
              <span style={{ fontSize: 14 }}>✓ Marked done{response?.submitted_at ? ` ${new Date(response.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
              <button onClick={() => save(answers, 'in_progress')} style={s.ghost}>Reopen</button>
            </>
          ) : (
            <>
              <button onClick={() => save(answers, 'submitted')} style={s.button}>Mark as done</button>
              <span style={s.small}>Ben gets to see your answers either way. This just tells him you’re finished.</span>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}

function FieldInput({ field, value, onChange, readOnly, showLabel }: {
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
    const items = Array.isArray(value) ? value : [];
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
        {!readOnly && (
          <button onClick={() => onChange([...rows, ''])} style={{ ...s.ghost, marginTop: 8, marginLeft: 26 }}>+ Add another</button>
        )}
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
            style={{
              height: 36,
              border: `0.5px solid ${n === v ? c.ink : c.line}`,
              background: n === v ? c.ink : v <= n ? '#efe6d4' : c.paper,
              color: n === v ? c.bg : c.ink,
              borderRadius: 3,
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: readOnly ? 'default' : 'pointer',
              padding: 0,
            }}
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

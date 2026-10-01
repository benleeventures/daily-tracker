'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exerciseBySlug } from '../exercises';
import { formatDue, useCoachingSession, type Assignment, type Response } from '../data';
import type { Answers } from '../types';
import { ExerciseBody } from '../fields';
import { Loading, Shell, c, s } from '../ui';

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
    if (!clientId || !exercise) return;
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
  }, [clientId, exercise]);

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
        <p style={{ fontSize: 14, background: '#efe6d4', border: `0.5px solid ${c.gold}`, padding: '10px 12px', borderRadius: 4, margin: '0 0 1.25rem' }}>
          You’re working in <strong>{clientName || 'this client'}’s</strong> account. Everything you type saves to them, not you.
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

      <ExerciseBody exercise={exercise} answers={answers} onChange={setField} />

      {response && (
        <p className="no-print" style={{ margin: '1.5rem 0 0' }}>
          <Link href={`/coaching/report?slug=${exercise.slug}${viewingOther ? `&client=${clientId}` : ''}`} style={{ fontSize: 14, color: c.goldDeep }}>
            Download as PDF →
          </Link>
        </p>
      )}

      <hr style={s.rule} />

      {viewingOther && (
        <section style={{ marginBottom: '2rem' }}>
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
      )}
      {(
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {status === 'submitted' ? (
            <>
              <span style={{ fontSize: 14 }}>✓ Marked done{response?.submitted_at ? ` ${new Date(response.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
              <button onClick={() => save(answers, 'in_progress')} style={s.ghost}>Reopen</button>
            </>
          ) : (
            <>
              <button onClick={() => save(answers, 'submitted')} style={s.button}>Mark as done</button>
              <span style={s.small}>{viewingOther ? 'Marks it finished on their hub.' : 'Ben gets to see your answers either way. This just tells him you’re finished.'}</span>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}


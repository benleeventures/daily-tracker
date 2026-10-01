'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EXERCISES, PHASES } from '../exercises';
import { formatDue, statusOf, useCoachingSession, type Assignment, type Profile, type Response } from '../data';
import { Loading, Shell, StatusDot, c, s } from '../ui';
import { ActionItems, Sessions } from '../items';
import { EnergySummary } from '../visuals';
import type { Answers } from '../types';

export default function ClientsPage() {
  const { profile } = useCoachingSession();
  const [clients, setClients] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [p, a, r] = await Promise.all([
      supabase.from('coaching_profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }),
      supabase.from('coaching_assignments').select('*'),
      supabase.from('coaching_responses').select('client_id, exercise_slug, status, updated_at, submitted_at, coach_comment, answers'),
    ]);
    setClients((p.data || []) as Profile[]);
    setAssignments((a.data || []) as Assignment[]);
    setResponses((r.data || []) as Response[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (profile?.role === 'coach') load();
  }, [profile, load]);

  if (!profile) return <Shell><Loading /></Shell>;
  if (profile.role !== 'coach') {
    return <Shell back={{ href: '/coaching', label: 'Back' }}><p style={s.body}>This page is for Ben.</p></Shell>;
  }
  if (!loaded) return <Shell><Loading /></Shell>;

  return (
    <Shell back={{ href: '/coaching', label: 'Exercises' }}>
      <p style={s.eyebrow}>Coach view</p>
      <h1 style={s.h1}>Clients</h1>

      <AddClient onAdded={(id) => { load(); setOpenId(id); }} />

      {clients.length === 0 ? (
        <p style={s.body}>No clients yet. Add one above.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `0.5px solid ${c.line}` }}>
          {clients.map((cl) => {
            const mine = responses.filter((r) => r.client_id === cl.user_id);
            const theirAssignments = assignments.filter((a) => a.client_id === cl.user_id);
            const done = mine.filter((r) => r.status === 'submitted').length;
            const last = mine.map((r) => r.updated_at).sort().at(-1);
            const open = openId === cl.user_id;
            return (
              <li key={cl.user_id} style={{ borderBottom: `0.5px solid ${c.line}` }}>
                <button
                  onClick={() => setOpenId(open ? null : cl.user_id)}
                  aria-expanded={open}
                  style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', padding: '16px 0', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}
                >
                  <span>
                    <span style={{ display: 'block', fontWeight: 500 }}>{cl.name || 'Unnamed client'}</span>
                    <span style={s.small}>
                      {done}/{theirAssignments.length || EXERCISES.length} done
                      {last ? ` · active ${new Date(last).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ' · not started'}
                    </span>
                  </span>
                  <span style={{ color: c.muted, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
                </button>
                {open && <ClientDetail client={cl} assignments={theirAssignments} responses={mine} onChange={load} />}
              </li>
            );
          })}
        </ul>
      )}

      <hr style={s.rule} />
      <Leads />
    </Shell>
  );
}

type Lead = { id: string; name: string; email: string; note: string; answers: Answers; created_at: string };

// Submissions from the public Energy Audit at /energy-audit
function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('energy_audit_leads').select('*').order('created_at', { ascending: false }).then(({ data }) => setLeads((data || []) as Lead[]));
  }, []);

  return (
    <section>
      <h2 style={s.h2}>Energy Audit leads</h2>
      <p style={{ ...s.small, margin: '0 0 0.75rem' }}>
        From the free audit at <Link href="/energy-audit" style={{ color: c.goldDeep }}>teambenlee.com/energy-audit</Link>.
      </p>
      {leads.length === 0 ? (
        <p style={s.small}>None yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `0.5px solid ${c.line}` }}>
          {leads.map((l) => {
            const open = openId === l.id;
            return (
              <li key={l.id} style={{ borderBottom: `0.5px solid ${c.line}` }}>
                <button onClick={() => setOpenId(open ? null : l.id)} aria-expanded={open} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>
                    <span style={{ fontWeight: 500 }}>{l.name || l.email}</span>
                    <span style={{ ...s.small, display: 'block' }}>{l.email} · {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </span>
                  <span style={{ fontSize: 12, color: c.muted }}>{open ? '▲' : '▼'}</span>
                </button>
                {open && (
                  <div style={{ paddingBottom: 12 }}>
                    {l.note && <p style={{ ...s.body, fontSize: 15, whiteSpace: 'pre-wrap' }}>“{l.note}”</p>}
                    <EnergySummary answers={l.answers} />
                    <a href={`mailto:${l.email}?subject=${encodeURIComponent('Your Energy Audit')}`} style={{ fontSize: 13, color: c.goldDeep }}>Reply by email ↗</a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// Creates the client's account (silently, no email) via the coaching-add-client edge function,
// so Ben can fill exercises in for them during a session. Sending the sign-in link is a separate step.
function AddClient({ onAdded }: { onAdded: (userId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('saving');
    setError('');
    const { data, error } = await supabase.functions.invoke('coaching-add-client', { body: { name, email } });
    const message = data?.error || (error ? 'Something went wrong. Try again.' : '');
    if (message || !data?.user_id) {
      setState('error');
      setError(message || 'Something went wrong. Try again.');
      return;
    }
    setState('idle');
    setName('');
    setEmail('');
    setOpen(false);
    onAdded(data.user_id);
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} style={{ ...s.button, marginBottom: '1.75rem' }}>+ Add a client</button>;
  }
  return (
    <form onSubmit={add} style={{ display: 'grid', gap: 8, padding: 14, background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 6, marginBottom: '1.75rem' }}>
      <p style={{ ...s.small, color: c.ink, margin: 0 }}>
        This creates their account. No email goes out yet, so you can fill things in together first. Send them a sign-in link whenever you’re ready.
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Client name" required style={s.input} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Client email" type="email" required style={s.input} />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button type="submit" disabled={state === 'saving'} style={s.button}>{state === 'saving' ? 'Adding…' : 'Add client'}</button>
        <button type="button" onClick={() => setOpen(false)} style={{ ...s.ghost, color: c.muted }}>Cancel</button>
      </div>
      {state === 'error' && <p style={{ ...s.small, color: c.alert, margin: 0 }}>{error}</p>}
    </form>
  );
}

// Emails the client a one-tap sign-in link to their hub. Works only for accounts that already exist.
function SendLink({ email, name }: { email: string; name: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const send = async () => {
    if (!confirm(`Email ${name || email} a sign-in link to their coaching hub?`)) return;
    setState('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/coaching` },
    });
    setState(error ? 'error' : 'sent');
  };
  if (state === 'sent') return <span style={{ fontSize: 13, color: '#5a7340' }}>✓ Sign-in link sent</span>;
  return (
    <button onClick={send} disabled={state === 'sending'} style={s.ghost}>
      {state === 'sending' ? 'Sending…' : state === 'error' ? 'Didn’t send. Try again' : 'Send sign-in link'}
    </button>
  );
}

function ClientDetail({ client, assignments, responses, onChange }: {
  client: Profile;
  assignments: Assignment[];
  responses: Response[];
  onChange: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [focus, setFocus] = useState(client.focus);
  const [savedProfile, setSavedProfile] = useState(false);

  const saveProfile = async () => {
    await supabase.from('coaching_profiles').update({ name, focus }).eq('user_id', client.user_id);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 1500);
    onChange();
  };

  const assign = async (slug: string, due_date: string | null, note: string) => {
    await supabase
      .from('coaching_assignments')
      .upsert({ client_id: client.user_id, exercise_slug: slug, due_date, note }, { onConflict: 'client_id,exercise_slug' });
    onChange();
  };

  const unassign = async (slug: string) => {
    await supabase.from('coaching_assignments').delete().eq('client_id', client.user_id).eq('exercise_slug', slug);
    onChange();
  };

  return (
    <div style={{ padding: '0 0 1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', alignItems: 'center', margin: '0 0 1rem', fontSize: 13 }}>
        {client.email && <span style={{ color: c.muted }}>{client.email}</span>}
        {client.email && <SendLink email={client.email} name={client.name} />}
        <Link href={`/coaching/report?client=${client.user_id}`} style={{ color: c.goldDeep }}>PDF report</Link>
      </div>
      <div style={{ display: 'grid', gap: 8, marginBottom: '1.5rem' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={s.input} aria-label="Client name" />
        <textarea value={focus} onChange={(e) => setFocus(e.target.value)} rows={3} placeholder="Their focus right now (shows at the top of their hub)" style={{ ...s.input, resize: 'vertical' }} aria-label="Client focus" />
        <div>
          <button onClick={saveProfile} style={s.button}>{savedProfile ? 'Saved' : 'Save'}</button>
        </div>
      </div>

      <p style={{ ...s.eyebrow, margin: '0 0 6px' }}>Action items</p>
      <div style={{ marginBottom: '1.5rem' }}><ActionItems clientId={client.user_id} /></div>

      <p style={{ ...s.eyebrow, margin: '0 0 6px' }}>Sessions</p>
      <div style={{ marginBottom: '1.75rem' }}><Sessions clientId={client.user_id} canEdit /></div>

      <p style={{ ...s.eyebrow, margin: '0 0 6px' }}>Exercises</p>
      {PHASES.map((phase) => (
        <div key={phase.id} style={{ marginBottom: '1rem' }}>
          <p style={{ ...s.eyebrow, margin: '0 0 4px' }}>0{phase.number} {phase.title}</p>
          {EXERCISES.filter((e) => e.phase === phase.id).map((ex) => (
            <AssignRow
              key={ex.slug}
              title={ex.title}
              href={`/coaching/${ex.slug}?client=${client.user_id}`}
              assignment={assignments.find((a) => a.exercise_slug === ex.slug)}
              status={statusOf(ex.slug, responses)}
              hasComment={!!responses.find((r) => r.exercise_slug === ex.slug)?.coach_comment}
              onAssign={(due, note) => assign(ex.slug, due, note)}
              onUnassign={() => unassign(ex.slug)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function AssignRow({ title, href, assignment, status, hasComment, onAssign, onUnassign }: {
  title: string;
  href: string;
  assignment?: Assignment;
  status: 'not_started' | 'in_progress' | 'submitted';
  hasComment: boolean;
  onAssign: (due: string | null, note: string) => void;
  onUnassign: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [due, setDue] = useState(assignment?.due_date || '');
  const [note, setNote] = useState(assignment?.note || '');

  return (
    <div style={{ borderTop: `0.5px solid ${c.line}`, padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ minWidth: 0 }}>
          <Link href={href} style={{ color: c.ink, textDecoration: status === 'not_started' ? 'none' : 'underline', textDecorationColor: c.line, textUnderlineOffset: 3 }}>
            {title}
          </Link>
          {assignment && <span style={{ fontSize: 11, color: c.goldDeep, marginLeft: 8 }}>assigned{assignment.due_date ? ` · due ${formatDue(assignment.due_date)}` : ''}</span>}
          {hasComment && <span style={{ fontSize: 11, color: c.muted, marginLeft: 8 }}>· feedback sent</span>}
        </span>
        <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <StatusDot status={status} />
          <button onClick={() => setEditing(!editing)} style={s.ghost}>{assignment ? 'Edit' : 'Assign'}</button>
        </span>
      </div>
      {editing && (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={s.input} aria-label="Due date" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note for them (optional)" style={{ ...s.input, resize: 'vertical' }} aria-label="Note" />
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button onClick={() => { onAssign(due || null, note); setEditing(false); }} style={s.button}>{assignment ? 'Update' : 'Assign'}</button>
            {assignment && <button onClick={() => { onUnassign(); setEditing(false); }} style={{ ...s.ghost, color: c.alert }}>Unassign</button>}
            <button onClick={() => setEditing(false)} style={{ ...s.ghost, color: c.muted }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

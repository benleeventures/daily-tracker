'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EXERCISES, PHASES, WELCOME } from './exercises';
import { formatDue, loadClientState, statusOf, useCoachingSession, type Assignment, type Response } from './data';
import { Loading, Shell, StatusDot, c, s } from './ui';
import { ActionItems, Sessions } from './items';

export default function CoachingHub() {
  const { profile, setProfile, email } = useCoachingSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (!profile) return;
    loadClientState(profile.user_id).then(({ assignments, responses }) => {
      setAssignments(assignments);
      setResponses(responses);
    });
  }, [profile]);

  if (!profile) return <Shell><Loading /></Shell>;

  const isCoach = profile.role === 'coach';
  const assignedSlugs = new Set(assignments.map((a) => a.exercise_slug));
  const upNext = assignments
    .filter((a) => statusOf(a.exercise_slug, responses) !== 'submitted')
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
  const firstName = (profile.name || '').split(' ')[0];

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name) return;
    // Profile rows are coach-editable only; this RPC updates just the caller's name
    const { error } = await supabase.rpc('set_my_coaching_name', { new_name: name });
    if (!error) setProfile({ ...profile, name });
  };

  return (
    <Shell
      right={
        <>
          {isCoach && <Link href="/coaching/clients" style={{ color: c.goldDeep, textDecoration: 'none' }}>Clients →</Link>}
          <button onClick={() => supabase.auth.signOut().then(() => window.location.replace('/login?next=/coaching'))} style={{ ...s.ghost, color: c.muted, fontSize: 12 }}>
            Sign out
          </button>
        </>
      }
    >
      <p style={s.eyebrow}>{firstName ? `Welcome, ${firstName}` : 'Welcome'}</p>
      <h1 style={s.h1}>{WELCOME.title}</h1>
      {WELCOME.body.map((p, i) => <p key={i} style={s.body}>{p}</p>)}

      {!profile.name && !isCoach && (
        <div style={{ display: 'flex', gap: 8, margin: '1.5rem 0' }}>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            placeholder="What should I call you?"
            style={s.input}
            aria-label="Your name"
          />
          <button onClick={saveName} style={s.button}>Save</button>
        </div>
      )}

      {profile.focus && (
        <div style={{ borderLeft: `2px solid ${c.gold}`, padding: '4px 0 4px 16px', margin: '2rem 0' }}>
          <p style={{ ...s.eyebrow, marginBottom: 6 }}>Your focus right now</p>
          <p style={{ ...s.body, margin: 0, whiteSpace: 'pre-wrap' }}>{profile.focus}</p>
        </div>
      )}

      {upNext.length > 0 && (
        <section style={{ margin: '2.5rem 0' }}>
          <h2 style={s.h2}>Up next</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `0.5px solid ${c.line}` }}>
            {upNext.map((a) => {
              const ex = EXERCISES.find((e) => e.slug === a.exercise_slug);
              if (!ex) return null;
              return (
                <li key={a.id} style={{ borderBottom: `0.5px solid ${c.line}` }}>
                  <Link href={`/coaching/${ex.slug}`} style={{ display: 'block', padding: '14px 0', color: 'inherit', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 500 }}>{ex.title}</span>
                      <span style={{ fontSize: 12, color: c.goldDeep, whiteSpace: 'nowrap' }}>{a.due_date ? `Due ${formatDue(a.due_date)}` : ''}</span>
                    </div>
                    {a.note && <p style={{ ...s.small, margin: '4px 0 0' }}>{a.note}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section style={{ margin: '2.5rem 0' }}>
        <h2 style={s.h2}>Action items</h2>
        <p style={{ ...s.small, margin: '0 0 0.75rem' }}>What we agreed you’d do. Add your own too.</p>
        <ActionItems clientId={profile.user_id} />
      </section>

      <section style={{ margin: '2.5rem 0' }}>
        <h2 style={s.h2}>Sessions</h2>
        <Sessions clientId={profile.user_id} canEdit={isCoach} />
      </section>

      <hr style={s.rule} />

      <p style={s.eyebrow}>The path</p>
      {PHASES.map((phase) => {
        const items = EXERCISES.filter((e) => e.phase === phase.id);
        return (
          <section key={phase.id} style={{ margin: '1.75rem 0 2.5rem' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: c.gold, fontVariantNumeric: 'tabular-nums' }}>0{phase.number}</span>
              <div>
                <h2 style={s.h2}>{phase.title}</h2>
                <p style={{ ...s.small, margin: '0 0 0.75rem' }}>{phase.question}</p>
              </div>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `0.5px solid ${c.line}` }}>
              {items.map((ex) => (
                <li key={ex.slug} style={{ borderBottom: `0.5px solid ${c.line}` }}>
                  <Link
                    href={`/coaching/${ex.slug}`}
                    style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', color: 'inherit', textDecoration: 'none' }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 500 }}>
                        {ex.title}
                        {assignedSlugs.has(ex.slug) && <span style={{ fontSize: 11, color: c.goldDeep, marginLeft: 8 }}>assigned</span>}
                      </span>
                      <span style={{ ...s.small, display: 'block' }}>{ex.summary} · {ex.minutes} min</span>
                    </span>
                    <StatusDot status={statusOf(ex.slug, responses)} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p style={{ ...s.small, marginTop: '3rem' }}>Signed in as {email}</p>
    </Shell>
  );
}

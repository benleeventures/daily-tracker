'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Answers } from './types';

export type Profile = { user_id: string; role: 'client' | 'coach'; name: string; focus: string };
export type Assignment = { id: string; client_id: string; exercise_slug: string; due_date: string | null; note: string };
export type Response = {
  client_id: string;
  exercise_slug: string;
  answers: Answers;
  status: 'in_progress' | 'submitted';
  coach_comment: string;
  submitted_at: string | null;
  updated_at: string;
};

// Signed-in user + their coaching profile. Redirects to login if signed out, and creates a
// client profile the first time someone opens the portal.
export function useCoachingSession() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      setEmail(session.user.email || '');
      let { data } = await supabase.from('coaching_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      if (!data) {
        const created = await supabase
          .from('coaching_profiles')
          .insert({ user_id: session.user.id, role: 'client' })
          .select()
          .single();
        data = created.data;
      }
      if (!cancelled && data) setProfile(data as Profile);
    })();
    return () => { cancelled = true; };
  }, []);

  return { profile, setProfile, email };
}

export async function loadClientState(clientId: string) {
  const [a, r] = await Promise.all([
    supabase.from('coaching_assignments').select('*').eq('client_id', clientId),
    supabase.from('coaching_responses').select('*').eq('client_id', clientId),
  ]);
  return {
    assignments: (a.data || []) as Assignment[],
    responses: (r.data || []) as Response[],
  };
}

export type ExerciseStatus = 'not_started' | 'in_progress' | 'submitted';

export function statusOf(slug: string, responses: Response[]): ExerciseStatus {
  const r = responses.find((x) => x.exercise_slug === slug);
  if (!r) return 'not_started';
  return r.status;
}

export function formatDue(date: string | null) {
  if (!date) return '';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

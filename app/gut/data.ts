'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { emptyDay, normalize } from './day';
import type { Config, Day, SaveState } from './types';

export { addDays, dayLabel, daysBetween, emptyDay, longDate } from './day';

// ---- session + access ----

export type GutSession =
  | { status: 'loading' }
  | { status: 'denied'; email: string }
  | { status: 'ready'; userId: string; email: string };

// Signed-out visitors go to login. Signed-in visitors not on the gut_access allowlist see "denied";
// the database enforces the same rule, so the page check is only for a friendly message.
export function useGutSession(): GutSession {
  const [session, setSession] = useState<GutSession>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.replace(`/login?next=${encodeURIComponent('/gut')}`);
        return;
      }
      const { id, email = '' } = data.session.user;
      const { data: row } = await supabase.from('gut_access').select('user_id').eq('user_id', id).maybeSingle();
      if (cancelled) return;
      setSession(row ? { status: 'ready', userId: id, email } : { status: 'denied', email });
    })();
    return () => { cancelled = true; };
  }, []);

  return session;
}

// ---- config: Day 1 defaults to the earliest day record ----

export function useGutConfig(userId: string | null) {
  const [config, setConfig] = useState<Config>({ goals: [] });
  const [firstDay, setFirstDay] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [cfg, first] = await Promise.all([
        supabase.from('gut_config').select('doc').eq('user_id', userId).maybeSingle(),
        supabase.from('gut_days').select('date').eq('user_id', userId).order('date', { ascending: true }).limit(1).maybeSingle(),
      ]);
      if (cancelled) return;
      if (cfg.data?.doc) setConfig({ goals: [], ...(cfg.data.doc as Partial<Config>) });
      if (first.data?.date) setFirstDay(first.data.date as string);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { config, setConfig, firstDay, loaded };
}

// ---- one day, with debounced autosave ----

const DEBOUNCE_MS = 700;

// Autosave rules: every change is debounced ~700ms; one write in flight at a time, always carrying the
// latest state; pending writes flush before the date changes or the page is hidden; on error the local
// state stays and the next change retries.
export function useDay(userId: string, date: string) {
  const [loaded, setLoaded] = useState<Day | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });

  const dayRef = useRef<Day | null>(null);
  const dirty = useRef(new Map<string, Day>()); // latest unsaved doc per date
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draining = useRef<Promise<void> | null>(null);

  const drain = useCallback((): Promise<void> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (draining.current) return draining.current;
    draining.current = (async () => {
      while (dirty.current.size > 0) {
        const [date, doc] = dirty.current.entries().next().value as [string, Day];
        dirty.current.delete(date);
        setSave({ kind: 'saving' });
        const { error } = await supabase
          .from('gut_days')
          .upsert({ user_id: userId, date, doc }, { onConflict: 'user_id,date' });
        if (error) {
          // Keep it for retry unless a newer edit for that date already queued
          if (!dirty.current.has(date)) dirty.current.set(date, doc);
          setSave({ kind: 'error', message: error.message || "Couldn't save" });
          return;
        }
        setSave({ kind: 'saved', at: new Date() });
      }
    })().finally(() => { draining.current = null; });
    return draining.current;
  }, [userId]);

  const update = useCallback((fn: (d: Day) => Day) => {
    const current = dayRef.current;
    if (!current) return;
    const next = { ...fn(current), updatedAt: new Date().toISOString() };
    dayRef.current = next;
    setLoaded(next);
    dirty.current.set(next.date, next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void drain(); }, DEBOUNCE_MS);
  }, [drain]);

  // Load the day. Anything still unsaved (including from a failed write) wins over the server copy.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await drain();
      const pending = dirty.current.get(date);
      let doc: Day;
      if (pending) {
        doc = pending;
      } else {
        const { data, error } = await supabase.from('gut_days').select('doc').eq('user_id', userId).eq('date', date).maybeSingle();
        if (cancelled) return;
        if (error) {
          setSave({ kind: 'error', message: "Couldn't load this day" });
          return;
        }
        doc = data?.doc ? normalize(data.doc as Partial<Day>, date) : emptyDay(date);
      }
      if (cancelled) return;
      dayRef.current = doc;
      setLoaded(doc);
    })();
    return () => { cancelled = true; };
  }, [userId, date, drain]);

  // Flush when the tab is hidden or closed (best effort on close)
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') void drain(); };
    const onUnload = () => { void drain(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [drain]);

  // Until the requested date has loaded, show nothing rather than the previous day
  const day = loaded && loaded.date === date ? loaded : null;
  return { day, update, save, flush: drain };
}

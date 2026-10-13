'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyNote, hasScores, parseNote, type ParsedNote } from './parse-note';
import type { Day } from './types';

export type ImportMessage = { kind: 'ok' | 'error'; text: string };
type Incoming = { note: ParsedNote; target: string };

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// Lives above the tabs because importing a note dated for another day navigates there, which unmounts
// the Day tab; the import finishes once that day has loaded.
export function useNoteImport(opts: {
  day: Day | null;
  update: (fn: (d: Day) => Day) => void;
  today: string;
  viewed: string;
  setDate: (d: string) => void;
}) {
  const { day, update, today, viewed, setDate } = opts;
  const [message, setMessage] = useState<ImportMessage | null>(null);
  const [dup, setDup] = useState<Incoming | null>(null);
  const incoming = useRef<Incoming | null>(null);

  const apply = useCallback((inc: Incoming) => {
    update((d) => applyNote(d, inc.note, newId));
    const parts = [`${inc.note.meals.length} meal${inc.note.meals.length === 1 ? '' : 's'}`, `${inc.note.bms.length} BM${inc.note.bms.length === 1 ? '' : 's'}`];
    const scores = hasScores(inc.note) ? ', plus check-in scores' : '';
    setMessage({ kind: 'ok', text: `Imported via template into ${inc.target}: ${parts.join(', ')}${scores}. Review below.` });
  }, [update]);

  const process = useCallback((inc: Incoming, loaded: Day) => {
    if (loaded.imports?.includes(inc.note.hash)) {
      setDup(inc);
      setMessage(null);
      return;
    }
    apply(inc);
  }, [apply]);

  // Returns whether the note parsed, so the caller can clear its textarea
  const start = useCallback((text: string): boolean => {
    setDup(null);
    const res = parseNote(text);
    if (!res.ok) {
      setMessage({ kind: 'error', text: res.error });
      return false;
    }
    // A missing or future date means "the day I'm looking at"
    const dated = res.note.date;
    const target = dated && dated <= today ? dated : viewed;
    const inc = { note: res.note, target };
    if (target === viewed && day) {
      process(inc, day);
    } else {
      incoming.current = inc;
      setDate(target);
    }
    return true;
  }, [day, today, viewed, setDate, process]);

  // Finish a cross-day import once the target day has loaded
  useEffect(() => {
    const inc = incoming.current;
    if (inc && day && day.date === inc.target) {
      incoming.current = null;
      process(inc, day);
    }
  }, [day, process]);

  const confirmDup = useCallback(() => {
    if (dup) apply(dup);
    setDup(null);
  }, [dup, apply]);

  return { message, dup: !!dup, start, confirmDup, cancelDup: () => setDup(null), clear: () => setMessage(null) };
}

export type NoteImport = ReturnType<typeof useNoteImport>;

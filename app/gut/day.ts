import { AUDIT_DAYS } from './constants';
import type { Day } from './types';

// Day document helpers shared by the browser app and the ingest route (no 'use client' here).

export function emptyDay(date: string): Day {
  return {
    date,
    am: { rituals: {} },
    meals: [],
    bms: [],
    pm: { actions: {}, rituals: {} },
    updatedAt: new Date().toISOString(),
  };
}

// Stored docs may predate a field; fill the containers so the UI never trips on undefined.
export function normalize(doc: Partial<Day>, date: string): Day {
  const base = emptyDay(date);
  return {
    ...base,
    ...doc,
    date,
    am: { ...base.am, ...doc.am, rituals: { ...doc.am?.rituals } },
    pm: { ...base.pm, ...doc.pm, actions: { ...doc.pm?.actions }, rituals: { ...doc.pm?.rituals } },
    meals: doc.meals ?? [],
    bms: doc.bms ?? [],
  };
}

// Dates are "YYYY-MM-DD" local strings, never converted through UTC for display.

const parts = (date: string) => date.split('-').map(Number) as [number, number, number];

export function addDays(date: string, n: number): string {
  const [y, m, d] = parts(date);
  const next = new Date(y, m - 1, d + n);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

// Whole days between two date strings. Uses UTC math only to dodge DST; never for display.
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = parts(from);
  const [ty, tm, td] = parts(to);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

export function longDate(date: string): string {
  const [y, m, d] = parts(date);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function shortDate(date: string): string {
  const [y, m, d] = parts(date);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function dayLabel(start: string, date: string): string {
  const n = daysBetween(start, date) + 1;
  if (n < 1) return 'Before day 1';
  if (n > AUDIT_DAYS) return `Day ${n}`;
  return `Day ${n} of ${AUDIT_DAYS}`;
}

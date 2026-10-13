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

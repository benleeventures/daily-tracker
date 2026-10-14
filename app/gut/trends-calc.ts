import { TAGS } from './constants';
import { addDays } from './day';
import type { Day, TagKey } from './types';

// Pure calculations behind the Trends tab (build spec 5.5, 7.2-7.4). Unset scores are undefined and are
// skipped everywhere, so a missing value never drags an average toward zero.

const isNum = (n: number | undefined): n is number => typeof n === 'number' && !Number.isNaN(n);

export const mean = (xs: (number | undefined)[]): number | undefined => {
  const v = xs.filter(isNum);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
};

export const one = (n: number) => n.toFixed(1);

// Oldest first, ending today
export function windowDates(today: string, n = 14): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

// A day counts as logged only if something real was entered (an empty record doesn't count)
export function hasData(d: Day): boolean {
  const scalars = (o: object) => Object.entries(o).some(([, v]) => v !== undefined && v !== '' && typeof v !== 'object');
  const flags = (o: object) => Object.values(o).some(Boolean);
  return (
    scalars(d.am) || flags(d.am.rituals) ||
    scalars(d.pm) || flags(d.pm.actions) || flags(d.pm.rituals) ||
    d.meals.length > 0 || d.bms.length > 0 || !!d.flag
  );
}

export type WindowStats = {
  avgBloat?: number;
  avgSleep?: number;
  loggedDays: number;
  bmCount: number;
  bmPerDay?: number;
  mucus: number;
  woke: number;
  hasBlood: boolean;
};

export function windowStats(byDate: Map<string, Day>, dates: string[]): WindowStats {
  const days = dates.map((d) => byDate.get(d)).filter((d): d is Day => !!d);
  const logged = days.filter(hasData);
  const bms = days.flatMap((d) => d.bms);
  return {
    avgBloat: mean(days.map((d) => d.pm.bloat)),
    avgSleep: mean(days.map((d) => d.am.sleepQ)),
    loggedDays: logged.length,
    bmCount: bms.length,
    bmPerDay: logged.length ? bms.length / logged.length : undefined,
    mucus: bms.filter((b) => b.mucus).length,
    woke: bms.filter((b) => b.night).length,
    hasBlood: bms.some((b) => b.blood),
  };
}

export function bristolCounts(byDate: Map<string, Day>, dates: string[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  for (const date of dates) for (const b of byDate.get(date)?.bms ?? []) if (b.bristol) counts[b.bristol]++;
  return counts;
}

// Two nights in a row with a bowel movement that woke you
export function nightsRunning(byDate: Map<string, Day>, dates: string[]): boolean {
  const woke = (date: string) => !!byDate.get(date)?.bms.some((b) => b.night);
  return dates.some((date, i) => i > 0 && woke(date) && woke(dates[i - 1]));
}

export type TagRow = { tag: TagKey; label: string; daysWith: number; avgWith: number; avgWithout: number; gap: number };

// Over every day with a night bloating score. A tag shows only with at least 2 days with and 2 without.
export function foodTagRows(allDays: Day[]): { rows: TagRow[]; scored: number } {
  const scored = allDays.filter((d) => isNum(d.pm.bloat));
  const rows: TagRow[] = [];
  for (const tag of Object.keys(TAGS) as TagKey[]) {
    const withTag = scored.filter((d) => d.meals.some((m) => m.tags.includes(tag)));
    const without = scored.filter((d) => !withTag.includes(d));
    if (withTag.length < 2 || without.length < 2) continue;
    const avgWith = mean(withTag.map((d) => d.pm.bloat))!;
    const avgWithout = mean(without.map((d) => d.pm.bloat))!;
    rows.push({ tag, label: TAGS[tag], daysWith: withTag.length, avgWith, avgWithout, gap: avgWith - avgWithout });
  }
  rows.sort((a, b) => b.gap - a.gap);
  return { rows, scored: scored.length };
}

export const signed = (n: number) => `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(1)}`;

// Plain text for a doctor visit. Only days with something to report, only modifiers that occurred, top 5 tags.
export function doctorSummary(byDate: Map<string, Day>, dates: string[], rows: TagRow[]): string {
  const lines: string[] = [`Gut log summary — ${dates[0]} to ${dates[dates.length - 1]}`, ''];
  for (const date of dates) {
    const d = byDate.get(date);
    if (!d) continue;
    const parts: string[] = [];
    if (isNum(d.pm.bloat)) parts.push(`bloat ${d.pm.bloat}/10`);
    if (isNum(d.pm.gas)) parts.push(`gas ${d.pm.gas}`);
    if (isNum(d.pm.pain)) parts.push(`pain ${d.pm.pain}`);
    if (isNum(d.am.sleepQ)) parts.push(`sleep ${d.am.sleepQ}/10`);
    if (isNum(d.pm.stress)) parts.push(`stress ${d.pm.stress}`);

    let bm = '';
    if (d.bms.length) {
      const types = d.bms.map((b) => b.bristol).filter(isNum);
      const mods = [
        d.bms.some((b) => b.mucus) && 'mucus',
        d.bms.some((b) => b.urgency) && 'urgency',
        d.bms.some((b) => b.strain || b.incomplete) && 'straining/incomplete',
        d.bms.some((b) => b.night) && 'nocturnal',
        d.bms.some((b) => b.blood) && 'BLOOD',
      ].filter(Boolean);
      bm = `BMs ${d.bms.length}${types.length ? ` (Bristol ${types.join(',')})` : ''}${mods.length ? `, ${mods.join(', ')}` : ''}`;
    }
    if (!parts.length && !bm) continue;
    lines.push(`${date}: ${[parts.join(', '), bm].filter(Boolean).join('; ')}`);
  }
  const top = rows.slice(0, 5);
  if (top.length) {
    lines.push('', 'Food tags vs bloating (association only):');
    for (const r of top) lines.push(`- ${r.label}: ${one(r.avgWith)} with vs ${one(r.avgWithout)} without (${r.daysWith} days)`);
  }
  return lines.join('\n');
}

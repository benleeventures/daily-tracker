// Polar AccessLink v3 client and the mapping from Polar data to Gut Audit and Dailys.
// Only values Polar actually returned are written; anything missing is left out, never guessed.

export const POLAR_AUTH_URL = 'https://flow.polar.com/oauth2/authorization';
export const POLAR_TOKEN_URL = 'https://polarremote.com/v2/oauth2/token';
export const POLAR_API = 'https://www.polaraccesslink.com/v3';
export const TZ = 'America/Costa_Rica';

export const todayInCostaRica = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export function shiftDate(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export class PolarAuthError extends Error {}

async function polarGet<T>(path: string, token: string): Promise<T | null> {
  const res = await fetch(`${POLAR_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 401 || res.status === 403) throw new PolarAuthError(`Polar refused the token (${res.status})`);
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`Polar ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

type Night = {
  date: string;
  sleep_start_time?: string;
  sleep_end_time?: string;
  light_sleep?: number;
  deep_sleep?: number;
  rem_sleep?: number;
  sleep_score?: number;
  total_interruption_duration?: number;
  long_interruption_duration?: number;
};
type Recharge = {
  date: string;
  heart_rate_avg?: number;
  heart_rate_variability_avg?: number;
  breathing_rate_avg?: number;
  ans_charge?: number;
  nightly_recharge_status?: number;
};
type Activity = { start_time?: string; date?: string; steps?: number; active_duration?: string };
type Exercise = { start_time?: string; sport?: string; detailed_sport_info?: string; duration?: string };

// What we keep from Polar for one day. Stored as-is on the Gut day under `polar`.
export type PolarDay = {
  sleepMin?: number;
  sleepScore?: number;
  bed?: string; // HH:MM local
  wake?: string;
  interruptionsMin?: number;
  hrv?: number; // ms
  rhr?: number; // bpm
  breathing?: number;
  ansCharge?: number;
  rechargeStatus?: number; // 1–6, Polar's Nightly Recharge scale
  steps?: number;
  workouts?: { sport: string; minutes: number; start?: string }[];
  syncedAt: string;
};

const hhmm = (iso?: string) => (iso && /T(\d{2}:\d{2})/.exec(iso)?.[1]) || undefined;

export function isoMinutes(d?: string): number | undefined {
  const m = d && /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(d);
  if (!m) return undefined;
  return Math.round(Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) + Number(m[3] ?? 0) / 60);
}

const sportName = (e: Exercise) =>
  (e.detailed_sport_info || e.sport || 'workout').toLowerCase().replace(/_/g, ' ');

// Sleep and recharge are dated by the morning you wake; steps and workouts by the calendar day.
export async function fetchPolarDay(token: string, date: string): Promise<PolarDay> {
  const [nights, recharges, activities, exercises] = await Promise.all([
    polarGet<{ nights: Night[] }>('/users/sleep', token),
    polarGet<{ recharges: Recharge[] }>('/users/nightly-recharge', token),
    polarGet<Activity[]>(`/users/activities?from=${date}&to=${date}`, token).catch(() => null),
    polarGet<Exercise[]>('/exercises', token),
  ]);

  const night = nights?.nights?.find((n) => n.date === date);
  const rc = recharges?.recharges?.find((r) => r.date === date);
  const act = Array.isArray(activities) ? activities.find((a) => (a.date ?? a.start_time ?? '').startsWith(date)) : undefined;
  const workouts = (exercises ?? [])
    .filter((e) => e.start_time?.startsWith(date))
    .map((e) => ({ sport: sportName(e), minutes: isoMinutes(e.duration) ?? 0, start: hhmm(e.start_time) }));

  const day: PolarDay = { syncedAt: new Date().toISOString() };
  if (night) {
    const secs = (night.light_sleep ?? 0) + (night.deep_sleep ?? 0) + (night.rem_sleep ?? 0);
    if (secs > 0) day.sleepMin = Math.round(secs / 60);
    if (night.sleep_score != null) day.sleepScore = night.sleep_score;
    day.bed = hhmm(night.sleep_start_time);
    day.wake = hhmm(night.sleep_end_time);
    if (night.total_interruption_duration != null) day.interruptionsMin = Math.round(night.total_interruption_duration / 60);
  }
  if (rc) {
    if (rc.heart_rate_variability_avg != null) day.hrv = rc.heart_rate_variability_avg;
    if (rc.heart_rate_avg != null) day.rhr = rc.heart_rate_avg;
    if (rc.breathing_rate_avg != null) day.breathing = Math.round(rc.breathing_rate_avg * 10) / 10;
    if (rc.ans_charge != null) day.ansCharge = Math.round(rc.ans_charge * 10) / 10;
    if (rc.nightly_recharge_status != null) day.rechargeStatus = rc.nightly_recharge_status;
  }
  if (act?.steps != null) day.steps = act.steps;
  if (workouts.length) day.workouts = workouts;
  return day;
}

const dur = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;

// One plain line for Dailys observations. Empty string when Polar had nothing.
export function polarSummary(p: PolarDay): string {
  const bits: string[] = [];
  if (p.sleepMin != null) bits.push(`sleep ${dur(p.sleepMin)}${p.sleepScore != null ? ` (score ${p.sleepScore})` : ''}`);
  if (p.hrv != null) bits.push(`HRV ${p.hrv} ms`);
  if (p.rhr != null) bits.push(`RHR ${p.rhr}`);
  if (p.ansCharge != null) bits.push(`ANS ${p.ansCharge}`);
  if (p.steps != null) bits.push(`${p.steps.toLocaleString('en-US')} steps`);
  for (const w of p.workouts ?? []) bits.push(`${w.sport} ${w.minutes} min`);
  return bits.length ? `Polar: ${bits.join(', ')}` : '';
}

const MOVE_SPORTS = /surf|run|cycl|bik|swim|strength|gym|yoga|walk|hik|paddle|training|other/;

// Dailys note for one day. Movement habit only when Polar logged a workout.
export function dailiesNote(date: string, p: PolarDay): string | null {
  const line = polarSummary(p);
  if (!line) return null;
  const habits = p.workouts?.some((w) => MOVE_SPORTS.test(w.sport)) ? '\nhabits: movement' : '';
  return `# ${date}\n\n## Day\nobservations: ${line}${habits}\n`;
}

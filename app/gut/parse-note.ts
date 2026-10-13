import { ACTIONS, MEAL_TYPES, RITUALS, TAGS } from './constants';
import type { ActionKey, BowelMovement, BristolType, Day, Meal, RitualKey, TagKey } from './types';

// Parser for the daily note Instinct produces (build spec section 6). Pure and forgiving: unknown lines are
// skipped, and nothing it returns is invented. Anything it can't read is simply left out.

type Section = 'pre' | 'none' | 'am' | 'meals' | 'bms' | 'pm';

type NumericAm = 'wakeups' | 'sleepQ' | 'energy' | 'stress' | 'bloat';
export type ParsedNote = {
  date: string | null;
  hash: string;
  flag?: string;
  status?: 'partial';
  am: Partial<Pick<Day['am'], NumericAm | 'bed' | 'wake' | 'coffee' | 'intention'>> & { rituals: RitualKey[] };
  pm: Partial<Omit<Day['pm'], 'rituals' | 'actions'>> & { rituals: RitualKey[]; actions: ActionKey[] };
  meals: Omit<Meal, 'id'>[];
  bms: Omit<BowelMovement, 'id'>[];
};

export type ParseResult = { ok: true; note: ParsedNote } | { ok: false; error: string };

export const NOT_TEMPLATE = "That note doesn't follow the template. Copy the template and match its headings.";

const DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/;

function firstDate(text: string): string | null {
  const m = DATE_RE.exec(text);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(y, mo - 1, d);
  return check.getFullYear() === y && check.getMonth() === mo - 1 && check.getDate() === d ? m[0] : null;
}

// Small stable hash (FNV-1a) of the note with line endings and outer whitespace normalized
export function hashNote(text: string): string {
  const norm = text.replace(/\r\n?/g, '\n').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// "HH:MM", "H.MM", "7am", "7:30 pm" -> 24h "HH:MM". Anything else is rejected.
export function parseTime(raw: string): string | undefined {
  const m = /^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i.exec(raw.trim().replace(/\.$/, ''));
  if (!m) return undefined;
  const hasMinutes = m[2] !== undefined;
  const ap = m[3]?.toLowerCase();
  if (!hasMinutes && !ap) return undefined; // a bare "7" is ambiguous
  let h = Number(m[1]);
  const min = hasMinutes ? Number(m[2]) : 0;
  if (min > 59) return undefined;
  if (ap) {
    if (h < 1 || h > 12) return undefined;
    h = (h % 12) + (ap === 'pm' ? 12 : 0);
  } else if (h > 23) {
    return undefined;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const firstNumber = (v: string): number | undefined => {
  const m = /-?\d+(?:\.\d+)?/.exec(v);
  return m ? Number(m[0]) : undefined;
};

const score = (v: string): number | undefined => {
  const n = firstNumber(v);
  return n === undefined ? undefined : Math.min(10, Math.max(0, Math.round(n)));
};

// Match a token to a key by exact key, or by label prefix ("high-fructose" -> fructose)
function matchKey<K extends string>(labels: Record<K, string>, token: string): K | undefined {
  const t = token.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t) return undefined;
  const keys = Object.keys(labels) as K[];
  const exact = keys.find((k) => k === t);
  if (exact) return exact;
  if (t.length < 3) return undefined;
  return keys.find((k) => labels[k].toLowerCase().startsWith(t));
}

const list = <K extends string>(labels: Record<K, string>, v: string): K[] =>
  v.split(/[,;]/).map((x) => matchKey(labels, x)).filter((k): k is K => !!k);

function sectionOf(heading: string): Section | null {
  const h = heading.toLowerCase();
  if (/\bbms?\b|bowel|stool|poop/.test(h)) return 'bms';
  if (/meal|food/.test(h)) return 'meals';
  if (/morn|^am\b/.test(h)) return 'am';
  if (/night|^pm\b|evening/.test(h)) return 'pm';
  return null;
}

const TIME_LEAD = /^(\d{1,2}[:.]\d{2}(?:\s*[ap]m)?|\d{1,2}\s*[ap]m)(?=\s|$)\s*/i;

function parseMeal(body: string): Omit<Meal, 'id'> {
  let rest = body;
  let time: string | undefined;
  const t = TIME_LEAD.exec(rest);
  if (t) {
    time = parseTime(t[1]);
    rest = rest.slice(t[0].length);
  }
  let type: Meal['type'] | undefined;
  const ty = /^(breakfast|lunch|dinner|snack|off-plan|celebration)\b\s*:?\s*/i.exec(rest);
  if (ty) {
    const word = ty[1].toLowerCase();
    type = word === 'celebration' ? 'Off-plan' : MEAL_TYPES.find((m) => m.toLowerCase() === word);
    rest = rest.slice(ty[0].length);
  }
  const tags: TagKey[] = [];
  rest = rest.replace(/\[([^\]]*)\]/g, (_, inner: string) => {
    tags.push(...list(TAGS, inner));
    return '';
  });
  if (!type) {
    const hour = time ? Number(time.slice(0, 2)) : undefined;
    type = hour === undefined ? 'Snack' : hour < 11 ? 'Breakfast' : hour < 16 ? 'Lunch' : 'Dinner';
  }
  return { type, time, what: rest.replace(/\s+/g, ' ').trim(), tags: [...new Set(tags)] };
}

function parseBm(body: string): Omit<BowelMovement, 'id'> {
  let rest = body;
  const bm: Omit<BowelMovement, 'id'> = {};
  const t = TIME_LEAD.exec(rest);
  if (t) {
    bm.time = parseTime(t[1]);
    rest = rest.slice(t[0].length);
  }
  const b = /(?:bristol|type)\s*([1-7])\b/i.exec(rest) || /\bb([1-7])\b/i.exec(rest);
  if (b) bm.bristol = Number(b[1]) as BristolType;
  const low = rest.toLowerCase();
  if (/\bmucus\b/.test(low)) bm.mucus = true;
  if (/\burgen(cy|t)\b/.test(low)) bm.urgency = true;
  if (/\bstrain/.test(low)) bm.strain = true;
  if (/\bincomplete\b/.test(low)) bm.incomplete = true;
  if (/\bcoffee\b/.test(low)) bm.coffee = true;
  if (/\bnight\b|\bwoke\b/.test(low)) bm.night = true;
  if (/\bblood|\bblack\b|\btarry\b/.test(low)) bm.blood = true;
  if (/\bphoto\b/.test(low)) bm.photo = true;
  return bm;
}

export function parseNote(text: string): ParseResult {
  const note: ParsedNote = {
    date: firstDate(text),
    hash: hashNote(text),
    am: { rituals: [] },
    pm: { rituals: [], actions: [] },
    meals: [],
    bms: [],
  };

  let section: Section = 'pre';
  let sawSection = false;
  let lastMeal: Omit<Meal, 'id'> | null = null;

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const heading = /^#{1,3}\s*(.*)$/.exec(raw.trim());
    if (heading) {
      const h = heading[1].trim();
      const sec = sectionOf(h);
      lastMeal = null;
      if (sec) {
        section = sec;
        sawSection = true;
      } else if (DATE_RE.test(h) && !sawSection) {
        section = 'pre'; // the "# 2026-10-14" title line
      } else {
        section = 'none'; // any other heading (like a Key legend) ends the section
      }
      continue;
    }

    const line = raw.replace(/\*\*/g, '').replace(/[’]/g, "'").trim();
    if (!line || section === 'none') continue;

    if (section === 'meals') {
      const after = /^after\s*:\s*(.*)$/i.exec(line);
      if (after) {
        if (lastMeal && after[1].trim()) lastMeal.after = after[1].trim();
        continue;
      }
      const bullet = /^[-*]\s+(.*)$/.exec(line);
      if (bullet) {
        lastMeal = parseMeal(bullet[1]);
        note.meals.push(lastMeal);
      }
      continue;
    }

    if (section === 'bms') {
      const bullet = /^[-*]\s+(.*)$/.exec(line);
      if (bullet) note.bms.push(parseBm(bullet[1]));
      continue;
    }

    const kv = /^[-*]?\s*([A-Za-z' ]+?)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1].toLowerCase().replace(/\s+/g, ' ').trim();
    const value = kv[2].trim();
    if (!value) continue;

    if (section === 'pre') {
      if (key === 'flag') note.flag = value;
      else if (key === 'status' && /partial/i.test(value)) note.status = 'partial';
      continue;
    }

    if (section === 'am') {
      const am = note.am;
      switch (key) {
        case 'bed': am.bed = parseTime(value) ?? am.bed; break;
        case 'wake': am.wake = parseTime(value) ?? am.wake; break;
        case 'wakeups': case 'wake ups': {
          const n = firstNumber(value);
          if (n !== undefined) am.wakeups = Math.max(0, Math.round(n));
          break;
        }
        case 'sleep': case 'sleep quality': am.sleepQ = score(value) ?? am.sleepQ; break;
        case 'energy': am.energy = score(value) ?? am.energy; break;
        case 'stress': am.stress = score(value) ?? am.stress; break;
        case 'belly': case 'bloat': am.bloat = score(value) ?? am.bloat; break;
        case 'coffee': am.coffee = parseTime(value) ?? am.coffee; break;
        case 'intention': case 'purpose': am.intention = value; break;
        case 'rituals': am.rituals.push(...list(RITUALS, value)); break;
      }
      continue;
    }

    // night
    const pm = note.pm;
    switch (key) {
      case 'bloat': case 'bloating': {
        const [scorePart, timePart] = value.split('@');
        pm.bloat = score(scorePart) ?? pm.bloat;
        if (timePart) pm.bloatTime = parseTime(timePart) ?? pm.bloatTime;
        break;
      }
      case 'gas': pm.gas = score(value) ?? pm.gas; break;
      case 'pain': pm.pain = score(value) ?? pm.pain; break;
      case 'energy': pm.energy = score(value) ?? pm.energy; break;
      case 'stress': pm.stress = score(value) ?? pm.stress; break;
      case 'libido': pm.libido = score(value) ?? pm.libido; break;
      case 'water': {
        const n = firstNumber(value);
        if (n !== undefined && n >= 0) pm.water = n;
        break;
      }
      case 'lastmeal': case 'last meal': pm.lastMeal = parseTime(value) ?? pm.lastMeal; break;
      case 'supps': {
        const lead = /^(yes|y|all)\b[\s,:;-]*/i.exec(value);
        if (lead) {
          pm.suppsOk = true;
          const rest = value.slice(lead[0].length).trim();
          if (rest) pm.supps = rest;
        } else {
          pm.supps = value;
        }
        break;
      }
      case 'training': pm.training = value; break;
      case 'actions': pm.actions.push(...list(ACTIONS, value)); break;
      case 'rituals': pm.rituals.push(...list(RITUALS, value)); break;
      case 'adversity': pm.adversity = value; break;
      case 'good': case "what's good": pm.good = value; break;
      case 'tomorrow': pm.tomorrow = value; break;
    }
  }

  if (!sawSection) return { ok: false, error: NOT_TEMPLATE };
  return { ok: true, note };
}

export function hasScores(n: ParsedNote): boolean {
  const defined = (o: object, skip: string[]) =>
    Object.entries(o).some(([k, v]) => !skip.includes(k) && v !== undefined && !Array.isArray(v));
  return defined(n.am, []) || defined(n.pm, []);
}

// Merge into a day without deleting anything: present scalars overwrite, rituals/actions OR together,
// meals and bowel movements are appended with new ids.
export function applyNote(day: Day, n: ParsedNote, newId: () => string): Day {
  const am = { ...day.am, rituals: { ...day.am.rituals } };
  for (const [k, v] of Object.entries(n.am)) {
    if (k !== 'rituals' && v !== undefined) (am as Record<string, unknown>)[k] = v;
  }
  n.am.rituals.forEach((r) => { am.rituals[r] = true; });

  const pm = { ...day.pm, actions: { ...day.pm.actions }, rituals: { ...day.pm.rituals } };
  for (const [k, v] of Object.entries(n.pm)) {
    if (k !== 'rituals' && k !== 'actions' && v !== undefined) (pm as Record<string, unknown>)[k] = v;
  }
  n.pm.actions.forEach((a) => { pm.actions[a] = true; });
  n.pm.rituals.forEach((r) => { pm.rituals[r] = true; });

  return {
    ...day,
    flag: n.flag ?? day.flag,
    status: n.status ?? day.status,
    am,
    pm,
    meals: [...day.meals, ...n.meals.map((m) => ({ ...m, id: newId() }))],
    bms: [...day.bms, ...n.bms.map((b) => ({ ...b, id: newId() }))],
    imports: [...(day.imports ?? []), n.hash],
  };
}

export function noteTemplate(date: string): string {
  return `# ${date}
flag:
status:

## Morning
bed: 23:00
wake: 06:30
wakeups: 1
sleep: 7
energy: 6
stress: 5
belly: 2
coffee: 07:00
rituals: breath, purpose
intention: Calm, focused build day

## Meals
- 08:00 Breakfast: eggs, avocado, coffee [coffee]
  after: fine
- 13:00 Lunch: chicken, rice, salad [grains, raw]
  after: bloated 30 min later

## BMs
- 07:30 bristol 6 mucus coffee photo
- 18:00 bristol 2 strain incomplete

## Night
bloat: 6 @ 21:00
gas: 5
pain: 1
energy: 6
stress: 7
libido: 4
water: 2.5
lastmeal: 19:30
supps: yes, creatine, D/K
training: 45 min surf, felt good
actions: sun, walk, meditate
rituals: breath
adversity: Stressful call before dinner, ate fast
good: Walk after dinner helped
tomorrow: Eat dinner by 7

## Key (ignored on import)
tags: ${Object.keys(TAGS).join(', ')}
bm flags: bristol 1-7, mucus, urgency, strain, incomplete, coffee, night, blood, photo
rituals: ${Object.keys(RITUALS).join(', ')}
actions: ${Object.keys(ACTIONS).join(', ')}
`;
}

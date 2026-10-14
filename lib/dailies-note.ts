// Parser and merge for the note Instinct sends to Dailys (see docs/dailies-note-format.md).
// Pure and forgiving: lines it can't read are skipped, and nothing it returns is invented.

export type Task = { id: string; text: string; completed: boolean };
export type Entry = {
  reflection: string;
  energy: string;
  observations: string;
  habits: Record<string, boolean>;
  tasks: Task[];
};
export type MeetingRow = { id: string; person: string; notes: string; granola_link: string; action_items: Task[] };

export type ParsedNote = {
  date: string | null;
  energy?: string;
  reflection?: string;
  observations?: string;
  habits: string[];
  tasks: { text: string; completed: boolean }[];
  meetings: { person: string; notes: string; granola_link: string; action_items: { text: string; completed: boolean }[] }[];
};
export type ParseResult = { ok: true; note: ParsedNote } | { ok: false; error: string };

export const NOT_TEMPLATE = "That note doesn't follow the template. Use the headings ## Day, ## Tasks and ## Meetings.";

// Same five faces as the Dailys check-in, lowest to highest
const FACES = ['😤', '😔', '😐', '😊', '🤩'];
const HABIT_IDS = ['surf', 'write', 'meditate', 'supplements', 'biofeedback'] as const;
const HABIT_ALIASES: Record<string, (typeof HABIT_IDS)[number]> = {
  surf: 'surf', movement: 'surf', 'surf/movement': 'surf', workout: 'surf', train: 'surf',
  write: 'write', journal: 'write', 'write in journal': 'write',
  meditate: 'meditate', meditation: 'meditate',
  supplements: 'supplements', peptides: 'supplements', 'supplements/peptides': 'supplements',
  biofeedback: 'biofeedback',
};

const MAX_TEXT = 4000;
const MAX_ITEMS = 100;
const MAX_MEETINGS = 30;

const clip = (s: string, n = MAX_TEXT) => s.trim().slice(0, n);
const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function firstDate(text: string): string | null {
  const m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  return check.getUTCFullYear() === y && check.getUTCMonth() === mo - 1 && check.getUTCDate() === d ? m[0] : null;
}

function parseEnergy(raw: string): string | undefined {
  const v = raw.trim();
  if (FACES.includes(v)) return v;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? FACES[n - 1] : undefined;
}

const CHECK_RE = /^[-*]\s*\[( |x|X)\]\s+(.+)$/;
const BULLET_RE = /^[-*]\s+(.+)$/;

function parseItem(line: string): { text: string; completed: boolean } | null {
  const c = CHECK_RE.exec(line);
  if (c) return { text: clip(c[2], 500), completed: c[1] !== ' ' };
  const b = BULLET_RE.exec(line);
  return b ? { text: clip(b[1], 500), completed: false } : null;
}

// "key: value" with indented lines continuing the value
function readFields(lines: string[], keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  let current: string | null = null;
  for (const raw of lines) {
    const m = /^([A-Za-z_]+)\s*:\s*(.*)$/.exec(raw);
    if (m && keys.includes(m[1].toLowerCase()) && !/^\s/.test(raw)) {
      current = m[1].toLowerCase();
      out[current] = m[2];
    } else if (current && /^\s+\S/.test(raw)) {
      out[current] += '\n' + raw.trim();
    } else if (raw.trim() === '') {
      if (current) out[current] += '\n';
    } else {
      current = null;
    }
  }
  return out;
}

export function parseNote(text: string): ParseResult {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const note: ParsedNote = { date: null, habits: [], tasks: [], meetings: [] };

  let section: 'pre' | 'day' | 'tasks' | 'meetings' | 'other' = 'pre';
  let sawHeading = false;
  const dayLines: string[] = [];
  let meeting: { person: string; lines: string[] } | null = null;
  const meetingBlocks: { person: string; lines: string[] }[] = [];

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const h1 = /^#\s+(.*)$/.exec(line);
    if (h1) {
      note.date ??= firstDate(h1[1]);
      continue;
    }
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2) {
      const name = h2[1].trim().toLowerCase();
      meeting = null;
      if (name === 'day') section = 'day';
      else if (name === 'tasks') section = 'tasks';
      else if (name === 'meetings') section = 'meetings';
      else section = 'other';
      sawHeading ||= section !== 'other';
      continue;
    }
    const h3 = /^###\s+(.*)$/.exec(line);
    if (h3 && section === 'meetings') {
      meeting = { person: clip(h3[1], 120), lines: [] };
      if (meeting.person) meetingBlocks.push(meeting);
      else meeting = null;
      continue;
    }
    if (section === 'pre') note.date ??= firstDate(line);
    else if (section === 'day') dayLines.push(line);
    else if (section === 'tasks') {
      const item = parseItem(line);
      if (item && item.text) note.tasks.push(item);
    } else if (section === 'meetings' && meeting) meeting.lines.push(line);
  }

  if (!sawHeading) return { ok: false, error: NOT_TEMPLATE };

  const day = readFields(dayLines, ['energy', 'reflection', 'observations', 'habits']);
  if (day.energy) note.energy = parseEnergy(day.energy);
  if (day.reflection?.trim()) note.reflection = clip(day.reflection);
  if (day.observations?.trim()) note.observations = clip(day.observations);
  if (day.habits) {
    const ids = new Set<string>();
    for (const part of day.habits.split(',')) {
      const id = HABIT_ALIASES[part.trim().toLowerCase()];
      if (id) ids.add(id);
    }
    note.habits = [...ids];
  }

  for (const block of meetingBlocks.slice(0, MAX_MEETINGS)) {
    const fields = readFields(
      block.lines.filter((l) => !CHECK_RE.test(l) && !BULLET_RE.test(l)),
      ['granola', 'notes'],
    );
    const items = block.lines.map(parseItem).filter((i): i is { text: string; completed: boolean } => !!i && !!i.text);
    const link = (fields.granola ?? '').trim();
    note.meetings.push({
      person: block.person,
      notes: clip(fields.notes ?? ''),
      granola_link: /^https:\/\//.test(link) ? link.slice(0, 500) : '',
      action_items: items.slice(0, MAX_ITEMS),
    });
  }
  note.tasks = note.tasks.slice(0, MAX_ITEMS);

  const empty =
    !note.energy && !note.reflection && !note.observations && note.habits.length === 0 &&
    note.tasks.length === 0 && note.meetings.length === 0;
  if (empty) return { ok: false, error: 'The note has the right headings but nothing in it to import.' };
  return { ok: true, note };
}

// Adds a note's text to what is already there without losing it or doubling it on a resend
const appendText = (existing: string, added: string) => {
  const have = (existing || '').trim();
  if (!have) return added;
  return have.includes(added.trim()) ? have : `${have}\n\n${added}`;
};

function mergeItems(existing: Task[], incoming: { text: string; completed: boolean }[], newId: () => string): Task[] {
  const out = existing.map((t) => ({ ...t }));
  for (const item of incoming) {
    const match = out.find((t) => sameText(t.text, item.text));
    if (match) {
      if (item.completed) match.completed = true; // a note can finish an item, never reopen one
    } else {
      out.push({ id: newId(), text: item.text, completed: item.completed });
    }
  }
  return out;
}

export type DayDoc = { entry: Entry | null; meetings: MeetingRow[] };

// Never overwrites: text is appended, habits only turn on, tasks and action items are added by text.
export function applyNote(existing: DayDoc, note: ParsedNote, newId: () => string, newMeetingId: () => string): { entry: Entry | null; meetings: MeetingRow[] } {
  const touchesEntry =
    note.energy || note.reflection || note.observations || note.habits.length > 0 || note.tasks.length > 0;

  let entry: Entry | null = null;
  if (touchesEntry) {
    const base: Entry = existing.entry ?? { reflection: '', energy: '', observations: '', habits: {}, tasks: [] };
    entry = {
      reflection: note.reflection ? appendText(base.reflection, note.reflection) : base.reflection || '',
      energy: note.energy ?? base.energy ?? '',
      observations: note.observations ? appendText(base.observations, note.observations) : base.observations || '',
      habits: { ...(base.habits || {}), ...Object.fromEntries(note.habits.map((h) => [h, true])) },
      tasks: mergeItems(base.tasks || [], note.tasks, newId),
    };
  }

  const changed: MeetingRow[] = [];
  for (const m of note.meetings) {
    const found = existing.meetings.find((x) => sameText(x.person, m.person));
    if (found) {
      changed.push({
        ...found,
        notes: m.notes ? appendText(found.notes, m.notes) : found.notes || '',
        granola_link: found.granola_link || m.granola_link,
        action_items: mergeItems(found.action_items || [], m.action_items, newId),
      });
    } else {
      changed.push({
        id: newMeetingId(),
        person: m.person,
        notes: m.notes,
        granola_link: m.granola_link,
        action_items: mergeItems([], m.action_items, newId),
      });
    }
  }
  return { entry, meetings: changed };
}

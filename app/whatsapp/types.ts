export type Bucket = 'today' | 'week' | 'read';

export type Chat = {
  name: string;
  unread: number;
  need: string; // what they're waiting on, one line
  draft?: string; // suggested reply; Ben sends it himself
};

export type Brief = {
  scannedAt: string; // ISO time of the scan
  unreadChats: number;
  scanned: number; // how many chats the scan actually reached
  today: Chat[];
  week: Chat[];
  read: Chat[];
  note?: string; // anything the scan couldn't do
};

const chat = (v: unknown): Chat | null => {
  const o = v as Record<string, unknown>;
  if (!o || typeof o.name !== 'string') return null;
  return {
    name: o.name.slice(0, 120),
    unread: Number(o.unread) || 0,
    need: String(o.need ?? '').slice(0, 400),
    draft: typeof o.draft === 'string' ? o.draft.slice(0, 600) : undefined,
  };
};
const list = (v: unknown) => (Array.isArray(v) ? v.map(chat).filter((x): x is Chat => !!x).slice(0, 200) : []);

// Trusts nothing from the poster: keeps only known fields, trimmed.
export function normalizeBrief(v: unknown): Brief | null {
  const o = v as Record<string, unknown>;
  if (!o || typeof o !== 'object') return null;
  const today = list(o.today), week = list(o.week), read = list(o.read);
  if (!today.length && !week.length && !read.length) return null;
  return {
    scannedAt: typeof o.scannedAt === 'string' && !isNaN(Date.parse(o.scannedAt)) ? o.scannedAt : new Date().toISOString(),
    unreadChats: Number(o.unreadChats) || 0,
    scanned: Number(o.scanned) || today.length + week.length + read.length,
    today,
    week,
    read,
    note: typeof o.note === 'string' ? o.note.slice(0, 600) : undefined,
  };
}

// Exercise content is authored in code (exercises.ts) so it's versioned and easy to edit.
// The database only stores assignments and each client's answers, keyed by exercise slug + field id.

export type Field =
  | { kind: 'short'; id: string; label: string; hint?: string; placeholder?: string }
  | { kind: 'long'; id: string; label: string; hint?: string; placeholder?: string; rows?: number }
  | { kind: 'list'; id: string; label: string; hint?: string; count: number; placeholder?: string }
  | { kind: 'scale'; id: string; label: string; hint?: string; low: string; high: string }
  | { kind: 'table'; id: string; label: string; hint?: string; columns: Column[]; minRows: number; addLabel?: string };

// One row per item (a task, a toleration…). Rendered as a compact card so it works on a phone.
export type Column =
  | { id: string; label: string; type: 'text'; placeholder?: string; primary?: boolean; showUnless?: { column: string; values: string[] } }
  | { id: string; label: string; type: 'number'; placeholder?: string; suffix?: string }
  | { id: string; label: string; type: 'rating'; min: number; max: number }
  | { id: string; label: string; type: 'choice'; options: string[] };

export type Row = Record<string, string | number>;

export type Section = {
  title: string;
  intro?: string;
  fields: Field[];
};

export type PhaseId = 'ground' | 'vision' | 'offer' | 'build';

export type Phase = {
  id: PhaseId;
  number: number;
  title: string;
  question: string;
  summary: string;
};

export type Exercise = {
  slug: string;
  title: string;
  phase: PhaseId;
  minutes: number;
  summary: string; // one line, shown in lists
  intro: string[]; // paragraphs in Ben's voice
  videos?: { label: string; url: string }[]; // Loom/YouTube share URLs
  sections: Section[];
  visual?: 'ikigai' | 'wheel' | 'energy'; // optional summary built from the answers
  visualTop?: boolean; // show the visual above the prompts so people see what they're building
  steps?: string[]; // "How this works", in plain words
  example?: { note: string; answers: Answers }; // Ben's own completed version, shown read-only
  closing?: string;
};

export type Answers = Record<string, string | string[] | number | Row[]>;

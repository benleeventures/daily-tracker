// Exercise content is authored in code (exercises.ts) so it's versioned and easy to edit.
// The database only stores assignments and each client's answers, keyed by exercise slug + field id.

export type Field =
  | { kind: 'short'; id: string; label: string; hint?: string; placeholder?: string }
  | { kind: 'long'; id: string; label: string; hint?: string; placeholder?: string; rows?: number }
  | { kind: 'list'; id: string; label: string; hint?: string; count: number; placeholder?: string }
  | { kind: 'scale'; id: string; label: string; hint?: string; low: string; high: string };

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
  video?: string; // Loom/YouTube share URL
  sections: Section[];
  visual?: 'ikigai' | 'wheel'; // optional summary graphic built from the answers
  closing?: string;
};

export type Answers = Record<string, string | string[] | number>;

import type { ACTIONS, BRISTOL, MEAL_TYPES, RITUALS, TAGS } from './constants';

export type TagKey = keyof typeof TAGS;
export type RitualKey = keyof typeof RITUALS;
export type ActionKey = keyof typeof ACTIONS;
export type BristolType = keyof typeof BRISTOL;

export type Meal = {
  id: string;
  type: (typeof MEAL_TYPES)[number];
  time?: string; // "HH:MM"
  what: string;
  tags: TagKey[];
  after?: string; // how it felt 30–90 min later
};

export type BowelMovement = {
  id: string;
  time?: string;
  bristol?: BristolType;
  mucus?: boolean;
  urgency?: boolean;
  strain?: boolean;
  incomplete?: boolean;
  coffee?: boolean; // right after coffee
  night?: boolean; // woke me up
  blood?: boolean; // blood or black/tarry: red flag
  photo?: boolean;
};

// An unset score is undefined, never 0. Averages and charts skip unset values.
export type Day = {
  date: string; // "YYYY-MM-DD", local date
  status?: 'partial';
  flag?: string;
  am: {
    bed?: string;
    wake?: string;
    wakeups?: number;
    sleepQ?: number;
    energy?: number;
    stress?: number;
    bloat?: number;
    coffee?: string;
    intention?: string;
    rituals: Partial<Record<RitualKey, boolean>>;
  };
  meals: Meal[];
  bms: BowelMovement[];
  pm: {
    bloat?: number;
    bloatTime?: string;
    gas?: number;
    pain?: number;
    energy?: number;
    stress?: number;
    libido?: number;
    water?: number;
    lastMeal?: string;
    suppsOk?: boolean;
    supps?: string;
    training?: string;
    actions: Partial<Record<ActionKey, boolean>>;
    rituals: Partial<Record<RitualKey, boolean>>;
    adversity?: string;
    good?: string;
    tomorrow?: string;
  };
  imports?: string[]; // hashes of notes already imported into this day, to warn before a repeat
  updatedAt: string; // ISO timestamp
};

export type Config = {
  start?: string; // Day 1, "YYYY-MM-DD"; defaults to the earliest day record
  mission?: string;
  goals: string[];
};

export type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: Date } | { kind: 'error'; message: string };

// Course text from Miguel de la Roza's Week 1 (re:center). Everything here is open — nothing is gated.

export type PracticeClass = {
  id: string;
  title: string;
  minutes: number;
  suggested: string; // a suggestion, never a lock
  steps: string[];
};

export const course = {
  eyebrow: 'Nervous System · Week 1',
  title: 'The Diaphragm',
  quote: 'Body first. Always.',
  teacher: 'Miguel de la Roza',
  teacherLine: '17 years · Vipassana, Ajahn Tong tradition',
};

export const classes: PracticeClass[] = [
  {
    id: 'c1',
    title: 'Feeling the Diaphragm for the First Time',
    minutes: 15,
    suggested: 'Days 1–2',
    steps: ['Scan', 'Move', 'Breathe', 'Meditate'],
  },
  {
    id: 'c2',
    title: 'Opening the Chest · Ujjayi',
    minutes: 17,
    suggested: 'Days 3–6',
    steps: ['Scan', 'Move', 'Ujjayi', 'Meditate'],
  },
  {
    id: 'c3',
    title: 'First Complete Ritual · Bhramari',
    minutes: 20,
    suggested: 'Day 7',
    steps: ['Scan', 'Full move', 'Bhramari', 'Ritual'],
  },
];

export const hard: { q: string; a: string }[] = [
  { q: 'I fall asleep.', a: 'Normal in the first weeks. Try half-open eyes or a more upright posture.' },
  { q: "My mind won't stop.", a: 'It is not about stopping the mind. Each return is the practice.' },
  { q: 'I get bored.', a: 'Boredom is the antechamber of silence. It is the default mode network resisting the release of control.' },
  { q: "I don't feel anything special.", a: 'There is no special state to reach. The effects show up in life, not in the session.' },
  { q: 'I skip days.', a: 'One 5-minute day is worth more than giving up entirely.' },
];

export type Learn = { id: string; kicker: string; title: string; paras: string[]; list?: string[]; quote?: string };

export const learn: Learn[] = [
  {
    id: 'anatomy',
    kicker: 'Anatomy',
    title: 'The Diaphragm',
    paras: [
      'A dome-shaped muscle that divides the trunk in two. Through its openings pass the aorta, the esophagus, the vena cava, and, most importantly, the vagus nerve.',
      'With each deep diaphragmatic breath, the diaphragm massages the vagus nerve, the gateway to the parasympathetic system. When it moves freely, your body receives the signal that it is safe.',
    ],
    quote: 'The body knows what the mind has not yet realized. — Nazareth Castellanos',
  },
  {
    id: 'ns',
    kicker: 'Nervous system',
    title: 'Two Modes',
    paras: [
      'Your autonomic nervous system runs in two modes. Meditation needs the parasympathetic. Most people try to meditate while still in sympathetic.',
    ],
    list: [
      'Alert (sympathetic): fast, shallow breath · high heart rate · high cortisol · tense diaphragm · scattered mind. Meditation: blocked.',
      'Calm (parasympathetic): slow, deep breath · low heart rate · high serotonin · free diaphragm · clear, present mind. Deepening: open.',
    ],
  },
  {
    id: 'dmn',
    kicker: 'Neuroscience',
    title: 'Default Mode Network',
    paras: [
      'The brain network that runs when you are doing nothing specific: daydreaming, ruminating, worrying. The mental autopilot. When you anchor to the body, it deactivates.',
      'When you are present, the prefrontal cortex activates and the DMN drops. Each return to the meditation object is one rep of the muscle that reduces the DMN.',
    ],
    quote: "The moment you notice 'I wandered' and return, that is not failure. That is the practice. — Ajahn Tong",
  },
  {
    id: 'sitting',
    kicker: 'Sitting',
    title: 'Three Pillars',
    paras: [],
    list: [
      'Posture: spine upright, not rigid. Hips above knees. Slouching compresses the diaphragm.',
      'Breath: breathe first. The brain receives the signal it is safe. Body first, then mind.',
      'Equanimity: not meditating to achieve anything. Observe what arises without reacting, rejecting, or grasping.',
    ],
  },
  {
    id: 'habit',
    kicker: 'Habit',
    title: 'Building the Ritual',
    paras: ['Ritual turns a sporadic practice into a state the organism seeks and defends on its own.'],
    list: [
      'Fixed time: the same time every day. The brain learns: at this hour, I settle.',
      'Consistent space: the same place. The hippocampus encodes it as a state-territory.',
      'Opening sequence: 3–5 actions in the same order. The first one triggers everything.',
      'Olfactory anchor: one scent only for meditation. Smell has direct access to the limbic system.',
      'Closing ritual: three breaths, hands to heart. A clear signal practice is over.',
    ],
  },
];

export type Phase = { label: string; secs: number };
export type Technique = { id: string; name: string; pattern: string; note: string; phases: Phase[] };

export const techniques: Technique[] = [
  { id: 'dia', name: 'Diaphragmatic', pattern: '4 · 6', note: 'The foundation', phases: [{ label: 'In', secs: 4 }, { label: 'Out', secs: 6 }] },
  { id: '21', name: '2:1 Breathing', pattern: '4 · 8', note: 'Vagal brake', phases: [{ label: 'In', secs: 4 }, { label: 'Out', secs: 8 }] },
  { id: 'ujj', name: 'Ujjayi', pattern: '5 · 7', note: 'Ocean sound', phases: [{ label: 'In', secs: 5 }, { label: 'Out', secs: 7 }] },
  { id: 'bhr', name: 'Bhramari', pattern: '4 · 8', note: 'Hum on the exhale', phases: [{ label: 'In', secs: 4 }, { label: 'Hum out', secs: 8 }] },
  {
    id: 'box',
    name: 'Box Breathing',
    pattern: '4 · 4 · 4 · 4',
    note: 'Balances both',
    phases: [{ label: 'In', secs: 4 }, { label: 'Hold', secs: 4 }, { label: 'Out', secs: 4 }, { label: 'Hold', secs: 4 }],
  },
  {
    id: 'sigh',
    name: 'Physiological Sigh',
    pattern: '2 + 2 · 8',
    note: 'Cortisol fast',
    phases: [{ label: 'In', secs: 2 }, { label: 'Top up', secs: 2 }, { label: 'Long out', secs: 8 }],
  },
];

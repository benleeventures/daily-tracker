// Course text by Miguel de la Roza (Weeks 1–2). Everything here is open — nothing is gated.

import type { VisualKind } from './visuals';

export type Step = { name: string; detail?: string; visual?: VisualKind };

export type PracticeClass = {
  id: string;
  title: string;
  minutes: number;
  suggested: string; // a suggestion, never a lock
  steps: Step[];
};

export type Week = { id: string; eyebrow: string; title: string; quote: string; classes: PracticeClass[] };

const st = (name: string, visual?: VisualKind, detail?: string): Step => ({ name, visual, detail });

export const weeks: Week[] = [
  {
    id: 'w1',
    eyebrow: 'Week 1 · Foundation',
    title: 'The Diaphragm',
    quote: 'Body first. Always.',
    classes: [
      { id: 'c1', title: 'Feeling the Diaphragm for the First Time', minutes: 15, suggested: 'Days 1–2', steps: [st('Scan'), st('Move'), st('Breathe', 'breath'), st('Meditate', 'posture')] },
      { id: 'c2', title: 'Opening the Chest · Ujjayi', minutes: 17, suggested: 'Days 3–6', steps: [st('Scan'), st('Move'), st('Ujjayi', 'ujjayi'), st('Meditate', 'posture')] },
      { id: 'c3', title: 'First Complete Ritual · Bhramari', minutes: 20, suggested: 'Day 7', steps: [st('Scan'), st('Full move'), st('Bhramari', 'bhramari'), st('Ritual', 'posture')] },
    ],
  },
  {
    id: 'w2',
    eyebrow: 'Week 2 · Regulation',
    title: 'The Vagus Nerve',
    quote: 'The breath is the only voluntary bridge to the nervous system.',
    classes: [
      {
        id: 'c4',
        title: 'Prostrations · Box Breathing · Nadi Shodhana',
        minutes: 25,
        suggested: 'Days 8–9',
        steps: [
          st('Movement · 5 min', undefined, 'Standing body shake, 2 minutes. Seated twists, 3 times each side. Chest opening, 8 breaths. Psoas stretch, 5–6 breaths per side.'),
          st('Somatic scan · 2 min', undefined, 'Seated, eyes closed. How did you arrive today? Scan from feet to crown. Name what you find: tension, tiredness, agitation, calm.'),
          st('Pranayama · 8 min', undefined, '3 min Box Breathing (4-4-4-4). If it is easy, move to 5-5-5-5. Then 5 min Nadi Shodhana, 8–10 complete cycles without retention. The mind settles like a lake.'),
          st('Prostrations', 'prostration', '3 complete prostrations, slow and conscious. This week is about getting familiar with the movement. They lead straight into the sitting.'),
          st('Meditation · 20 min', 'posture', 'Min 0–10: sensations of breathing. Min 10–15: expand to general body sensations. Min 15–20: open presence, no fixed object. Use soft Ujjayi if the mind is very active.'),
          st('Integration · 2 min', undefined, 'Hands to heart. Closing phrase. Journal: do you notice a difference between Nadi Shodhana and the 2:1?'),
        ],
      },
      {
        id: 'c5',
        title: 'Full Bhramari · Expanded Meditation',
        minutes: 28,
        suggested: 'Days 10–11',
        steps: [
          st('Movement · 5 min', undefined, 'Progressive relaxation: tense the whole body, release, 3 times. Chest opening and twists, 3 times each side. Psoas stretch, 6–8 breaths per side. Physiological sighs, 5 repetitions.'),
          st('Somatic scan · 2 min', undefined, 'New this week: stay standing first and feel the whole body before you sit. Then, seated with eyes closed, scan from feet to crown.'),
          st('Pranayama · 8 min', 'bhramari', '3 min extended 2:1 (4/8 or 5/10). 5 min full Bhramari with ears closed, 8 slow, deep rounds. Feel the vibration fill the mental space. End with 1 minute of complete silence.'),
          st('Prostrations', 'prostration', '3 prostrations. The body is regulated and ready. Feel them flow from the breathing into the stillness of sitting.'),
          st('Meditation · 22 min', 'posture', 'Min 0–10: very fine attention on the breath. Min 10–18: the whole body: temperature, weight, pulse. Min 18–22: open presence. When the mind activates, notice the content without identifying with it. Simply “thinking”.'),
          st('Integration · 3 min', undefined, 'Hands to heart. Open your eyes very slowly. Feel the silence for 1 minute before getting up. Journal: do you notice signs the ritual is already working?'),
        ],
      },
      {
        id: 'c6',
        title: 'Week 2 Integration · The Ritual Is Working',
        minutes: 30,
        suggested: 'Day 14',
        steps: [
          st('Full movement · 6 min', undefined, 'The full sequence: shake, twists, chest opening, psoas, progressive relaxation. This is the sequence you will have automated by the end of the course. Observe it already.'),
          st('Somatic scan · 2 min', undefined, 'Seated scan. Does the body settle faster than in week 1? Is the aroma already producing an automatic change of state?'),
          st('Pranayama · 9 min', 'bhramari', '2 min Box Breathing (5-5-5-5). 3 min Nadi Shodhana with gentle retention (4-2-6). 4 min Bhramari, 6–8 deep rounds with ears closed.'),
          st('Prostrations', 'prostration', '3 prostrations. Notice whether the movement already feels more fluid than the first time.'),
          st('Meditation · 22 min', 'posture', 'Min 0–10: attention on the breath. Min 10–18: open presence, no fixed object. Min 18–22: return gently. Feel the body, the space, the moment.'),
          st('Week 2 review · 3 min', undefined, 'Are you noticing effects in daily life: sleep, reactivity, mental clarity? Signs it is working: the body settles faster, the scent produces an automatic effect.'),
        ],
      },
    ],
  },
];

export const course = {
  teacher: 'Miguel de la Roza',
  teacherLine: '17 years · Vipassana, Ajahn Tong tradition',
};

export const hard: { q: string; a: string }[] = [
  { q: 'I fall asleep.', a: 'Normal in the first weeks. Try half-open eyes or a more upright posture.' },
  { q: "My mind won't stop.", a: 'It is not about stopping the mind. Each return is the practice.' },
  { q: 'I get bored.', a: 'Boredom is the antechamber of silence. It is the default mode network resisting the release of control.' },
  { q: "I don't feel anything special.", a: 'There is no special state to reach. The effects show up in life, not in the session.' },
  { q: 'I skip days.', a: 'One 5-minute day is worth more than giving up entirely.' },
];

export type Learn = { id: string; kicker: string; title: string; paras: string[]; list?: string[]; quote?: string; visual?: VisualKind };

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
    visual: 'breath',
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
    visual: 'posture',
  },
  {
    id: 'prostration',
    kicker: 'Week 2 · Movement',
    title: 'Mindful Prostrations',
    paras: [
      'Not a religious gesture. A Vipassana practice in itself: each movement done with total mindfulness, feeling the real physical sensations. The body in its lowest posture teaches the ego it does not always have to be at the centre.',
      'Done three times at the start of each sitting, honoring the Three Jewels: Buddha (the one who awakened), Dhamma (the path) and Sangha (the community of practitioners). You are not praying. You are feeling the body move with total attention.',
      'If a thought arises, notice it, label it “thinking”, and return to the sensation. Humility does not come from telling yourself you are humble. It comes from the body being on the ground and you being completely present in that.',
    ],
    visual: 'prostration',
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
  { id: 'box5', name: 'Box Breathing 5', pattern: '5 · 5 · 5 · 5', note: 'When 4s feel easy', phases: [{ label: 'In', secs: 5 }, { label: 'Hold', secs: 5 }, { label: 'Out', secs: 5 }, { label: 'Hold', secs: 5 }] },
  { id: 'ext21', name: 'Extended 2:1', pattern: '5 · 10', note: 'Deeper vagal brake', phases: [{ label: 'In', secs: 5 }, { label: 'Out', secs: 10 }] },
  { id: 'nadi', name: 'Nadi Shodhana', pattern: '4 · 2 · 6', note: 'Alternate nostrils, gentle hold', phases: [{ label: 'In', secs: 4 }, { label: 'Hold', secs: 2 }, { label: 'Out', secs: 6 }] },
  {
    id: 'sigh',
    name: 'Physiological Sigh',
    pattern: '2 + 2 · 8',
    note: 'Cortisol fast',
    phases: [{ label: 'In', secs: 2 }, { label: 'Top up', secs: 2 }, { label: 'Long out', secs: 8 }],
  },
];

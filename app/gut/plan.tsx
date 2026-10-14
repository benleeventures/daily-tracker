'use client';

import { useId } from 'react';
import { c, s } from '../coaching/ui';
import { addDays, dayLabel, longDate, shortDate } from './day';
import { Field, Section, TextArea } from './inputs';
import type { Config, SaveState } from './types';

const GOAL_SLOTS = 5;
const GOAL_EXAMPLES = [
  'Know which foods set off the bloating',
  'Sleep 7+ hours most nights',
  'Bristol 3–4 most days',
  'Eat dinner by 7',
  'Bring clear data to my doctor',
];

export type PlanProps = {
  config: Config;
  updateConfig: (patch: Partial<Config>) => void;
  firstDay: string | null;
  today: string;
  loaded: boolean;
  loadFailed: boolean;
  save: SaveState;
};

export default function Plan({ config, updateConfig, firstDay, today, loaded, loadFailed, save }: PlanProps) {
  const ids = { mission: useId(), start: useId() };
  const goalId = useId();

  if (!loaded) return <p style={{ ...s.small, textAlign: 'center', marginTop: '3rem' }}>Loading…</p>;
  if (loadFailed) {
    return (
      <p style={{ ...s.body, color: c.alert }}>
        Couldn’t load your plan, so editing is turned off to protect what you saved. Reload the page to try again.
      </p>
    );
  }

  // Same rule the day header uses for "Day N of 60"
  const start = config.start || firstDay || today;
  const goals = Array.from({ length: GOAL_SLOTS }, (_, i) => config.goals[i] ?? '');
  const setGoal = (i: number, value: string) => {
    const next = goals.map((g, j) => (j === i ? value : g));
    let last = next.length;
    while (last > 0 && !next[last - 1].trim()) last--;
    updateConfig({ goals: next.slice(0, last) });
  };

  return (
    <div>
      <p style={{ ...s.small, margin: '0 0 22px', minHeight: 18, color: save.kind === 'error' ? c.alert : c.muted }} aria-live="polite">
        {save.kind === 'saving' && 'Saving…'}
        {save.kind === 'saved' && `Saved ${save.at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
        {save.kind === 'error' && `${save.message}. Your changes are kept here and will retry on your next edit.`}
      </p>

      <Section title="Mission">
        <Field label="Why you're doing this" hint="A sentence or two you can come back to on a bad day" htmlFor={ids.mission}>
          <TextArea id={ids.mission} value={config.mission} onChange={(mission) => updateConfig({ mission })} rows={4} placeholder="Find out what's driving the bloating so I can feel good in my body again" />
        </Field>
      </Section>

      <Section title="Goals">
        <p style={{ ...s.small, margin: '0 0 14px' }}>Up to five. Make them things you can check against your own data.</p>
        {goals.map((g, i) => (
          <Field key={i} label={`Goal ${i + 1}`} htmlFor={`${goalId}-${i}`}>
            <input
              id={`${goalId}-${i}`}
              type="text"
              value={g}
              maxLength={160}
              onChange={(e) => setGoal(i, e.target.value)}
              placeholder={GOAL_EXAMPLES[i]}
              style={{ ...s.input, minHeight: 44 }}
            />
          </Field>
        ))}
      </Section>

      <Section title="Day 1">
        <Field label="Start date" hint="Leave blank to start from your first logged day" htmlFor={ids.start}>
          <input
            id={ids.start}
            type="date"
            value={config.start ?? ''}
            onChange={(e) => updateConfig({ start: e.target.value || undefined })}
            style={{ ...s.input, minHeight: 44 }}
          />
        </Field>
        <p style={{ ...s.small, margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          Day 1 is {longDate(start)}{config.start ? '' : firstDay ? ' (your first logged day)' : ' (today, until you log a day)'}.
          Day 60 is {shortDate(addDays(start, 59))}. Today is {dayLabel(start, today).toLowerCase()}.
        </p>
      </Section>

      <Section title="How to win with it">
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {[
            ['Log in the same place, morning and night.', 'Same spot, same time, so it turns into a habit.'],
            ['Don’t skip.', 'A rough entry beats a blank day. A blank day gives you nothing to compare.'],
            ['Log meals and bowel movements as they happen.', 'Memory at night is unreliable.'],
            [`Review at day 14 (${shortDate(addDays(start, 13))}) and day 30 (${shortDate(addDays(start, 29))}).`, 'Open Trends, then write down what stands out.'],
            ['Change one thing at a time.', 'If you change food and sleep together, you won’t know which one moved the numbers.'],
          ].map(([head, body], i) => (
            <li key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <span style={{ color: c.goldDeep, fontVariantNumeric: 'tabular-nums', fontSize: 13, paddingTop: 2, minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontSize: 15, lineHeight: 1.55 }}><b style={{ fontWeight: 600 }}>{head}</b> <span style={{ color: c.muted }}>{body}</span></span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

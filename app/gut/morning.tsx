'use client';

import { useId } from 'react';
import { RITUALS } from './constants';
import { Chip, ChipRow, Field, IntInput, Scale, Section, TextArea, TimeInput } from './inputs';
import type { Day, RitualKey } from './types';

type Am = Day['am'];

// About five minutes, ideally right after waking and before coffee.
export default function Morning({ day, update }: { day: Day; update: (fn: (d: Day) => Day) => void }) {
  const ids = { bed: useId(), wake: useId(), wakeups: useId(), coffee: useId(), intention: useId() };
  const am = day.am;
  const set = (patch: Partial<Am>) => update((d) => ({ ...d, am: { ...d.am, ...patch } }));
  const toggleRitual = (key: RitualKey) =>
    update((d) => ({ ...d, am: { ...d.am, rituals: { ...d.am.rituals, [key]: !d.am.rituals[key] } } }));

  return (
    <div>
      <p style={{ margin: '0 0 22px', fontSize: 14, color: '#676d55', lineHeight: 1.5 }}>
        About five minutes. Score how you feel right now, not how you think you should.
      </p>

      <Section title="Last night">
        <Field label="Bed" hint="When you went to bed last night" htmlFor={ids.bed}>
          <TimeInput id={ids.bed} value={am.bed} onChange={(bed) => set({ bed })} />
        </Field>
        <Field label="Wake" htmlFor={ids.wake}>
          <TimeInput id={ids.wake} value={am.wake} onChange={(wake) => set({ wake })} />
        </Field>
        <Field label="Wake-ups" hint="Times you woke during the night" htmlFor={ids.wakeups}>
          <IntInput id={ids.wakeups} value={am.wakeups} onChange={(wakeups) => set({ wakeups })} />
        </Field>
        <Scale label="Sleep quality" low="Wrecked" high="Deep" value={am.sleepQ} onChange={(sleepQ) => set({ sleepQ })} />
      </Section>

      <Section title="Right now">
        <Scale label="Energy" low="Empty" high="Full" value={am.energy} onChange={(energy) => set({ energy })} />
        <Scale label="Stress" low="Calm" high="Maxed" value={am.stress} onChange={(stress) => set({ stress })} />
        <Scale label="Belly" low="Flat" high="Distended" value={am.bloat} onChange={(bloat) => set({ bloat })} />
        <Field label="Coffee" hint="Leave blank if none yet" htmlFor={ids.coffee}>
          <TimeInput id={ids.coffee} value={am.coffee} onChange={(coffee) => set({ coffee })} />
        </Field>
      </Section>

      <Section title="Start of day">
        <Field label="Morning rituals">
          <ChipRow>
            {(Object.keys(RITUALS) as RitualKey[]).map((k) => (
              <Chip key={k} label={RITUALS[k]} on={!!am.rituals[k]} onToggle={() => toggleRitual(k)} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Purpose for today" hint="One line on what today is for" htmlFor={ids.intention}>
          <TextArea id={ids.intention} value={am.intention} onChange={(intention) => set({ intention })} placeholder="Calm, focused build day" />
        </Field>
      </Section>
    </div>
  );
}

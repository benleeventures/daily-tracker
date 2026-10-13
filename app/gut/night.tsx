'use client';

import { useId } from 'react';
import { ACTIONS, RITUALS } from './constants';
import { Chip, ChipRow, DecimalInput, Field, Scale, Section, TextArea, TimeInput } from './inputs';
import type { ActionKey, Day, RitualKey } from './types';

type Pm = Day['pm'];

// About five minutes, before bed. Peak means the worst it got today.
export default function Night({ day, update }: { day: Day; update: (fn: (d: Day) => Day) => void }) {
  const ids = { bloatTime: useId(), water: useId(), lastMeal: useId(), supps: useId(), training: useId(), adversity: useId(), good: useId(), tomorrow: useId() };
  const pm = day.pm;
  const set = (patch: Partial<Pm>) => update((d) => ({ ...d, pm: { ...d.pm, ...patch } }));
  const toggleAction = (key: ActionKey) =>
    update((d) => ({ ...d, pm: { ...d.pm, actions: { ...d.pm.actions, [key]: !d.pm.actions[key] } } }));
  const toggleRitual = (key: RitualKey) =>
    update((d) => ({ ...d, pm: { ...d.pm, rituals: { ...d.pm.rituals, [key]: !d.pm.rituals[key] } } }));

  return (
    <div>
      <p style={{ margin: '0 0 22px', fontSize: 14, color: '#676d55', lineHeight: 1.5 }}>
        About five minutes. Score the day as a whole. For bloating, give the worst it got.
      </p>

      <Section title="How the day went">
        <Scale label="Peak bloating" low="Flat" high="Distended" value={pm.bloat} onChange={(bloat) => set({ bloat })} />
        <Field label="When it peaked" hint="Leave blank if you're not sure" htmlFor={ids.bloatTime}>
          <TimeInput id={ids.bloatTime} value={pm.bloatTime} onChange={(bloatTime) => set({ bloatTime })} />
        </Field>
        <Scale label="Gas" low="None" high="Constant" value={pm.gas} onChange={(gas) => set({ gas })} />
        <Scale label="Pain" low="None" high="Severe" value={pm.pain} onChange={(pain) => set({ pain })} />
        <Scale label="Energy" low="Empty" high="Full" value={pm.energy} onChange={(energy) => set({ energy })} />
        <Scale label="Stress" low="Calm" high="Maxed" value={pm.stress} onChange={(stress) => set({ stress })} />
        <Scale label="Libido" low="Low" high="High" value={pm.libido} onChange={(libido) => set({ libido })} />
      </Section>

      <Section title="Intake">
        <Field label="Water" hint="Liters today" htmlFor={ids.water}>
          <DecimalInput id={ids.water} value={pm.water} onChange={(water) => set({ water })} />
        </Field>
        <Field label="Last food" hint="When you finished eating" htmlFor={ids.lastMeal}>
          <TimeInput id={ids.lastMeal} value={pm.lastMeal} onChange={(lastMeal) => set({ lastMeal })} />
        </Field>
        <Field label="Supplements">
          <ChipRow>
            <Chip label="Took my supplements" on={!!pm.suppsOk} onToggle={() => set({ suppsOk: !pm.suppsOk })} />
          </ChipRow>
        </Field>
        <Field label="What you took" htmlFor={ids.supps}>
          <TextArea id={ids.supps} value={pm.supps} onChange={(supps) => set({ supps })} rows={2} placeholder="Creatine, D/K" />
        </Field>
        <Field label="Training" htmlFor={ids.training}>
          <TextArea id={ids.training} value={pm.training} onChange={(training) => set({ training })} rows={2} placeholder="45 min surf, felt good" />
        </Field>
      </Section>

      <Section title="What helped">
        <Field label="Today I did">
          <ChipRow>
            {(Object.keys(ACTIONS) as ActionKey[]).map((k) => (
              <Chip key={k} label={ACTIONS[k]} on={!!pm.actions[k]} onToggle={() => toggleAction(k)} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Night rituals">
          <ChipRow>
            {(Object.keys(RITUALS) as RitualKey[]).map((k) => (
              <Chip key={k} label={RITUALS[k]} on={!!pm.rituals[k]} onToggle={() => toggleRitual(k)} />
            ))}
          </ChipRow>
        </Field>
      </Section>

      <Section title="Reflect">
        <Field label="Adversity, and a possible fix" hint="What went wrong today and what you'd try next time" htmlFor={ids.adversity}>
          <TextArea id={ids.adversity} value={pm.adversity} onChange={(adversity) => set({ adversity })} placeholder="Stressful call before dinner, ate fast" />
        </Field>
        <Field label="What's good?" htmlFor={ids.good}>
          <TextArea id={ids.good} value={pm.good} onChange={(good) => set({ good })} placeholder="Walk after dinner helped" />
        </Field>
        <Field label="One change for tomorrow" htmlFor={ids.tomorrow}>
          <TextArea id={ids.tomorrow} value={pm.tomorrow} onChange={(tomorrow) => set({ tomorrow })} rows={2} placeholder="Eat dinner by 7" />
        </Field>
      </Section>
    </div>
  );
}

'use client';

import { useId, useState } from 'react';
import { c, s } from '../coaching/ui';
import { BRISTOL, MEAL_TYPES, TAGS } from './constants';
import { Chip, ChipRow, Field, Section, TextArea, TimeInput } from './inputs';
import { newId, type NoteImport } from './import-flow';
import { noteTemplate } from './parse-note';
import type { BowelMovement, BristolType, Day, Meal, TagKey } from './types';

type Update = (fn: (d: Day) => Day) => void;

const nowHHMM = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
};

const mealTypeForHour = (h: number): Meal['type'] => (h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : 'Dinner');

export default function DayTab({ day, update, isToday, noteImport }: { day: Day; update: Update; isToday: boolean; noteImport: NoteImport }) {
  const addMeal = () => {
    const now = new Date();
    update((d) => ({
      ...d,
      meals: [...d.meals, { id: newId(), type: isToday ? mealTypeForHour(now.getHours()) : 'Snack', time: isToday ? nowHHMM() : undefined, what: '', tags: [] }],
    }));
  };
  const addBm = () => {
    update((d) => ({ ...d, bms: [...d.bms, { id: newId(), time: isToday ? nowHHMM() : undefined }] }));
  };
  const patchMeal = (id: string, patch: Partial<Meal>) =>
    update((d) => ({ ...d, meals: d.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const patchBm = (id: string, patch: Partial<BowelMovement>) =>
    update((d) => ({ ...d, bms: d.bms.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const removeMeal = (id: string) => {
    if (window.confirm('Remove this meal?')) update((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== id) }));
  };
  const removeBm = (id: string) => {
    if (window.confirm('Remove this bowel movement?')) update((d) => ({ ...d, bms: d.bms.filter((b) => b.id !== id) }));
  };

  return (
    <div>
      <ImportCard date={day.date} noteImport={noteImport} />

      <Section title="Meals">
        {day.meals.length === 0 && <p style={{ ...s.small, margin: '0 0 14px' }}>Log meals as you eat them, with how you felt 30–90 minutes later.</p>}
        {day.meals.map((m) => (
          <MealCard key={m.id} meal={m} onChange={(p) => patchMeal(m.id, p)} onRemove={() => removeMeal(m.id)} />
        ))}
        <button type="button" onClick={addMeal} style={addButton}>+ Add meal</button>
      </Section>

      <Section title="Bowel movements">
        {day.bms.length === 0 && <p style={{ ...s.small, margin: '0 0 14px' }}>Log each one when it happens. Pick the closest Bristol type.</p>}
        {day.bms.map((b) => (
          <BmCard key={b.id} bm={b} onChange={(p) => patchBm(b.id, p)} onRemove={() => removeBm(b.id)} />
        ))}
        <button type="button" onClick={addBm} style={addButton}>+ Add bowel movement</button>
      </Section>
    </div>
  );
}

const addButton = { ...s.button, width: '100%', minHeight: 48, background: 'transparent', color: c.goldDeep, border: `1px dashed ${c.gold}` };
const card = { background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 6, padding: 14, marginBottom: 14 } as const;

function MealCard({ meal, onChange, onRemove }: { meal: Meal; onChange: (p: Partial<Meal>) => void; onRemove: () => void }) {
  const ids = { type: useId(), time: useId(), what: useId(), after: useId() };
  const toggle = (t: TagKey) =>
    onChange({ tags: meal.tags.includes(t) ? meal.tags.filter((x) => x !== t) : [...meal.tags, t] });
  return (
    <div style={card}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label htmlFor={ids.type} style={labelStyle}>Meal</label>
          <select id={ids.type} value={meal.type} onChange={(e) => onChange({ type: e.target.value as Meal['type'] })} style={{ ...s.input, minHeight: 44 }}>
            {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={ids.time} style={labelStyle}>Time</label>
          <TimeInput id={ids.time} value={meal.time} onChange={(time) => onChange({ time })} />
        </div>
      </div>
      <Field label="What you ate" htmlFor={ids.what}>
        <TextArea id={ids.what} value={meal.what} onChange={(what) => onChange({ what: what ?? '' })} rows={2} placeholder="Chicken, rice, salad" />
      </Field>
      <Field label="Tags" hint="Tap anything that was in it">
        <ChipRow>
          {(Object.keys(TAGS) as TagKey[]).map((t) => (
            <Chip key={t} label={TAGS[t]} on={meal.tags.includes(t)} onToggle={() => toggle(t)} />
          ))}
        </ChipRow>
      </Field>
      <Field label="30–90 min after" htmlFor={ids.after}>
        <TextArea id={ids.after} value={meal.after} onChange={(after) => onChange({ after })} rows={2} placeholder="Fine, or bloated 30 min later" />
      </Field>
      <button type="button" onClick={onRemove} style={removeStyle}>Remove meal</button>
    </div>
  );
}

function BmCard({ bm, onChange, onRemove }: { bm: BowelMovement; onChange: (p: Partial<BowelMovement>) => void; onRemove: () => void }) {
  const timeId = useId();
  const flag = (key: keyof BowelMovement, label: string) => (
    <Chip key={key} label={label} on={!!bm[key]} onToggle={() => onChange({ [key]: !bm[key] })} />
  );
  return (
    <div style={card}>
      <Field label="Time" htmlFor={timeId}>
        <TimeInput id={timeId} value={bm.time} onChange={(time) => onChange({ time })} />
      </Field>
      <Field label="Bristol type" hint="Tap again to unselect">
        <div role="group" aria-label="Bristol type" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))', gap: 8 }}>
          {(Object.keys(BRISTOL) as unknown as BristolType[]).map((n) => {
            const on = bm.bristol === Number(n);
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ bristol: on ? undefined : (Number(n) as BristolType) })}
                style={{
                  minHeight: 56,
                  borderRadius: 6,
                  border: `1px solid ${on ? c.goldDeep : c.line}`,
                  background: on ? c.goldDeep : c.bg,
                  color: on ? '#fff' : c.ink,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  lineHeight: 1.2,
                }}
              >
                <span style={{ display: 'block', fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                <span style={{ display: 'block', fontSize: 11 }}>{BRISTOL[Number(n) as BristolType]}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Notes on this one">
        <ChipRow>
          {flag('mucus', 'Mucus')}
          {flag('urgency', 'Urgency')}
          {flag('strain', 'Straining')}
          {flag('incomplete', 'Not fully empty')}
          {flag('coffee', 'After coffee')}
          {flag('night', 'Woke me up')}
          {flag('photo', 'Photo taken')}
          <Chip label="Blood / black" tone="alert" on={!!bm.blood} onToggle={() => onChange({ blood: !bm.blood })} />
        </ChipRow>
      </Field>
      <button type="button" onClick={onRemove} style={removeStyle}>Remove bowel movement</button>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 } as const;
const removeStyle = { ...s.ghost, color: c.alert, minHeight: 44, padding: '0 4px' };

function ImportCard({ date, noteImport }: { date: string; noteImport: NoteImport }) {
  const [text, setText] = useState('');
  const [template, setTemplate] = useState<string | null>(null);
  const fileId = useId();
  const pasteId = useId();
  const { message, dup, start, confirmDup, cancelDup } = noteImport;

  // Keep the pasted text only when it failed to parse, so it can be fixed
  const run = (body: string) => { if (start(body)) setText(''); };

  const onFile = async (file: File | undefined) => {
    if (file) run(await file.text());
  };

  const copyTemplate = async () => {
    const body = noteTemplate(date);
    try {
      await navigator.clipboard.writeText(body);
      setTemplate(null);
    } catch {
      setTemplate(body); // clipboard blocked: show it selectable
    }
  };

  return (
    <section style={{ ...card, marginBottom: 34 }} aria-labelledby="import-title">
      <h2 id="import-title" style={{ ...s.h2, marginBottom: 4 }}>Import a note</h2>
      <p style={{ ...s.small, margin: '0 0 14px' }}>Drop in the daily note from Instinct. It adds to this log and never deletes anything.</p>

      <label htmlFor={fileId} style={labelStyle}>Choose a .md or .txt file</label>
      <input id={fileId} type="file" accept=".md,.txt,text/markdown,text/plain" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} style={{ fontSize: 14, marginBottom: 16, maxWidth: '100%' }} />

      <label htmlFor={pasteId} style={labelStyle}>Or paste it here</label>
      <textarea id={pasteId} value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="# 2026-10-14&#10;## Morning&#10;sleep: 7" style={{ ...s.input, resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14 }} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { run(text); }} disabled={!text.trim()} style={{ ...s.button, minHeight: 44, opacity: text.trim() ? 1 : 0.4 }}>Import into log</button>
        <button type="button" onClick={copyTemplate} style={{ ...s.ghost, minHeight: 44, padding: '0 6px' }}>Copy note template</button>
      </div>

      {template && (
        <div style={{ marginTop: 12 }}>
          <p style={{ ...s.small, margin: '0 0 6px' }}>Couldn’t copy automatically. Select all and copy:</p>
          <textarea readOnly value={template} rows={8} onFocus={(e) => e.currentTarget.select()} style={{ ...s.input, fontFamily: 'ui-monospace, monospace', fontSize: 13 }} />
        </div>
      )}

      {dup && (
        <div role="alert" style={{ marginTop: 14, padding: 12, border: `0.5px solid ${c.goldDeep}`, borderRadius: 4, fontSize: 14, lineHeight: 1.5 }}>
          This note was already imported into this day. Importing it again will add its meals and bowel movements a second time.
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={confirmDup} style={{ ...s.button, minHeight: 44 }}>Import again</button>
            <button type="button" onClick={cancelDup} style={{ ...s.ghost, minHeight: 44, padding: '0 8px' }}>Cancel</button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" style={{ marginTop: 14, marginBottom: 0, fontSize: 14, lineHeight: 1.5, color: message.kind === 'error' ? c.alert : c.ink }}>
          {message.text}
        </p>
      )}
    </section>
  );
}

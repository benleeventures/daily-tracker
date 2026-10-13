'use client';

import { useId, type CSSProperties, type ReactNode } from 'react';
import { c, font, s } from '../coaching/ui';

// Shared form controls for every Gut Audit tab. Sizes follow phone use: 16px text so iOS doesn't zoom,
// 44px touch targets, one column.

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: hint ? 2 : 6 }}>{label}</label>
      {hint && <p style={{ ...s.small, margin: '0 0 6px' }}>{hint}</p>}
      {children}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <h2 style={{ ...s.h2, paddingBottom: 8, borderBottom: `0.5px solid ${c.line}`, marginBottom: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

// 0–10 slider. Unset is undefined, never 0: it shows "–" and stays dimmed until touched, and "Clear"
// puts it back, so averages and charts can skip it.
export function Scale({ label, low, high, value, onChange }: {
  label: string;
  low: string;
  high: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const id = useId();
  const unset = value === undefined;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <label htmlFor={id} style={{ fontSize: 14, fontWeight: 600 }}>{label}</label>
        <span
          aria-hidden
          style={{ fontSize: 28, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: unset ? c.line : c.ink, minWidth: 34, textAlign: 'right' }}
        >
          {unset ? '–' : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value ?? 5}
        aria-valuetext={unset ? 'not set' : String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        // A tap without a drag doesn't fire change, so the first press sets the value it landed on
        onPointerUp={(e) => { if (unset) onChange(Number((e.target as HTMLInputElement).value)); }}
        style={{ width: '100%', height: 44, margin: '2px 0', accentColor: c.goldDeep, opacity: unset ? 0.4 : 1, touchAction: 'pan-y' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: c.muted }}>
        <span>{low}</span>
        {!unset && <button type="button" onClick={() => onChange(undefined)} style={{ ...s.ghost, fontSize: 12, minHeight: 44, padding: '0 16px' }}>Clear</button>}
        <span>{high}</span>
      </div>
    </div>
  );
}

// Toggle chip. aria-pressed carries the state; the filled style carries it visually.
export function Chip({ label, on, onToggle, tone = 'default' }: { label: string; on: boolean; onToggle: () => void; tone?: 'default' | 'alert' }) {
  const accent = tone === 'alert' ? c.alert : c.goldDeep;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      style={{
        minHeight: 44,
        padding: '0 14px',
        borderRadius: 999,
        border: `1px solid ${on ? accent : c.line}`,
        background: on ? accent : c.paper,
        color: on ? '#fff' : c.ink,
        fontSize: 14,
        fontFamily: font,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>;
}

const control: CSSProperties = { ...s.input, minHeight: 44 };

// type="time" yields and accepts 24h "HH:MM", which is the stored format
export function TimeInput({ id, value, onChange }: { id?: string; value: string | undefined; onChange: (v: string | undefined) => void }) {
  return <input id={id} type="time" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} style={control} />;
}

export function IntInput({ id, value, onChange, max = 20 }: { id?: string; value: number | undefined; onChange: (v: number | undefined) => void; max?: number }) {
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={0}
      max={max}
      step={1}
      value={value ?? ''}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        onChange(Number.isNaN(n) ? undefined : Math.min(max, Math.max(0, n)));
      }}
      style={control}
    />
  );
}

// Decimal number (liters of water). Empty is unset, never 0.
export function DecimalInput({ id, value, onChange, max = 20 }: { id?: string; value: number | undefined; onChange: (v: number | undefined) => void; max?: number }) {
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={0}
      max={max}
      step={0.1}
      value={value ?? ''}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        onChange(Number.isNaN(n) ? undefined : Math.min(max, Math.max(0, n)));
      }}
      style={control}
    />
  );
}

export function TextArea({ id, value, onChange, placeholder, rows = 3 }: { id?: string; value: string | undefined; onChange: (v: string | undefined) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      id={id}
      value={value ?? ''}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value || undefined)}
      style={{ ...s.input, resize: 'vertical' }}
    />
  );
}

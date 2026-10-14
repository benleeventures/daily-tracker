'use client';

import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
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

const THUMB = 30; // px; the whole 48px-tall strip is the touch target, not just the thumb

// 0–10 slider. Unset is undefined, never 0: it shows "–" and stays dimmed until touched, and "Clear"
// puts it back, so averages and charts can skip it.
//
// Built on pointer events instead of <input type="range"> because iOS only lets you grab the native
// thumb, so touches anywhere else did nothing and felt "stuck". Here a tap anywhere on the bar sets that
// value and a sideways drag follows the finger. On touch, a vertical swipe scrolls the page and never
// changes the score, so scrolling past a slider can't alter it by accident.
export function Scale({ label, low, high, value, onChange }: {
  label: string;
  low: string;
  high: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const labelId = useId();
  const track = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; touch: boolean; dragging: boolean } | null>(null);
  const unset = value === undefined;
  const shown = value ?? 5;

  const fromX = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const usable = r.width - THUMB;
    const frac = Math.min(1, Math.max(0, (clientX - r.left - THUMB / 2) / usable));
    return Math.round(frac * 10);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const touch = e.pointerType === 'touch';
    press.current = { x: e.clientX, y: e.clientY, touch, dragging: !touch };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not capturable; moves still arrive */ }
    if (!touch) onChange(fromX(e.clientX)); // mouse and pen set on press; touch waits to tell a tap from a scroll
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    if (p.touch && !p.dragging) {
      const dx = Math.abs(e.clientX - p.x), dy = Math.abs(e.clientY - p.y);
      if (dx > 6 && dx > dy) p.dragging = true; // sideways: this is a slide
      else return;
    }
    onChange(fromX(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    if (p?.touch && !p.dragging && Math.abs(e.clientX - p.x) <= 6 && Math.abs(e.clientY - p.y) <= 6) {
      onChange(fromX(e.clientX)); // a tap
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 2, PageDown: -2 };
    let next: number | undefined;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 10;
    else if (e.key in step) next = unset ? 5 : Math.min(10, Math.max(0, shown + step[e.key]));
    if (next === undefined) return;
    e.preventDefault();
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span id={labelId} style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span
          aria-hidden
          style={{ fontSize: 28, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: unset ? c.line : c.ink, minWidth: 34, textAlign: 'right' }}
        >
          {unset ? '–' : value}
        </span>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={unset ? undefined : value}
        aria-valuetext={unset ? 'not set' : String(value)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { press.current = null; }}
        onKeyDown={onKeyDown}
        style={{ position: 'relative', height: 48, margin: '2px 0', touchAction: 'pan-y', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent', outlineOffset: 2 }}
      >
        <div aria-hidden style={{ position: 'absolute', left: THUMB / 2, right: THUMB / 2, top: 22, height: 4, borderRadius: 2, background: c.line }} />
        <div aria-hidden style={{ position: 'absolute', left: THUMB / 2, top: 22, height: 4, borderRadius: 2, background: c.gold, width: `calc((100% - ${THUMB}px) * ${shown / 10})`, opacity: unset ? 0 : 1 }} />
        {Array.from({ length: 11 }, (_, i) => (
          <div key={i} aria-hidden style={{ position: 'absolute', top: 31, width: 1, height: 5, background: c.line, left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${i / 10})` }} />
        ))}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 9,
            width: THUMB,
            height: THUMB,
            borderRadius: 999,
            background: unset ? c.paper : c.goldDeep,
            border: `2px solid ${unset ? c.line : c.goldDeep}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
            left: `calc((100% - ${THUMB}px) * ${shown / 10})`,
            opacity: unset ? 0.7 : 1,
          }}
        />
      </div>
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

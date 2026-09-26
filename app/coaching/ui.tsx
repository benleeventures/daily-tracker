import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

// Same palette and mark as the teambenlee.com index and Dailys, so everything reads as one site.
export const c = {
  bg: '#faf8f3',
  ink: '#3d3a33',
  muted: '#9ca084',
  line: '#e8e3db',
  gold: '#c6a96c',
  goldDeep: '#a88a4f',
  paper: '#fffdf8',
  alert: '#b5654a',
};

export const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} style={{ color: c.gold, flexShrink: 0 }} aria-hidden>
      <rect width="22" height="22" x="9" y="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect width="14" height="14" x="13" y="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Shell({ children, right, back }: { children: ReactNode; right?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <main style={{ minHeight: '100vh', background: c.bg, color: c.ink, fontFamily: font, padding: '2rem 1rem 5rem' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '2.5rem' }}>
          <Link href="/coaching" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}>
            <Mark />
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>Ben Lee Coaching</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: c.muted }}>{right}</div>
        </header>
        {back && (
          <Link href={back.href} style={{ display: 'inline-block', fontSize: 13, color: c.muted, textDecoration: 'none', marginBottom: '1.5rem' }}>
            ← {back.label}
          </Link>
        )}
        {children}
      </div>
    </main>
  );
}

export const s = {
  eyebrow: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: c.muted } as CSSProperties,
  h1: { fontSize: 30, fontWeight: 600, letterSpacing: '-0.8px', lineHeight: 1.15, margin: '0.4rem 0 1rem' } as CSSProperties,
  h2: { fontSize: 19, fontWeight: 600, letterSpacing: '-0.3px', margin: '0 0 0.35rem' } as CSSProperties,
  body: { fontSize: 16, lineHeight: 1.65, margin: '0 0 1rem' } as CSSProperties,
  small: { fontSize: 13, color: c.muted, lineHeight: 1.5 } as CSSProperties,
  rule: { border: 0, borderTop: `0.5px solid ${c.line}`, margin: '2.5rem 0' } as CSSProperties,
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: c.paper,
    border: `0.5px solid ${c.line}`,
    borderRadius: 4,
    padding: '10px 12px',
    fontSize: 16, // 16px keeps iOS from zooming on focus
    fontFamily: font,
    color: c.ink,
    lineHeight: 1.5,
  } as CSSProperties,
  button: {
    background: c.ink,
    color: c.bg,
    border: 'none',
    borderRadius: 4,
    padding: '10px 18px',
    fontSize: 14,
    fontFamily: font,
    cursor: 'pointer',
  } as CSSProperties,
  ghost: {
    background: 'transparent',
    color: c.goldDeep,
    border: 'none',
    padding: 0,
    fontSize: 13,
    fontFamily: font,
    cursor: 'pointer',
  } as CSSProperties,
};

export function StatusDot({ status }: { status: 'not_started' | 'in_progress' | 'submitted' }) {
  const label = status === 'submitted' ? 'Done' : status === 'in_progress' ? 'In progress' : 'Not started';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: status === 'not_started' ? c.muted : c.ink, whiteSpace: 'nowrap' }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          border: `1px solid ${status === 'not_started' ? c.line : c.gold}`,
          background: status === 'submitted' ? c.gold : status === 'in_progress' ? `linear-gradient(90deg, ${c.gold} 50%, transparent 50%)` : 'transparent',
        }}
      />
      {label}
    </span>
  );
}

export function Loading() {
  return <p style={{ ...s.small, textAlign: 'center', marginTop: '4rem' }}>Loading…</p>;
}

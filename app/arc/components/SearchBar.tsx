'use client';

import { c, font } from '../../coaching/ui';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={styles.wrapper}>
      <input
        type="text"
        placeholder="Search bookmarks, tags, notes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={styles.clearButton}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 16px',
    background: c.paper,
    border: `0.5px solid ${c.line}`,
    borderRadius: '8px',
    color: c.ink,
    fontSize: '14px',
    fontFamily: font,
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  clearButton: {
    position: 'absolute' as const,
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: c.muted,
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    transition: 'color 0.2s ease',
  } as React.CSSProperties,
} as const;

'use client';

import { c } from '../../coaching/ui';

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}

export function TagFilter({ tags, selectedTags, onTagSelect }: TagFilterProps) {
  return (
    <div style={styles.container}>
      <label style={styles.label}>Filter by tags:</label>
      <div style={styles.tagsList}>
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagSelect(tag)}
              style={{
                ...styles.tag,
                ...(isSelected ? styles.tagSelected : {}),
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: c.muted,
    marginBottom: '0.75rem',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  tagsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  } as React.CSSProperties,
  tag: {
    background: 'rgba(198, 169, 108, 0.1)',
    border: '1px solid rgba(198, 169, 108, 0.4)',
    color: c.goldDeep,
    borderRadius: '16px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  tagSelected: {
    background: c.gold,
    color: c.bg,
    borderColor: c.gold,
  } as React.CSSProperties,
} as const;

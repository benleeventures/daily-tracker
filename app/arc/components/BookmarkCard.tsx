'use client';

import { useState } from 'react';
import { c } from '../../coaching/ui';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  tags: string[];
  notes: string;
  category: 'Dailys' | 'Ben Lee Coaching' | 'General';
  created_at: string;
  user_id: string;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleDelete = async () => {
    if (confirm('Delete this bookmark?')) {
      setIsDeleting(true);
      await onDelete(bookmark.id);
    }
  };

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Link';
    }
  };

  return (
    <div
      style={styles.card}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={styles.cardContent}>
        <h3 style={styles.title}>{bookmark.title}</h3>

        {bookmark.notes && <p style={styles.notes}>{bookmark.notes}</p>}

        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.url}
          title={bookmark.url}
        >
          {getDomain(bookmark.url)} ↗
        </a>

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div style={styles.tags}>
            {bookmark.tags.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {showActions && (
        <div style={styles.actions}>
          <button
            onClick={() => onEdit(bookmark.id)}
            style={styles.actionButton}
            title="Edit bookmark"
          >
            ✎ Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={styles.deleteButton}
            title="Delete bookmark"
          >
            {isDeleting ? '...' : '✕ Delete'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: c.paper,
    border: `0.5px solid ${c.line}`,
    borderRadius: '8px',
    padding: '1.5rem',
    position: 'relative' as const,
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column' as const,
  } as React.CSSProperties,
  cardContent: {
    flex: 1,
  } as React.CSSProperties,
  title: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 0.75rem 0',
    color: c.ink,
    lineHeight: 1.3,
  } as React.CSSProperties,
  notes: {
    fontSize: '13px',
    color: c.muted,
    margin: '0 0 0.75rem 0',
    lineHeight: 1.5,
  } as React.CSSProperties,
  url: {
    display: 'inline-block',
    fontSize: '12px',
    color: c.goldDeep,
    textDecoration: 'none',
    padding: '6px 0',
    marginBottom: '0.75rem',
    transition: 'opacity 0.2s ease',
  } as React.CSSProperties,
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginTop: '0.75rem',
  } as React.CSSProperties,
  tag: {
    display: 'inline-block',
    background: 'rgba(198, 169, 108, 0.15)',
    color: c.goldDeep,
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 500,
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `0.5px solid ${c.line}`,
  } as React.CSSProperties,
  actionButton: {
    background: 'rgba(198, 169, 108, 0.15)',
    border: '1px solid rgba(198, 169, 108, 0.4)',
    color: c.goldDeep,
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  deleteButton: {
    background: 'rgba(160, 82, 58, 0.1)',
    border: `1px solid rgba(160, 82, 58, 0.35)`,
    color: c.alert,
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
} as const;

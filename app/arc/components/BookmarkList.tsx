'use client';

import { BookmarkCard } from './BookmarkCard';

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

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function BookmarkList({ bookmarks, onEdit, onDelete }: BookmarkListProps) {
  return (
    <div style={styles.grid}>
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  } as React.CSSProperties,
} as const;

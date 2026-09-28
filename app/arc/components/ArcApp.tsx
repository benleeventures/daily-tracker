'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { c, font, Mark } from '../../coaching/ui';
import { BookmarkList } from './BookmarkList';
import { AddBookmarkForm } from './AddBookmarkForm';
import { SearchBar } from './SearchBar';
import { TagFilter } from './TagFilter';

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

interface ArcAppProps {
  bookmarks: Bookmark[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
  loading: boolean;
  userId: string;
}

export default function ArcApp({
  bookmarks,
  setBookmarks,
  loading,
  userId,
}: ArcAppProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach((b) => {
      b.tags?.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [bookmarks]);

  // Filter bookmarks based on search and tags
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      // Filter by search query (fuzzy match on title, tags, notes)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${bookmark.title} ${bookmark.tags.join(' ')} ${bookmark.notes}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Filter by selected tags
      if (selectedTags.length > 0) {
        const bookmarkTags = bookmark.tags || [];
        if (!selectedTags.some((tag) => bookmarkTags.includes(tag))) return false;
      }

      return true;
    });
  }, [bookmarks, searchQuery, selectedTags]);

  return (
    <div style={styles.container}>
      {/* Brand strip — always visible so you never lose your way back */}
      <div style={styles.brandBar}>
        <Link href="/" style={styles.brandLink}>
          <Mark size={22} />
          <span style={styles.brandText}>Ben Lee</span>
        </Link>
      </div>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Arc</h1>
          <p style={styles.subtitle}>Bookmarks &amp; resources</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
          }}
          style={{
            ...styles.addButton,
            ...(showAddForm ? styles.addButtonActive : {}),
          }}
        >
          {showAddForm ? '✕ Close' : '+ Add'}
        </button>
      </header>

      {/* Add Bookmark Form */}
      {showAddForm && (
        <AddBookmarkForm
          userId={userId}
          category="General"
          onClose={() => setShowAddForm(false)}
          editingId={editingId ?? undefined}
          existingBookmark={editingId ? bookmarks.find((b) => b.id === editingId) : undefined}
        />
      )}

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div style={styles.filterContainer}>
          <TagFilter
            tags={allTags}
            selectedTags={selectedTags}
            onTagSelect={(tag) => {
              setSelectedTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              );
            }}
          />
        </div>
      )}

      {/* Bookmark List */}
      <main style={styles.main}>
        {loading ? (
          <div style={styles.empty}>Loading bookmarks...</div>
        ) : filteredBookmarks.length === 0 ? (
          <div style={styles.empty}>
            <p>No bookmarks found</p>
            {searchQuery && <p style={{ fontSize: '14px', opacity: 0.7 }}>Try adjusting your search</p>}
          </div>
        ) : (
          <BookmarkList
            bookmarks={filteredBookmarks}
            onEdit={(id) => {
              setEditingId(id);
              setShowAddForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={async (id) => {
              await supabase.from('arc_bookmarks').delete().eq('id', id);
            }}
          />
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: c.bg,
    color: c.ink,
    fontFamily: font,
  } as React.CSSProperties,
  brandBar: {
    padding: '1rem 1rem 0',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  brandLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    color: 'inherit',
    textDecoration: 'none',
  } as React.CSSProperties,
  brandText: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.3px',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.5rem 1rem 2rem',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
    borderBottom: `0.5px solid ${c.line}`,
  } as React.CSSProperties,
  headerContent: {
    flex: 1,
  } as React.CSSProperties,
  title: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 0.5rem 0',
    color: c.ink,
    letterSpacing: '-0.8px',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '14px',
    margin: 0,
    color: c.muted,
  } as React.CSSProperties,
  addButton: {
    background: c.ink,
    color: c.bg,
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  addButtonActive: {
    background: c.alert,
    color: '#fff',
  } as React.CSSProperties,
  searchContainer: {
    padding: '1.5rem 1rem 1rem 1rem',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  filterContainer: {
    padding: '1rem 1rem 0 1rem',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem',
    width: '100%',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: c.muted,
  } as React.CSSProperties,
} as const;

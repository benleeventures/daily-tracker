'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { c, font } from '../../coaching/ui';

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

interface AddBookmarkFormProps {
  userId: string;
  category: 'Dailys' | 'Ben Lee Coaching' | 'General';
  onClose: () => void;
  editingId?: string;
  existingBookmark?: Bookmark;
}

export function AddBookmarkForm({
  userId,
  category,
  onClose,
  editingId,
  existingBookmark,
}: AddBookmarkFormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingBookmark) {
      setTitle(existingBookmark.title);
      setUrl(existingBookmark.url);
      setNotes(existingBookmark.notes);
      setTags(existingBookmark.tags || []);
    }
  }, [existingBookmark]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !url.trim()) {
      setError('Title and URL are required');
      return;
    }

    // Commit whatever's still sitting in the tag box — don't silently drop
    // a tag just because the user didn't click "Add" before submitting.
    const pendingTag = tagInput.trim();
    const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;

    try {
      setIsSubmitting(true);

      const bookmarkData = {
        title: title.trim(),
        url: url.trim(),
        notes: notes.trim(),
        tags: finalTags,
        category,
        user_id: userId,
      };

      if (editingId) {
        // Update existing bookmark
        const { error: updateError } = await supabase
          .from('arc_bookmarks')
          .update(bookmarkData)
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        // Insert new bookmark
        const { error: insertError } = await supabase
          .from('arc_bookmarks')
          .insert(bookmarkData);

        if (insertError) throw insertError;
      }

      // Reset form
      setTitle('');
      setUrl('');
      setNotes('');
      setTags([]);
      setTagInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bookmark');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      <div style={styles.formWrapper}>
        <h2 style={styles.formTitle}>
          {editingId ? 'Edit Bookmark' : 'Add Bookmark'}
        </h2>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.formGroup}>
          <label style={styles.label}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., React Documentation"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why is this bookmark relevant? Any context?"
            style={styles.textarea}
            rows={3}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Tags</label>
          <div style={styles.tagInputWrapper}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag (press Enter)"
              style={styles.tagInput}
            />
            <button
              type="button"
              onClick={handleAddTag}
              style={styles.tagAddButton}
              disabled={!tagInput.trim()}
            >
              Add
            </button>
          </div>

          {tags.length > 0 && (
            <div style={styles.tagsList}>
              {tags.map((tag) => (
                <div key={tag} style={styles.tagItem}>
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={styles.tagRemoveButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.formActions}>
          <button type="submit" disabled={isSubmitting} style={styles.submitButton}>
            {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'} Bookmark
          </button>
          <button type="button" onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

const styles = {
  container: {
    padding: '1rem',
    background: c.paper,
    borderBottom: `0.5px solid ${c.line}`,
  } as React.CSSProperties,
  formWrapper: {
    maxWidth: '900px',
    margin: '0 auto',
    background: c.bg,
    border: `0.5px solid ${c.line}`,
    borderRadius: '8px',
    padding: '1.5rem',
  } as React.CSSProperties,
  formTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 1.5rem 0',
    color: c.goldDeep,
  } as React.CSSProperties,
  error: {
    background: 'rgba(160, 82, 58, 0.1)',
    border: `1px solid rgba(160, 82, 58, 0.35)`,
    color: c.alert,
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '13px',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: c.ink,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    background: c.paper,
    border: `0.5px solid ${c.line}`,
    borderRadius: '6px',
    color: c.ink,
    fontSize: '16px',
    fontFamily: font,
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '10px 12px',
    background: c.paper,
    border: `0.5px solid ${c.line}`,
    borderRadius: '6px',
    color: c.ink,
    fontSize: '16px',
    fontFamily: font,
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  tagInputWrapper: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1rem',
  } as React.CSSProperties,
  tagInput: {
    flex: 1,
    padding: '10px 12px',
    background: c.paper,
    border: `0.5px solid ${c.line}`,
    borderRadius: '6px',
    color: c.ink,
    fontSize: '16px',
    fontFamily: font,
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  tagAddButton: {
    background: 'rgba(198, 169, 108, 0.15)',
    border: '1px solid rgba(198, 169, 108, 0.4)',
    color: c.goldDeep,
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  tagsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  } as React.CSSProperties,
  tagItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(198, 169, 108, 0.15)',
    border: '1px solid rgba(198, 169, 108, 0.4)',
    color: c.goldDeep,
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '13px',
    fontWeight: 500,
  } as React.CSSProperties,
  tagRemoveButton: {
    background: 'transparent',
    border: 'none',
    color: c.goldDeep,
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s ease',
  } as React.CSSProperties,
  formActions: {
    display: 'flex',
    gap: '12px',
  } as React.CSSProperties,
  submitButton: {
    background: c.ink,
    color: c.bg,
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  cancelButton: {
    background: 'transparent',
    color: c.goldDeep,
    border: '1px solid rgba(198, 169, 108, 0.4)',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
} as const;

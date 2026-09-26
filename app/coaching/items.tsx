'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDue } from './data';
import { c, s } from './ui';

type ActionItem = { id: string; client_id: string; text: string; due_date: string | null; done: boolean; done_at: string | null; created_at: string };
type Session = { id: string; client_id: string; session_date: string; title: string; notes: string; recording_url: string };

// Shared to-do list between coach and client. Both can add, check off, and remove.
export function ActionItems({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('coaching_action_items').select('*').eq('client_id', clientId).order('created_at');
    setItems((data || []) as ActionItem[]);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    setDue('');
    await supabase.from('coaching_action_items').insert({ client_id: clientId, text: t, due_date: due || null });
    load();
  };

  const toggle = async (item: ActionItem) => {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)));
    await supabase.from('coaching_action_items').update({ done: !item.done, done_at: item.done ? null : new Date().toISOString() }).eq('id', item.id);
  };

  const remove = async (item: ActionItem) => {
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    await supabase.from('coaching_action_items').delete().eq('id', item.id);
  };

  const open = items.filter((i) => !i.done).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
  const done = items.filter((i) => i.done);
  const today = new Date().toISOString().slice(0, 10);

  const row = (item: ActionItem) => (
    <li key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: `0.5px solid ${c.line}` }}>
      <input type="checkbox" checked={item.done} onChange={() => toggle(item)} aria-label={`Mark "${item.text}" ${item.done ? 'not done' : 'done'}`} style={{ width: 18, height: 18, marginTop: 2, accentColor: c.gold, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 15, lineHeight: 1.45, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? c.muted : c.ink }}>
        {item.text}
        {item.due_date && !item.done && (
          <span style={{ fontSize: 12, marginLeft: 8, color: item.due_date < today ? c.alert : c.goldDeep, whiteSpace: 'nowrap' }}>
            {item.due_date < today ? 'Overdue · ' : ''}{formatDue(item.due_date)}
          </span>
        )}
      </span>
      <button onClick={() => remove(item)} aria-label={`Delete "${item.text}"`} style={{ ...s.ghost, color: c.muted, fontSize: 16, lineHeight: 1 }}>×</button>
    </li>
  );

  return (
    <div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `0.5px solid ${c.line}` }}>
        {open.map(row)}
        {open.length === 0 && <li style={{ ...s.small, padding: '10px 0', borderBottom: `0.5px solid ${c.line}` }}>Nothing open. Nice.</li>}
      </ul>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Add an action item" aria-label="New action item" style={{ ...s.input, flex: '1 1 220px' }} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date (optional)" style={{ ...s.input, flex: '0 0 150px', color: due ? c.ink : c.muted }} />
        <button onClick={add} style={s.button}>Add</button>
      </div>
      {done.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowDone(!showDone)} style={{ ...s.ghost, color: c.muted }}>
            {showDone ? 'Hide' : 'Show'} {done.length} done
          </button>
          {showDone && <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }}>{done.map(row)}</ul>}
        </div>
      )}
    </div>
  );
}

// Session log. The coach writes; the client reads.
export function Sessions({ clientId, canEdit }: { clientId: string; canEdit: boolean }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Session> | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('coaching_sessions').select('*').eq('client_id', clientId).order('session_date', { ascending: false });
    setSessions((data || []) as Session[]);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    const row = {
      client_id: clientId,
      session_date: editing.session_date || new Date().toISOString().slice(0, 10),
      title: editing.title || '',
      notes: editing.notes || '',
      recording_url: editing.recording_url || '',
    };
    if (editing.id) await supabase.from('coaching_sessions').update(row).eq('id', editing.id);
    else await supabase.from('coaching_sessions').insert(row);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this session note?')) return;
    await supabase.from('coaching_sessions').delete().eq('id', id);
    setEditing(null);
    load();
  };

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      {canEdit && !editing && (
        <button onClick={() => setEditing({ session_date: new Date().toISOString().slice(0, 10) })} style={{ ...s.ghost, marginBottom: 10 }}>+ New session note</button>
      )}

      {editing && (
        <div style={{ display: 'grid', gap: 8, margin: '0 0 1.25rem', padding: 12, background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 4 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={editing.session_date || ''} onChange={(e) => setEditing({ ...editing, session_date: e.target.value })} aria-label="Session date" style={{ ...s.input, flex: '0 0 160px' }} />
            <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title (e.g. Energy Audit review)" aria-label="Session title" style={{ ...s.input, flex: '1 1 200px' }} />
          </div>
          <textarea value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={8} placeholder="Notes, takeaways, homework. Paste from Granola if you like." aria-label="Session notes" style={{ ...s.input, resize: 'vertical' }} />
          <input value={editing.recording_url || ''} onChange={(e) => setEditing({ ...editing, recording_url: e.target.value })} placeholder="Recording link (optional)" aria-label="Recording link" style={s.input} />
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button onClick={save} style={s.button}>Save</button>
            <button onClick={() => setEditing(null)} style={{ ...s.ghost, color: c.muted }}>Cancel</button>
            {editing.id && <button onClick={() => remove(editing.id!)} style={{ ...s.ghost, color: c.alert, marginLeft: 'auto' }}>Delete</button>}
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <p style={s.small}>{canEdit ? 'No sessions logged yet.' : 'Notes from our calls will show up here.'}</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `0.5px solid ${c.line}` }}>
          {sessions.map((se) => {
            const open = openId === se.id;
            return (
              <li key={se.id} style={{ borderBottom: `0.5px solid ${c.line}` }}>
                <button onClick={() => setOpenId(open ? null : se.id)} aria-expanded={open} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span><span style={{ fontWeight: 500 }}>{se.title || 'Session'}</span> <span style={s.small}>· {fmtDate(se.session_date)}</span></span>
                  <span style={{ fontSize: 12, color: c.muted }}>{open ? '▲' : '▼'}</span>
                </button>
                {open && (
                  <div style={{ padding: '0 0 14px' }}>
                    {se.notes && <p style={{ ...s.body, whiteSpace: 'pre-wrap', fontSize: 15 }}>{se.notes}</p>}
                    <div style={{ display: 'flex', gap: 16 }}>
                      {se.recording_url && <a href={se.recording_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: c.goldDeep }}>Watch recording ↗</a>}
                      {canEdit && <button onClick={() => setEditing(se)} style={s.ghost}>Edit</button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

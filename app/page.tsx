'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/local-date';

interface DailyEntry {
  id: string;
  date: string;
  reflection: string;
  habits: { [key: string]: boolean };
  tasks: Array<{ id: string; text: string; completed: boolean }>;
}

interface Meeting {
  id: string;
  person: string;
  notes: string;
  granola_link: string;
}

const FIXED_HABITS = [
  { id: 'surf', label: 'Surf/Movement' },
  { id: 'write', label: 'Write in journal' },
  { id: 'meditate', label: 'Meditate 20+ mins' },
  { id: 'supplements', label: 'Supplements/Peptides' },
  { id: 'biofeedback', label: 'Biofeedback' },
];

export default function DailyTracker() {
  const [view, setView] = useState<'daily' | 'meetings'>('daily');
  const [date, setDate] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [habits, setHabits] = useState<{ [key: string]: boolean }>({});
  const [tasks, setTasks] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [newTask, setNewTask] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMeeting, setNewMeeting] = useState({ person: '', notes: '', granola_link: '' });
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [energy, setEnergy] = useState<string>('');
  const [observations, setObservations] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [writtenToUgmonk, setWrittenToUgmonk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const today = getLocalDateString();
    setDate(today);
    loadEntry(today);

    const initHabits = FIXED_HABITS.reduce((acc, habit) => {
      acc[habit.id] = false;
      return acc;
    }, {} as { [key: string]: boolean });
    setHabits(initHabits);
  }, []);

  const loadEntry = async (entryDate: string) => {
    try {
      const saved = localStorage.getItem(`dailys_${entryDate}`);
      if (saved) {
        const data = JSON.parse(saved);
        setReflection(data.reflection || '');
        setEnergy(data.energy || '');
        setObservations(data.observations || '');
        setHabits(data.habits || {});
        setTasks(data.tasks || []);
        setWrittenToUgmonk(data.written_to_ugmonk || false);
      } else {
        setReflection('');
        setEnergy('');
        setObservations('');
        setTasks([]);
        setWrittenToUgmonk(false);
      }
    } catch (e) {
      console.error('Error loading entry:', e);
      setReflection('');
      setEnergy('');
      setObservations('');
      setTasks([]);
      setWrittenToUgmonk(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    loadEntry(newDate);
  };

  const goToPreviousDay = () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const newDate = d.toISOString().split('T')[0];
    handleDateChange(newDate);
  };

  const goToNextDay = () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const newDate = d.toISOString().split('T')[0];
    handleDateChange(newDate);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${dayName} ${month}/${day}/${year}`;
  };

  const toggleHabit = (habitId: string) => {
    setHabits((prev) => ({ ...prev, [habitId]: !prev[habitId] }));
  };

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now().toString(),
        text: newTask,
        completed: false,
      };
      setTasks((prev) => [...prev, task]);
      setNewTask('');
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addMeeting = () => {
    if (newMeeting.person.trim() || newMeeting.notes.trim()) {
      const meeting: Meeting = {
        id: Date.now().toString(),
        person: newMeeting.person,
        notes: newMeeting.notes,
        granola_link: newMeeting.granola_link,
      };
      setMeetings((prev) => [...prev, meeting]);
      setNewMeeting({ person: '', notes: '', granola_link: '' });
    }
  };

  const deleteMeeting = (meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
  };

  const saveMeetingEdit = (meetingId: string, updates: { person: string; notes: string; granola_link: string }) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              person: updates.person,
              notes: updates.notes,
              granola_link: updates.granola_link,
            }
          : m
      )
    );
    setEditingMeetingId(null);
  };

  const MeetingEditForm = ({ meeting, onSave, onCancel, styles }: any) => {
    const [person, setPerson] = React.useState(meeting.person);
    const [notes, setNotes] = React.useState(meeting.notes);
    const [granola_link, setGranolaLink] = React.useState(meeting.granola_link || '');

    return (
      <div style={{ ...styles.meetingForm, border: '0.5px solid #e8e3db', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
        <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Person/Topic" style={styles.meetingInput} />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" style={{ ...styles.meetingInput, minHeight: '80px', resize: 'none' }} />
        <input type="text" value={granola_link} onChange={(e) => setGranolaLink(e.target.value)} placeholder="Granola link (optional)" style={styles.meetingInput} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onSave(meeting.id, { person, notes, granola_link })} style={{ ...styles.buttonPrimary, flex: 1 }}>Save</button>
          <button onClick={onCancel} style={{ ...styles.buttonSecondary, flex: 1 }}>Cancel</button>
        </div>
      </div>
    );
  };

  const setEnergyAndSave = (emoji: string) => {
    setEnergy(emoji);
    try {
      const saved = localStorage.getItem(`dailys_${date}`);
      const entry = saved ? JSON.parse(saved) : { date, reflection, observations, habits, tasks };
      localStorage.setItem(`dailys_${date}`, JSON.stringify({
        ...entry,
        energy: emoji,
      }));
    } catch (e) {
      console.error('Error saving energy:', e);
    }
  };

  const saveTaskEdit = (taskId: string, newText: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, text: newText } : t))
    );
    setEditingTaskId(null);
  };

  const toggleWrittenToUgmonk = async () => {
    const newStatus = !writtenToUgmonk;
    setWrittenToUgmonk(newStatus);
    try {
      const saved = localStorage.getItem(`dailys_${date}`);
      const entry = saved ? JSON.parse(saved) : { date, reflection, habits, tasks };
      localStorage.setItem(`dailys_${date}`, JSON.stringify({
        ...entry,
        written_to_ugmonk: newStatus,
      }));
    } catch (e) {
      console.error('Error updating Ugmonk status:', e);
    }
  };

  const generateShareLink = (meeting: Meeting) => {
    const encoded = btoa(JSON.stringify({
      person: meeting.person,
      notes: meeting.notes,
      granola_link: meeting.granola_link,
    }));
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dailys/share/${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link:', shareUrl);
    });
  };

  const saveEntry = async () => {
    setLoading(true);
    try {
      localStorage.setItem(`dailys_${date}`, JSON.stringify({
        date,
        reflection,
        energy,
        observations,
        habits,
        tasks,
        written_to_ugmonk: writtenToUgmonk,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving entry:', e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={styles.logo}>
          <rect width="40" height="40" fill="none"/>
          <rect width="22" height="22" x="9" y="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <rect width="14" height="14" x="13" y="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span style={styles.brandText}>Dailys</span>
      </div>
      <div style={styles.tabBar}>
        <button
          onClick={() => setView('daily')}
          style={{
            ...styles.tabButton,
            ...(view === 'daily' ? styles.tabButtonActive : styles.tabButtonInactive),
          }}
        >
          Daily
        </button>
        <button
          onClick={() => setView('meetings')}
          style={{
            ...styles.tabButton,
            ...(view === 'meetings' ? styles.tabButtonActive : styles.tabButtonInactive),
          }}
        >
          Meetings
        </button>
      </div>

      <div style={styles.content}>
        {view === 'daily' && (
        <>
        {/* Date */}
        <div style={styles.dateHeadline}>
          <div style={styles.dateNavigation}>
            <button onClick={goToPreviousDay} style={styles.navButton}>← Prev</button>
            <h1 style={styles.dateHeadlineText}>{formatDateDisplay(date)}</h1>
            <button onClick={goToNextDay} style={styles.navButton}>Next →</button>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            style={styles.datePickerInput}
          />
        </div>

        {/* Energy & Observations */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>How's your energy?</label>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px', fontSize: '32px' }}>
            {['😤', '😔', '😐', '😊', '🤩'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setEnergyAndSave(emoji)}
                style={{
                  background: energy === emoji ? '#c9a876' : 'transparent',
                  border: energy === emoji ? '2px solid #c9a876' : '2px solid #e8e3db',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '28px',
                  transition: 'all 0.2s',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Observations (optional)"
            style={{ ...styles.textarea, minHeight: '80px' }}
          />
        </div>

        {/* Habits */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>Habits</label>
          <div style={styles.checklist}>
            {FIXED_HABITS.map((habit) => (
              <label key={habit.id} style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={habits[habit.id] || false}
                  onChange={() => toggleHabit(habit.id)}
                  style={styles.checkbox}
                />
                <span>{habit.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>Today's tasks</label>
          <div style={styles.checklist}>
            {tasks.map((task) => (
              <div key={task.id} style={styles.taskRow}>
                {editingTaskId === task.id ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={editingTaskText}
                      onChange={(e) => setEditingTaskText(e.target.value)}
                      autoFocus
                      style={{ ...styles.taskField, flex: 1 }}
                    />
                    <button
                      onClick={() => saveTaskEdit(task.id, editingTaskText)}
                      style={{ ...styles.deleteBtn, color: '#c9a876' }}
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <>
                    <label style={styles.checkboxItem} onClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        style={styles.checkbox}
                      />
                      <span style={{ textDecoration: task.completed ? 'line-through' : 'none', cursor: 'pointer' }}>
                        {task.text}
                      </span>
                    </label>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={styles.deleteBtn}
                      aria-label="Delete task"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={styles.taskInput}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask();
              }}
              placeholder="Add a task..."
              style={styles.taskField}
            />
            <button onClick={addTask} style={styles.addBtn}>
              +
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonGroup}>
          <button onClick={saveEntry} disabled={loading} style={styles.buttonPrimary}>
            {loading ? 'Saving...' : saved ? 'Saved ✓' : 'Save entry'}
          </button>
          <button onClick={toggleWrittenToUgmonk} style={{ ...styles.buttonSecondary, opacity: writtenToUgmonk ? 1 : 0.6 }}>
            {writtenToUgmonk ? '✓ Written to Ugmonk' : 'Mark written'}
          </button>
        </div>
        </>
        )}

        {view === 'meetings' && (
        <>
        {/* Meetings Date */}
        <div style={styles.dateHeadline}>
          <div style={styles.dateNavigation}>
            <button onClick={goToPreviousDay} style={styles.navButton}>← Prev</button>
            <h1 style={styles.dateHeadlineText}>{formatDateDisplay(date)}</h1>
            <button onClick={goToNextDay} style={styles.navButton}>Next →</button>
          </div>
        </div>

        {/* Meetings List */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>Meetings</label>
          <div style={styles.checklist}>
            {meetings.map((meeting) => (
              editingMeetingId === meeting.id ? (
                <MeetingEditForm key={meeting.id} meeting={meeting} onSave={saveMeetingEdit} onCancel={() => setEditingMeetingId(null)} styles={styles} />
              ) : (
                <div key={meeting.id} style={styles.meetingItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{meeting.person}</div>
                    {meeting.notes && <div style={{ fontSize: '13px', color: '#3d3a33', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{meeting.notes}</div>}
                    {meeting.granola_link && <div style={{ fontSize: '12px', color: '#c9a876', marginBottom: '8px' }}><a href={meeting.granola_link} target="_blank" rel="noopener noreferrer" style={{ color: '#c9a876', textDecoration: 'none' }}>Granola →</a></div>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => generateShareLink(meeting)} style={{ ...styles.deleteBtn, color: '#c9a876', fontSize: '14px' }} title="Share notes">↗</button>
                    <button onClick={() => setEditingMeetingId(meeting.id)} style={{ ...styles.deleteBtn, color: '#c9a876' }}>✎</button>
                    <button onClick={() => deleteMeeting(meeting.id)} style={styles.deleteBtn}>×</button>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Add Meeting */}
          <div style={styles.meetingForm}>
            <input
              type="text"
              value={newMeeting.person}
              onChange={(e) => setNewMeeting({ ...newMeeting, person: e.target.value })}
              placeholder="Person/Topic"
              style={styles.meetingInput}
            />
            <textarea
              value={newMeeting.notes}
              onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
              placeholder="Notes"
              style={{ ...styles.meetingInput, minHeight: '80px', resize: 'none' }}
            />
            <input
              type="text"
              value={newMeeting.granola_link}
              onChange={(e) => setNewMeeting({ ...newMeeting, granola_link: e.target.value })}
              placeholder="Granola link (optional)"
              style={styles.meetingInput}
            />
            <button onClick={addMeeting} style={styles.buttonPrimary}>Add meeting</button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#faf8f3',
    color: '#3d3a33',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '2rem 1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '2rem',
    maxWidth: '640px',
    margin: '0 auto 2rem auto',
  },
  logo: {
    width: '32px',
    height: '32px',
    color: '#c6a96c',
    flexShrink: 0,
  },
  brandText: {
    fontSize: '16px',
    fontWeight: 600 as const,
    color: '#3d3a33',
    letterSpacing: '-0.5px',
  },
  content: {
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  dateHeadline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    paddingBottom: '1.5rem',
    borderBottom: '0.5px solid #e8e3db',
  },
  dateNavigation: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  dateHeadlineText: {
    margin: '0',
    fontSize: '32px',
    fontWeight: 600 as const,
    color: '#3d3a33',
    lineHeight: '1.2',
    flex: 1,
    textAlign: 'center' as const,
  },
  navButton: {
    background: 'transparent',
    border: '0.5px solid #e8e3db',
    color: '#3d3a33',
    fontSize: '13px',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  datePickerInput: {
    background: 'transparent',
    border: 'none',
    fontSize: '13px',
    color: '#9ca084',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: 'fit-content',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#9ca084',
  },
  textarea: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#3d3a33',
    minHeight: '120px',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    fontSize: '14px',
    color: '#3d3a33',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    border: '1.5px solid #e8e3db',
    borderRadius: '4px',
    flexShrink: 0,
    cursor: 'pointer',
    background: 'transparent',
  },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  taskInput: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '8px',
  },
  taskField: {
    flex: 1,
    background: 'transparent',
    border: '0.5px solid #e8e3db',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#3d3a33',
    fontFamily: 'inherit',
    outline: 'none',
  },
  addBtn: {
    width: '32px',
    height: '32px',
    border: '1.5px solid #c9a876',
    borderRadius: '4px',
    background: 'transparent',
    color: '#c9a876',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca084',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '1rem',
  },
  buttonPrimary: {
    flex: 1,
    padding: '10px 16px',
    background: '#c9a876',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500 as const,
    cursor: 'pointer',
  },
  buttonSecondary: {
    flex: 1,
    padding: '10px 16px',
    background: 'transparent',
    border: '0.5px solid #e8e3db',
    color: '#3d3a33',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500 as const,
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    gap: '1rem',
    borderBottom: '0.5px solid #e8e3db',
    paddingBottom: '1rem',
  },
  tabButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500 as const,
    cursor: 'pointer',
    padding: '8px 0',
  },
  tabButtonActive: {
    color: '#c9a876',
    borderBottom: '2px solid #c9a876',
  },
  tabButtonInactive: {
    color: '#9ca084',
  },
  meetingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '0.5px solid #e8e3db',
  },
  meetingForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '1rem',
  },
  meetingInput: {
    background: 'transparent',
    border: '0.5px solid #e8e3db',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#3d3a33',
    fontFamily: 'inherit',
  },
};

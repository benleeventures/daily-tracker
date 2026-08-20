'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DailyEntry {
  id: string;
  date: string;
  reflection: string;
  habits: { [key: string]: boolean };
  tasks: Array<{ id: string; text: string; completed: boolean }>;
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
  const [meetings, setMeetings] = useState<Array<{ id: string; person: string; agenda: string[]; discussion: string[]; actionItems: Array<{ text: string; completed: boolean }> }>>([]);
  const [newMeeting, setNewMeeting] = useState({ person: '', agenda: '', discussion: '', actionItems: '' });
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [writtenToUgmonk, setWrittenToUgmonk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
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
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('date', entryDate)
        .single();

      if (data) {
        setReflection(data.reflection || '');
        setHabits(data.habits || {});
        setTasks(data.tasks || []);
        setWrittenToUgmonk(data.written_to_ugmonk || false);
      } else {
        setReflection('');
        setTasks([]);
        setWrittenToUgmonk(false);
      }
    } catch (e) {
      console.log('No entry for this date yet');
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
    if (newMeeting.person.trim()) {
      const meeting = {
        id: Date.now().toString(),
        person: newMeeting.person,
        agenda: newMeeting.agenda.split('\n').filter(line => line.trim()),
        discussion: newMeeting.discussion.split('\n').filter(line => line.trim()),
        actionItems: newMeeting.actionItems.split('\n').filter(line => line.trim()).map(text => ({ text, completed: false })),
      };
      setMeetings((prev) => [...prev, meeting]);
      setNewMeeting({ person: '', agenda: '', discussion: '', actionItems: '' });
    }
  };

  const deleteMeeting = (meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
  };

  const saveMeetingEdit = (meetingId: string, updates: { person: string; agenda: string; discussion: string; actionItems: string }) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              person: updates.person,
              agenda: updates.agenda.split('\n').filter((line) => line.trim()),
              discussion: updates.discussion.split('\n').filter((line) => line.trim()),
              actionItems: updates.actionItems.split('\n').filter((line) => line.trim()).map((text) => ({ text, completed: false })),
            }
          : m
      )
    );
    setEditingMeetingId(null);
  };

  const MeetingEditForm = ({ meeting, onSave, onCancel, styles }: any) => {
    const [person, setPerson] = React.useState(meeting.person);
    const [agenda, setAgenda] = React.useState(meeting.agenda.join('\n'));
    const [discussion, setDiscussion] = React.useState(meeting.discussion.join('\n'));
    const [actionItems, setActionItems] = React.useState(meeting.actionItems.map((ai: any) => ai.text).join('\n'));

    return (
      <div style={{ ...styles.meetingForm, border: '0.5px solid #e8e3db', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
        <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Person/Topic" style={styles.meetingInput} />
        <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="Agenda (one per line)" style={{ ...styles.meetingInput, minHeight: '50px', resize: 'none' }} />
        <textarea value={discussion} onChange={(e) => setDiscussion(e.target.value)} placeholder="Discussion (one per line)" style={{ ...styles.meetingInput, minHeight: '50px', resize: 'none' }} />
        <textarea value={actionItems} onChange={(e) => setActionItems(e.target.value)} placeholder="Action items (one per line)" style={{ ...styles.meetingInput, minHeight: '50px', resize: 'none' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onSave(meeting.id, { person, agenda, discussion, actionItems })} style={{ ...styles.buttonPrimary, flex: 1 }}>Save</button>
          <button onClick={onCancel} style={{ ...styles.buttonSecondary, flex: 1 }}>Cancel</button>
        </div>
      </div>
    );
  };

  const toggleWrittenToUgmonk = async () => {
    const newStatus = !writtenToUgmonk;
    setWrittenToUgmonk(newStatus);
    try {
      await supabase.from('daily_entries').upsert(
        {
          date,
          written_to_ugmonk: newStatus,
        },
        { onConflict: 'date' }
      );
    } catch (e) {
      console.error('Error updating Ugmonk status:', e);
    }
  };

  const saveEntry = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('daily_entries').upsert(
        {
          date,
          reflection,
          habits,
          tasks,
          written_to_ugmonk: writtenToUgmonk,
        },
        { onConflict: 'date' }
      );

      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error('Error saving entry:', e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.container}>
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

        {/* Reflection */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>Energy & observations</label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What happened today? What matters?"
            style={styles.textarea}
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
                <label style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    style={styles.checkbox}
                  />
                  <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
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
                    {meeting.agenda.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#9ca084', marginBottom: '4px' }}>Agenda</div>
                        <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '13px' }}>
                          {meeting.agenda.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {meeting.discussion.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#9ca084', marginBottom: '4px' }}>Discussion</div>
                        <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '13px' }}>
                          {meeting.discussion.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {meeting.actionItems.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#9ca084', marginBottom: '4px' }}>Action items</div>
                        {meeting.actionItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }} onClick={() => {
                            const updated = meetings.map(m => m.id === meeting.id ? { ...m, actionItems: m.actionItems.map((ai, idx) => idx === i ? { ...ai, completed: !ai.completed } : ai) } : m);
                            setMeetings(updated);
                          }}>
                            <input type="checkbox" checked={item.completed} style={styles.checkbox} readOnly />
                            <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
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
              value={newMeeting.agenda}
              onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
              placeholder="Agenda (one per line)"
              style={{ ...styles.meetingInput, minHeight: '50px', resize: 'none' }}
            />
            <textarea
              value={newMeeting.discussion}
              onChange={(e) => setNewMeeting({ ...newMeeting, discussion: e.target.value })}
              placeholder="Discussion (one per line)"
              style={{ ...styles.meetingInput, minHeight: '50px', resize: 'none' }}
            />
            <textarea
              value={newMeeting.actionItems}
              onChange={(e) => setNewMeeting({ ...newMeeting, actionItems: e.target.value })}
              placeholder="Action items (one per line)"
              style={{ ...styles.meetingInput, minHeight: '50px', resize: 'none' }}
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

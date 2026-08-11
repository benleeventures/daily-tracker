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
  { id: 'surf', label: 'Surf or movement class' },
  { id: 'meditate', label: 'Meditate (15+ min)' },
  { id: 'write', label: 'Write in journal' },
  { id: 'supplements', label: 'Take supplements' },
];

export default function DailyTracker() {
  const [date, setDate] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [habits, setHabits] = useState<{ [key: string]: boolean }>({});
  const [tasks, setTasks] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [newTask, setNewTask] = useState('');
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
      } else {
        setReflection('');
        setTasks([]);
      }
    } catch (e) {
      console.log('No entry for this date yet');
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    loadEntry(newDate);
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

  const saveEntry = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('daily_entries').upsert(
        {
          date,
          reflection,
          habits,
          tasks,
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
      <div style={styles.content}>
        {/* Date */}
        <div style={styles.dateSection}>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            style={styles.dateInput}
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
        </div>
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
  dateSection: {
    paddingBottom: '1rem',
    borderBottom: '0.5px solid #e8e3db',
  },
  dateInput: {
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500 as const,
    color: '#3d3a33',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
    marginTop: 'auto',
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
};

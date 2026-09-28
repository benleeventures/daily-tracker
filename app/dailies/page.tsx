'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/local-date';

const OWNER_EMAIL = 'ben@benlee.ventures';

interface DailyEntry {
  id: string;
  date: string;
  reflection: string;
  energy: string;
  observations: string;
  habits: { [key: string]: boolean };
  tasks: Array<{ id: string; text: string; completed: boolean }>;
  written_to_ugmonk: boolean;
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
  const router = useRouter();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [carriedOverTasks, setCarriedOverTasks] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [carriedFrom, setCarriedFrom] = useState('');
  const [showCarriedOver, setShowCarriedOver] = useState(true);
  const [showCheckin, setShowCheckin] = useState(false);

  // Sync bookkeeping. Refs, not state, so timers and event listeners always see current values.
  const dateRef = useRef('');
  const followTodayRef = useRef(true); // viewing "today" → roll forward when the day changes
  const dirtyRef = useRef(false); // text edits not yet saved
  const pendingSavesRef = useRef(0);
  const lastLocalChangeRef = useRef(0);

  // Don't let a server refresh clobber edits that haven't landed yet.
  const hasLocalChanges = () =>
    dirtyRef.current || pendingSavesRef.current > 0 || Date.now() - lastLocalChangeRef.current < 3000;

  const loadEntry = useCallback(async (entryDate: string, opts: { background?: boolean } = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Not authenticated');
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      setIsOwner(session.user.email === OWNER_EMAIL);
      if (session.user.email !== OWNER_EMAIL) return;
      if (opts.background && hasLocalChanges()) return;

      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', entryDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error)
        console.error('Error loading entry:', error);
        return;
      }

      // Bail if the user switched days or started editing while the request was in flight
      if (entryDate !== dateRef.current) return;
      if (opts.background && hasLocalChanges()) return;

      if (data) {
        setEntryId(data.id);
        setReflection(data.reflection || '');
        setEnergy(data.energy || '');
        setObservations(data.observations || '');
        setHabits(data.habits || {});
        setTasks(data.tasks || []);
        setWrittenToUgmonk(data.written_to_ugmonk || false);
      } else {
        setEntryId(null);
        setReflection('');
        setEnergy('');
        setObservations('');
        setHabits({});
        setTasks([]);
        setWrittenToUgmonk(false);
      }
    } catch (e) {
      // Network blip (common on mobile resume) — keep what's on screen rather than blanking it
      console.error('Error loading entry:', e);
    }
  }, []);

  const loadCarriedOverTasks = useCallback(async (entryDate: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Look back past skipped days (up to two weeks) to the last entry that still has open tasks
      const { data, error } = await supabase
        .from('daily_entries')
        .select('date, tasks')
        .eq('user_id', session.user.id)
        .lt('date', entryDate)
        .order('date', { ascending: false })
        .limit(14);

      if (error) {
        console.error('Error loading previous tasks:', error);
        return;
      }
      if (entryDate !== dateRef.current) return;

      type Task = { id: string; text: string; completed: boolean };
      const prev = (data || []).find((d) => (d.tasks as Task[] | null)?.some((t) => !t.completed));
      setCarriedOverTasks(prev ? (prev.tasks as Task[]).filter((t) => !t.completed) : []);
      setCarriedFrom(prev ? prev.date : '');
    } catch (e) {
      console.error('Error loading carried over tasks:', e);
    }
  }, []);

  const loadMeetings = useCallback(async (meetingDate: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', meetingDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading meetings:', error);
        return;
      }

      if (data && meetingDate === dateRef.current) {
        setMeetings(data.map(m => ({
          id: m.id,
          person: m.person,
          notes: m.notes,
          granola_link: m.granola_link,
        })));
      }
    } catch (e) {
      console.error('Error loading meetings:', e);
    }
  }, []);

  // Upsert on (user_id, date). The old insert-or-update keyed on a local entryId: a device that
  // opened before today's row existed kept entryId = null forever, so every save it made was an
  // insert that hit the unique constraint and was silently dropped.
  const saveEntryToSupabase = useCallback(async (entryData: any, forDate: string = dateRef.current) => {
    if (!forDate) return;
    pendingSavesRef.current += 1;
    lastLocalChangeRef.current = Date.now();
    setSaveStatus('saving');
    let ok = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('daily_entries')
        .upsert(
          {
            user_id: session.user.id,
            date: forDate,
            ...entryData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving entry:', error);
        return;
      }

      ok = true;
      if (data && forDate === dateRef.current) {
        setEntryId(data.id);
      }
    } catch (e) {
      console.error('Error saving entry to Supabase:', e);
    } finally {
      pendingSavesRef.current -= 1;
      lastLocalChangeRef.current = Date.now();
      if (ok) {
        if (pendingSavesRef.current === 0) setSaveStatus('saved');
      } else {
        // Keep the edit marked unsaved and try again shortly (flaky mobile signal)
        setSaveStatus('error');
        if (forDate === dateRef.current) {
          dirtyRef.current = true;
          setTimeout(() => flushRef.current(), 5000);
        }
      }
    }
  }, []);

  const flushRef = useRef<() => Promise<void>>(async () => {});

  const showDate = useCallback(async (newDate: string) => {
    dateRef.current = newDate;
    followTodayRef.current = newDate === getLocalDateString();
    dirtyRef.current = false;
    setDate(newDate);
    await Promise.all([loadEntry(newDate), loadMeetings(newDate), loadCarriedOverTasks(newDate)]);
  }, [loadEntry, loadMeetings, loadCarriedOverTasks]);

  // Pull the latest from the server. If the phone was left open overnight, jump to the new today.
  const refresh = useCallback(async () => {
    if (!dateRef.current) return;
    const today = getLocalDateString();
    if (followTodayRef.current && today !== dateRef.current && !hasLocalChanges()) {
      await showDate(today);
      return;
    }
    await Promise.all([
      loadEntry(dateRef.current, { background: true }),
      loadMeetings(dateRef.current),
    ]);
  }, [showDate, loadEntry, loadMeetings]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) await showDate(getLocalDateString());
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setIsAuthenticated(!!session);
      if (session && event === 'SIGNED_IN' && !dateRef.current) {
        await showDate(getLocalDateString());
      } else if (!session) {
        setIsAuthenticated(false);
        dateRef.current = '';
        setEntryId(null);
        setReflection('');
        setEnergy('');
        setObservations('');
        setHabits({});
        setTasks([]);
        setMeetings([]);
        setCarriedOverTasks([]);
      }
    });

    return () => subscription?.unsubscribe();
  }, [showDate]);

  // Keep half-typed tasks/meetings on this device so closing the app doesn't lose them
  const draftsLoadedRef = useRef(false);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('dailys-drafts') || '{}');
      if (d.newTask) setNewTask(d.newTask);
      if (d.newMeeting) setNewMeeting(d.newMeeting);
      if (localStorage.getItem('dailys-checkin-open') === '1') setShowCheckin(true);
    } catch {}
    draftsLoadedRef.current = true;
  }, []);
  useEffect(() => {
    if (!draftsLoadedRef.current) return;
    try {
      localStorage.setItem('dailys-drafts', JSON.stringify({ newTask, newMeeting }));
    } catch {}
  }, [newTask, newMeeting]);

  // Latest entry state, for saves fired from timers
  const latestRef = useRef({ reflection, energy, observations, habits, tasks, written_to_ugmonk: writtenToUgmonk });
  useEffect(() => {
    latestRef.current = { reflection, energy, observations, habits, tasks, written_to_ugmonk: writtenToUgmonk };
  });

  const flushTextEdits = useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    await saveEntryToSupabase(latestRef.current);
  }, [saveEntryToSupabase]);

  useEffect(() => {
    flushRef.current = flushTextEdits;
  }, [flushTextEdits]);

  // Auto-save typed text 1.5s after the last keystroke. Only fires on real edits (dirtyRef),
  // never on data that just arrived from the server.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(flushTextEdits, 1500);
    return () => clearTimeout(timer);
  }, [reflection, observations, flushTextEdits]);

  // Poll while visible. iOS freezes timers in the background, so also refresh on resume:
  // `focus` alone doesn't fire when reopening a home-screen app, `visibilitychange`/`pageshow` do.
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 5000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
      else flushTextEdits(); // app is being backgrounded — get typing saved first
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('pagehide', flushTextEdits);
    return () => {
      window.removeEventListener('pagehide', flushTextEdits);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [isAuthenticated, refresh, flushTextEdits]);

  const handleDateChange = async (newDate: string) => {
    if (!newDate) return;
    await flushTextEdits();
    await showDate(newDate);
  };

  const goToPreviousDay = async () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const newDate = d.toISOString().split('T')[0];
    await handleDateChange(newDate);
  };

  const goToNextDay = async () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const newDate = d.toISOString().split('T')[0];
    await handleDateChange(newDate);
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

  const toggleHabit = async (habitId: string) => {
    const updatedHabits = { ...habits, [habitId]: !habits[habitId] };
    setHabits(updatedHabits);
    await saveEntryToSupabase({
      reflection,
      energy,
      observations,
      habits: updatedHabits,
      tasks,
      written_to_ugmonk: writtenToUgmonk,
    });
  };

  const generateTaskId = () => {
    // Generate a more robust UUID-like ID instead of using Date.now()
    // This prevents collisions when multiple tasks are added rapidly
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: generateTaskId(),
        text: newTask,
        completed: false,
      };
      const updatedTasks = [...tasks, task];
      setTasks(updatedTasks);
      setNewTask('');
      // Immediately save to Supabase
      saveEntryToSupabase({
        reflection,
        energy,
        observations,
        habits,
        tasks: updatedTasks,
        written_to_ugmonk: writtenToUgmonk,
      });
    }
  };

  const carryOverTask = (carriedTask: { id: string; text: string; completed: boolean }) => {
    const newTask = {
      id: generateTaskId(),
      text: carriedTask.text,
      completed: false,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveEntryToSupabase({
      reflection,
      energy,
      observations,
      habits,
      tasks: updatedTasks,
      written_to_ugmonk: writtenToUgmonk,
    });
  };

  const sameTask = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const pendingCarry = carriedOverTasks.filter((c) => !tasks.some((t) => sameTask(t.text, c.text)));

  const carryAll = () => {
    const updatedTasks = [
      ...tasks,
      ...pendingCarry.map((t) => ({ id: generateTaskId(), text: t.text, completed: false })),
    ];
    setTasks(updatedTasks);
    saveEntryToSupabase({
      reflection,
      energy,
      observations,
      habits,
      tasks: updatedTasks,
      written_to_ugmonk: writtenToUgmonk,
    });
  };

  const carriedFromLabel = (() => {
    if (!carriedFrom || !date) return 'earlier';
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (carriedFrom === yesterday) return 'yesterday';
    return new Date(carriedFrom + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  const toggleCheckin = () => {
    const next = !showCheckin;
    setShowCheckin(next);
    try { localStorage.setItem('dailys-checkin-open', next ? '1' : '0'); } catch {}
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updatedTasks);
    await saveEntryToSupabase({
      reflection,
      energy,
      observations,
      habits,
      tasks: updatedTasks,
      written_to_ugmonk: writtenToUgmonk,
    });
  };

  const deleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    await saveEntryToSupabase({
      reflection,
      energy,
      observations,
      habits,
      tasks: updatedTasks,
      written_to_ugmonk: writtenToUgmonk,
    });
  };

  const addMeeting = async () => {
    if (newMeeting.person.trim() || newMeeting.notes.trim()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('Not authenticated');
          return;
        }

        const { data, error } = await supabase
          .from('meetings')
          .insert({
            user_id: session.user.id,
            date,
            person: newMeeting.person,
            notes: newMeeting.notes,
            granola_link: newMeeting.granola_link,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating meeting:', error);
          return;
        }

        if (data) {
          setMeetings((prev) => [
            ...prev,
            {
              id: data.id,
              person: data.person,
              notes: data.notes,
              granola_link: data.granola_link,
            },
          ]);
        }

        setNewMeeting({ person: '', notes: '', granola_link: '' });
      } catch (e) {
        console.error('Error adding meeting:', e);
      }
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting meeting:', error);
        return;
      }

      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    } catch (e) {
      console.error('Error deleting meeting:', e);
    }
  };

  const saveMeetingEdit = async (meetingId: string, updates: { person: string; notes: string; granola_link: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('meetings')
        .update({
          person: updates.person,
          notes: updates.notes,
          granola_link: updates.granola_link,
          updated_at: new Date().toISOString(),
        })
        .eq('id', meetingId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating meeting:', error);
        return;
      }

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
    } catch (e) {
      console.error('Error saving meeting edit:', e);
    }
  };

  const MeetingEditForm = ({ meeting, onSave, onCancel, styles }: any) => {
    const [person, setPerson] = useState(meeting.person);
    const [notes, setNotes] = useState(meeting.notes);
    const [granola_link, setGranolaLink] = useState(meeting.granola_link || '');

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

  const setEnergyAndSave = async (emoji: string) => {
    setEnergy(emoji);
    await saveEntryToSupabase({
      reflection,
      energy: emoji,
      observations,
      habits,
      tasks,
      written_to_ugmonk: writtenToUgmonk,
    });
  };

  const saveTaskEdit = async (taskId: string, newText: string) => {
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, text: newText } : t));
    setTasks(updatedTasks);
    setEditingTaskId(null);
    await saveEntryToSupabase({
      reflection,
      energy,
      observations,
      habits,
      tasks: updatedTasks,
      written_to_ugmonk: writtenToUgmonk,
    });
  };

  const toggleWrittenToUgmonk = async () => {
    const newStatus = !writtenToUgmonk;
    setWrittenToUgmonk(newStatus);
    await saveEntryToSupabase({
      reflection,
      energy,
      observations,
      habits,
      tasks,
      written_to_ugmonk: newStatus,
    });
  };

  const generateShareLink = (meeting: Meeting) => {
    const encoded = btoa(JSON.stringify({
      person: meeting.person,
      notes: meeting.notes,
      granola_link: meeting.granola_link,
    }));
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dailies/share/${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link:', shareUrl);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setEntryId(null);
    setReflection('');
    setEnergy('');
    setObservations('');
    setHabits({});
    setTasks([]);
    setMeetings([]);
    setCarriedOverTasks([]);
  };



  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.content, justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: '1rem', fontSize: '24px', fontWeight: 600 }}>Please log in to continue</h1>
            <p style={{ color: '#676d55', marginBottom: '2rem' }}>You need to authenticate to use Dailys</p>
            <a href="/login?next=/dailies" style={{ ...styles.buttonPrimary, display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>Go to Login</a>
          </div>
        </div>
      </div>
    );
  }

  if (isOwner === false) {
    router.replace('/coaching');
    return (
      <div style={styles.container}>
        <div style={{ ...styles.content, justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#676d55' }}>Redirecting…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ ...styles.header, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={styles.logo}>
            <rect width="40" height="40" fill="none"/>
            <rect width="22" height="22" x="9" y="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <rect width="14" height="14" x="13" y="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span style={styles.brandText}>Dailys</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: saveStatus === 'error' ? '#a0523a' : '#676d55' }} aria-live="polite">
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Not saved — retrying' : ''}
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '0.5px solid #e8e3db',
            color: '#676d55',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Logout
        </button>
        </div>
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
                      style={{ ...styles.deleteBtn, color: '#876a30' }}
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        style={styles.checkbox}
                      />
                      <span
                        style={{ textDecoration: task.completed ? 'line-through' : 'none', cursor: 'pointer', flex: 1 }}
                        onClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }}
                      >
                        {task.text}
                      </span>
                    </div>
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

        {/* Carried over: open tasks from the last day you used Dailys, minus ones already on today */}
        {pendingCarry.length > 0 && (
        <div style={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <button onClick={() => setShowCarriedOver(!showCarriedOver)} style={styles.collapseBtn}>
              {showCarriedOver ? '▼' : '▶'} Still open from {carriedFromLabel} ({pendingCarry.length})
            </button>
            <button onClick={carryAll} style={styles.linkBtn}>Bring all forward</button>
          </div>
          {showCarriedOver && (
            <div style={styles.checklist}>
              {pendingCarry.map((task) => (
                <div key={task.id} style={styles.taskRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => carryOverTask(task)}
                      style={styles.checkbox}
                      aria-label={`Bring "${task.text}" to today`}
                    />
                    <span style={{ color: '#676d55', fontSize: '14px', flex: 1 }}>
                      {task.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Check-in: energy, habits, notes — collapsed so tasks stay front and center */}
        <div style={styles.section}>
          <button onClick={toggleCheckin} style={styles.collapseBtn}>
            {showCheckin ? '▼' : '▶'} Check-in
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              {energy || '—'} · {FIXED_HABITS.filter((h) => habits[h.id]).length}/{FIXED_HABITS.length} habits
            </span>
          </button>
        </div>
        {showCheckin && (
        <>
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
            onChange={(e) => { dirtyRef.current = true; setObservations(e.target.value); }}
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

        <div style={styles.buttonGroup}>
          <button onClick={toggleWrittenToUgmonk} style={{ ...styles.buttonSecondary, opacity: writtenToUgmonk ? 1 : 0.6 }}>
            {writtenToUgmonk ? '✓ Written to Ugmonk' : 'Mark written'}
          </button>
        </div>
        </>
        )}
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
                    {meeting.granola_link && <div style={{ fontSize: '12px', color: '#876a30', marginBottom: '8px' }}><a href={meeting.granola_link} target="_blank" rel="noopener noreferrer" style={{ color: '#876a30', textDecoration: 'none' }}>Granola →</a></div>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => generateShareLink(meeting)} style={{ ...styles.deleteBtn, color: '#876a30', fontSize: '14px' }} title="Share notes">↗</button>
                    <button onClick={() => setEditingMeetingId(meeting.id)} style={{ ...styles.deleteBtn, color: '#876a30' }}>✎</button>
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <textarea
                value={newMeeting.notes}
                onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                placeholder="Notes"
                style={{ ...styles.meetingInput, minHeight: '80px', resize: 'none', flex: 1 }}
              />
              <button
                onClick={() => setNewMeeting({ ...newMeeting, notes: 'Agenda\n\n* \n\nDiscussion\n\n* \n\nAction Items\n\n* [ ] \n* [ ] ' })}
                style={{ ...styles.templateBtn, alignSelf: 'flex-start', marginTop: '2px' }}
                title="Insert meeting template"
              >
                Template
              </button>
            </div>
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
  collapseBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#676d55',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'inherit',
    textAlign: 'left' as const,
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '12px',
    color: '#876a30',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
  },
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
    color: '#676d55',
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
    color: '#676d55',
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
    color: '#876a30',
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
    color: '#676d55',
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
    background: '#876a30',
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
    color: '#876a30',
    borderBottom: '2px solid #c9a876',
  },
  tabButtonInactive: {
    color: '#676d55',
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
  templateBtn: {
    background: 'transparent',
    border: '0.5px solid #e8e3db',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#876a30',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500 as const,
  },
};

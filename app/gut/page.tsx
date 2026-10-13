'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/local-date';
import { Mark, c, font, s } from '../coaching/ui';
import { addDays, dayLabel, longDate, useDay, useGutConfig, useGutSession } from './data';
import DayTab from './day-tab';
import { useNoteImport, type NoteImport } from './import-flow';
import Morning from './morning';
import Night from './night';
import type { Day, SaveState } from './types';

const TABS = [
  { id: 'morning', label: 'Morning' },
  { id: 'day', label: 'Day' },
  { id: 'night', label: 'Night' },
  { id: 'trends', label: 'Trends' },
  { id: 'plan', label: 'Plan' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const signOut = () => supabase.auth.signOut().then(() => window.location.replace('/login?next=/gut'));

export default function GutPage() {
  const session = useGutSession();

  if (session.status === 'loading') {
    return <Frame><p style={{ ...s.small, textAlign: 'center', marginTop: '4rem' }}>Loading…</p></Frame>;
  }
  if (session.status === 'denied') {
    return (
      <Frame>
        <h1 style={s.h1}>This one is private</h1>
        <p style={s.body}>You’re signed in as {session.email}, but this account doesn’t have access to the Gut Audit.</p>
        <button onClick={signOut} style={s.button}>Sign out</button>
      </Frame>
    );
  }
  return <GutApp userId={session.userId} email={session.email} />;
}

function GutApp({ userId, email }: { userId: string; email: string }) {
  const [today, setToday] = useState(getLocalDateString);
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<TabId>('morning');
  const { day, update, save, flush } = useDay(userId, date);
  const noteImport = useNoteImport({ day, update, today, viewed: date, setDate });
  const { config, firstDay, loaded } = useGutConfig(userId);

  // The home-screen app can resume on yesterday's date. When the calendar day rolls over, follow it
  // if the person was looking at "today".
  useEffect(() => {
    const check = () => {
      const now = getLocalDateString();
      setToday((prev) => {
        if (prev !== now) setDate((d) => (d === prev ? now : d));
        return now;
      });
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  // Day 1 = the configured start, else the earliest day on record, else today.
  const start = config.start || firstDay || today;
  const isToday = date === today;
  const hasBlood = !!day?.bms.some((b) => b.blood);

  // Pending edits flush inside useDay when the date changes; flushing here too keeps the status honest.
  const go = (next: string) => { void flush(); setDate(next); };

  return (
    <Frame
      header={
        <DayHeader
          label={loaded ? dayLabel(start, date) : ' '}
          date={date}
          isToday={isToday}
          save={save}
          onPrev={() => go(addDays(date, -1))}
          onNext={() => go(addDays(date, 1))}
          onToday={() => go(today)}
        />
      }
      right={<button onClick={signOut} style={{ ...s.ghost, color: c.muted, fontSize: 12 }}>Sign out</button>}
      tabs={<TabBar tab={tab} onChange={setTab} />}
    >
      {hasBlood && (
        <div role="alert" style={styles.alert}>
          You logged blood or black stool today. Contact a doctor promptly rather than waiting for the next check-in.
        </div>
      )}

      {!day ? (
        <p style={{ ...s.small, textAlign: 'center', marginTop: '3rem' }}>Loading…</p>
      ) : (
        <TabPanel tab={tab} day={day} update={update} isToday={isToday} noteImport={noteImport} />
      )}

      <p style={{ ...s.small, marginTop: '3rem' }}>Signed in as {email}</p>
    </Frame>
  );
}

// Each tab fills in over the next steps. The shell, header, autosave and access are what's live now.
function TabPanel({ tab, day, update, isToday, noteImport }: { tab: TabId; day: Day; update: (fn: (d: Day) => Day) => void; isToday: boolean; noteImport: NoteImport }) {
  if (tab === 'morning') return <Morning day={day} update={update} />;
  if (tab === 'night') return <Night day={day} update={update} />;
  if (tab === 'day') return <DayTab day={day} update={update} isToday={isToday} noteImport={noteImport} />;
  const copy: Record<TabId, string> = {
    morning: '',
    day: '',
    night: '',
    trends: 'The 14-day chart, Bristol spread and food tags.',
    plan: 'Mission, goals and your Day 1 date.',
  };
  const title = TABS.find((t) => t.id === tab)!.label;
  return (
    <section aria-labelledby="panel-title">
      <p style={s.eyebrow}>{day.date}</p>
      <h1 id="panel-title" style={s.h1}>{title}</h1>
      <p style={s.body}>{copy[tab]}</p>
    </section>
  );
}

function DayHeader(props: {
  label: string;
  date: string;
  isToday: boolean;
  save: SaveState;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const { label, date, isToday, save, onPrev, onNext, onToday } = props;
  return (
    <div style={styles.dayHeader}>
      <div style={{ minWidth: 0 }}>
        <p style={{ ...s.eyebrow, margin: 0, minHeight: 14 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>
          {longDate(date)}{isToday && <span style={{ color: c.goldDeep, fontWeight: 500 }}> · today</span>}
        </p>
        <p style={{ ...s.small, margin: '2px 0 0', minHeight: 18, color: save.kind === 'error' ? c.alert : c.muted }} aria-live="polite">
          <SaveText save={save} />
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {!isToday && <button onClick={onToday} style={{ ...s.ghost, padding: '0 6px' }}>Today</button>}
        <button onClick={onPrev} aria-label="Previous day" style={styles.arrow}>←</button>
        <button onClick={onNext} disabled={isToday} aria-label="Next day" style={{ ...styles.arrow, opacity: isToday ? 0.35 : 1, cursor: isToday ? 'default' : 'pointer' }}>→</button>
      </div>
    </div>
  );
}

function SaveText({ save }: { save: SaveState }) {
  if (save.kind === 'saving') return <>Saving…</>;
  if (save.kind === 'saved') return <>Saved {save.at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>;
  if (save.kind === 'error') return <>{save.message}. Your entry is kept here; it will retry on your next change.</>;
  return <> </>;
}

function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav aria-label="Sections" style={styles.tabBar}>
      <div style={styles.tabInner}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { onChange(t.id); window.scrollTo({ top: 0 }); }}
            aria-current={tab === t.id ? 'page' : undefined}
            style={{
              ...styles.tab,
              color: tab === t.id ? c.ink : c.muted,
              fontWeight: tab === t.id ? 600 : 400,
              borderTop: `2px solid ${tab === t.id ? c.gold : 'transparent'}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Frame({ children, header, right, tabs }: { children: React.ReactNode; header?: React.ReactNode; right?: React.ReactNode; tabs?: React.ReactNode }) {
  return (
    <main className="gut" style={styles.page}>
      <style>{FOCUS_CSS}</style>
      <div style={styles.column}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mark size={24} />
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>Gut Audit</span>
          </div>
          {right}
        </div>
        {header}
        <div style={{ paddingTop: 20 }}>{children}</div>
      </div>
      {tabs}
    </main>
  );
}

// Visible keyboard focus on every control, and no motion for people who ask for none
const FOCUS_CSS = `
.gut button:focus-visible, .gut input:focus-visible, .gut textarea:focus-visible, .gut select:focus-visible { outline: 2px solid ${c.goldDeep}; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .gut * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const styles = {
  page: {
    minHeight: '100vh',
    background: c.bg,
    color: c.ink,
    fontFamily: font,
    // Room for the fixed tab bar plus the iPhone home indicator
    paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
  } as CSSProperties,
  column: { maxWidth: 560, margin: '0 auto', padding: '0 16px' } as CSSProperties,
  dayHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    background: c.bg,
    borderBottom: `0.5px solid ${c.line}`,
    padding: '8px 0 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  } as CSSProperties,
  arrow: {
    width: 40,
    height: 40,
    background: c.paper,
    border: `0.5px solid ${c.line}`,
    borderRadius: 4,
    color: c.ink,
    fontSize: 16,
    fontFamily: font,
    cursor: 'pointer',
  } as CSSProperties,
  alert: {
    background: 'rgba(160, 82, 58, 0.08)',
    border: `0.5px solid ${c.alert}`,
    color: c.alert,
    borderRadius: 4,
    padding: '12px 14px',
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 16,
  } as CSSProperties,
  tabBar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    background: c.bg,
    borderTop: `0.5px solid ${c.line}`,
    paddingBottom: 'env(safe-area-inset-bottom)',
  } as CSSProperties,
  tabInner: { maxWidth: 560, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' } as CSSProperties,
  tab: {
    background: 'transparent',
    border: 'none',
    height: 56,
    fontSize: 13,
    fontFamily: font,
    cursor: 'pointer',
  } as CSSProperties,
};

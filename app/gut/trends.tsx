'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { c, s } from '../coaching/ui';
import { BRISTOL } from './constants';
import { normalize } from './day';
import { Section } from './inputs';
import { bristolCounts, doctorSummary, foodTagRows, one, nightsRunning, signed, windowDates, windowStats } from './trends-calc';
import type { Day } from './types';

// Last 14 calendar days ending today, plus food-tag associations across every scored day.

const WARN = '#de905a'; // amber for watch-this data; red stays reserved for blood

export default function Trends({ userId, today, flush }: { userId: string; today: string; flush: () => Promise<void> }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await flush(); // make sure the day you just edited is saved before reading everything back
      const { data, error } = await supabase.from('gut_days').select('date, doc').eq('user_id', userId).order('date', { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(true);
        return;
      }
      setDays((data ?? []).map((r) => normalize(r.doc as Partial<Day>, r.date as string)));
    })();
    return () => { cancelled = true; };
  }, [userId, flush]);

  if (error) return <p style={{ ...s.body, color: c.alert }}>Couldn’t load your history. Check your connection and reopen this tab.</p>;
  if (!days) return <p style={{ ...s.small, textAlign: 'center', marginTop: '3rem' }}>Loading…</p>;
  return <TrendsView days={days} today={today} />;
}

export function TrendsView({ days, today }: { days: Day[]; today: string }) {
  const dates = useMemo(() => windowDates(today, 14), [today]);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const stats = useMemo(() => windowStats(byDate, dates), [byDate, dates]);
  const bristol = useMemo(() => bristolCounts(byDate, dates), [byDate, dates]);
  const tags = useMemo(() => foodTagRows(days), [days]);
  const running = useMemo(() => nightsRunning(byDate, dates), [byDate, dates]);

  if (stats.loggedDays === 0 && !stats.hasBlood) {
    return (
      <div>
        <p style={s.body}>Nothing to chart yet. Log a few days and your patterns show up here.</p>
        <FoodTags tags={tags} />
      </div>
    );
  }

  return (
    <div>
      {stats.hasBlood && (
        <div role="alert" style={{ ...alertBox, background: 'rgba(160, 82, 58, 0.08)', border: `0.5px solid ${c.alert}`, color: c.alert }}>
          You logged blood or black stool in the last 14 days. Contact a doctor promptly rather than waiting for the next check-in.
        </div>
      )}
      {running && (
        <div role="note" style={{ ...alertBox, background: 'rgba(222, 144, 90, 0.12)', border: `0.5px solid ${WARN}`, color: c.ink }}>
          Diarrhea waking you up two nights running is worth flagging to your doctor.
        </div>
      )}

      <p style={{ ...s.small, margin: '0 0 14px' }}>Last 14 days, {dates[0]} to {dates[dates.length - 1]}.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30 }}>
        <Tile label="Avg peak bloating" value={stats.avgBloat === undefined ? '–' : one(stats.avgBloat)} unit={stats.avgBloat === undefined ? '' : '/10'} />
        <Tile label="Avg sleep quality" value={stats.avgSleep === undefined ? '–' : one(stats.avgSleep)} unit={stats.avgSleep === undefined ? '' : '/10'} />
        <Tile label="BMs per logged day" value={stats.bmPerDay === undefined ? '–' : one(stats.bmPerDay)} sub={`${stats.bmCount} over ${stats.loggedDays} logged day${stats.loggedDays === 1 ? '' : 's'}`} />
        <Tile label="BMs with mucus" value={String(stats.mucus)} sub={`${stats.woke} woke you up`} />
      </div>

      <Section title="Bloating and sleep">
        <Chart dates={dates} byDate={byDate} today={today} />
      </Section>

      <Section title="Bristol types">
        <BristolBars counts={bristol} />
      </Section>

      <Section title="Food tags vs bloating">
        <FoodTags tags={tags} />
      </Section>

      <Section title="Share">
        <ShareCard text={doctorSummary(byDate, dates, tags.rows)} />
      </Section>
    </div>
  );
}

const alertBox: CSSProperties = { borderRadius: 4, padding: '12px 14px', fontSize: 14, lineHeight: 1.5, marginBottom: 14 };

function Tile({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div style={{ background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 6, padding: '12px 14px' }}>
      <p style={{ ...s.eyebrow, margin: 0 }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '-0.5px' }}>
        {value}
        {unit && <span style={{ fontSize: 14, color: c.muted, fontWeight: 400 }}>{unit}</span>}
      </p>
      {sub && <p style={{ ...s.small, margin: '2px 0 0' }}>{sub}</p>}
    </div>
  );
}

// Bars = peak bloating, dots = sleep quality, one shared 0 to 10 axis. A missing value draws nothing.
function Chart({ dates, byDate, today }: { dates: string[]; byDate: Map<string, Day>; today: string }) {
  const W = 360, H = 200, ml = 26, mr = 6, mt = 10, mb = 26;
  const plotW = W - ml - mr, plotH = H - mt - mb;
  const slot = plotW / dates.length;
  const y = (v: number) => mt + plotH * (1 - v / 10);
  const rows = dates.map((date) => ({ date, bloat: byDate.get(date)?.pm.bloat, sleep: byDate.get(date)?.am.sleepQ }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: c.muted, marginBottom: 8 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: c.gold, marginRight: 6, verticalAlign: -1 }} />Peak bloating</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 999, background: c.ink, marginRight: 6, verticalAlign: -1 }} />Sleep quality</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Peak bloating bars and sleep quality dots for each of the last 14 days, scored 0 to 10" style={{ display: 'block' }}>
        {[0, 5, 10].map((t) => (
          <g key={t}>
            <line x1={ml} x2={W - mr} y1={y(t)} y2={y(t)} stroke={c.line} strokeWidth={0.75} />
            <text x={ml - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill={c.muted}>{t}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cx = ml + slot * i + slot / 2;
          return (
            <g key={r.date}>
              {r.bloat !== undefined && (
                <rect x={cx - 6} y={y(r.bloat)} width={12} height={Math.max(0, y(0) - y(r.bloat))} rx={1} fill={c.gold}>
                  <title>{`${r.date}: peak bloating ${r.bloat}/10`}</title>
                </rect>
              )}
              {r.sleep !== undefined && (
                <circle cx={cx} cy={y(r.sleep)} r={3.6} fill={c.ink} stroke={c.bg} strokeWidth={1}>
                  <title>{`${r.date}: sleep quality ${r.sleep}/10`}</title>
                </circle>
              )}
              <text x={cx} y={H - 9} textAnchor="middle" fontSize={10} fill={r.date === today ? c.ink : c.muted} fontWeight={r.date === today ? 700 : 400}>
                {Number(r.date.slice(8))}
              </text>
            </g>
          );
        })}
      </svg>
      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: 13, color: c.goldDeep, cursor: 'pointer', minHeight: 32 }}>See the numbers</summary>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 6 }}>
          <thead><tr><th style={th}>Date</th><th style={thNum}>Bloating</th><th style={thNum}>Sleep</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date}><td style={td}>{r.date}</td><td style={tdNum}>{r.bloat ?? '–'}</td><td style={tdNum}>{r.sleep ?? '–'}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function BristolBars({ counts }: { counts: Record<number, number> }) {
  const max = Math.max(1, ...Object.values(counts));
  const colorOf = (n: number) => (n === 3 || n === 4 ? c.muted : n === 1 || n === 2 || n === 6 || n === 7 ? WARN : '#b9b2a3');
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div>
      {total === 0 && <p style={{ ...s.small, margin: '0 0 10px' }}>No bowel movements with a Bristol type in the last 14 days.</p>}
      {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => (
        <div key={n} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 28px', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13 }}>
          <span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</b> <span style={{ color: c.muted }}>{BRISTOL[n]}</span></span>
          <div style={{ background: c.line, height: 12, borderRadius: 2, overflow: 'hidden' }} aria-hidden>
            <div style={{ width: `${(counts[n] / max) * 100}%`, height: '100%', background: colorOf(n) }} />
          </div>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{counts[n]}</span>
        </div>
      ))}
      <p style={{ ...s.small, margin: '10px 0 0' }}>Types 3 and 4 are the target. Types 1–2 and 6–7 are the ones to watch.</p>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'left', fontWeight: 600, padding: '6px 4px', borderBottom: `0.5px solid ${c.line}` };
const thNum: CSSProperties = { ...th, textAlign: 'right' };
const td: CSSProperties = { padding: '7px 4px', borderBottom: `0.5px solid ${c.line}` };
const tdNum: CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

function FoodTags({ tags }: { tags: ReturnType<typeof foodTagRows> }) {
  return (
    <div>
      {tags.rows.length === 0 ? (
        <p style={{ ...s.small, margin: 0, fontSize: 14 }}>
          Needs at least 2 days with and 2 without a tag, each with a night bloating score. {tags.scored} scored day{tags.scored === 1 ? '' : 's'} so far.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr><th style={th}>Tag</th><th style={thNum}>Days</th><th style={thNum}>With</th><th style={thNum}>Without</th><th style={thNum}>Gap</th></tr>
            </thead>
            <tbody>
              {tags.rows.map((r) => {
                const hot = r.gap >= 1;
                return (
                  <tr key={r.tag} style={{ background: hot ? 'rgba(198, 169, 108, 0.22)' : undefined }}>
                    <td style={{ ...td, fontWeight: hot ? 600 : 400 }}>{r.label}</td>
                    <td style={tdNum}>{r.daysWith}</td>
                    <td style={tdNum}>{one(r.avgWith)}</td>
                    <td style={tdNum}>{one(r.avgWithout)}</td>
                    <td style={{ ...tdNum, fontWeight: hot ? 700 : 400 }}>{signed(r.gap)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ ...s.small, margin: '10px 0 0' }}>
        Associations, not causes. Average night bloating on days with the tag vs without. A gap can be coincidence, so treat it as something to test, not a verdict.
      </p>
    </div>
  );
}

function ShareCard({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('manual'); // clipboard blocked: show the text so it can be selected
    }
  };
  return (
    <div>
      <p style={{ ...s.small, margin: '0 0 12px', fontSize: 14 }}>Plain text of the last 14 days, ready to paste into a message or bring to an appointment.</p>
      <button type="button" onClick={copy} style={{ ...s.button, minHeight: 48, width: '100%' }}>
        {state === 'copied' ? 'Copied' : 'Copy 14-day summary for my doctor'}
      </button>
      {state === 'manual' && (
        <div style={{ marginTop: 12 }}>
          <p style={{ ...s.small, margin: '0 0 6px' }}>Couldn’t copy automatically. Select all and copy:</p>
          <textarea readOnly value={text} rows={10} onFocus={(e) => e.currentTarget.select()} style={{ ...s.input, fontFamily: 'ui-monospace, monospace', fontSize: 13 }} />
        </div>
      )}
    </div>
  );
}

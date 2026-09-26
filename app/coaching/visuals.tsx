import type { Answers, Row } from './types';
import { c, font } from './ui';

const listOf = (v: Answers[string] | undefined) =>
  Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

// Four overlapping circles filled from the Ikigai answers; the one-line statement sits in the middle.
export function IkigaiVisual({ answers }: { answers: Answers }) {
  const circles = [
    { id: 'love', label: 'Love', cx: 200, cy: 130 },
    { id: 'good', label: 'Great at', cx: 130, cy: 200 },
    { id: 'need', label: 'World needs', cx: 270, cy: 200 },
    { id: 'paid', label: 'Paid for', cx: 200, cy: 270 },
  ];
  const labelPos: Record<string, { x: number; y: number; anchor: 'middle' | 'start' | 'end' }> = {
    love: { x: 200, y: 62, anchor: 'middle' },
    good: { x: 54, y: 204, anchor: 'start' },
    need: { x: 346, y: 204, anchor: 'end' },
    paid: { x: 200, y: 346, anchor: 'middle' },
  };
  const statement = typeof answers.statement === 'string' ? answers.statement.trim() : '';

  return (
    <figure style={{ margin: '2rem 0' }}>
      <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }} role="img" aria-label="Your Ikigai">
        {circles.map((ci) => (
          <circle key={ci.id} cx={ci.cx} cy={ci.cy} r={100} fill={c.gold} fillOpacity={0.09} stroke={c.gold} strokeWidth={1} />
        ))}
        {circles.map((ci) => {
          const p = labelPos[ci.id];
          const items = listOf(answers[ci.id]).slice(0, 3);
          return (
            <g key={ci.id} fontFamily={font}>
              <text x={p.x} y={p.y} textAnchor={p.anchor} fontSize={11} fontWeight={600} fill={c.goldDeep} letterSpacing="0.6">
                {ci.label.toUpperCase()}
              </text>
              {items.length === 0 && (
                <text x={p.x} y={p.y + 15} textAnchor={p.anchor} fontSize={10.5} fill={c.muted} fontStyle="italic">your answers here</text>
              )}
              {items.map((it, i) => (
                <text key={i} x={p.x} y={p.y + 15 + i * 13} textAnchor={p.anchor} fontSize={10.5} fill={c.ink}>
                  {it.length > 19 ? it.slice(0, 18) + '…' : it}
                </text>
              ))}
            </g>
          );
        })}
        <foreignObject x={160} y={165} width={80} height={70}>
          <div style={{ fontFamily: font, fontSize: 9.5, lineHeight: 1.2, textAlign: 'center', color: c.ink, fontWeight: 600, height: 70, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {statement || 'Your Ikigai'}
          </div>
        </foreignObject>
      </svg>
      <figcaption style={{ textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 8 }}>
        This draws itself as you fill in the four lists. Nothing to design.
      </figcaption>
    </figure>
  );
}

// Horizontal bars for 1–10 scale answers, lowest scores flagged so the weak spots jump out.
export function WheelVisual({ answers, fields }: { answers: Answers; fields: { id: string; label: string }[] }) {
  const scored = fields.filter((f) => typeof answers[f.id] === 'number');
  if (scored.length === 0) return null;
  const min = Math.min(...scored.map((f) => answers[f.id] as number));
  return (
    <figure style={{ margin: '2rem 0' }} aria-label="Your scores">
      {fields.map((f) => {
        const v = typeof answers[f.id] === 'number' ? (answers[f.id] as number) : 0;
        const low = v > 0 && v === min;
        return (
          <div key={f.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 38%) 1fr 24px', gap: 10, alignItems: 'center', margin: '7px 0', fontSize: 13 }}>
            <span style={{ color: low ? c.alert : c.ink }}>{f.label}</span>
            <span style={{ height: 6, background: c.line, borderRadius: 3, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${v * 10}%`, background: low ? c.alert : c.gold, borderRadius: 3 }} />
            </span>
            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: v ? c.ink : c.muted }}>{v || '–'}</span>
          </div>
        );
      })}
    </figure>
  );
}

const RECLAIM = ['Delegate', 'Automate', 'Drop'];
const GREEN = '#5a7340';
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

// The Energy Audit's payoff: where the week actually goes, and how much of it you're taking back.
// Mirrors the original spreadsheet math: impact = weekly hours × energy rating (−3…+3).
export function EnergySummary({ answers }: { answers: Answers }) {
  const rows = (Array.isArray(answers.tasks) ? (answers.tasks as unknown[]) : []).filter(
    (r): r is Row => typeof r === 'object' && r !== null
  );
  const scored = rows
    .map((r) => ({
      task: typeof r.task === 'string' ? r.task.trim() : '',
      hours: typeof r.hours === 'number' ? r.hours : 0,
      energy: typeof r.energy === 'number' ? r.energy : null,
      action: typeof r.action === 'string' ? r.action : '',
    }))
    .filter((r) => r.task && r.hours > 0 && r.energy !== null) as { task: string; hours: number; energy: number; action: string }[];

  if (scored.length === 0) {
    return (
      <p style={{ fontSize: 13, color: c.muted, margin: '2rem 0', textAlign: 'center' }}>
        Add hours and an energy rating to a few tasks and your summary shows up here.
      </p>
    );
  }

  const total = scored.reduce((a, r) => a + r.hours, 0);
  const drain = scored.filter((r) => r.energy < 0).reduce((a, r) => a + r.hours, 0);
  const fuel = scored.filter((r) => r.energy > 0).reduce((a, r) => a + r.hours, 0);
  const neutral = total - drain - fuel;
  const reclaim = scored.filter((r) => r.energy < 0 && RECLAIM.includes(r.action)).reduce((a, r) => a + r.hours, 0);
  const worst = [...scored].filter((r) => r.energy < 0).sort((a, b) => a.hours * a.energy - b.hours * b.energy).slice(0, 3);

  const maxImpact = Math.max(...scored.map((r) => Math.abs(r.hours * r.energy)), 0);

  const stat = (n: string, label: string, color: string = c.ink) => (
    <div>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.8px', color, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
      <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.35 }}>{label}</div>
    </div>
  );

  return (
    <figure style={{ margin: '2.5rem 0', padding: '20px 18px', background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 6 }} aria-label="Your energy summary">
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: c.muted, margin: '0 0 14px' }}>Your week, by energy</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {stat(fmt(total), 'hours a week you mapped')}
        {stat(fmt(drain), 'hours draining you', drain > 0 ? c.alert : c.ink)}
        {stat(fmt(reclaim), 'hours you’re taking back', reclaim > 0 ? GREEN : c.ink)}
      </div>

      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', margin: '18px 0 6px', background: c.line }} aria-hidden>
        <span style={{ width: `${(fuel / total) * 100}%`, background: GREEN }} />
        <span style={{ width: `${(neutral / total) * 100}%`, background: '#d9d2c3' }} />
        <span style={{ width: `${(drain / total) * 100}%`, background: c.alert }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.muted }}>
        <span>Fuels you {Math.round((fuel / total) * 100)}%</span>
        <span>Drains you {Math.round((drain / total) * 100)}%</span>
      </div>

      <div style={{ marginTop: 22 }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>Your energy map</p>
        <p style={{ fontSize: 12, color: c.muted, margin: '0 0 10px' }}>Longer bar = bigger effect on your week (hours × rating).</p>
        {[...scored].sort((a, b) => b.hours * b.energy - a.hours * a.energy).map((r) => {
          const impact = r.hours * r.energy;
          const w = maxImpact ? (Math.abs(impact) / maxImpact) * 50 : 0;
          return (
            <div key={r.task} style={{ margin: '0 0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, marginBottom: 3 }}>
                <span>{r.task}</span>
                <span style={{ color: impact < 0 ? c.alert : impact > 0 ? GREEN : c.muted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {impact > 0 ? '+' : ''}{fmt(impact)}
                </span>
              </div>
              <div style={{ position: 'relative', height: 8, background: '#efebe3', borderRadius: 4 }}>
                <span style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: '#cfc7b8' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    borderRadius: 4,
                    background: impact < 0 ? c.alert : GREEN,
                    left: impact < 0 ? `${50 - w}%` : '50%',
                    width: `${w}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.muted, marginTop: 2 }}>
          <span>← drains you</span>
          <span>fuels you →</span>
        </div>
      </div>

      {worst.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>Biggest drains</p>
          {worst.map((r) => (
            <div key={r.task} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '5px 0', borderTop: `0.5px solid ${c.line}` }}>
              <span>{r.task}</span>
              <span style={{ whiteSpace: 'nowrap', color: r.action ? c.ink : c.alert }}>{r.action || 'No decision yet'}</span>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}

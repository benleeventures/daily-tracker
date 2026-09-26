import type { Answers } from './types';
import { c, font } from './ui';

const listOf = (v: Answers[string] | undefined) => (Array.isArray(v) ? v.filter((x) => x && x.trim()) : []);

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
              {items.map((it, i) => (
                <text key={i} x={p.x} y={p.y + 15 + i * 13} textAnchor={p.anchor} fontSize={10.5} fill={c.ink}>
                  {it.length > 22 ? it.slice(0, 21) + '…' : it}
                </text>
              ))}
            </g>
          );
        })}
        <foreignObject x={150} y={170} width={100} height={60}>
          <div style={{ fontFamily: font, fontSize: 10.5, lineHeight: 1.25, textAlign: 'center', color: c.ink, fontWeight: 600, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {statement || 'Ikigai'}
          </div>
        </foreignObject>
      </svg>
      <figcaption style={{ textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 8 }}>
        Fills in from your answers.
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

'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { c, s } from '../coaching/ui';

// Line-art teaching diagrams in the site palette. All optional, all behind a "Show me" tap.

export type VisualKind = 'breath' | 'ujjayi' | 'bhramari' | 'posture' | 'prostration';

const stroke = { fill: 'none', stroke: c.ink, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const gold = { fill: 'none', stroke: c.gold, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const label: CSSProperties = { fontSize: 11, fill: c.muted, fontFamily: 'inherit' };

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Frame({ caption, children, h = 280 }: { caption: string; children: React.ReactNode; h?: number }) {
  return (
    <figure style={{ margin: '1rem 0', padding: '1rem', background: c.paper, border: `0.5px solid ${c.line}`, borderRadius: 4 }}>
      <svg viewBox={`0 0 280 ${h}`} role="img" aria-label={caption} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
        {children}
      </svg>
      <figcaption style={{ ...s.small, textAlign: 'center', marginTop: 8 }}>{caption}</figcaption>
    </figure>
  );
}

// Side view, facing right. `full` = lungs filled: the diaphragm drops and flattens, the belly rises.
export function DiaphragmBreath({ full, secs = 4 }: { full: boolean; secs?: number }) {
  const t = reduced() ? '0s' : `${secs}s`;
  const move = (origin: string): CSSProperties => ({ transition: `transform ${t} ease-in-out`, transformBox: 'fill-box', transformOrigin: origin });
  return (
    <Frame caption={full ? 'Breathing in: the diaphragm drops and flattens. The belly rises.' : 'Breathing out: the diaphragm rises and relaxes. The belly softens.'}>
      {/* head, neck, back and front of the torso */}
      <circle cx="120" cy="30" r="17" {...stroke} />
      <path d="M112 47 C 96 62 88 100 90 150 C 90 190 92 230 94 262" {...stroke} />
      <path d="M136 47 C 164 56 176 88 172 130 C 170 150 168 160 166 172" {...stroke} />
      {/* lungs, drawn tall; the dome below hides their lower edge */}
      <g style={{ ...move('50% 0%'), transform: full ? 'scaleY(1.1)' : 'scaleY(1)' }}>
        <path d="M110 80 C 100 84 98 132 102 166 Q 133 182 164 166 C 168 130 162 86 146 78 C 134 72 118 74 110 80Z" {...stroke} fill={c.line} fillOpacity={0.6} strokeWidth={1} />
      </g>
      {/* the diaphragm: a dome that pushes up into the lungs, then flattens as you breathe in */}
      <g style={{ ...move('50% 100%'), transform: full ? 'scaleY(0.22)' : 'scaleY(1)' }}>
        <path d="M91 176 A 40 46 0 0 1 169 176 Z" fill={c.paper} stroke="none" />
        <path d="M91 176 A 40 46 0 0 1 169 176" {...gold} strokeWidth={2.25} />
      </g>
      {/* the vagus nerve, running down the neck to the diaphragm */}
      <path d="M126 46 C 128 80 122 124 128 150" {...gold} strokeDasharray="3 4" />
      {/* belly: the front wall bulges out as the diaphragm drops */}
      <g style={{ ...move('0% 50%'), transform: full ? 'scaleX(2.4)' : 'scaleX(1)' }}>
        <path d="M166 172 C 178 192 178 232 166 252" {...stroke} />
      </g>
      <text x="196" y="108" style={label}>Lungs</text>
      <text x="196" y="156" style={{ ...label, fill: c.goldDeep }}>Diaphragm</text>
      <text x="204" y="218" style={label}>Belly</text>
      <text x="6" y="100" style={{ ...label, fill: c.goldDeep }}>Vagus nerve</text>
      <path d="M72 97 C 90 96 108 98 124 100" {...gold} strokeWidth={0.75} />
    </Frame>
  );
}

// Side view of the head and throat, facing right.
export function HeadDiagram({ mode, secs = 5 }: { mode: 'ujjayi' | 'bhramari'; secs?: number }) {
  const ujj = mode === 'ujjayi';
  const t = reduced() ? '0s' : `${secs}s`;
  return (
    <Frame
      caption={
        ujj
          ? 'Ujjayi: breathe through the nose, and gently narrow the back of the throat, like fogging a mirror with your mouth closed. You hear a soft ocean sound.'
          : 'Bhramari: lips closed, a steady hum on the exhale. Feel the vibration in your skull and the back of your face.'
      }
    >
      {/* skull, face, jaw, neck */}
      <path d="M70 130 C 66 60 110 24 160 40 C 200 54 206 92 198 112 L 220 138 L 200 144 C 202 164 190 182 168 188 L 168 270" {...stroke} />
      <path d="M92 188 C 86 170 76 160 70 130" {...stroke} />
      <path d="M92 188 L 94 270" {...stroke} />
      {/* airway: nostril -> back of throat -> windpipe */}
      <path
        d="M212 128 C 186 124 150 128 132 150 L 132 268"
        {...gold}
        strokeDasharray={ujj ? '0' : '3 4'}
        style={ujj ? { strokeDasharray: '4 5', animation: reduced() ? 'none' : `practiceflow ${t} linear infinite` } : undefined}
      />
      {ujj ? (
        <>
          {/* the soft narrowing at the throat */}
          <path d="M120 190 Q 132 198 144 190" {...stroke} strokeWidth={2} />
          <path d="M120 206 Q 132 198 144 206" {...stroke} strokeWidth={2} />
          <text x="150" y="203" style={{ ...label, fill: c.goldDeep }}>soft narrowing</text>
          <text x="204" y="124" style={label} textAnchor="end">nose in</text>
          <path d="M86 150 q-8 -6 0 -12 q8 -6 0 -12" {...gold} strokeWidth={1} />
        </>
      ) : (
        <>
          {/* closed lips + hum waves inside the skull */}
          <path d="M200 150 L 214 150" {...stroke} strokeWidth={2.5} />
          <circle cx="126" cy="100" r="14" {...gold} strokeWidth={1} opacity={0.9} />
          <circle cx="126" cy="100" r="28" {...gold} strokeWidth={1} opacity={0.6} />
          <circle cx="126" cy="100" r="42" {...gold} strokeWidth={1} opacity={0.35} />
          <text x="126" y="104" textAnchor="middle" style={{ ...label, fill: c.goldDeep }}>mmm</text>
          <text x="196" y="170" style={label} textAnchor="end">lips closed</text>
        </>
      )}
      <style>{`@keyframes practiceflow { to { stroke-dashoffset: -18; } }`}</style>
    </Frame>
  );
}

// Seated side view: stacked vs slouched.
export function Posture() {
  const figure = (x: number, good: boolean) => (
    <g transform={`translate(${x},0)`}>
      <path d="M20 218 L 100 218" {...stroke} strokeWidth={1} />
      {/* cushion */}
      <path d="M44 200 C 44 190 84 190 84 200 L 84 214 L 44 214Z" {...stroke} fill={c.line} fillOpacity={0.7} strokeWidth={1} />
      {/* legs: hips above knees */}
      <path d="M64 192 L 18 206 L 62 212" {...stroke} />
      {good ? (
        <>
          <path d="M64 192 L 64 78" {...stroke} />
          <circle cx="64" cy="58" r="16" {...stroke} />
          <path d="M64 192 L 64 78" {...gold} strokeWidth={0.75} strokeDasharray="2 4" />
        </>
      ) : (
        <>
          <path d="M64 192 C 50 150 52 112 76 88" {...stroke} />
          <circle cx="86" cy="72" r="16" {...stroke} />
          <path d="M72 140 C 82 150 82 168 74 176" {...stroke} stroke={c.alert} strokeWidth={1.25} strokeDasharray="2 3" />
        </>
      )}
    </g>
  );
  return (
    <Frame caption="Spine upright, not rigid. Hips above knees. Slouching squeezes the diaphragm, so the breath stays shallow." h={250}>
      {figure(0, true)}
      {figure(130, false)}
      <text x="64" y="244" textAnchor="middle" style={{ ...label, fill: c.goldDeep }}>Easy and tall</text>
      <text x="194" y="244" textAnchor="middle" style={{ ...label, fill: c.alert }}>Slouched</text>
    </Frame>
  );
}


// Five key moments of the mindful prostration, in Miguel's own vocabulary. Side view, facing right, kneeling on the floor.
type Pt = readonly [number, number];
const POSES: { name: string; note: string; hip: Pt; sh: Pt; head: Pt; elbow: Pt; hand: Pt }[] = [
  { name: 'Sitting', note: 'Kneel upright, hands joined at the chest. Feel the contact with the floor.', hip: [78, 186], sh: [82, 112], head: [84, 88], elbow: [98, 142], hand: [106, 122] },
  { name: 'Bending', note: 'Fold forward slowly from the hips. Hands begin to travel down.', hip: [82, 178], sh: [114, 130], head: [134, 118], elbow: [136, 160], hand: [150, 176] },
  { name: 'Lowering', note: 'Hands to the floor at shoulder height, one at a time.', hip: [88, 168], sh: [138, 148], head: [158, 142], elbow: [162, 180], hand: [180, 208] },
  { name: 'Touching', note: 'Forehead to the floor between the hands. Five points touch: forehead, hands, knees. Stay a few seconds and feel the contact.', hip: [98, 160], sh: [148, 178], head: [172, 198], elbow: [180, 196], hand: [204, 208] },
  { name: 'Raising', note: 'Reverse it with the same slowness. Forehead lifts, hands support, back to kneeling, hands to the chest.', hip: [82, 180], sh: [106, 136], head: [124, 116], elbow: [122, 162], hand: [134, 148] },
];

const limb = (...pts: Pt[]) => 'M' + pts.map((q) => q.join(' ')).join(' L ');

export function Prostration() {
  const [i, setI] = useState(0);
  const p = POSES[i];
  const knee: Pt = [138, 208];
  const body = { fill: 'none', stroke: c.ink, strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <>
      <Frame caption={`${i + 1} of ${POSES.length} · ${p.name}. ${p.note}`} h={240}>
        <path d="M24 216 L 256 216" {...stroke} strokeWidth={1} />
        {/* shin and thigh, then spine, then the arm in gold so the hands read clearly */}
        <path d={limb([62, 209], knee, p.hip)} {...body} stroke={c.muted} strokeWidth={7} />
        <path d={limb(p.hip, p.sh)} {...body} />
        <path d={limb(p.sh, p.elbow, p.hand)} {...body} stroke={c.gold} strokeWidth={5} />
        <circle cx={p.head[0]} cy={p.head[1]} r="13" fill={c.paper} stroke={c.ink} strokeWidth={1.5} />
        <text x="24" y="234" style={label}>{p.name}</text>
      </Frame>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button onClick={() => setI((i + POSES.length - 1) % POSES.length)} style={{ ...s.ghost, minHeight: 44, padding: '0 14px' }}>← Back</button>
        <button onClick={() => setI((i + 1) % POSES.length)} style={{ ...s.ghost, minHeight: 44, padding: '0 14px' }}>Next →</button>
      </div>
      <p style={{ ...s.small, textAlign: 'center' }}>Do it three times to begin each sitting. If a thought arises, label it “thinking” and return to the sensation.</p>
    </>
  );
}

// Controlled by the Breathe timer or a class step. `full` + `secs` only matter for the breath diagram.
export function Visual({ kind, full = false, secs = 4 }: { kind: VisualKind; full?: boolean; secs?: number }) {
  if (kind === 'breath') return <DiaphragmBreath full={full} secs={secs} />;
  if (kind === 'ujjayi' || kind === 'bhramari') return <HeadDiagram mode={kind} secs={secs} />;
  if (kind === 'prostration') return <Prostration />;
  return <Posture />;
}

// Slow looping breath for places with no timer (Learn tab, class steps).
export function LoopingBreath() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setFull((f) => !f), 4000);
    return () => clearInterval(id);
  }, []);
  return <DiaphragmBreath full={full} secs={4} />;
}

export function ShowMe({ kind }: { kind: VisualKind }) {
  const [on, setOn] = useState(false);
  return (
    <div>
      <button onClick={() => setOn(!on)} aria-expanded={on} style={{ ...s.ghost, minHeight: 44 }}>
        {on ? 'Hide' : 'Show me'}
      </button>
      {on && (kind === 'breath' ? <LoopingBreath /> : <Visual kind={kind} />)}
    </div>
  );
}

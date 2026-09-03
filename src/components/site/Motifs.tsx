/**
 * Six persona motifs.
 *
 * Not icons of jobs. Each one is a drawn idea: what the persona's relationship
 * with AI is about. They are procedural SVG so they scale, respond to the
 * persona accent colour, and cost nothing to load.
 *
 * emergence     knowledge becoming capability, lines opening into a field
 * illumination  information becoming learning, one point distributed outward
 * stewardship   two paths under one open arch, joined but not merged
 * systems       judgment at the junction where consequences branch
 * formation     layers crossed vertically, a threshold rather than a door
 * resilience    an operating loop that keeps running when a node is removed
 */

import type { Motif } from '@/content/personas';

const P = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function Emergence({ c }: { c: string }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} {...P} stroke={c} strokeOpacity={0.28 + i * 0.13} strokeWidth={1.1}
          d={`M 14 86 Q ${34 + i * 9} ${66 - i * 9} ${52 + i * 11} ${28 - i * 4}`} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={52 + i * 11} cy={28 - i * 4} r={1.6 + i * 0.5} fill={c} fillOpacity={0.3 + i * 0.16} />
      ))}
      <circle cx={14} cy={86} r={3} fill={c} />
    </>
  );
}

function Illumination({ c }: { c: string }) {
  return (
    <>
      {[13, 24, 35, 46].map((r, i) => (
        <circle key={r} cx={50} cy={54} r={r} {...P} stroke={c} strokeOpacity={0.4 - i * 0.07} strokeWidth={1} />
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line key={a} x1={50 + Math.cos(rad) * 15} y1={54 + Math.sin(rad) * 15}
            x2={50 + Math.cos(rad) * 47} y2={54 + Math.sin(rad) * 47}
            stroke={c} strokeOpacity={0.2} strokeWidth={0.9} />
        );
      })}
      <circle cx={50} cy={54} r={5} fill={c} fillOpacity={0.9} />
    </>
  );
}

function Stewardship({ c }: { c: string }) {
  return (
    <>
      <path {...P} stroke={c} strokeOpacity={0.55} strokeWidth={1.2} d="M 8 84 Q 50 6 92 84" />
      <path {...P} stroke={c} strokeOpacity={0.85} strokeWidth={1.6} d="M 36 92 Q 40 62 33 34" />
      <path {...P} stroke={c} strokeOpacity={0.5} strokeWidth={1.6} d="M 64 92 Q 60 62 67 34" />
      <circle cx={33} cy={34} r={3.2} fill={c} />
      <circle cx={67} cy={34} r={3.2} fill={c} fillOpacity={0.5} />
      <line x1={20} y1={92} x2={80} y2={92} stroke={c} strokeOpacity={0.2} strokeWidth={1} />
    </>
  );
}

function Systems({ c }: { c: string }) {
  return (
    <>
      <path {...P} stroke={c} strokeOpacity={0.85} strokeWidth={1.7} d="M 12 90 Q 34 74 48 52" />
      {[[86, 16], [92, 40], [78, 64]].map(([x, y], i) => (
        <path key={i} {...P} stroke={c} strokeOpacity={0.42 - i * 0.08} strokeWidth={1.1}
          d={`M 48 52 Q ${60 + i * 4} ${44 - i * 6} ${x} ${y}`} />
      ))}
      {[[86, 16], [92, 40], [78, 64]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} fill={c} fillOpacity={0.45 - i * 0.1} />
      ))}
      <circle cx={48} cy={52} r={6} {...P} stroke={c} strokeWidth={1.8} />
      <circle cx={48} cy={52} r={2.2} fill={c} />
    </>
  );
}

function Formation({ c }: { c: string }) {
  return (
    <>
      {[26, 40, 54, 68, 82].map((y, i) => (
        <line key={y} x1={16} y1={y} x2={84} y2={y} stroke={c} strokeOpacity={0.16 + i * 0.05} strokeWidth={1} />
      ))}
      <line x1={50} y1={12} x2={50} y2={94} stroke={c} strokeOpacity={0.8} strokeWidth={1.6} />
      <circle cx={50} cy={54} r={7} {...P} stroke={c} strokeWidth={1.2} strokeOpacity={0.7} />
      <circle cx={50} cy={54} r={2.4} fill={c} />
    </>
  );
}

function Resilience({ c }: { c: string }) {
  const nodes: Array<[number, number]> = [[50, 16], [82, 38], [70, 78], [30, 78], [18, 38]];
  return (
    <>
      <circle cx={50} cy={53} r={37} {...P} stroke={c} strokeOpacity={0.3} strokeWidth={1}
        strokeDasharray="3 5" />
      {nodes.map(([x, y], i) => {
        const [nx, ny] = nodes[(i + 1) % nodes.length];
        return <line key={i} x1={x} y1={y} x2={nx} y2={ny} stroke={c}
          strokeOpacity={i === 2 ? 0.16 : 0.5} strokeWidth={1.2} />;
      })}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 3 ? 5 : 3.4} fill={i === 3 ? 'none' : c}
          fillOpacity={0.85} stroke={c} strokeWidth={i === 3 ? 1.4 : 0} strokeDasharray={i === 3 ? '2 3' : undefined} />
      ))}
    </>
  );
}

/** Many small calls, and a hand kept on them. */
function Judgment({ c }: { c: string }) {
  const pts: Array<[number, number]> = [[26, 30], [50, 22], [74, 32], [80, 56], [62, 74], [36, 72], [22, 54]];
  return (
    <>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4.6 : 3.2} fill="none"
          stroke={c} strokeOpacity={0.4 + (i % 3) * 0.16} strokeWidth={1.5} />
      ))}
      {pts.map(([x, y], i) => (
        <line key={`l${i}`} x1={50} y1={50} x2={x} y2={y} stroke={c} strokeOpacity={0.18} strokeWidth={1} />
      ))}
      <circle cx={50} cy={50} r={12} fill="none" stroke={c} strokeWidth={1.8} />
      <circle cx={50} cy={50} r={4} fill={c} />
    </>
  );
}

const SHAPES: Record<Motif, (p: { c: string }) => React.JSX.Element> = {
  emergence: Emergence, illumination: Illumination, stewardship: Stewardship,
  systems: Systems, formation: Formation, resilience: Resilience, judgment: Judgment,
};

export default function MotifMark({ motif, color = 'currentColor', size = 100 }: {
  motif: Motif; color?: string; size?: number;
}) {
  const Shape = SHAPES[motif];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <Shape c={color} />
    </svg>
  );
}

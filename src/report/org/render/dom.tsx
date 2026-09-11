/**
 * The same Scene, drawn into the page. No chart logic lives here either.
 *
 * The two renderers exist so that the printed chart and the web chart are the
 * same geometry rather than two implementations that agree today.
 */
import React from 'react';
import { C, type Prim, type Scene } from '../scene';

const family = (p: Extract<Prim, { k: 'text' }>) =>
  p.mono ? 'var(--mono, ui-monospace, monospace)'
    : p.serif ? 'var(--serif, Georgia, serif)'
    : 'var(--sans, system-ui, sans-serif)';

function draw(p: Prim, i: number): React.ReactElement | null {
  switch (p.k) {
    case 'rect':
      return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r ?? 0}
        fill={p.fill ?? 'none'} stroke={p.stroke} strokeWidth={p.strokeWidth}
        fillOpacity={p.opacity} />;
    case 'line':
      return <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
        stroke={p.stroke} strokeWidth={p.strokeWidth ?? 1}
        strokeDasharray={p.dash} strokeOpacity={p.opacity} />;
    case 'circle':
      return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill ?? 'none'}
        stroke={p.stroke} strokeWidth={p.strokeWidth} fillOpacity={p.opacity} />;
    case 'path':
      return <path key={i} d={p.d} fill={p.fill ?? 'none'} stroke={p.stroke}
        strokeWidth={p.strokeWidth} fillOpacity={p.opacity} />;
    case 'text':
      return <text key={i} x={p.x} y={p.y} fill={p.fill ?? C.ink}
        fontSize={p.size} fontFamily={family(p)} fontWeight={p.weight}
        textAnchor={p.anchor ?? 'start'}>{p.text}</text>;
    case 'callout':
      return (
        <g key={i}>
          <line x1={p.x} y1={p.y} x2={p.toX} y2={p.toY} stroke={C.mute} strokeWidth={0.6} />
          <circle cx={p.toX} cy={p.toY} r={1.4} fill={C.mute} />
          <text x={p.x} y={p.y - 3} fill={C.mute} fontSize={7.2}
            fontFamily="var(--sans, system-ui, sans-serif)"
            textAnchor={p.anchor ?? 'start'}>{p.text}</text>
        </g>
      );
    default:
      return null;
  }
}

export const SceneSvg = ({ scene }: { scene: Scene }) => (
  <svg width="100%" viewBox={`0 0 ${scene.w} ${scene.h}`} role="img" aria-label={scene.alt}
    style={{ display: 'block', maxWidth: '100%', height: 'auto' }}>
    {scene.prims.map(draw)}
  </svg>
);

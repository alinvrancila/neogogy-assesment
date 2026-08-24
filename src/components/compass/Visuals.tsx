'use client';

/**
 * Formation Compass v2 visuals.
 *
 * Three pieces, all driven straight from a CompassResult and none of them
 * computing anything the engine has not already decided:
 *   ContinuumStrip  the ten stage ramp with the continuous index marker,
 *                   the borderline zone, and the gate marker
 *   DimensionRadar  ten dimensions, dependencySafety shown as Dependency Risk
 *   NextStagePanel  current position to next target, or the maintenance loop
 *
 * Brand: Deep Navy ground, a single Electric Teal accent, hairline rules,
 * generous whitespace, no heavy fills.
 */

import type { CompassResult, ConstructId } from '@/engine';
import { CONSTRUCTS, STAGES } from '@/engine/config';

const NAVY = '#1B2A4A';
const TEAL = '#00D4AA';
const HAIR = 'rgba(242, 232, 220, 0.22)';
const INK = '#F2E8DC';
const MUTE = 'rgba(242, 232, 220, 0.62)';

/* ------------------------------------------------------- continuum strip */

export function ContinuumStrip({ result }: { result: CompassResult }) {
  const W = 900;
  const H = 190;
  const padX = 34;
  const trackY = 96;
  const trackW = W - padX * 2;

  const xOf = (index: number) => padX + (Math.max(0, Math.min(100, index)) / 100) * trackW;

  const marker = xOf(result.stage.rawIndex);
  const bl = result.stage.borderline;
  const gated = result.stage.gated;

  // The borderline zone straddles the boundary the respondent is near.
  let zone: { x1: number; x2: number } | null = null;
  if (bl) {
    const boundaryStage = Math.max(result.stage.stage, bl.adjacentStage);
    const def = STAGES.find((s) => s.stage === boundaryStage);
    if (def) {
      const b = xOf(def.minIndex);
      const half = (bl.distance / 100) * trackW + 10;
      zone = { x1: b - half, x2: b + half };
    }
  }

  return (
    <figure className="viz" aria-label={`Stage ${result.stage.stage} of 10, ${result.stage.stageName}`}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        <rect x={0} y={0} width={W} height={H} fill={NAVY} rx={12} />

        {/* borderline zone sits under the track */}
        {zone && (
          <rect
            x={zone.x1} y={trackY - 16} width={Math.max(6, zone.x2 - zone.x1)} height={32}
            fill={TEAL} opacity={0.14} rx={4}
          />
        )}

        {/* hairline track */}
        <line x1={padX} y1={trackY} x2={W - padX} y2={trackY} stroke={HAIR} strokeWidth={1} />

        {/* stage ticks */}
        {STAGES.map((s) => {
          const x = xOf(s.minIndex);
          const here = s.stage === result.stage.stage;
          return (
            <g key={s.stage}>
              <line x1={x} y1={trackY - 7} x2={x} y2={trackY + 7} stroke={here ? TEAL : HAIR} strokeWidth={1} />
              <text x={x} y={trackY + 24} textAnchor="middle" fontSize={10} fill={here ? TEAL : MUTE} fontFamily="var(--f-mono)">
                {s.stage}
              </text>
            </g>
          );
        })}

        {/* the earned position, when gating pulled the placement down */}
        {gated && (
          <g>
            <line x1={xOf(result.stage.rawIndex)} y1={trackY - 30} x2={marker} y2={trackY - 30}
              stroke={HAIR} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={xOf(result.stage.rawIndex)} cy={trackY - 30} r={3.5} fill="none" stroke={MUTE} strokeWidth={1} />
            <text x={xOf(result.stage.rawIndex)} y={trackY - 40} textAnchor="middle" fontSize={9.5} fill={MUTE} fontFamily="var(--f-mono)">
              index {result.stage.rawIndex} would reach stage {gated.cappedFrom}
            </text>
          </g>
        )}

        {/* position marker */}
        <g>
          <line x1={marker} y1={trackY - 20} x2={marker} y2={trackY + 12} stroke={TEAL} strokeWidth={1.5} />
          <circle cx={marker} cy={trackY} r={5} fill={TEAL} />
          <text x={marker} y={trackY - 27} textAnchor="middle" fontSize={11} fill={INK} fontFamily="var(--f-mono)">
            {result.stage.rawIndex}
          </text>
        </g>

        {/* labels */}
        <text x={padX} y={30} fontSize={11} fill={MUTE} fontFamily="var(--f-mono)" letterSpacing="0.12em">
          THE NEOGOGY CONTINUUM
        </text>
        <text x={padX} y={54} fontSize={16} fill={INK} fontFamily="var(--f-serif)">
          Stage {result.stage.stage} of 10, {result.stage.stageName}
        </text>
        <text x={padX} y={72} fontSize={11} fill={TEAL} fontFamily="var(--f-mono)">
          {result.stage.substage}
          {bl ? `  ·  borderline zone, ${bl.distance} points from stage ${bl.adjacentStage}` : ''}
        </text>

        {gated && (
          <text x={padX} y={H - 16} fontSize={10.5} fill={MUTE} fontFamily="var(--f-mono)">
            Held at stage {result.stage.stage}: {gated.reasons[0]}
          </text>
        )}
      </svg>
    </figure>
  );
}

/* --------------------------------------------------------------- radar */

export function DimensionRadar({ result }: { result: CompassResult }) {
  const ids = Object.keys(CONSTRUCTS) as ConstructId[];
  const S = 420;
  const c = S / 2;
  const R = 140;
  const n = ids.length;

  const pt = (i: number, radius: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * radius, c + Math.sin(a) * radius] as const;
  };

  // Plotted on the reported scale, so Dependency Risk is drawn as the risk value.
  const valueOf = (id: ConstructId) => {
    const d = result.dimensions[id];
    return CONSTRUCTS[id].reportedAsRisk ? d.reportedScore : d.score;
  };

  const poly = ids.map((id, i) => pt(i, (valueOf(id) / 100) * R).join(',')).join(' ');

  return (
    <figure className="viz" aria-label="Your ten dimensions">
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" role="img">
        <rect x={0} y={0} width={S} height={S} fill={NAVY} rx={12} />
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={ids.map((_, i) => pt(i, R * f).join(',')).join(' ')}
            fill="none" stroke={HAIR} strokeWidth={1}
          />
        ))}
        {ids.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke={HAIR} strokeWidth={1} />;
        })}
        <polygon points={poly} fill={TEAL} fillOpacity={0.16} stroke={TEAL} strokeWidth={1.5} />
        {ids.map((id, i) => {
          const [x, y] = pt(i, (valueOf(id) / 100) * R);
          return <circle key={id} cx={x} cy={y} r={3} fill={TEAL} />;
        })}
        {ids.map((id, i) => {
          const [x, y] = pt(i, R + 26);
          const def = CONSTRUCTS[id];
          return (
            <text
              key={id} x={x} y={y} textAnchor="middle" fontSize={9} fill={MUTE}
              fontFamily="var(--f-mono)"
            >
              {(def.reportedAsRisk ? 'Dependency Risk' : def.name).slice(0, 20)} {valueOf(id)}
            </text>
          );
        })}
      </svg>
      <figcaption className="viz-cap">
        Dependency Risk is plotted as risk, so lower is healthier on that spoke. Every other
        dimension is plotted so higher is healthier.
      </figcaption>
    </figure>
  );
}

/* ---------------------------------------------------- next stage panel */

export function NextStagePanel({ result }: { result: CompassResult }) {
  const atTop = result.nextTarget.stage === result.stage.stage;
  return (
    <div className="nextstage">
      <div className="ns-row">
        <div className="ns-node">
          <div className="ns-lab">Now</div>
          <div className="ns-name">Stage {result.stage.stage}, {result.stage.stageName}</div>
          <div className="ns-sub">{result.stage.substage} · index {result.stage.rawIndex}</div>
        </div>
        <div className="ns-arrow" aria-hidden="true">{atTop ? '↻' : '→'}</div>
        <div className="ns-node ns-target">
          <div className="ns-lab">{atTop ? 'Maintaining' : 'Next'}</div>
          <div className="ns-name">Stage {result.nextTarget.stage}, {result.nextTarget.stageName}</div>
          <div className="ns-sub">{atTop ? 'the loop that keeps it' : 'what it asks of you'}</div>
        </div>
      </div>
      <ul className="md-list">
        {result.nextTarget.requirements.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  );
}

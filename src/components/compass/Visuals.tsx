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

import Image from 'next/image';
import type { CSSProperties } from 'react';
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

/** Short labels for the radar, so spokes never truncate mid-word. */
const RADAR_LABEL: Record<string, string> = {
  fluency: 'Fluency',
  agency: 'Agency',
  amplification: 'Amplification',
  dependencySafety: 'Dependency Risk',
  verification: 'Verification',
  skillGrowth: 'Skill Growth',
  creativity: 'Creativity',
  responsibleUse: 'Responsible Use',
  transfer: 'Transfer',
  adaptability: 'Adaptability',
};

export function DimensionRadar({ result }: { result: CompassResult }) {
  const ids = Object.keys(CONSTRUCTS) as ConstructId[];
  const S = 440;
  const c = S / 2;
  const R = 138;
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
          return (
            <text
              key={id} x={x} y={y} textAnchor="middle" fontSize={9} fill={MUTE}
              fontFamily="var(--f-mono)"
            >
              {RADAR_LABEL[id]} {valueOf(id)}
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

/* ------------------------------------------------------- brand and preview */

/** ICAN brand mark, carried over from v1 unchanged. */
export function IcanLogo({ height = 46, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/ican-logo.png"
      alt="ICAN.ph, International Center for Applied Neogogy"
      width={1039}
      height={740}
      className={className}
      style={{ '--ican-logo-height': `${height}px` } as CSSProperties}
      priority
    />
  );
}

/**
 * Faux report cover for the landing page, so a visitor sees the deliverable.
 * Static illustration with representative numbers, not a computed result.
 */
export function ReportPreview() {
  return (
    <div className="report-preview" aria-hidden="true">
      <div className="rp-page rp-back2" />
      <div className="rp-page rp-back1" />
      <div className="rp-page rp-cover">
        <div className="rp-band">
          <div className="rp-band-eyebrow">The Neogogy Formation Compass</div>
          <div className="rp-band-title">Your Formation Profile</div>
        </div>
        <div className="rp-pad">
          <div className="rp-youare">Your answers are consistent with</div>
          <div className="rp-profile">[YOUR ARCHETYPE]</div>
          <div className="rp-tagline">your personal portrait, revealed inside</div>
          <div className="rp-index">
            <div className="rp-index-top">
              <span className="rp-index-n">72</span>
              <span className="rp-index-lab">Developmental index</span>
            </div>
            <div className="rp-indexbar"><span className="rp-indexmark" style={{ left: '72%' }} /></div>
            <div className="rp-indexends"><span className="de">Stage 1</span><span className="fo">Stage 10</span></div>
          </div>
          <div className="rp-stats">
            <div className="rp-stat"><span>7</span><label>Stage</label></div>
            <div className="rp-stat"><span style={{ color: '#2F6F62' }}>10</span><label>Dimensions</label></div>
            <div className="rp-stat"><span style={{ color: '#00A98A' }}>5</span><label>Next moves</label></div>
          </div>
          <div className="rp-meta"><span>Prepared for you</span><span>www.ican.ph</span></div>
        </div>
      </div>
      <div className="rp-badge">Sample report</div>
    </div>
  );
}

/* ------------------------------------------------- band colour vocabulary */

/** One colour scale, used by every chart so a colour means the same thing
 *  everywhere: healthy, developing, needs attention. */
export const bandColor = (healthy: number): string =>
  healthy >= 65 ? '#00A98A' : healthy >= 40 ? '#C58A33' : '#9E1D20';

export const bandName = (healthy: number): string =>
  healthy >= 65 ? 'strong' : healthy >= 40 ? 'developing' : 'watch';

/* ------------------------------------------------------------ stage ladder */

/**
 * The full continuum, every stage named, occupying roughly half a page so a
 * respondent can see where they sit and what else exists above and below.
 */
export function StageLadder({ result }: { result: CompassResult }) {
  const here = result.stage.stage;
  const target = result.nextTarget.stage;
  const gatedFrom = result.stage.gated?.cappedFrom;

  return (
    <div className="ladder" aria-label={`Stage ${here} of 10 on the Neogogy continuum`}>
      {[...STAGES].reverse().map((s) => {
        const isHere = s.stage === here;
        const isTarget = s.stage === target && target !== here;
        const isEarned = gatedFrom !== undefined && s.stage === gatedFrom;
        const below = s.stage < here;
        const gates = s.gates ? Object.entries(s.gates) : [];
        return (
          <div
            key={s.stage}
            className={`lad-row${isHere ? ' lad-here' : ''}${isTarget ? ' lad-target' : ''}${below ? ' lad-below' : ''}`}
          >
            <div className="lad-num">{s.stage}</div>
            <div className="lad-rail">
              <span className="lad-dot" />
            </div>
            <div className="lad-body">
              <div className="lad-name">
                {s.name}
                {isHere ? <span className="lad-tag lad-tag-here">You are here</span> : null}
                {isTarget ? <span className="lad-tag lad-tag-next">Your next stage</span> : null}
                {isEarned ? <span className="lad-tag lad-tag-earned">Your index reaches here</span> : null}
              </div>
              {(isHere || isTarget) && <div className="lad-short">{s.short}</div>}
              {(isHere || isTarget) && gates.length > 0 && (
                <div className="lad-gates">
                  Requires: {gates.map(([g, v]) => `${CONSTRUCTS[g as ConstructId].name} ${v}`).join(', ')}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="lad-foot">
        Your developmental index is <strong>{result.stage.rawIndex}</strong> of 100
        {result.stage.borderline
          ? `, which sits ${result.stage.borderline.distance} points from stage ${result.stage.borderline.adjacentStage}, so treat this as a zone rather than a line.`
          : `.`}
        {result.stage.gated ? ` Your index alone would reach stage ${result.stage.gated.cappedFrom}, and a gate is holding the placement here.` : ''}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- dimension bars */

export function DimensionBars({ result }: { result: CompassResult }) {
  const ids = Object.keys(CONSTRUCTS) as ConstructId[];
  const rows = ids
    .map((id) => ({ id, d: result.dimensions[id], def: CONSTRUCTS[id] }))
    .sort((a, b) => b.d.score - a.d.score);

  return (
    <div className="bars">
      {rows.map(({ id, d, def }) => {
        const shownValue = def.reportedAsRisk ? d.reportedScore : d.score;
        const color = bandColor(d.score); // colour always follows the healthy reading
        return (
          <div className="bar-row" key={id}>
            <div className="bar-label">
              {def.reportedAsRisk ? 'Dependency Risk' : def.name}
              {d.confidence !== 'high' ? <span className="bar-conf">{d.confidence}</span> : null}
            </div>
            <div className="bar-track">
              <span className="bar-fill" style={{ width: `${Math.max(2, shownValue)}%`, background: color }} />
            </div>
            <div className="bar-val" style={{ color }}>{shownValue}</div>
          </div>
        );
      })}
      <div className="bars-key">
        <span><i style={{ background: '#00A98A' }} /> strong, 65 and above</span>
        <span><i style={{ background: '#C58A33' }} /> developing, 40 to 64</span>
        <span><i style={{ background: '#9E1D20' }} /> watch, below 40</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- composites */

export function CompositesPanel({ result }: { result: CompassResult }) {
  const c = result.composites;
  // For the two risk composites a high number is a concern, so the colour is
  // taken from the inverted value to keep one colour vocabulary.
  const rows: Array<{ label: string; value: number; healthy: number; note: string }> = [
    { label: 'Future readiness', value: c.futureReadiness, healthy: c.futureReadiness, note: 'Fluency, adaptability and transfer' },
    { label: 'Augmentation', value: c.augmentation, healthy: c.augmentation, note: 'Better thinking, not just faster output' },
    { label: 'Judgment', value: c.judgment, healthy: c.judgment, note: 'Verification, agency and responsible use' },
    { label: 'Capability transfer', value: c.capabilityTransfer, healthy: c.capabilityTransfer, note: 'Assisted work becoming your own' },
    { label: 'Dependency index', value: c.dependencyIndex, healthy: 100 - c.dependencyIndex, note: 'Higher means more depends on the tool' },
    { label: 'Underexposure', value: c.underexposure, healthy: 100 - c.underexposure, note: 'Higher means limited practice with the tools' },
  ];
  return (
    <div className="composites">
      {rows.map((r) => (
        <div className="comp-card" key={r.label}>
          <div className="comp-val" style={{ color: bandColor(r.healthy) }}>{r.value}</div>
          <div className="comp-label">{r.label}</div>
          <div className="comp-track">
            <span style={{ width: `${Math.max(2, r.value)}%`, background: bandColor(r.healthy) }} />
          </div>
          <div className="comp-note">{r.note}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------- plan timeline */

export function PlanTimeline({
  blocks
}: { blocks: Array<{ horizon: string; timeframe: string; items: string[] }> }) {
  return (
    <div className="plan">
      {blocks.map((b, i) => (
        <div className="plan-block" key={b.horizon}>
          <div className="plan-head">
            <span className="plan-n">{i + 1}</span>
            <div>
              <div className="plan-horizon">{b.horizon}</div>
              <div className="plan-time">{b.timeframe}</div>
            </div>
          </div>
          <ul className="plan-items">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

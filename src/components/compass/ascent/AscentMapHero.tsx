'use client';

/**
 * The ascent map: five coordinated layers (sky, terrain ridges, contour lines,
 * route path, camps and gates) with the live marker placed continuously.
 *
 * Every label, score and marker position is drawn from data at render time.
 * Nothing here is a baked image, and nothing here computes a score.
 */

import type { CompassResult } from '@/engine';
import { STAGES } from '@/engine/config';
import type { ConstructId } from '@/engine/types';
import {
  VIEW, ROUTE_POINTS, pointAtIndex, routePath, ridgePolygon, contourPaths,
} from './route';

/** Gates that bind on the route, in the language of the climb. */
export const GATE_DEFS: Array<{ construct: ConstructId; label: string; firstStage: number }> = [
  { construct: 'agency', label: 'Authorship', firstStage: 6 },
  { construct: 'verification', label: 'Verification', firstStage: 6 },
  { construct: 'responsibleUse', label: 'Boundaries', firstStage: 7 },
  { construct: 'transfer', label: 'Transfer', firstStage: 8 },
];

const minIndexOf = (stage: number) => STAGES.find((s) => s.stage === stage)?.minIndex ?? 0;

/** Ridge extended past both edges so the terrain never shows a cut seam. */
const EXTENDED = [
  { x: -200, y: ROUTE_POINTS[0].y + 30 },
  ...ROUTE_POINTS,
  { x: VIEW.w + 260, y: ROUTE_POINTS[ROUTE_POINTS.length - 1].y - 40 },
];

export default function AscentMapHero({ result }: { result: CompassResult }) {
  const index = result.stage.rawIndex;
  const here = pointAtIndex(index);
  const nextStage = result.nextTarget.stage;
  const nextAtTop = nextStage === result.stage.stage;
  const nextPt = pointAtIndex(minIndexOf(nextStage));

  const full = routePath();
  const contours = contourPaths(7);

  // Route split into travelled and remaining, using a dash window on a copy of
  // the same path so both halves follow identical geometry.
  const travelledLen = (index / 100);

  return (
    <div className="asc-map-wrap">
      <div className="asc-map-scroll">
        <svg
          className="asc-map"
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          role="img"
          aria-label={
            `Ascent route with ten stages. You are at stage ${result.stage.stage}, ` +
            `${result.stage.stageName}, with a developmental index of ${index} out of 100. ` +
            (nextAtTop
              ? 'You are at the final stage of the route.'
              : `The next stage is ${nextStage}, ${result.nextTarget.stageName}.`)
          }
        >
          <defs>
            <linearGradient id="ascSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--asc-sky-1)" />
              <stop offset="100%" stopColor="var(--asc-sky-2)" />
            </linearGradient>
            <clipPath id="ascClip">
              <rect x="0" y="0" width={VIEW.w} height={VIEW.h} rx="14" />
            </clipPath>
          </defs>

          <g clipPath="url(#ascClip)">
            {/* layer 1: sky */}
            <rect x="0" y="0" width={VIEW.w} height={VIEW.h} fill="url(#ascSky)" />

            {/* layer 3: terrain ridges, far to near */}
            <g aria-hidden="true">
              <polygon points={ridgePolygon(EXTENDED, VIEW.h, -120, 96)} fill="var(--asc-ridge-far)" opacity={0.85} />
              <polygon points={ridgePolygon(EXTENDED, VIEW.h, -58, 54)} fill="var(--asc-ridge-mid)" opacity={0.8} />
              <polygon points={ridgePolygon(EXTENDED, VIEW.h, 0, 14)} fill="var(--asc-ridge-near)" opacity={0.7} />
            </g>

            {/* layer 3b: contour lines, over the terrain so they read as a map */}
            <g aria-hidden="true">
              {contours.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="var(--asc-contour)" strokeWidth={1} opacity={0.5 - i * 0.045} />
              ))}
            </g>

            {/* layer 4: the route, travelled then remaining */}
            <path d={full} fill="none" stroke="var(--asc-border)" strokeWidth={7} strokeLinecap="round" />
            <path
              d={full} fill="none" stroke="var(--asc-teal)" strokeWidth={6} strokeLinecap="round"
              pathLength={1} strokeDasharray={`${travelledLen} ${1 - travelledLen}`}
            />
            <path
              d={full} fill="none" stroke="var(--asc-muted)" strokeWidth={2} strokeLinecap="round"
              pathLength={1} strokeDasharray={`0.006 0.012`} strokeDashoffset={-travelledLen}
              opacity={0.55}
            />

            {/* layer 5: camps, gates and markers */}
            <g>
              {STAGES.map((s) => {
                const p = pointAtIndex(s.minIndex);
                const isHere = s.stage === result.stage.stage;
                const isNext = !nextAtTop && s.stage === nextStage;
                const reached = index >= s.minIndex;
                // Labels sit in two fixed bands at the top with leader lines down
                // to their camp. Anchoring them to the terrain made long names
                // collide wherever the route steepened.
                const band = s.stage % 2 === 1 ? 44 : 92;
                const lx = Math.max(74, Math.min(VIEW.w - 118, p.x));
                return (
                  <g key={s.stage}>
                    <line
                      x1={lx} y1={band + 10} x2={p.x} y2={p.y - 14}
                      stroke="var(--asc-border)" strokeWidth={1} strokeDasharray="2 4"
                    />
                    <text x={lx} y={band - 12} textAnchor="middle"
                      className={`asc-camp-num${isHere ? ' is-here' : ''}`}>
                      {s.stage}
                    </text>
                    <text x={lx} y={band + 6} textAnchor="middle"
                      className={`asc-camp-name${isHere ? ' is-here' : ''}${isNext ? ' is-next' : ''}`}>
                      {s.name}
                    </text>
                    <circle
                      cx={p.x} cy={p.y} r={isHere ? 11 : 7}
                      fill={reached ? 'var(--asc-teal)' : 'var(--asc-card)'}
                      stroke={isNext ? 'var(--asc-teal)' : 'var(--asc-border)'}
                      strokeWidth={isNext ? 2.5 : 1.5}
                    />
                  </g>
                );
              })}

              {/* practice gates, drawn where they first bind */}
              {GATE_DEFS.map((g, gi) => {
                const base = pointAtIndex(minIndexOf(g.firstStage));
                const sameStage = GATE_DEFS.filter((o) => o.firstStage === g.firstStage);
                const slot = sameStage.findIndex((o) => o.construct === g.construct);
                const spread = (slot - (sameStage.length - 1) / 2) * 22;
                const p = { x: base.x + spread, y: base.y };
                return (
                  <g key={`${g.construct}-${gi}`} aria-hidden="true">
                    <line x1={p.x} y1={p.y + 14} x2={p.x} y2={p.y + 44} stroke="var(--asc-gold)" strokeWidth={1.2} />
                    <rect x={p.x - 5} y={p.y + 41} width={10} height={10} fill="var(--asc-gold)" transform={`rotate(45 ${p.x} ${p.y + 46})`} />
                  </g>
                );
              })}

              {/* basecamp */}
              <g aria-hidden="true">
                <text x={ROUTE_POINTS[0].x + 4} y={ROUTE_POINTS[0].y + 34} className="asc-anchor-label">BASECAMP</text>
              </g>

              {/* summit beacon */}
              <g aria-hidden="true">
                <line x1={1150} y1={120} x2={1150} y2={128} stroke="var(--asc-oxblood)" strokeWidth={2} />
                <circle cx={1150} cy={120} r={7} fill="var(--asc-card)" stroke="var(--asc-oxblood)" strokeWidth={2.5} />
                <text x={1150} y={150} textAnchor="middle" className="asc-anchor-label">SUMMIT</text>
              </g>

              {/* next ledge marker */}
              {!nextAtTop && (
                <g>
                  <line x1={nextPt.x} y1={nextPt.y - 12} x2={nextPt.x} y2={nextPt.y - 30}
                    stroke="var(--asc-teal)" strokeWidth={1.2} />
                  <rect
                    x={nextPt.x - 64} y={nextPt.y - 58} width={128} height={28} rx={14}
                    fill="var(--asc-teal-pale)" stroke="var(--asc-teal)" strokeWidth={1}
                  />
                  <text x={nextPt.x} y={nextPt.y - 39} textAnchor="middle" className="asc-next-chip">
                    NEXT LEDGE
                  </text>
                </g>
              )}

              {/* the climber, placed at the exact index */}
              <g>
                <line x1={here.x} y1={here.y} x2={here.x} y2={here.y - 40} stroke="var(--asc-oxblood)" strokeWidth={2} />
                <polygon
                  points={`${here.x},${here.y - 40} ${here.x + 30},${here.y - 33} ${here.x},${here.y - 26}`}
                  fill="var(--asc-oxblood)"
                />
                <circle cx={here.x} cy={here.y} r={14} fill="var(--asc-card)" stroke="var(--asc-oxblood)" strokeWidth={3} />
                <circle cx={here.x} cy={here.y} r={6} fill="var(--asc-oxblood)" />
                <g>
                  <rect
                    x={here.x - 78} y={here.y - 104} width={156} height={30} rx={15}
                    fill="var(--asc-oxblood)"
                  />
                  <text x={here.x} y={here.y - 84} textAnchor="middle" className="asc-here-chip">
                    YOU ARE HERE
                  </text>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* legend, outside the SVG so it stays selectable text */}
      <div className="asc-legend" aria-label="Map legend">
        <span><i className="lg-route" /> Route travelled</span>
        <span><i className="lg-ahead" /> Route ahead</span>
        <span><i className="lg-camp" /> Stage camp</span>
        <span><i className="lg-gate" /> Practice gate</span>
        <span className="asc-legend-note">
          Altitude reflects developmental index, 0 at basecamp to 100 at the summit.
        </span>
      </div>
    </div>
  );
}

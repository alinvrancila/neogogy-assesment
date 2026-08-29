'use client';

/**
 * The ascent map: five coordinated layers (sky, terrain ridges, contour lines,
 * route path, camps and gates) with the live marker placed continuously.
 *
 * Every label, score and marker position is drawn from data at render time.
 * Nothing here is a baked image, and nothing here computes a score.
 */

import type { CompassResult } from '@/engine';
import type { AttemptComparison } from '@/lib/history';
import { STAGES } from '@/engine/config';
import type { ConstructId } from '@/engine/types';
import {
  VIEW, ROUTE_POINTS, pointAtIndex, routePath, contourPaths, routeRidge, GATE_DEFS,
} from './route';

export { GATE_DEFS };

const minIndexOf = (stage: number) => STAGES.find((s) => s.stage === stage)?.minIndex ?? 0;

/** Ridge extended past both edges so the terrain never shows a cut seam. */
export default function AscentMapHero(
  { result, comparison }: { result: CompassResult; comparison?: AttemptComparison | null }
) {
  const index = result.stage.rawIndex;
  const here = pointAtIndex(index);
  // The callout is clamped so it cannot run off the panel at either extreme.
  const calloutX = Math.max(104, Math.min(VIEW.w - 104, here.x));
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
              <stop offset="0%" stopColor="#F7F1E5" />
              <stop offset="55%" stopColor="var(--asc-sky-1)" />
              <stop offset="100%" stopColor="var(--asc-sky-2)" />
            </linearGradient>
            <linearGradient id="ascRockFar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9BEAC" />
              <stop offset="100%" stopColor="#DCD3C3" />
            </linearGradient>
            <linearGradient id="ascRockMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B3A794" />
              <stop offset="100%" stopColor="#C8BDAA" />
            </linearGradient>
            <linearGradient id="ascRockNear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9A8C77" />
              <stop offset="100%" stopColor="#B6A992" />
            </linearGradient>
            <linearGradient id="ascScrim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F7F1E4" stopOpacity="0.92" />
              <stop offset="62%" stopColor="#F7F1E4" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#F7F1E4" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="ascVignette" cx="50%" cy="46%" r="72%">
              <stop offset="60%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#5A4B34" stopOpacity="0.16" />
            </radialGradient>
            {/* paper grain, so the panel reads as printed parchment */}
            <filter id="ascGrain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n" />
              <feColorMatrix in="n" type="saturate" values="0" result="d" />
              <feComponentTransfer in="d" result="g">
                <feFuncA type="linear" slope="0.08" />
              </feComponentTransfer>
              <feComposite in="g" in2="SourceGraphic" operator="over" />
            </filter>
            <clipPath id="ascClip">
              <rect x="0" y="0" width={VIEW.w} height={VIEW.h} rx="14" />
            </clipPath>
          </defs>

          <g clipPath="url(#ascClip)">
            {/* layer 1: the painted backdrop. Decorative only: it carries no
                data, and every label, route point and marker is drawn over it. */}
            <image
              href="/ascent-backdrop.jpg"
              x={0} y={0} width={VIEW.w} height={VIEW.h}
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            />

            {/* the illustration is the setting, not the content: a light wash
                over it keeps the route, camps and labels first to the eye */}
            <rect x={0} y={0} width={VIEW.w} height={VIEW.h} fill="#F7F1E4" opacity={0.34} aria-hidden="true" />

            {/* a light scrim beneath the label band, drawn before any live
                element so it never washes out the labels it protects */}
            <rect x="0" y="0" width={VIEW.w} height={188} fill="url(#ascScrim)" aria-hidden="true" />

            {/* layer 2: a soft crest beneath the route, so the path reads as
                sitting on ground rather than floating over the illustration */}
            <polygon points={routeRidge(10)} fill="#6E6147" opacity={0.22} aria-hidden="true" />
            <path
              d={full} fill="none" stroke="#4A3F2C" strokeWidth={14}
              strokeLinecap="round" opacity={0.13} aria-hidden="true"
            />

            {/* layer 3b: contour lines, over the terrain so they read as a map */}
            <g aria-hidden="true">
              {contours.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="var(--asc-contour)" strokeWidth={1} opacity={0.5 - i * 0.045} />
              ))}
            </g>

            {/* layer 4: the route, travelled then remaining */}
            <path d={full} fill="none" stroke="#FBF8F1" strokeWidth={11} strokeLinecap="round" opacity={0.75} />
            <path
              d={full} fill="none" stroke="var(--asc-teal)" strokeWidth={7} strokeLinecap="round"
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

              {/* compass rose */}
              <g aria-hidden="true" transform="translate(86 176)" opacity={0.5}>
                <circle r={26} fill="none" stroke="var(--asc-muted)" strokeWidth={1} />
                <circle r={18} fill="none" stroke="var(--asc-muted)" strokeWidth={0.6} />
                <polygon points="0,-24 5,0 0,24 -5,0" fill="var(--asc-oxblood)" opacity={0.75} />
                <polygon points="-24,0 0,4 24,0 0,-4" fill="var(--asc-muted)" opacity={0.45} />
                <text x={0} y={-30} textAnchor="middle" className="asc-anchor-label">N</text>
              </g>

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

              {/* where the previous attempt stood, when there is one */}
              {comparison ? (() => {
                const prev = pointAtIndex(comparison.previousIndex);
                // Only label the ghost when it is far enough from the current
                // marker to be readable. The comparison card below states the
                // movement in full either way, so the map never repeats it.
                const gap = Math.abs(comparison.currentIndex - comparison.previousIndex);
                return (
                  <g>
                    {gap >= 4 ? (
                      <path
                        d={`M ${prev.x} ${prev.y + 16} L ${here.x} ${here.y + 16}`}
                        stroke="var(--asc-muted)" strokeWidth={1.4} strokeDasharray="5 5" fill="none"
                      />
                    ) : null}
                    <circle cx={prev.x} cy={prev.y} r={9} fill="none"
                      stroke="#5C513C" strokeWidth={2.5} strokeDasharray="3 3" />
                    {gap >= 8 ? (
                      <text x={prev.x} y={prev.y + 36} textAnchor="middle" className="asc-prev-chip">
                        LAST TIME
                      </text>
                    ) : null}
                  </g>
                );
              })() : null}

              {/* the climber, placed at the exact index */}
              <g>
                <line x1={here.x} y1={here.y} x2={here.x} y2={here.y - 40} stroke="var(--asc-oxblood)" strokeWidth={2} />
                <line x1={here.x} y1={here.y - 40} x2={calloutX} y2={here.y - 74} stroke="var(--asc-oxblood)" strokeWidth={1.4} />
                <polygon
                  points={`${here.x},${here.y - 40} ${here.x + 30},${here.y - 33} ${here.x},${here.y - 26}`}
                  fill="var(--asc-oxblood)"
                />
                <circle cx={here.x} cy={here.y} r={14} fill="var(--asc-card)" stroke="var(--asc-oxblood)" strokeWidth={3} />
                <circle cx={here.x} cy={here.y} r={6} fill="var(--asc-oxblood)" />
                <g>
                  <rect
                    x={calloutX - 92} y={here.y - 106} width={184} height={32} rx={16}
                    fill="var(--asc-oxblood)"
                  />
                  <text x={calloutX} y={here.y - 85} textAnchor="middle" className="asc-here-chip">
                    YOU ARE HERE · {result.stage.rawIndex}
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

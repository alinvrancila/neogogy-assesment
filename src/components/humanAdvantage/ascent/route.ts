/**
 * Route geometry for the ascent map.
 *
 * Pure maths, no React and no scoring. The engine decides the index; this file
 * only decides where on a drawn path an index sits.
 *
 * The contract that matters: fraction t along the route equals index / 100.
 * An index of 37.8 is placed at 37.8 percent of the route length, never
 * snapped to the middle of a stage band.
 */

export interface Pt { x: number; y: number }

import type { ConstructId } from '@/engine/types';

/** Practice gates that bind on the route, in the language of the climb. */
export const GATE_DEFS: Array<{ construct: ConstructId; label: string; firstStage: number }> = [
  { construct: 'agency', label: 'Authorship', firstStage: 6 },
  { construct: 'verification', label: 'Verification', firstStage: 6 },
  { construct: 'responsibleUse', label: 'Boundaries', firstStage: 7 },
  { construct: 'transfer', label: 'Transfer', firstStage: 8 },
];

export const VIEW = { w: 1200, h: 560 };

/**
 * Ridge line the route follows, left (basecamp) to right (summit).
 * Chosen so the climb reads as terrain rather than a diagonal bar: it rises
 * unevenly, with shoulders and a steeper final pitch.
 */
export const ROUTE_POINTS: Pt[] = [
  { x: 40,   y: 500 },
  { x: 150,  y: 482 },
  { x: 258,  y: 470 },
  { x: 352,  y: 446 },
  { x: 448,  y: 452 },
  { x: 540,  y: 412 },
  { x: 634,  y: 402 },
  { x: 726,  y: 366 },
  { x: 812,  y: 340 },
  { x: 900,  y: 286 },
  { x: 986,  y: 250 },
  { x: 1064, y: 186 },
  { x: 1150, y: 120 },
];

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/** Cumulative arc length at each vertex. */
function cumulative(points: Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) out.push(out[i - 1] + dist(points[i - 1], points[i]));
  return out;
}

const CUM = cumulative(ROUTE_POINTS);
export const ROUTE_LENGTH = CUM[CUM.length - 1];

/**
 * Point at fraction t (0..1) measured along the true arc length of the route.
 * Clamped, so an out-of-range index cannot escape the drawing.
 */
export function pointAt(t: number): Pt {
  const clamped = Math.max(0, Math.min(1, t));
  const target = clamped * ROUTE_LENGTH;
  for (let i = 1; i < ROUTE_POINTS.length; i++) {
    if (CUM[i] >= target) {
      const span = CUM[i] - CUM[i - 1];
      const local = span === 0 ? 0 : (target - CUM[i - 1]) / span;
      const a = ROUTE_POINTS[i - 1];
      const b = ROUTE_POINTS[i];
      return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
    }
  }
  return ROUTE_POINTS[ROUTE_POINTS.length - 1];
}

/** Where an index of 0..100 sits on the route. */
export const pointAtIndex = (index: number): Pt => pointAt(index / 100);

/** The route as an SVG path, smoothed just enough to read as terrain. */
export function routePath(points: Pt[] = ROUTE_POINTS): string {
  if (points.length < 2) return '';
  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const mx = (a.x + b.x) / 2;
    d.push(`Q ${a.x} ${a.y} ${mx} ${(a.y + b.y) / 2}`);
    d.push(`Q ${b.x} ${b.y} ${b.x} ${b.y}`);
  }
  return d.join(' ');
}

/** A ridge polygon under the route, used for the terrain layers. */
export function ridgePolygon(points: Pt[], baseY: number, dx = 0, dy = 0): string {
  const pts = points.map((p) => `${p.x + dx},${p.y + dy}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  return `${first.x + dx},${baseY} ${pts} ${last.x + dx},${baseY}`;
}

/** Contour lines: the ridge repeated downward at decreasing amplitude. */
export function contourPaths(count = 7): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const drop = i * 26;
    const flatten = 1 - i * 0.06;
    const pts = ROUTE_POINTS.map((p) => ({
      x: p.x,
      y: VIEW.h - (VIEW.h - p.y) * flatten + drop * 0.35,
    }));
    out.push(routePath(pts));
  }
  return out;
}

/* ---------------------------------------------------------------- terrain */

/** Deterministic pseudo-random, so terrain is identical on server and client. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * A jagged mountain range as an SVG polygon.
 * Peaks rise toward the right so the terrain agrees with the route's climb.
 */
export function mountainRange(opts: {
  seed: number;
  peaks: number;
  baseY: number;
  startY: number;
  endY: number;
  jitter: number;
}): string {
  const { seed, peaks, baseY, startY, endY, jitter } = opts;
  const rand = rng(seed);
  const left = -160;
  const right = VIEW.w + 200;
  const span = right - left;
  const pts: Pt[] = [{ x: left, y: baseY }];

  for (let i = 0; i <= peaks; i++) {
    const t = i / peaks;
    const x = left + span * t;
    const ridge = startY + (endY - startY) * t;
    // alternate peak and saddle so the silhouette has real teeth
    const isPeak = i % 2 === 0;
    const amp = jitter * (0.55 + rand() * 0.9);
    const y = isPeak ? ridge - amp : ridge + amp * 0.55;
    if (i > 0) {
      const px = left + span * ((i - 0.5) / peaks);
      const pr = startY + (endY - startY) * ((i - 0.5) / peaks);
      pts.push({ x: px, y: pr + amp * 0.25 });
    }
    pts.push({ x, y });
  }

  pts.push({ x: right, y: baseY });
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

/** Snow cap sitting on a peak: a small triangle with a ragged lower edge. */
export function snowCap(peak: Pt, width: number, depth: number, seed: number): string {
  const rand = rng(seed);
  const l = { x: peak.x - width / 2, y: peak.y + depth };
  const r = { x: peak.x + width / 2, y: peak.y + depth };
  const mid1 = { x: peak.x - width / 6, y: peak.y + depth * (0.55 + rand() * 0.3) };
  const mid2 = { x: peak.x + width / 5, y: peak.y + depth * (0.6 + rand() * 0.35) };
  return `${peak.x},${peak.y} ${r.x},${r.y} ${mid2.x},${mid2.y} ${peak.x},${peak.y + depth * 0.85} ${mid1.x},${mid1.y} ${l.x},${l.y}`;
}


/**
 * The near range follows the route itself, so the climber reads as walking a
 * ridge crest rather than having a peak drawn in front of them. A little
 * deterministic jitter keeps it from looking like a chart area fill.
 */
export function routeRidge(offset = 8): string {
  const rand = rng(97);
  const pts: Pt[] = [{ x: -160, y: ROUTE_POINTS[0].y + 46 }];
  for (let i = 0; i < ROUTE_POINTS.length; i++) {
    const p = ROUTE_POINTS[i];
    if (i > 0) {
      const prev = ROUTE_POINTS[i - 1];
      const mx = (prev.x + p.x) / 2;
      const my = (prev.y + p.y) / 2;
      pts.push({ x: mx, y: my + offset + rand() * 16 });
    }
    pts.push({ x: p.x, y: p.y + offset });
  }
  pts.push({ x: VIEW.w + 200, y: ROUTE_POINTS[ROUTE_POINTS.length - 1].y - 30 });
  pts.push({ x: VIEW.w + 200, y: VIEW.h });
  pts.push({ x: -160, y: VIEW.h });
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

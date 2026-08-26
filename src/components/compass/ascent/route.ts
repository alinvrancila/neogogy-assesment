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

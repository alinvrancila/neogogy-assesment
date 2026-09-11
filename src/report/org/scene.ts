/**
 * A chart, before it is drawn.
 *
 * Every chart in the organisation report is a pure function from data to a
 * Scene: a flat, ordered list of primitives with coordinates. Two thin
 * renderers turn a Scene into react-pdf elements or into DOM SVG, and neither
 * renderer contains any chart logic.
 *
 * The reason is that the report has to exist twice, in print and on the web,
 * and those two have incompatible element models. A charting library solves
 * one of them: they all render to the DOM or to a canvas, and the print
 * pipeline must not need a browser. Writing each chart twice solves neither,
 * because the two copies drift and nothing notices.
 *
 * The second reason is that most of the acceptance checklist becomes a unit
 * test. Whether a chart carries a callout, whether its alt text states a
 * finding, whether a reversed metric is actually drawn reversed: all of those
 * are assertions about a Scene, which means they are checked on every run
 * rather than reviewed by eye once.
 */

export type Anchor = 'start' | 'middle' | 'end';

export type Prim =
  | { k: 'rect'; x: number; y: number; w: number; h: number; r?: number;
      fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number;
      stroke: string; strokeWidth?: number;
      /** Dash pattern as numbers. Each renderer formats it for its own target:
       *  SVG wants them space separated, react-pdf's pdfkit wants a real array. */
      dash?: number[]; opacity?: number }
  | { k: 'circle'; cx: number; cy: number; r: number; fill?: string;
      stroke?: string; strokeWidth?: number; opacity?: number }
  | { k: 'path'; d: string; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }
  | { k: 'text'; x: number; y: number; text: string; size: number;
      fill?: string; anchor?: Anchor; weight?: number; mono?: boolean; serif?: boolean }
  /** A short label with a leader line to the thing it describes. */
  | { k: 'callout'; x: number; y: number; toX: number; toY: number; text: string;
      anchor?: Anchor };

export interface Scene {
  w: number;
  h: number;
  prims: Prim[];
  /** One sentence stating the finding, not the chart type. */
  alt: string;
  /** A plain sentence stating the conclusion. Headings alone tell the story. */
  title: string;
}

/** The longest a callout may be, in words. Enforced by test, not by hope. */
export const CALLOUT_MAX_WORDS = 12;
/** No chart may carry more than this many callouts. */
export const CALLOUT_MAX = 4;

export const countCallouts = (s: Scene): number => s.prims.filter((p) => p.k === 'callout').length;

/** Text primitives carrying nothing. A chart should omit them, not emit them. */
export const emptyLabels = (s: Scene): number =>
  s.prims.filter((p) => (p.k === 'text' || p.k === 'callout') && !p.text.trim()).length;

/** Semantic colours. Reading meaning is separate from the LifeX chrome, so a
 *  burgundy heading is never read as a warning. */
export const C = {
  strength: '#2F6F62',
  strengthDeep: '#245A4F',
  developing: '#B08A3E',
  watch: '#B4452F',
  vulnerability: '#7B2B32',
  gate: '#B08A3E',
  ink: '#2C2621',
  mute: '#6E6155',
  hair: '#E0D5C6',
  hairSoft: '#EFE6DA',
  paper: '#FBF7F1',
  white: '#FFFFFF',
} as const;

/** The band a canonical score sits in, as a colour. */
export const bandColour = (score: number, strength = 65, watch = 40): string =>
  score >= strength ? C.strength : score >= watch ? C.developing : C.watch;

/* ------------------------------------------------------------- builders */

export const rect = (p: Extract<Prim, { k: 'rect' }>): Prim => p;
export const line = (p: Omit<Extract<Prim, { k: 'line' }>, 'k'>): Prim => ({ k: 'line', ...p });
export const text = (p: Omit<Extract<Prim, { k: 'text' }>, 'k'>): Prim => ({ k: 'text', ...p });
export const circle = (p: Omit<Extract<Prim, { k: 'circle' }>, 'k'>): Prim => ({ k: 'circle', ...p });
export const callout = (p: Omit<Extract<Prim, { k: 'callout' }>, 'k'>): Prim => ({ k: 'callout', ...p });

/** A scale from a value domain on to an x range. */
export const scaleX = (min: number, max: number, w: number) =>
  (v: number) => ((Math.max(min, Math.min(max, v)) - min) / Math.max(1e-9, max - min)) * w;

/** Counts never carry a decimal; a score carries at most one. */
export const one = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);
export const whole = (n: number): string => String(Math.round(n));
/** A count with its percentage beside it, never instead of it. */
export const withPct = (k: number, n: number): string =>
  `${k} of ${n} (${n ? Math.round((k / n) * 100) : 0}%)`;

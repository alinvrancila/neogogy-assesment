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

/**
 * One type scale for every chart.
 *
 * The charts had grown twelve distinct sizes between 5.6 and 9 points, which is
 * not a scale: it is twelve decisions taken separately. Below about 7.5 points
 * a printed label stops being comfortable to read, and several of these sat at
 * 5.6, so the smallest steps have moved the most.
 *
 * Seven steps, each a clear jump from the last, so a reader can tell what rank a
 * piece of text holds without measuring it.
 */
export const TYPE = {
  /** Scale ends, provenance, the canonical name under a row. */
  micro: 7.5,
  /** Axis labels, notes under a chart. */
  caption: 8,
  /** Row labels, secondary figures. */
  label: 8.5,
  /** Counts and the primary text inside a chart. */
  body: 9.5,
  /** Emphasis inside a chart. */
  strong: 10.5,
  /** A heading inside a drawing. */
  heading: 12,
  /** A figure that carries a card. */
  figure: 18,
  /** The figure a page is built around. */
  display: 24,
} as const;

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
/**
 * Wrap a sentence to a width, on word boundaries.
 *
 * Charts were slicing at a character count, which cuts words in half: a stage
 * row read "still want a sec" then "ond look", and a card read "how this work
 * is going to chang". `chars` is how many characters fit on a line at the size
 * being used, which is roughly the box width divided by 0.5 times the point
 * size for this typeface.
 *
 * Returns at most `lines` lines, with an ellipsis on the last one if the text
 * did not fit, so a truncation is visible rather than silent.
 */
export function wrap(textIn: string, chars: number, lines = 2): string[] {
  const words = String(textIn ?? '').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > chars && line) {
      out.push(line);
      line = word;
      if (out.length === lines) break;
    } else {
      line = next;
    }
  }
  if (out.length < lines && line) out.push(line);
  const used = out.join(' ').length;
  if (used < words.join(' ').length && out.length) {
    const last = out[out.length - 1];
    out[out.length - 1] = last.length > chars - 1 ? `${last.slice(0, chars - 2).trimEnd()}...` : `${last}...`;
  }
  return out;
}

/** How many characters of this typeface fit in a box, at a point size. */
export const fitChars = (boxWidth: number, size: number): number =>
  Math.max(8, Math.floor(boxWidth / (size * 0.5)));

/** A count with its percentage beside it, never instead of it. */
export const withPct = (k: number, n: number): string =>
  `${k} of ${n} (${n ? Math.round((k / n) * 100) : 0}%)`;

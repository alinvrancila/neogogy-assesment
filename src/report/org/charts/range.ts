/**
 * The range component, section 9.3.
 *
 * One distribution drawing, used for the developmental index, for every
 * dimension and for every composite. The reader learns it once in chapter 2 and
 * never has to learn another.
 *
 *   watch            developing                      strength
 *   0 ------------ 40 ---------------------------- 65 ------------ 100
 *                       45 (vulnerability, dashed)
 *
 *             |-------------- full observed range --------------|
 *                     [========== middle 50% ==========]
 *                                    median
 *
 * The vulnerability line is drawn separately from the band boundaries, because
 * they are four classifications and not three: a reading of 42 is developing
 * and also vulnerable, and a chart that draws one line at 45 through a band
 * edge invites a reader to collapse them.
 */

import {
  C, bandColour, callout, circle, line, one, rect, scaleX, text,
  type Prim, type Scene,
} from '../scene';

export interface RangeInput {
  title: string;
  /** Values as the report plots them, which is always healthy-high. */
  median: number; q1: number; q3: number; min: number; max: number;
  n: number;
  /** Set only for the two composites that genuinely run the other way. */
  lowerIsHealthier?: boolean;
  thresholds?: { watch: number; vulnerability: number; strength: number };
  /** Stage boundaries, drawn along the axis for the index. */
  stageMarks?: Array<{ at: number; label: string }>;
  /** Suppress the callout when the caller is drawing many of these in a row. */
  quiet?: boolean;
  width?: number;
}

export function rangeScene(d: RangeInput): Scene {
  const W = d.width ?? 430;
  const padL = 4, padR = 4;
  const inner = W - padL - padR;
  const t = d.thresholds ?? { watch: 40, vulnerability: 45, strength: 65 };
  const H = d.stageMarks?.length ? 78 : 62;
  const axisY = 40;
  const x = scaleX(0, 100, inner);
  const at = (v: number) => padL + x(v);
  const p: Prim[] = [];

  // Band grounds, so the reader sees the three bands before any data.
  const bands: Array<[number, number, string]> = [
    [0, t.watch, C.watch], [t.watch, t.strength, C.developing], [t.strength, 100, C.strength],
  ];
  for (const [from, to, colour] of bands) {
    p.push(rect({ k: 'rect', x: at(from), y: axisY - 3, w: at(to) - at(from), h: 6,
      fill: colour, opacity: 0.13 }));
  }
  p.push(line({ x1: at(t.watch), y1: axisY - 8, x2: at(t.watch), y2: axisY + 8,
    stroke: C.hair, strokeWidth: 1 }));
  p.push(line({ x1: at(t.strength), y1: axisY - 8, x2: at(t.strength), y2: axisY + 8,
    stroke: C.hair, strokeWidth: 1 }));

  // The vulnerability line, drawn apart from the band edges and dashed.
  p.push(line({ x1: at(t.vulnerability), y1: axisY - 11, x2: at(t.vulnerability), y2: axisY + 11,
    stroke: C.vulnerability, strokeWidth: 1, dash: [2, 2] }));

  // The observed range behind, then the middle half, then the median.
  p.push(line({ x1: at(d.min), y1: axisY, x2: at(d.max), y2: axisY,
    stroke: C.mute, strokeWidth: 1.2, opacity: 0.55 }));
  p.push(rect({ k: 'rect', x: at(d.q1), y: axisY - 5, w: Math.max(2, at(d.q3) - at(d.q1)), h: 10,
    r: 2, fill: bandColour(d.median, t.strength, t.watch), opacity: 0.32 }));
  p.push(circle({ cx: at(d.median), cy: axisY, r: 4.2,
    fill: bandColour(d.median, t.strength, t.watch) }));

  // Scale labels.
  for (const v of [0, t.watch, t.strength, 100]) {
    p.push(text({ x: at(v), y: axisY + 21, text: String(v), size: 6.4, fill: C.mute,
      anchor: v === 0 ? 'start' : v === 100 ? 'end' : 'middle', mono: true }));
  }
  p.push(text({ x: at(t.vulnerability), y: axisY + 30, text: 'vulnerability line',
    size: 6, fill: C.vulnerability, anchor: 'middle' }));

  for (const m of d.stageMarks ?? []) {
    p.push(line({ x1: at(m.at), y1: axisY + 12, x2: at(m.at), y2: axisY + 16,
      stroke: C.hair, strokeWidth: 0.8 }));
    p.push(text({ x: at(m.at), y: axisY + 38, text: m.label, size: 5.6, fill: C.mute, anchor: 'middle' }));
  }

  //
  // No title is drawn here. The Block above renders Scene.title as a proper
  // heading, and drawing it inside as well printed every chart title twice
  // across the whole report. This one was missed by the sweep that removed the
  // others, because its arguments are in a different order, and the two lines
  // then sat on the same baseline and overlapped.
  //
  p.push(text({
    x: W - padR, y: 12, anchor: 'end', mono: true, size: 7.2, fill: C.mute,
    text: `median ${one(d.median)} · middle half ${one(d.q1)} to ${one(d.q3)} · reaches ${one(d.min)} to ${one(d.max)}`,
  }));
  if (d.lowerIsHealthier) {
    p.push(text({ x: padL, y: 12, text: 'lower is healthier', size: 7, fill: C.ink, weight: 700 }));
  }

  if (!d.quiet) {
    p.push(callout({ x: at(d.median), y: axisY - 14, toX: at(d.median), toY: axisY - 5.5,
      text: 'the middle person', anchor: 'middle' }));
  }

  const band = d.median >= t.strength ? 'strength' : d.median >= t.watch ? 'developing' : 'watch';
  return {
    w: W, h: H, prims: p, title: d.title,
    alt: `${d.title}. The middle person scores ${one(d.median)} of 100, in the ${band} band. `
      + `The middle half of the ${d.n} people sit between ${one(d.q1)} and ${one(d.q3)}, `
      + `and the group reaches from ${one(d.min)} to ${one(d.max)}.`,
  };
}

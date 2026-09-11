/**
 * The two-by-two, used for readiness against protection, for use against
 * capability, and for fluency against protection.
 *
 * One quadrant style for every matrix, so the reader learns it once. Every cell
 * carries its count, its share of the population the matrix covers, its title
 * and the response it implies. The base is printed, because two of the three
 * matrices cover a population that is not the whole workforce, and a matrix
 * that silently omits people is how the old report reported six people as
 * twelve.
 */

import { C, callout, fitChars, line, one, rect, text, withPct, wrap, type Prim, type Scene } from '../scene';

export interface QuadrantCell {
  key: string;
  title: string;
  /** Top-left, top-right, bottom-left, bottom-right. */
  at: 'tl' | 'tr' | 'bl' | 'br';
  n: number;
  share: number;
  response?: string;
  highlight?: boolean;
}

export interface QuadrantInput {
  title: string;
  xLabel: string; yLabel: string;
  xLow: string; xHigh: string; yLow: string; yHigh: string;
  cells: QuadrantCell[];
  /** The population the four cells cover, which may not be the whole group. */
  base: number;
  /** Named when the matrix deliberately reports some people elsewhere. */
  asideLabel?: string;
  asideN?: number;
  width?: number;
}

export function quadrantScene(d: QuadrantInput): Scene {
  const W = d.width ?? 430;
  const gutterL = 92, gutterB = 34, top = 14;
  const boxW = (W - gutterL - 6) / 2;
  const boxH = 96;
  const H = top + boxH * 2 + gutterB + (d.asideLabel ? 16 : 0);
  const p: Prim[] = [];
  const pos = (at: QuadrantCell['at']) => ({
    x: gutterL + (at === 'tr' || at === 'br' ? boxW + 6 : 0),
    y: top + (at === 'bl' || at === 'br' ? boxH + 6 : 0),
  });

  for (const c of d.cells) {
    const { x, y } = pos(c.at);
    const strong = c.highlight;
    p.push(rect({ k: 'rect', x, y, w: boxW, h: boxH, r: 4,
      fill: strong ? C.watch : C.hairSoft, opacity: strong ? 0.14 : 0.55,
      stroke: strong ? C.watch : C.hair, strokeWidth: strong ? 1 : 0.7 }));
    p.push(text({ x: x + 10, y: y + 20, text: c.title, size: 10.5, fill: C.ink, weight: 600 }));
    // The count leads and the percentage sits beside it, never instead.
    p.push(text({ x: x + 10, y: y + 42, text: String(c.n), size: 24, fill: C.ink, serif: true, weight: 600 }));
    p.push(text({ x: x + 10 + String(c.n).length * 11 + 4, y: y + 42,
      text: `of ${d.base}  ·  ${Math.round(c.share)}%`, size: 9.5, fill: C.mute, mono: true }));
    if (c.response) {
      wrap(c.response, fitChars(boxW - 20, 8.5), 2).forEach((l, k) =>
        p.push(text({ x: x + 10, y: y + 60 + k * 11, text: l, size: 8.5, fill: C.mute })));
    }
  }

  // Axes, labelled in words rather than variable names.
  p.push(line({ x1: gutterL - 8, y1: top, x2: gutterL - 8, y2: top + boxH * 2 + 6, stroke: C.hair, strokeWidth: 0.8 }));
  p.push(line({ x1: gutterL, y1: top + boxH * 2 + 14, x2: W, y2: top + boxH * 2 + 14, stroke: C.hair, strokeWidth: 0.8 }));
  p.push(text({ x: gutterL - 14, y: top + 12, text: d.yHigh, size: 8.5, fill: C.mute, anchor: 'end' }));
  p.push(text({ x: gutterL - 14, y: top + boxH + 12, text: d.yLow, size: 8.5, fill: C.mute, anchor: 'end' }));
  p.push(text({ x: gutterL - 14, y: top + boxH, text: d.yLabel, size: 8.5, fill: C.ink, anchor: 'end', weight: 600 }));
  p.push(text({ x: gutterL, y: top + boxH * 2 + 25, text: d.xLow, size: 8.5, fill: C.mute }));
  p.push(text({ x: W, y: top + boxH * 2 + 25, text: d.xHigh, size: 8.5, fill: C.mute, anchor: 'end' }));
  p.push(text({ x: gutterL + boxW, y: top + boxH * 2 + 25, text: d.xLabel, size: 8.5, fill: C.ink, anchor: 'middle', weight: 600 }));

  if (d.asideLabel && typeof d.asideN === 'number') {
    p.push(text({ x: 0, y: H - 4, size: 8.5, fill: C.mute,
      text: `${d.asideN} ${d.asideN === 1 ? 'person is' : 'people are'} reported separately: ${d.asideLabel}.` }));
  }

  const biggest = [...d.cells].sort((a, b) => b.n - a.n)[0];
  if (biggest && biggest.n > 0) {
    // Inside the cell it names, at its top edge, where no box border runs.
    const { x, y } = pos(biggest.at);
    p.push(callout({ x: x + boxW - 10, y: y + 14, toX: x + boxW - 10, toY: y + 4,
      text: `${biggest.n} of ${d.base} are here`, anchor: 'end' }));
  }

  return {
    w: W, h: H, prims: p, title: d.title,
    alt: `${d.title}. Of ${d.base} people, `
      + d.cells.map((c) => `${c.n} are ${c.title.toLowerCase()}`).join(', ')
      + (d.asideLabel ? `. A further ${d.asideN} are reported separately as ${d.asideLabel}` : '') + '.',
  };
}

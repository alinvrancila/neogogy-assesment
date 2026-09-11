/**
 * Chapter 2's teaching visuals, and the small parts reused elsewhere.
 *
 * The reader learns the visual language here once: the band ruler, what a
 * median is, and the shape of the route. Every scored chart later in the report
 * prints the ruler underneath it, so the vocabulary is never more than a page
 * away.
 */

import { C, callout, circle, line, rect, scaleX, text, type Prim, type Scene } from '../scene';

/** The band ruler, printed under every scored chart. */
export function bandRulerScene(width = 430, compact = false): Scene {
  const W = width, H = compact ? 34 : 62;
  const y = compact ? 14 : 30;
  const x = scaleX(0, 100, W);
  const p: Prim[] = [];
  const bands: Array<[number, number, string, string]> = [
    [0, 40, C.watch, 'watch'], [40, 65, C.developing, 'developing'], [65, 100, C.strength, 'strength'],
  ];
  for (const [from, to, colour, label] of bands) {
    p.push(rect({ k: 'rect', x: x(from), y: y - 6, w: x(to) - x(from), h: 12, r: 2, fill: colour, opacity: 0.18 }));
    p.push(text({ x: (x(from) + x(to)) / 2, y: y + 3, size: 6.6, anchor: 'middle', fill: C.ink, text: label }));
  }
  p.push(line({ x1: x(45), y1: y - 11, x2: x(45), y2: y + 11, stroke: C.vulnerability, strokeWidth: 1, dash: [2, 2] }));
  for (const v of [0, 40, 65, 100]) {
    p.push(text({ x: x(v), y: y + 18, size: 6.2, mono: true, fill: C.mute,
      anchor: v === 0 ? 'start' : v === 100 ? 'end' : 'middle', text: String(v) }));
  }
  if (!compact) {
    p.push(text({ x: x(45), y: y + 30, size: 6.4, anchor: 'middle', fill: C.vulnerability,
      text: 'the vulnerability line, 45' }));
    p.push(callout({ x: x(45) + 46, y: y - 16, toX: x(45), toY: y - 10,
      text: '42 is developing and also vulnerable' }));
  }
  return {
    w: W, h: H, prims: p,
    title: 'The bands, and the vulnerability line that crosses them',
    alt: 'A ruler from 0 to 100. Below 40 is watch, 40 to 64.9 is developing, 65 and above is a '
      + 'strength. A dashed line at 45 marks the vulnerability line, which crosses the bands rather '
      + 'than dividing them: a reading of 42 is developing and also vulnerable.',
  };
}

/** Nine dots with the middle one ringed, so "median" is learned once. */
export function medianIllustrationScene(width = 430): Scene {
  const W = width, H = 64;
  const p: Prim[] = [];
  const values = [31, 38, 44, 49, 55, 58, 64, 71, 83];
  const gap = Math.min(30, (W - 40) / values.length);
  const startX = 12;
  p.push(text({ x: 0, y: 12, size: 8.4, weight: 600, fill: C.ink,
    text: 'The median is the person standing in the middle' }));
  values.forEach((v, i) => {
    const cx = startX + i * gap, cy = 36;
    const isMid = i === 4;
    p.push(circle({ cx, cy, r: isMid ? 6.5 : 4.5, fill: isMid ? C.strength : C.hair,
      opacity: isMid ? 0.85 : 0.9 }));
    if (isMid) p.push(circle({ cx, cy, r: 9.5, stroke: C.strength, strokeWidth: 1 }));
    p.push(text({ x: cx, y: cy + 20, size: 5.8, anchor: 'middle', mono: true, fill: C.mute, text: String(v) }));
  });
  p.push(callout({ x: startX + 4 * gap, y: 16, toX: startX + 4 * gap, toY: 25,
    text: 'the median', anchor: 'middle' }));
  p.push(text({ x: 0, y: H - 2, size: 6.2, fill: C.mute,
    text: 'Illustrative, not your group. Four people score below and four above.' }));
  return {
    w: W, h: H, prims: p,
    title: 'The median is the person standing in the middle',
    alt: 'Nine illustrative scores in order, with the fifth ringed. Four people score at or below '
      + 'it and four at or above. It is not the average: one unusually high or low person moves an '
      + 'average a long way and moves the median hardly at all.',
  };
}

/** The route in miniature, for chapter 2 and for chapter strips. */
export function miniRouteScene(centreStage: number, width = 200): Scene {
  const W = width, H = 30;
  const p: Prim[] = [];
  const step = W / 10;
  for (let s = 1; s <= 10; s++) {
    const cx = (s - 0.5) * step;
    const here = s === centreStage;
    p.push(circle({ cx, cy: 16, r: here ? 5 : 2.6, fill: here ? C.strength : C.hair }));
  }
  p.push(line({ x1: 3, y1: 16, x2: W - 3, y2: 16, stroke: C.hair, strokeWidth: 0.8, opacity: 0.6 }));
  p.push(text({ x: 0, y: 29, size: 5.6, fill: C.mute, text: 'stage 1' }));
  p.push(text({ x: W, y: 29, size: 5.6, fill: C.mute, anchor: 'end', text: 'stage 10' }));
  p.push(callout({ x: (centreStage - 0.5) * step, y: 8, toX: (centreStage - 0.5) * step, toY: 11,
    text: `stage ${centreStage}`, anchor: 'middle' }));
  return {
    w: W, h: H, prims: p, title: 'The route, in miniature',
    alt: `The ten stage route with stage ${centreStage} marked, which is where most of your people are.`,
  };
}

/** The band split for one dimension, as a stacked bar with counts on it. */
export function stackedBandScene(
  d: { strong: number; developing: number; watch: number; vulnerable: number; n: number },
  width = 200,
): Scene {
  const W = width, H = 40;
  const p: Prim[] = [];
  const barY = 10, barH = 14;
  const total = Math.max(1, d.n);
  let x = 0;
  const segs: Array<[number, string, string]> = [
    [d.strong, C.strength, 'strong'], [d.developing, C.developing, 'developing'], [d.watch, C.watch, 'watch'],
  ];
  for (const [v, colour, label] of segs) {
    const w = (v / total) * W;
    if (w > 0) {
      p.push(rect({ k: 'rect', x, y: barY, w, h: barH, r: 1.5, fill: colour, opacity: 0.6 }));
      if (w > 13) p.push(text({ x: x + w / 2, y: barY + 10, size: 7, anchor: 'middle', mono: true, fill: C.ink, text: String(v) }));
    }
    x += w;
  }
  p.push(text({ x: 0, y: barY + barH + 11, size: 6.2, fill: C.mute,
    text: `strong ${d.strong} · developing ${d.developing} · watch ${d.watch}` }));
  if (d.vulnerable > 0) {
    p.push(text({ x: W, y: barY + barH + 11, size: 6.2, anchor: 'end', fill: C.vulnerability,
      text: `${d.vulnerable} at or below 45` }));
  }
  p.push(callout({ x: 0, y: barY - 3, toX: 2, toY: barY + 1,
    text: `${d.n} people` }));
  return {
    w: W, h: H, prims: p, title: 'The band split',
    alt: `Of ${d.n} people, ${d.strong} are in the strength band, ${d.developing} developing and `
      + `${d.watch} in the watch band, with ${d.vulnerable} at or below the vulnerability line.`,
  };
}

/** Reported use intensity, chapter 8. */
export function useBarScene(rows: Array<{ label: string; n: number; share: number }>, n: number, width = 430): Scene {
  const W = width, rowH = 18, top = 26;
  const barX = 96, barW = W - barX - 58;
  const p: Prim[] = [];
  const max = Math.max(1, ...rows.map((r) => r.n));
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink, text: 'How much AI your people report using' }));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    p.push(text({ x: 0, y: y + 2, size: 7.2, fill: C.ink, text: r.label }));
    const w = Math.max(r.n ? 2 : 0, (r.n / max) * barW);
    p.push(rect({ k: 'rect', x: barX, y: y - 6, w, h: 12, r: 2, fill: C.strength, opacity: 0.45 }));
    p.push(text({ x: W, y: y + 2, size: 7, anchor: 'end', mono: true, fill: r.n ? C.ink : C.hair,
      text: `${r.n} of ${n}` }));
  });
  const top1 = [...rows].sort((a, b) => b.n - a.n)[0];
  if (top1) {
    const i = rows.indexOf(top1);
    p.push(callout({ x: barX + barW, y: top + i * rowH - 12, toX: barX + barW * 0.5, toY: top + i * rowH - 6,
      text: `most common: ${top1.label.toLowerCase()}`, anchor: 'end' }));
  }
  return {
    w: W, h: top + rows.length * rowH + 6, prims: p,
    title: 'How much AI your people report using',
    alt: `Reported use across ${n} people: ` + rows.map((r) => `${r.label}, ${r.n}`).join('; ') + '.',
  };
}

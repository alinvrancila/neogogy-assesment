/**
 * The workforce heatmap, chapter 6.
 *
 * Ten rows grouped by cluster, so a reader glances once and sees where the
 * organisation is strong, where most people are developing, where vulnerability
 * sits, where the workforce is divided, and what deserves attention first.
 *
 * Cells are coloured and also labelled, because colour never carries meaning on
 * its own.
 */

import { C, bandColour, callout, one, rect, text, whole, type Prim, type Scene } from '../scene';

export interface HeatRow {
  executiveName: string; canonicalName: string; cluster: string;
  median: number;
  strong: number; developing: number; watch: number; vulnerable: number;
  spreadWidth: number;
  polarised: boolean;
  priority?: number;
  n: number;
}

const COLS: Array<{ key: keyof HeatRow | 'median'; label: string; w: number }> = [
  { key: 'median', label: 'median', w: 42 },
  { key: 'strong', label: 'strong', w: 38 },
  { key: 'developing', label: 'developing', w: 46 },
  { key: 'watch', label: 'watch', w: 36 },
  { key: 'vulnerable', label: 'at or below 45', w: 56 },
  { key: 'spreadWidth', label: 'spread', w: 38 },
];

export function heatmapScene(rows: HeatRow[], n: number, width = 510): Scene {
  const nameW = 172, rowH = 17, headH = 26;
  const p: Prim[] = [];
  const clusters = [...new Set(rows.map((r) => r.cluster))];
  let y = headH + 14;
  const startX = nameW;
  const colX: number[] = [];
  let cx = startX;
  for (const c of COLS) { colX.push(cx); cx += c.w; }
  const totalW = cx + 24;

  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'Where your workforce is strong, developing, vulnerable and divided' }));

  COLS.forEach((c, i) => {
    p.push(text({ x: colX[i] + c.w - 4, y: headH, size: 6.2, fill: C.mute, anchor: 'end', text: c.label }));
  });
  p.push(text({ x: totalW - 4, y: headH, size: 6.2, fill: C.mute, anchor: 'end', text: 'split' }));

  for (const cluster of clusters) {
    p.push(text({ x: 0, y: y + 1, size: 6.4, fill: C.gate, text: cluster }));
    y += 13;
    for (const r of rows.filter((x) => x.cluster === cluster)) {
      p.push(text({ x: 0, y: y + 2, size: 7.4, fill: C.ink, text: r.executiveName }));
      p.push(text({ x: 0, y: y + 10, size: 5.8, fill: C.hair, text: r.canonicalName }));

      // The median cell carries the band colour and the number.
      const band = bandColour(r.median);
      p.push(rect({ k: 'rect', x: colX[0], y: y - 7, w: COLS[0].w - 4, h: 13, r: 2, fill: band, opacity: 0.2 }));
      p.push(text({ x: colX[0] + COLS[0].w - 8, y: y + 2, size: 7, anchor: 'end', mono: true,
        fill: C.ink, text: one(r.median) }));

      // Counts, with an in-cell bar so the number is drawn as well as printed.
      const cells: Array<[number, number, string]> = [
        [1, r.strong, C.strength], [2, r.developing, C.developing],
        [3, r.watch, C.watch], [4, r.vulnerable, C.vulnerability],
      ];
      for (const [i, v, colour] of cells) {
        const w = COLS[i].w - 4;
        p.push(rect({ k: 'rect', x: colX[i], y: y + 3, w: Math.max(v ? 1.5 : 0, (v / Math.max(1, n)) * w),
          h: 3, r: 1, fill: colour, opacity: 0.65 }));
        p.push(text({ x: colX[i] + w - 4, y: y + 1, size: 6.8, anchor: 'end', mono: true,
          fill: v ? C.ink : C.hair, text: whole(v) }));
      }
      p.push(text({ x: colX[5] + COLS[5].w - 4, y: y + 1, size: 6.8, anchor: 'end', mono: true,
        fill: C.mute, text: one(r.spreadWidth) }));
      if (r.polarised) {
        p.push(rect({ k: 'rect', x: totalW - 22, y: y - 6, w: 20, h: 11, r: 5.5, fill: C.watch, opacity: 0.16 }));
        p.push(text({ x: totalW - 12, y: y + 2, size: 5.6, anchor: 'middle', fill: C.watch, text: 'two' }));
      }
      y += rowH;
    }
    y += 4;
  }

  const worst = [...rows].sort((a, b) => a.median - b.median)[0];
  if (worst) {
    p.push(callout({ x: nameW - 6, y: headH - 10, toX: nameW - 6, toY: headH - 4,
      text: `lowest median: ${worst.executiveName}`, anchor: 'end' }));
  }

  const strong = rows.filter((r) => r.median >= 65).length;
  const weak = rows.filter((r) => r.median <= 45).length;
  const split = rows.filter((r) => r.polarised).length;
  return {
    w: Math.max(width, totalW), h: y + 14, prims: p,
    title: 'Where your workforce is strong, developing, vulnerable and divided',
    alt: `Ten capabilities across ${n} people. ${strong} have a median in the strength band and `
      + `${weak} at or below the vulnerability line. ${split} are split, holding both a strength and `
      + `a vulnerability at once. The lowest median is ${worst?.executiveName ?? ''} at `
      + `${one(worst?.median ?? 0)}.`,
  };
}

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
  { key: 'median', label: 'median', w: 50 },
  { key: 'strong', label: 'strong', w: 44 },
  { key: 'developing', label: 'developing', w: 54 },
  { key: 'watch', label: 'watch', w: 42 },
  { key: 'vulnerable', label: 'at or below 45', w: 66 },
  { key: 'spreadWidth', label: 'spread', w: 44 },
];

export function heatmapScene(rows: HeatRow[], n: number, width = 510): Scene {
  const nameW = 196, rowH = 22, headH = 30;
  const p: Prim[] = [];
  const clusters = [...new Set(rows.map((r) => r.cluster))];
  let y = headH + 30;
  const startX = nameW;
  const colX: number[] = [];
  let cx = startX;
  for (const c of COLS) { colX.push(cx); cx += c.w; }
  const totalW = cx + 24;


  COLS.forEach((c, i) => {
    p.push(text({ x: colX[i] + c.w - 4, y: headH, size: 8, fill: C.mute, anchor: 'end', text: c.label }));
  });
  p.push(text({ x: totalW - 4, y: headH, size: 8, fill: C.mute, anchor: 'end', text: 'split' }));

  for (const cluster of clusters) {
    p.push(text({ x: 0, y: y + 1, size: 8.5, fill: C.gate, text: cluster }));
    y += 16;
    for (const r of rows.filter((x) => x.cluster === cluster)) {
      p.push(text({ x: 0, y: y + 2, size: 9.5, fill: C.ink, text: r.executiveName }));
      p.push(text({ x: 0, y: y + 10, size: 7.5, fill: C.mute, text: r.canonicalName }));

      // The median cell carries the band colour and the number.
      const band = bandColour(r.median);
      p.push(rect({ k: 'rect', x: colX[0], y: y - 7, w: COLS[0].w - 4, h: 13, r: 2, fill: band, opacity: 0.2 }));
      p.push(text({ x: colX[0] + COLS[0].w - 8, y: y + 2, size: 9.5, anchor: 'end', mono: true,
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
        p.push(text({ x: colX[i] + w - 4, y: y + 1, size: 8.5, anchor: 'end', mono: true,
          fill: v ? C.ink : C.hair, text: whole(v) }));
      }
      p.push(text({ x: colX[5] + COLS[5].w - 4, y: y + 1, size: 8.5, anchor: 'end', mono: true,
        fill: C.mute, text: one(r.spreadWidth) }));
      if (r.polarised) {
        p.push(rect({ k: 'rect', x: totalW - 22, y: y - 6, w: 20, h: 11, r: 5.5, fill: C.watch, opacity: 0.16 }));
        p.push(text({ x: totalW - 12, y: y + 2, size: 7.5, anchor: 'middle', fill: C.watch, text: 'two' }));
      }
      y += rowH;
    }
    y += 7;
  }

  const worst = [...rows].sort((a, b) => a.median - b.median)[0];
  if (worst) {
    // Below the column headers rather than above them, pointing down at the
    // median column it names. Above, it sat on the headers.
    p.push(callout({ x: colX[0] + COLS[0].w / 2, y: headH + 13,
      toX: colX[0] + COLS[0].w / 2, toY: headH + 6,
      text: `lowest: ${worst.executiveName}`.slice(0, 34), anchor: 'middle' }));
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

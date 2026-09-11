/**
 * The bar family: diverging, mirrored, exposure meters and the bottleneck.
 *
 * One bar grammar for the whole report. Counts are always printed on the bar,
 * percentages sit beside them, and a callout points at the finding.
 */

import { C, callout, rect, text, whole, type Prim, type Scene } from '../scene';

/* ------------------------------------------------ diverging (lean, calibration) */

export interface DivergingInput {
  title: string;
  left: { label: string; n: number; note?: string };
  middle: { label: string; n: number };
  right: { label: string; n: number; note?: string };
  n: number;
  width?: number;
}

export function divergingScene(d: DivergingInput): Scene {
  const W = d.width ?? 524;
  const H = 108;
  const p: Prim[] = [];
  const barY = 48, barH = 22;
  const total = Math.max(1, d.left.n + d.middle.n + d.right.n);
  const w = (k: number) => (k / total) * W;


  let x = 0;
  const segs: Array<[{ label: string; n: number; note?: string }, string]> = [
    [d.left, C.developing], [d.middle, C.hair], [d.right, C.watch],
  ];
  for (const [seg, colour] of segs) {
    const sw = w(seg.n);
    if (sw > 0) {
      p.push(rect({ k: 'rect', x, y: barY, w: sw, h: barH, r: 2, fill: colour, opacity: 0.55 }));
      if (sw > 16) {
        p.push(text({ x: x + sw / 2, y: barY + 12.5, size: 10.5, anchor: 'middle', mono: true,
          fill: C.ink, text: whole(seg.n) }));
      }
    }
    x += sw;
  }

  p.push(text({ x: 0, y: barY - 6, size: 8.5, fill: C.mute, text: d.left.label }));
  p.push(text({ x: W, y: barY - 6, size: 8.5, fill: C.mute, anchor: 'end', text: d.right.label }));
  p.push(text({ x: W / 2, y: barY + barH + 12, size: 8.5, fill: C.mute, anchor: 'middle', text: d.middle.label }));
  if (d.left.note) p.push(text({ x: 0, y: barY + barH + 24, size: 8.5, fill: C.mute, text: d.left.note }));
  if (d.right.note) p.push(text({ x: W, y: barY + barH + 24, size: 8.5, fill: C.mute, anchor: 'end', text: d.right.note }));

  const bigger = d.left.n >= d.right.n ? d.left : d.right;
  const at = d.left.n >= d.right.n ? w(d.left.n) / 2 : W - w(d.right.n) / 2;
  p.push(callout({ x: at, y: barY - 16, toX: at, toY: barY - 1,
    text: `${bigger.n} of ${d.n} lean this way`, anchor: 'middle' }));

  return {
    w: W, h: H, prims: p, title: d.title,
    alt: `${d.title}. Of ${d.n} people, ${d.left.n} ${d.left.label.toLowerCase()}, `
      + `${d.middle.n} ${d.middle.label.toLowerCase()}, and ${d.right.n} ${d.right.label.toLowerCase()}.`,
  };
}

/* -------------------------------------------------- exposure meters (chapter 11) */

export interface ExposureRow { name: string; exposureLabel: string; atOrBelow: number }

export function exposureScene(rows: ExposureRow[], n: number, width = 430): Scene {
  const W = width, rowH = 40, top = 30;
  const barX = 178, barW = W - barX - 56;
  const p: Prim[] = [];
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    p.push(text({ x: 0, y: y + 2, size: 9.5, fill: C.ink, text: r.name }));
    p.push(text({ x: 0, y: y + 12, size: 8, fill: C.mute, text: r.exposureLabel }));
    p.push(rect({ k: 'rect', x: barX, y: y - 6, w: barW, h: 13, r: 2, fill: C.hairSoft, opacity: 0.7 }));
    const w = (r.atOrBelow / Math.max(1, n)) * barW;
    if (w > 0) p.push(rect({ k: 'rect', x: barX, y: y - 6, w: Math.max(2, w), h: 13, r: 2, fill: C.vulnerability, opacity: 0.55 }));
    p.push(text({ x: W, y: y + 3, size: 9.5, anchor: 'end', mono: true, fill: C.ink,
      text: `${r.atOrBelow} of ${n}` }));
  });
  const worst = [...rows].sort((a, b) => b.atOrBelow - a.atOrBelow)[0];
  if (worst) {
    const i = rows.indexOf(worst);
    p.push(callout({ x: barX + barW, y: top + i * rowH - 12, toX: barX + barW, toY: top + i * rowH - 6,
      text: `${worst.atOrBelow} reports worth opening`, anchor: 'end' }));
  }
  return {
    w: W, h: top + rows.length * rowH + 6, prims: p,
    title: 'Where your exposure sits, and how many people carry it',
    alt: 'Exposure on three capabilities, counted as people at or below the vulnerability line of 45. '
      + rows.map((r) => `${r.name}: ${r.atOrBelow} of ${n}`).join('. ') + '.',
  };
}

/* ------------------------------------------------------ bottleneck (chapter 15) */

export interface BottleneckRow { name: string; n: number; medianGap: number }

export function bottleneckScene(rows: BottleneckRow[], n: number, width = 430): Scene {
  const W = width, rowH = 23, top = 32;
  const barX = 196, barW = W - barX - 74;
  const p: Prim[] = [];
  const max = Math.max(1, ...rows.map((r) => r.n));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    p.push(text({ x: 0, y: y + 2, size: 9.5, fill: i === 0 ? C.ink : C.mute, weight: i === 0 ? 600 : 400, text: r.name }));
    const w = Math.max(r.n ? 2 : 0, (r.n / max) * barW);
    p.push(rect({ k: 'rect', x: barX, y: y - 6, w, h: 12, r: 2,
      fill: i === 0 ? C.gate : C.mute, opacity: i === 0 ? 0.6 : 0.3 }));
    p.push(text({ x: barX + w + 6, y: y + 2, size: 9.5, mono: true, fill: C.ink, text: whole(r.n) }));
    p.push(text({ x: W, y: y + 2, size: 8.5, anchor: 'end', mono: true, fill: C.mute,
      text: r.medianGap > 0 ? `${r.medianGap} to close` : '' }));
  });
  if (rows[0]) {
    p.push(callout({ x: barX, y: top - 12, toX: barX + 4, toY: top - 6,
      text: `${rows[0].n} of ${n} people` }));
  }
  return {
    w: W, h: top + rows.length * rowH + 8, prims: p,
    title: rows[0] ? `${rows[0].name} is holding the most people back` : 'No single capability is holding this workforce back',
    alt: rows[0]
      ? `The capability most often acting as the constraint is ${rows[0].name}, for ${rows[0].n} of ${n} people, `
        + `with a median gap of ${rows[0].medianGap} points to what would clear it.`
      : `No capability is acting as the constraint for a meaningful number of the ${n} people here.`,
  };
}

/* ------------------------------------------------- said against chosen (chapter 13) */

export interface MirrorRow { name: string; aligned: number; healthier: number; weaker: number }

export function mirrorScene(rows: MirrorRow[], n: number, width = 430): Scene {
  const W = width, rowH = 21, top = 40;
  const mid = W * 0.58, half = W * 0.3;
  const p: Prim[] = [];
  p.push(text({ x: mid - half, y: 25, size: 8, fill: C.mute, text: 'healthier in situations' }));
  p.push(text({ x: mid + half, y: 25, size: 8, fill: C.mute, anchor: 'end', text: 'weaker in situations' }));
  const max = Math.max(1, ...rows.flatMap((r) => [r.healthier, r.weaker]));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    p.push(text({ x: 0, y: y + 2, size: 9.5, fill: C.ink, text: r.name }));
    const lw = (r.healthier / max) * half, rw = (r.weaker / max) * half;
    if (lw > 0) p.push(rect({ k: 'rect', x: mid - lw, y: y - 5, w: lw, h: 10, r: 2, fill: C.strength, opacity: 0.5 }));
    if (rw > 0) p.push(rect({ k: 'rect', x: mid, y: y - 5, w: rw, h: 10, r: 2, fill: C.developing, opacity: 0.6 }));
    if (r.healthier) p.push(text({ x: mid - lw - 4, y: y + 2, size: 8.5, anchor: 'end', mono: true, fill: C.mute, text: whole(r.healthier) }));
    if (r.weaker) p.push(text({ x: mid + rw + 4, y: y + 2, size: 8.5, mono: true, fill: C.mute, text: whole(r.weaker) }));
  });
  p.push(text({ x: mid, y: top + rows.length * rowH + 10, size: 8, anchor: 'middle', fill: C.mute,
    text: `${n} people, each counted once per capability` }));
  const worst = [...rows].sort((a, b) => b.weaker - a.weaker)[0];
  if (worst) {
    const i = rows.indexOf(worst);
    p.push(callout({ x: mid + half, y: top + i * rowH - 9, toX: mid + (worst.weaker / max) * half, toY: top + i * rowH - 5,
      text: `widest gap: ${worst.name}`, anchor: 'end' }));
  }
  return {
    w: W, h: top + rows.length * rowH + 20, prims: p,
    title: 'Where stated practice and situational choice diverge',
    alt: worst
      ? `Across ten capabilities and ${n} people, the widest divergence is on ${worst.name}, where `
        + `${worst.weaker} chose less healthily in situations than they described themselves and `
        + `${worst.healthier} chose more healthily.`
      : `Across ten capabilities and ${n} people, stated practice and situational choice broadly agree.`,
  };
}

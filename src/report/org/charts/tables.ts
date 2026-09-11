/**
 * The table family. Tables here use in-cell bars and coloured band pills rather
 * than bare digits, because a figure that matters is drawn as well as printed.
 */

import { C, bandColour, callout, one, rect, text, whole, type Prim, type Scene } from '../scene';

/* -------------------------------------------- chapter 3, the ten stage table */

export interface StageRow {
  stage: number; name: string; looksLike: string; meansForBusiness: string; needNext: string;
  n: number; present: boolean;
}

export function stageTableScene(rows: StageRow[], n: number, width = 510): Scene {
  const W = width, rowH = 34, top = 28;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'What each stage means for your business, and what people there need next' }));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    if (r.present) p.push(rect({ k: 'rect', x: 0, y: y - 8, w: W, h: rowH - 4, r: 3, fill: C.hairSoft, opacity: 0.4 }));
    p.push(rect({ k: 'rect', x: 0, y: y - 5, w: 15, h: 13, r: 3,
      fill: r.present ? C.strength : C.hairSoft, opacity: r.present ? 0.85 : 0.7 }));
    p.push(text({ x: 7.5, y: y + 4, size: 6.6, anchor: 'middle', mono: true,
      fill: r.present ? C.white : C.mute, text: String(r.stage) }));
    p.push(text({ x: 21, y: y + 3, size: 7, weight: r.present ? 600 : 400,
      fill: r.present ? C.ink : C.hair, text: r.name.slice(0, 22) }));
    p.push(text({ x: 128, y: y - 1, size: 6.1, fill: C.mute, text: r.meansForBusiness.slice(0, 76) }));
    const tail = r.meansForBusiness.slice(76, 152);
    if (tail.trim()) p.push(text({ x: 128, y: y + 8, size: 6.1, fill: C.mute, text: tail }));
    p.push(text({ x: 128, y: y + 17, size: 6.1, fill: C.gate, text: `Needs next: ${r.needNext}`.slice(0, 80) }));
    p.push(text({ x: W, y: y + 3, size: 7, anchor: 'end', mono: true, fill: r.present ? C.ink : C.hair,
      text: r.present ? `${r.n} of ${n}` : '0' }));
  });
  const busiest = [...rows].sort((a, b) => b.n - a.n)[0];
  if (busiest?.present) {
    p.push(callout({ x: W, y: top - 14, toX: W - 10, toY: top - 8,
      text: `${busiest.n} of ${n} are at stage ${busiest.stage}`, anchor: 'end' }));
  }
  return {
    w: W, h: top + rows.length * rowH, prims: p,
    title: 'What each stage means for your business, and what people there need next',
    alt: `All ten stages of the route with what each means for an employer. Your workforce occupies `
      + `${rows.filter((r) => r.present).length} of them, and the busiest is stage ${busiest?.stage ?? 1} `
      + `with ${busiest?.n ?? 0} of ${n} people.`,
  };
}

/* ------------------------------------------- chapter 11, the exposure register */

export interface RegisterRow { exposure: string; dimension: string; atOrBelow: number; practice: string }

export function registerScene(rows: RegisterRow[], n: number, width = 510): Scene {
  const W = width, rowH = 27, top = 34;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink, text: 'The exposure register' }));
  p.push(text({ x: 0, y: 24, size: 6, fill: C.mute, text: 'exposure' }));
  p.push(text({ x: 136, y: 24, size: 6, fill: C.mute, text: 'capability' }));
  p.push(text({ x: 256, y: 24, size: 6, fill: C.mute, text: 'people at or below 45' }));
  p.push(text({ x: 392, y: 24, size: 6, fill: C.mute, text: 'the practice that addresses it' }));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    p.push(rect({ k: 'rect', x: 0, y: y - 8, w: W, h: rowH - 4, r: 3,
      fill: i % 2 ? C.hairSoft : C.white, opacity: i % 2 ? 0.35 : 1 }));
    p.push(text({ x: 4, y: y + 4, size: 6.6, fill: C.ink, text: r.exposure.slice(0, 24) }));
    p.push(text({ x: 136, y: y + 4, size: 6.4, fill: C.mute, text: r.dimension.slice(0, 24) }));
    // In-cell bar, so the count is drawn.
    p.push(rect({ k: 'rect', x: 256, y: y - 1, w: 64, h: 7, r: 2, fill: C.hairSoft }));
    p.push(rect({ k: 'rect', x: 256, y: y - 1, w: Math.max(r.atOrBelow ? 2 : 0, (r.atOrBelow / Math.max(1, n)) * 64),
      h: 7, r: 2, fill: C.vulnerability, opacity: 0.6 }));
    p.push(text({ x: 326, y: y + 4, size: 6.6, mono: true, fill: C.ink, text: `${r.atOrBelow} of ${n}` }));
    p.push(text({ x: 392, y: y + 4, size: 6.2, fill: C.mute, text: r.practice.slice(0, 30) }));
  });
  const worst = [...rows].sort((a, b) => b.atOrBelow - a.atOrBelow)[0];
  if (worst) {
    p.push(callout({ x: 256, y: top - 16, toX: 262, toY: top - 9,
      text: `largest: ${worst.exposure.toLowerCase()}` }));
  }
  return {
    w: W, h: top + rows.length * rowH + 4, prims: p, title: 'The exposure register',
    alt: `${rows.length} exposures, each counted as the people at or below the vulnerability line on `
      + `the capability that carries it: ` + rows.map((r) => `${r.exposure}, ${r.atOrBelow} of ${n}`).join('; ') + '.',
  };
}

/* -------------------------------------------------- chapter 12, the segments */

export interface SegmentPanel {
  cut: string; shown: boolean; n?: number; needs?: number;
  median?: number; modalStage?: string; constraint?: string;
}

export function segmentScene(panels: SegmentPanel[], width = 510): Scene {
  const W = width, ch = 46, gap = 6, cols = 2;
  const cw = (W - gap) / cols;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'Which parts of your organisation can be read separately' }));
  panels.forEach((s, i) => {
    const x = (i % cols) * (cw + gap);
    const y = 22 + Math.floor(i / cols) * (ch + gap);
    p.push(rect({ k: 'rect', x, y, w: cw, h: ch, r: 4,
      fill: s.shown ? C.white : C.hairSoft, opacity: s.shown ? 1 : 0.45,
      stroke: s.shown ? C.hair : undefined, strokeWidth: 0.7 }));
    p.push(text({ x: x + 9, y: y + 14, size: 7, weight: 600, fill: s.shown ? C.ink : C.mute, text: s.cut.slice(0, 38) }));
    if (s.shown) {
      p.push(text({ x: x + 9, y: y + 27, size: 6.3, fill: C.mute,
        text: `${s.n} people · median ${one(s.median ?? 0)} · ${s.modalStage ?? ''}`.slice(0, 46) }));
      if (s.constraint) p.push(text({ x: x + 9, y: y + 38, size: 6.1, fill: C.gate, text: `held most by ${s.constraint}`.slice(0, 46) }));
    } else {
      // A withheld cut carries no size, only what it would take to show it.
      p.push(text({ x: x + 9, y: y + 27, size: 6.2, fill: C.mute,
        text: 'Withheld, because this cut is small enough' }));
      p.push(text({ x: x + 9, y: y + 36, size: 6.2, fill: C.mute,
        text: `to identify the people in it.${s.needs ? ` Needs about ${s.needs} more.` : ''}` }));
    }
  });
  const shown = panels.filter((s) => s.shown).length;
  return {
    w: W, h: 22 + Math.ceil(panels.length / cols) * (ch + gap), prims: p,
    title: 'Which parts of your organisation can be read separately',
    alt: `${panels.length} cuts were requested. ${shown} can be shown and ${panels.length - shown} are `
      + 'withheld, because a cut small enough to identify the people in it is not reported at all.',
  };
}

/* --------------------------------------------- chapter 22, the wave comparison */

export function baselineScene(reason: string, width = 470): Scene {
  const W = width, H = 96;
  const p: Prim[] = [];
  p.push(rect({ k: 'rect', x: 0, y: 0, w: W, h: H, r: 5, fill: C.hairSoft, opacity: 0.4 }));
  p.push(text({ x: 14, y: 22, size: 9, weight: 600, fill: C.ink, text: 'This is your baseline' }));
  p.push(text({ x: 14, y: 38, size: 6.6, fill: C.mute, text: reason.slice(0, 96) }));
  const tail = reason.slice(96, 192);
  if (tail.trim()) p.push(text({ x: 14, y: 48, size: 6.6, fill: C.mute, text: tail }));
  // Two empty rulers, showing what a second wave would fill in.
  for (let i = 0; i < 2; i++) {
    const y = 64 + i * 14;
    p.push(text({ x: 14, y: y + 4, size: 6, fill: C.mute, text: i === 0 ? 'this wave' : 'next wave' }));
    p.push(rect({ k: 'rect', x: 72, y: y - 3, w: W - 100, h: 7, r: 3,
      fill: i === 0 ? C.strength : C.hair, opacity: i === 0 ? 0.35 : 0.4 }));
    if (i === 1) p.push(text({ x: W - 24, y: y + 4, size: 5.8, anchor: 'end', fill: C.mute, text: 'not yet taken' }));
  }
  p.push(callout({ x: W - 14, y: 20, toX: W - 20, toY: 64, text: 'movement appears here', anchor: 'end' }));
  return {
    w: W, h: H, prims: p, title: 'This is your baseline',
    alt: 'This is the organisation’s first comparable wave, so there is no movement to report '
      + 'yet. A second assessment on the same instrument version would show stage movement, which '
      + 'capabilities improved and which declined, and which gates were cleared.',
  };
}

export function waveScene(rows: Array<{ name: string; before: number; after: number }>, width = 470): Scene {
  const W = width, rowH = 20, top = 26;
  const barX = 150, barW = W - barX - 70;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink, text: 'What moved since the last wave' }));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    const up = r.after >= r.before;
    p.push(text({ x: 0, y: y + 2, size: 7, fill: C.ink, text: r.name.slice(0, 30) }));
    const x1 = barX + (r.before / 100) * barW, x2 = barX + (r.after / 100) * barW;
    p.push(rect({ k: 'rect', x: barX, y: y - 1, w: barW, h: 2, r: 1, fill: C.hairSoft }));
    p.push(rect({ k: 'rect', x: Math.min(x1, x2), y: y - 3, w: Math.max(2, Math.abs(x2 - x1)), h: 6, r: 2,
      fill: up ? C.strength : C.watch, opacity: 0.55 }));
    p.push(text({ x: W, y: y + 2, size: 6.6, anchor: 'end', mono: true, fill: up ? C.strengthDeep : C.watch,
      text: `${up ? '+' : ''}${one(r.after - r.before)}` }));
  });
  const best = [...rows].sort((a, b) => (b.after - b.before) - (a.after - a.before))[0];
  if (best) {
    p.push(callout({ x: barX, y: top - 12, toX: barX + 8, toY: top - 5,
      text: `largest move: ${best.name}`.slice(0, 40) }));
  }
  return {
    w: W, h: top + rows.length * rowH + 6, prims: p, title: 'What moved since the last wave',
    alt: `${rows.length} capabilities compared with the previous wave. `
      + `${rows.filter((r) => r.after > r.before).length} improved and `
      + `${rows.filter((r) => r.after < r.before).length} declined.`,
  };
}

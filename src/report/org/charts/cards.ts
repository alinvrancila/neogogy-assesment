/**
 * The card family: scorecards, strengths, profiles, cohorts, practices and
 * the modules that are not collected.
 *
 * One card grammar for the whole report. A card always carries a figure drawn
 * as well as printed, a label, and one sentence of meaning.
 */

import { C, bandColour, callout, circle, one, rect, text, whole, type Prim, type Scene } from '../scene';

/* --------------------------------------------------- chapter 1 scorecard */

export interface ScoreCardItem {
  figure: string; label: string; meaning: string;
  band?: 'strength' | 'developing' | 'watch';
  /** 0 to 100, drawn as a small fill under the figure when present. */
  fill?: number;
}

export function scorecardScene(items: ScoreCardItem[], width = 510): Scene {
  const cols = 3;
  const gap = 8;
  const cw = (width - gap * (cols - 1)) / cols;
  const ch = 74;
  const rows = Math.ceil(items.length / cols);
  const p: Prim[] = [];
  items.forEach((it, i) => {
    const cx = (i % cols) * (cw + gap);
    const cy = Math.floor(i / cols) * (ch + gap);
    p.push(rect({ k: 'rect', x: cx, y: cy, w: cw, h: ch, r: 5, fill: C.white, stroke: C.hair, strokeWidth: 0.7 }));
    p.push(text({ x: cx + 10, y: cy + 16, size: 6.4, fill: C.mute, text: it.label }));
    p.push(text({ x: cx + 10, y: cy + 40, size: 21, serif: true, weight: 600, fill: C.ink, text: it.figure }));
    if (it.band) {
      const colour = it.band === 'strength' ? C.strength : it.band === 'developing' ? C.developing : C.watch;
      p.push(rect({ k: 'rect', x: cx + cw - 54, y: cy + 26, w: 44, h: 12, r: 6, fill: colour, opacity: 0.18 }));
      p.push(text({ x: cx + cw - 32, y: cy + 34.5, size: 6, anchor: 'middle', fill: colour, text: it.band }));
    }
    if (typeof it.fill === 'number') {
      p.push(rect({ k: 'rect', x: cx + 10, y: cy + 46, w: cw - 20, h: 3, r: 1.5, fill: C.hairSoft }));
      p.push(rect({ k: 'rect', x: cx + 10, y: cy + 46, w: Math.max(1.5, ((cw - 20) * it.fill) / 100), h: 3, r: 1.5,
        fill: bandColour(it.fill) }));
    }
    p.push(text({ x: cx + 10, y: cy + 60, size: 6.2, fill: C.mute, text: it.meaning.slice(0, 62) }));
  });
  return {
    w: width, h: rows * (ch + gap) - gap, prims: p,
    title: 'The answer, in a page',
    alt: 'A scorecard of ' + items.length + ' figures. '
      + items.map((i) => `${i.label}: ${i.figure}`).join('. ') + '.',
  };
}

/* ------------------------------------------------ chapter 10, strengths */

export interface StrengthItem { signal: string; whyItMatters: string; preserve: string; scale: string }

export function strengthScene(items: StrengthItem[], width = 510): Scene {
  const W = width, ch = 62, gap = 7;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'What your workforce is already doing well' }));
  items.forEach((it, i) => {
    const y = 22 + i * (ch + gap);
    p.push(rect({ k: 'rect', x: 0, y, w: W, h: ch, r: 5, fill: C.strength, opacity: 0.07 }));
    p.push(rect({ k: 'rect', x: 0, y, w: 3, h: ch, r: 1.5, fill: C.strength, opacity: 0.8 }));
    p.push(text({ x: 12, y: y + 15, size: 8, weight: 600, fill: C.ink, text: it.signal }));
    p.push(text({ x: 12, y: y + 28, size: 6.4, fill: C.mute, text: `Why it matters: ${it.whyItMatters}`.slice(0, 108) }));
    p.push(text({ x: 12, y: y + 40, size: 6.4, fill: C.mute, text: `Preserve: ${it.preserve}`.slice(0, 108) }));
    p.push(text({ x: 12, y: y + 52, size: 6.4, fill: C.strengthDeep, text: `Scale it: ${it.scale}`.slice(0, 108) }));
  });
  if (items.length) {
    p.push(callout({ x: W, y: 18, toX: W - 6, toY: 24, text: `${items.length} to protect`, anchor: 'end' }));
  }
  return {
    w: W, h: 22 + items.length * (ch + gap), prims: p,
    title: 'What your workforce is already doing well',
    alt: items.length
      ? `${items.length} strengths worth preserving: ` + items.map((i) => i.signal).join('; ') + '.'
      : 'No dimension currently reaches the strength band across this workforce.',
  };
}

/* --------------------------------------------- chapter 12, the nine profiles */

export interface ProfileCell { name: string; n: number; share: number; present: boolean }

export function profileGridScene(cells: ProfileCell[], n: number, width = 510): Scene {
  const cols = 3, gap = 7;
  const cw = (width - gap * (cols - 1)) / cols, ch = 52;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'How your workforce currently relates to AI' }));
  cells.forEach((c, i) => {
    const x = (i % cols) * (cw + gap);
    const y = 22 + Math.floor(i / cols) * (ch + gap);
    p.push(rect({ k: 'rect', x, y, w: cw, h: ch, r: 4,
      fill: c.present ? C.white : C.hairSoft, opacity: c.present ? 1 : 0.5,
      stroke: c.present ? C.hair : undefined, strokeWidth: 0.7 }));
    p.push(text({ x: x + 9, y: y + 15, size: 6.8, fill: c.present ? C.ink : C.hair, text: c.name.slice(0, 30) }));
    p.push(text({ x: x + 9, y: y + 36, size: 15, serif: true, weight: 600,
      fill: c.present ? C.ink : C.hair, text: whole(c.n) }));
    p.push(text({ x: x + 9 + String(c.n).length * 8 + 6, y: y + 36, size: 6.2, mono: true,
      fill: C.mute, text: c.present ? `of ${n} · ${Math.round(c.share)}%` : 'none here' }));
  });
  const top = [...cells].sort((a, b) => b.n - a.n)[0];
  if (top && top.n > 0) {
    const i = cells.indexOf(top);
    const x = (i % cols) * (cw + gap);
    const y = 22 + Math.floor(i / cols) * (ch + gap);
    p.push(callout({ x: x + cw - 6, y: y - 4, toX: x + cw - 6, toY: y + 2,
      text: `most common: ${top.n} people`, anchor: 'end' }));
  }
  const absent = cells.filter((c) => !c.present).length;
  return {
    w: width, h: 22 + Math.ceil(cells.length / cols) * (ch + gap) - gap, prims: p,
    title: 'How your workforce currently relates to AI',
    alt: `All nine profiles, with ${cells.length - absent} present in this workforce of ${n}. `
      + (top && top.n ? `The most common is ${top.name}, with ${top.n} people. ` : '')
      + `${absent} profiles have nobody in them. Profiles describe current patterns of practice, not fixed types.`,
  };
}

/* --------------------------------------------- chapter 12, developmental cohorts */

export interface CohortItem { name: string; n: number; share: number; primaryNeed: string; tier: string; mergedFrom?: string[] }

export function cohortScene(items: CohortItem[], n: number, width = 510): Scene {
  const W = width, rowH = 46;
  const p: Prim[] = [];
  const max = Math.max(1, ...items.map((c) => c.n));
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'Your workforce, grouped by what it needs next' }));
  items.forEach((c, i) => {
    const y = 24 + i * rowH;
    p.push(rect({ k: 'rect', x: 0, y, w: W, h: rowH - 6, r: 4, fill: C.hairSoft, opacity: 0.45 }));
    p.push(text({ x: 10, y: y + 15, size: 7.6, weight: 600, fill: C.ink, text: c.name }));
    p.push(text({ x: 10, y: y + 27, size: 6.3, fill: C.mute, text: c.primaryNeed.slice(0, 92) }));
    if (c.mergedFrom?.length) {
      p.push(text({ x: 10, y: y + 36, size: 5.8, fill: C.gate,
        text: `includes ${c.mergedFrom.join(' and ')}, folded in because the cohort was too small to report on its own` }));
    }
    const bw = (c.n / max) * 90;
    p.push(rect({ k: 'rect', x: W - 148, y: y + 8, w: 90, h: 8, r: 2, fill: C.hairSoft }));
    p.push(rect({ k: 'rect', x: W - 148, y: y + 8, w: Math.max(2, bw), h: 8, r: 2, fill: C.strength, opacity: 0.6 }));
    p.push(text({ x: W - 10, y: y + 16, size: 7.4, anchor: 'end', mono: true, fill: C.ink, text: `${c.n} of ${n}` }));
    p.push(text({ x: W - 10, y: y + 27, size: 6, anchor: 'end', fill: C.mute, text: `tier: ${c.tier}` }));
  });
  if (items[0]) {
    p.push(callout({ x: W - 148, y: 20, toX: W - 140, toY: 32, text: `largest: ${items[0].n} people` }));
  }
  return {
    w: W, h: 24 + items.length * rowH, prims: p,
    title: 'Your workforce, grouped by what it needs next',
    alt: `${items.length} developmental cohorts across ${n} people, assigned by need rather than by `
      + `demographic: ` + items.map((c) => `${c.name}, ${c.n}`).join('; ') + '.',
  };
}

/* ------------------------------------------- chapter 18, the practice portfolio */

export interface PracticeItem { capability: string; n: number; share: number; priority: string; unlocks: number[] }

export function practiceScene(theme: string, items: PracticeItem[], n: number, width = 510): Scene {
  const W = width, rowH = 22, top = 22;
  const barX = 214, barW = W - barX - 78;
  const p: Prim[] = [];
  const max = Math.max(1, ...items.map((x) => x.n));
  p.push(text({ x: 0, y: 12, size: 8.4, weight: 600, fill: C.ink, text: theme }));
  items.forEach((it, i) => {
    const y = top + i * rowH;
    p.push(text({ x: 0, y: y + 2, size: 7.2, fill: C.ink, text: it.capability.slice(0, 44) }));
    const colour = it.priority === 'immediate' ? C.watch : it.priority === 'important' ? C.developing : C.mute;
    p.push(rect({ k: 'rect', x: barX - 66, y: y - 7, w: 60, h: 12, r: 6, fill: colour, opacity: 0.16 }));
    p.push(text({ x: barX - 36, y: y + 2, size: 5.8, anchor: 'middle', fill: colour, text: it.priority }));
    const w = Math.max(2, (it.n / max) * barW);
    p.push(rect({ k: 'rect', x: barX, y: y - 6, w, h: 11, r: 2, fill: C.strength, opacity: 0.4 }));
    p.push(text({ x: W, y: y + 2, size: 7, anchor: 'end', mono: true, fill: C.ink, text: `${it.n} of ${n}` }));
  });
  if (items[0]) {
    p.push(callout({ x: barX, y: top - 10, toX: barX + 4, toY: top - 5,
      text: `reaches ${items[0].n} people` }));
  }
  return {
    w: W, h: top + items.length * rowH + 6, prims: p, title: theme,
    alt: `${theme}: ${items.length} practices, reaching between ${Math.min(...items.map((i) => i.n))} and `
      + `${Math.max(...items.map((i) => i.n))} of ${n} people.`,
  };
}

/* --------------------------------- chapter 21, the modules that are not collected */

export function moduleScene(items: Array<{ name: string; whatItWouldAdd: string }>, width = 510): Scene {
  const W = width, ch = 48, gap = 6;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'What the next measurement layer would add' }));
  items.forEach((m, i) => {
    const y = 22 + i * (ch + gap);
    p.push(rect({ k: 'rect', x: 0, y, w: W, h: ch, r: 4, fill: C.hairSoft, opacity: 0.35,
      stroke: C.hair, strokeWidth: 0.6 }));
    p.push(text({ x: 10, y: y + 15, size: 7.4, weight: 600, fill: C.mute, text: m.name }));
    p.push(rect({ k: 'rect', x: W - 86, y: y + 5, w: 76, h: 12, r: 6, fill: C.hair, opacity: 0.5 }));
    p.push(text({ x: W - 48, y: y + 13.5, size: 5.8, anchor: 'middle', fill: C.mute, text: 'not collected yet' }));
    p.push(text({ x: 10, y: y + 30, size: 6.3, fill: C.mute, text: m.whatItWouldAdd.slice(0, 104) }));
    const tail = m.whatItWouldAdd.slice(104, 208);
    if (tail.trim()) p.push(text({ x: 10, y: y + 41, size: 6.3, fill: C.mute, text: tail }));
  });
  return {
    w: W, h: 22 + items.length * (ch + gap), prims: p,
    title: 'What the next measurement layer would add',
    alt: `${items.length} measurement modules the platform does not collect today, each marked not `
      + 'collected and carrying no values: ' + items.map((m) => m.name).join('; ') + '.',
  };
}

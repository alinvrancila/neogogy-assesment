/**
 * The flow family: the gate funnel, mobility, the tier ladder, the ninety day
 * timeline, the priority matrix, polarisation, segments, the register and the
 * wave comparison.
 */

import { C, callout, circle, line, one, rect, text, whole, type Prim, type Scene } from '../scene';

/* --------------------------------------------------- chapter 15, gate funnel */

export interface GateStep { name: string; stage: number; required: number; held: number; currentMedian: number; gap: number; close: number }

export function gateFunnelScene(steps: GateStep[], n: number, width = 510): Scene {
  const W = width, rowH = 40, top = 30;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: steps.length ? 'The guardrails holding people at their current stage' : 'No guardrail is currently holding anyone' }));
  let remaining = n;
  steps.forEach((s, i) => {
    const y = top + i * rowH;
    const w = (remaining / Math.max(1, n)) * (W - 128);
    p.push(rect({ k: 'rect', x: 0, y: y - 8, w: Math.max(4, w), h: 20, r: 3, fill: C.gate, opacity: 0.13 }));
    p.push(text({ x: 8, y: y + 5, size: 7.4, fill: C.ink, text: `${s.name}, stage ${s.stage} asks for ${s.required}` }));
    p.push(text({ x: W, y: y + 1, size: 7, anchor: 'end', mono: true, fill: C.ink, text: `${s.held} held` }));
    p.push(text({ x: W, y: y + 11, size: 6.2, anchor: 'end', fill: C.mute,
      text: `median ${one(s.currentMedian)}, gap ${one(s.gap)}, ${s.close} close` }));
    // The gap drawn, so the distance is visible rather than only stated.
    const gx = W - 124, gw = 40;
    p.push(rect({ k: 'rect', x: gx, y: y - 4, w: gw, h: 6, r: 3, fill: C.hairSoft }));
    p.push(rect({ k: 'rect', x: gx, y: y - 4,
      w: Math.max(1.5, gw * Math.max(0, Math.min(1, s.currentMedian / Math.max(1, s.required)))),
      h: 6, r: 3, fill: C.gate, opacity: 0.7 }));
    remaining = Math.max(0, remaining - s.held);
  });
  if (steps[0]) {
    p.push(callout({ x: 0, y: top - 14, toX: 6, toY: top - 8,
      text: `${steps[0].held} of ${n} held here` }));
  }
  return {
    w: W, h: top + Math.max(1, steps.length) * rowH, prims: p,
    title: steps.length ? 'The guardrails holding people at their current stage' : 'No guardrail is currently holding anyone',
    alt: steps.length
      ? `${steps.length} practice gates are holding people. The largest is ${steps[0].name}, which `
        + `stage ${steps[0].stage} requires at ${steps[0].required}, holding ${steps[0].held} of ${n} people, `
        + `with ${steps[0].close} within five points of clearing it.`
      : `No practice gate is holding any of the ${n} people back.`,
  };
}

/* ------------------------------------------------ chapter 16, stage by stage */

export interface MobilityRow { stage: number; stageName: string; n: number; movable: number; gated: number; development: number; intoName: string }

export function mobilityScene(rows: MobilityRow[], n: number, width = 510): Scene {
  const W = width, rowH = 22, top = 34;
  const barX = 150, barW = W - barX - 118;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'How many of your people can move next, and what is stopping the rest' }));
  p.push(text({ x: barX, y: 26, size: 6, fill: C.mute, text: 'close  ·  held by a gate  ·  more development needed' }));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    p.push(text({ x: 0, y: y + 2, size: 7.2, fill: C.ink, text: `${r.stage}. ${r.stageName}`.slice(0, 28) }));
    let x = barX;
    const segs: Array<[number, string]> = [[r.movable, C.strength], [r.gated, C.gate], [r.development, C.mute]];
    for (const [v, colour] of segs) {
      const w = (v / Math.max(1, r.n)) * barW;
      if (w > 0) {
        p.push(rect({ k: 'rect', x, y: y - 6, w, h: 12, r: 2, fill: colour, opacity: 0.55 }));
        if (w > 12) p.push(text({ x: x + w / 2, y: y + 2, size: 6.4, anchor: 'middle', mono: true, fill: C.ink, text: whole(v) }));
      }
      x += w;
    }
    if (r.movable > 0) {
      p.push(text({ x: W, y: y + 2, size: 6.6, anchor: 'end', fill: C.mute,
        text: `${r.movable} to ${r.intoName}`.slice(0, 26) }));
    }
  });
  const totalMovable = rows.reduce((a, r) => a + r.movable, 0);
  p.push(callout({ x: barX, y: top - 16, toX: barX + 6, toY: top - 8,
    text: `${totalMovable} of ${n} are close` }));
  return {
    w: W, h: top + rows.length * rowH + 6, prims: p,
    title: 'How many of your people can move next, and what is stopping the rest',
    alt: `Across ${rows.length} occupied stages, ${totalMovable} of ${n} people are within reach of `
      + `their next stage, ${rows.reduce((a, r) => a + r.gated, 0)} are held by a gate, and `
      + `${rows.reduce((a, r) => a + r.development, 0)} need more development first.`,
  };
}

/* ------------------------------------------------ chapter 17, priority matrix */

export interface Bubble { capability: string; reach: number; importance: number; distance: number; region: string }

export function priorityScene(items: Bubble[], n: number, width = 470): Scene {
  const W = width, H = 250;
  const padL = 44, padB = 34, padT = 22, padR = 10;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const p: Prim[] = [];
  const maxImp = Math.max(6, ...items.map((i) => i.importance));
  const x = (v: number) => padL + (v / Math.max(1, n)) * plotW;
  const y = (v: number) => padT + plotH - (v / maxImp) * plotH;

  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink, text: 'Where to invest first' }));
  // The four regions, labelled where they sit.
  p.push(line({ x1: padL, y1: padT + plotH / 2, x2: W - padR, y2: padT + plotH / 2, stroke: C.hair, strokeWidth: 0.6, dash: [2, 3] }));
  p.push(line({ x1: padL + plotW / 2, y1: padT, x2: padL + plotW / 2, y2: padT + plotH, stroke: C.hair, strokeWidth: 0.6, dash: [2, 3] }));
  p.push(text({ x: W - padR - 4, y: padT + 10, size: 6.2, anchor: 'end', fill: C.mute, text: 'act now' }));
  p.push(text({ x: padL + 4, y: padT + 10, size: 6.2, fill: C.mute, text: 'target' }));
  p.push(text({ x: W - padR - 4, y: padT + plotH - 4, size: 6.2, anchor: 'end', fill: C.mute, text: 'scale' }));
  p.push(text({ x: padL + 4, y: padT + plotH - 4, size: 6.2, fill: C.mute, text: 'monitor' }));

  const maxD = Math.max(1, ...items.map((i) => i.distance));
  for (const it of items) {
    const r = 3 + (it.distance / maxD) * 6;
    const colour = it.region === 'act now' ? C.watch : it.region === 'target' ? C.developing
      : it.region === 'scale' ? C.strength : C.mute;
    p.push(circle({ cx: x(it.reach), cy: y(it.importance), r, fill: colour, opacity: 0.45 }));
    p.push(circle({ cx: x(it.reach), cy: y(it.importance), r, stroke: colour, strokeWidth: 0.7 }));
  }
  p.push(line({ x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH, stroke: C.hair, strokeWidth: 0.8 }));
  p.push(line({ x1: padL, y1: padT, x2: padL, y2: padT + plotH, stroke: C.hair, strokeWidth: 0.8 }));
  p.push(text({ x: padL + plotW / 2, y: H - 16, size: 6.6, anchor: 'middle', fill: C.ink, text: 'how many people it reaches' }));
  p.push(text({ x: padL, y: H - 6, size: 6, fill: C.mute, text: '0' }));
  p.push(text({ x: W - padR, y: H - 6, size: 6, anchor: 'end', fill: C.mute, text: `${n} people` }));
  p.push(text({ x: 4, y: padT + plotH / 2, size: 6.6, fill: C.ink, text: 'how' }));
  p.push(text({ x: 4, y: padT + plotH / 2 + 9, size: 6.6, fill: C.ink, text: 'urgent' }));
  p.push(text({ x: 0, y: H - 2, size: 6, fill: C.mute, text: 'Bubble size is how far the group is from the threshold it would need to clear.' }));

  const top = [...items].sort((a, b) => b.importance - a.importance || b.reach - a.reach)[0];
  if (top) {
    p.push(callout({ x: Math.min(W - padR, x(top.reach) + 12), y: Math.max(padT + 8, y(top.importance) - 10),
      toX: x(top.reach), toY: y(top.importance), text: top.capability.slice(0, 34) }));
  }
  return {
    w: W, h: H, prims: p, title: 'Where to invest first',
    alt: `${items.length} practices plotted by how many of the ${n} people they reach and how urgent `
      + `they are. ${items.filter((i) => i.region === 'act now').length} sit in the act now region. `
      + (top ? `The highest is ${top.capability}, reaching ${top.reach} people.` : ''),
  };
}

/* -------------------------------------------------- chapter 19, tier ladder */

export function tierScene(tiers: Array<{ tier: string; cohorts: string[]; n: number }>, n: number, width = 510): Scene {
  const W = width, rowH = 34, top = 24;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: 'What kind of programme each part of your workforce needs' }));
  tiers.forEach((t, i) => {
    const y = top + i * rowH;
    const w = Math.max(6, (t.n / Math.max(1, n)) * (W - 150));
    p.push(rect({ k: 'rect', x: 0, y, w: W, h: rowH - 5, r: 4, fill: t.n ? C.hairSoft : C.white,
      opacity: t.n ? 0.45 : 1, stroke: t.n ? undefined : C.hair, strokeWidth: 0.6 }));
    p.push(text({ x: 10, y: y + 14, size: 7.6, weight: 600, fill: t.n ? C.ink : C.hair, text: t.tier }));
    p.push(text({ x: 10, y: y + 24, size: 6.2, fill: C.mute,
      text: t.cohorts.length ? t.cohorts.join(', ').slice(0, 74) : 'no cohort here in this workforce' }));
    p.push(rect({ k: 'rect', x: W - 140, y: y + 10, w: W - 150 > 0 ? 90 : 0, h: 8, r: 2, fill: C.hairSoft }));
    p.push(rect({ k: 'rect', x: W - 140, y: y + 10, w: Math.max(t.n ? 2 : 0, (t.n / Math.max(1, n)) * 90), h: 8, r: 2,
      fill: C.strength, opacity: 0.6 }));
    p.push(text({ x: W - 10, y: y + 18, size: 7.2, anchor: 'end', mono: true, fill: t.n ? C.ink : C.hair,
      text: `${t.n} of ${n}` }));
  });
  const biggest = [...tiers].sort((a, b) => b.n - a.n)[0];
  if (biggest && biggest.n) {
    const i = tiers.indexOf(biggest);
    p.push(callout({ x: W - 140, y: top + i * rowH + 4, toX: W - 134, toY: top + i * rowH + 10,
      text: `largest tier: ${biggest.n} people` }));
  }
  return {
    w: W, h: top + tiers.length * rowH, prims: p,
    title: 'What kind of programme each part of your workforce needs',
    alt: `Six programme tiers. ${tiers.filter((t) => t.n > 0).length} have people in them across this `
      + `workforce of ${n}. ` + tiers.filter((t) => t.n).map((t) => `${t.tier}, ${t.n}`).join('; ') + '.',
  };
}

/* ------------------------------------------------ chapter 20, the 90 day plan */

export interface TimelineBand { title: string; window: string; note: string; actions: Array<{ capability: string; priority: string; reach: number; metricToMove: string }> }

export function timelineScene(bands: TimelineBand[], n: number, width = 510): Scene {
  const W = width;
  const p: Prim[] = [];
  const colW = (W - 16) / 3;
  let maxRows = 0;
  bands.forEach((b) => { maxRows = Math.max(maxRows, b.actions.length); });
  const H = 46 + maxRows * 26 + 10;
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink, text: 'The next ninety days, in three bands' }));
  bands.forEach((b, i) => {
    const x = i * (colW + 8);
    p.push(rect({ k: 'rect', x, y: 20, w: colW, h: H - 26, r: 4, fill: C.hairSoft, opacity: 0.4 }));
    p.push(rect({ k: 'rect', x, y: 20, w: colW, h: 3, r: 1.5,
      fill: i === 0 ? C.watch : i === 1 ? C.developing : C.strength, opacity: 0.75 }));
    p.push(text({ x: x + 9, y: 36, size: 7.6, weight: 600, fill: C.ink, text: b.title }));
    b.actions.forEach((a, k) => {
      const y = 50 + k * 26;
      p.push(text({ x: x + 9, y: y + 6, size: 6.4, fill: C.ink, text: a.capability.slice(0, 34) }));
      p.push(text({ x: x + 9, y: y + 15, size: 5.8, fill: C.mute, text: `reaches ${a.reach} of ${n}` }));
      p.push(rect({ k: 'rect', x: x + 9, y: y + 18, w: Math.max(2, (a.reach / Math.max(1, n)) * (colW - 22)), h: 2.5, r: 1,
        fill: C.strength, opacity: 0.55 }));
    });
    if (!b.actions.length) {
      p.push(text({ x: x + 9, y: 56, size: 6.2, fill: C.hair, text: 'nothing at this priority' }));
    }
  });
  p.push(callout({ x: 9, y: 30, toX: 14, toY: 36, text: 'start here' }));
  return {
    w: W, h: H, prims: p, title: 'The next ninety days, in three bands',
    alt: 'Three bands of work. '
      + bands.map((b) => `${b.title}: ${b.actions.length} actions`).join('. ')
      + `. Owner and target date are left for your organisation to set.`,
  };
}

/* ------------------------------------------------- chapter 12, polarisation */

export function polarisationScene(rows: Array<{ name: string; strong: number; watch: number }>, n: number, width = 470): Scene {
  const W = width, rowH = 26, top = 26;
  const mid = W * 0.5, half = W * 0.34;
  const p: Prim[] = [];
  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: rows.length ? 'The capabilities where your workforce is split in two' : 'No capability splits your workforce in two' }));
  const max = Math.max(1, ...rows.flatMap((r) => [r.strong, r.watch]));
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    p.push(text({ x: 0, y: y + 2, size: 7, fill: C.ink, text: r.name.slice(0, 30) }));
    const lw = (r.strong / max) * half, rw = (r.watch / max) * half;
    p.push(rect({ k: 'rect', x: mid - lw, y: y - 6, w: lw, h: 12, r: 2, fill: C.strength, opacity: 0.55 }));
    p.push(rect({ k: 'rect', x: mid, y: y - 6, w: rw, h: 12, r: 2, fill: C.watch, opacity: 0.55 }));
    p.push(text({ x: mid - lw - 4, y: y + 2, size: 6.4, anchor: 'end', mono: true, fill: C.mute, text: whole(r.strong) }));
    p.push(text({ x: mid + rw + 4, y: y + 2, size: 6.4, mono: true, fill: C.mute, text: whole(r.watch) }));
  });
  if (rows.length) {
    p.push(text({ x: mid - half, y: top - 8, size: 6, fill: C.strength, text: 'in the strength band' }));
    p.push(text({ x: mid + half, y: top - 8, size: 6, anchor: 'end', fill: C.watch, text: 'in the watch band' }));
    p.push(callout({ x: mid, y: top + rows.length * rowH + 8, toX: mid, toY: top + rows.length * rowH - 2,
      text: 'two populations, not one', anchor: 'middle' }));
  }
  return {
    w: W, h: top + Math.max(1, rows.length) * rowH + 16, prims: p,
    title: rows.length ? 'The capabilities where your workforce is split in two' : 'No capability splits your workforce in two',
    alt: rows.length
      ? `${rows.length} capabilities hold both a strength and a vulnerability at once across ${n} `
        + `people: ` + rows.map((r) => `${r.name}, ${r.strong} strong against ${r.watch} in watch`).join('; ') + '.'
      : `No capability holds both a strength and a vulnerability across these ${n} people.`,
  };
}

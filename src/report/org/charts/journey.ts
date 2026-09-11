/**
 * The journey, chapter 3's flagship.
 *
 * All ten stages, always, so a reader sees the whole route and not only the
 * part their workforce occupies. Each stage carries its count, its share, a
 * density mark, its relation to the median, how many are estimated movable, and
 * the gate holding people where one applies.
 *
 * The density marks are positioned by stage band and never by index. A dot at
 * its exact index position is a readable individual score, which the privacy
 * rules forbid below ten respondents and which the platform has no provision
 * for at any size. Stacked inside the band, a dot carries exactly what the
 * printed stage count already carries and nothing more. This is deviation 3 in
 * the plan, and it is stricter than the brief allows.
 */

import { C, callout, circle, line, one, rect, scaleX, text, whole, type Prim, type Scene } from '../scene';

export interface JourneyStage {
  stage: number; stageName: string; short: string;
  minIndex: number;
  n: number; share: number;
  movable: number;
  gate?: string;
}

export interface JourneyInput {
  stages: JourneyStage[];
  median: number; q1: number; q3: number;
  centreStage: number;
  n: number;
  width?: number;
}

export function journeyScene(d: JourneyInput): Scene {
  const W = d.width ?? 500;
  const labelW = 132, countW = 64;
  const trackX = labelW, trackW = W - labelW - countW - 6;
  const rowH = 21, top = 40;
  const H = top + d.stages.length * rowH + 34;
  const p: Prim[] = [];
  const maxN = Math.max(1, ...d.stages.map((s) => s.n));

  p.push(text({ x: 0, y: 12, size: 9, weight: 600, fill: C.ink,
    text: `Your workforce across the ten stages of the route` }));
  p.push(text({ x: W, y: 12, size: 7, fill: C.mute, anchor: 'end', mono: true,
    text: `${d.n} people` }));

  for (let i = 0; i < d.stages.length; i++) {
    const s = d.stages[i];
    const y = top + i * rowH;
    const here = s.stage === d.centreStage;
    // The stage badge, one style everywhere.
    p.push(rect({ k: 'rect', x: 0, y: y - 9, w: 15, h: 14, r: 3,
      fill: here ? C.strength : C.hairSoft, opacity: here ? 0.9 : 0.7 }));
    p.push(text({ x: 7.5, y: y + 1, size: 7, anchor: 'middle', mono: true,
      fill: here ? C.white : C.mute, text: String(s.stage) }));
    p.push(text({ x: 20, y: y + 1, size: 7.6, fill: here ? C.ink : C.mute,
      weight: here ? 600 : 400, text: s.stageName }));

    // The count bar, so the number is drawn and not only printed.
    const bw = Math.max(s.n ? 2 : 0, (s.n / maxN) * (trackW * 0.55));
    p.push(rect({ k: 'rect', x: trackX, y: y - 5, w: trackW, h: 9, r: 2, fill: C.hairSoft, opacity: 0.5 }));
    if (s.n > 0) {
      p.push(rect({ k: 'rect', x: trackX, y: y - 5, w: bw, h: 9, r: 2,
        fill: here ? C.strength : C.mute, opacity: here ? 0.55 : 0.3 }));
    }
    // One anonymous mark per person, stacked inside the band.
    for (let k = 0; k < Math.min(s.n, 28); k++) {
      p.push(circle({ cx: trackX + 5 + k * 5.4, cy: y, r: 1.7, fill: here ? C.strengthDeep : C.mute, opacity: 0.75 }));
    }
    if (s.n > 28) p.push(text({ x: trackX + 5 + 28 * 5.4 + 4, y: y + 2, size: 6, fill: C.mute, text: `+${s.n - 28}` }));

    p.push(text({ x: W, y: y + 1, size: 7, anchor: 'end', mono: true, fill: s.n ? C.ink : C.hair,
      text: s.n ? `${s.n} · ${Math.round(s.share)}%` : '0' }));
    if (s.gate && s.n > 0) {
      p.push(text({ x: trackX + trackW * 0.58, y: y + 1, size: 6.2, fill: C.gate,
        text: `held by ${s.gate}` }));
    } else if (s.movable > 0) {
      p.push(text({ x: trackX + trackW * 0.58, y: y + 1, size: 6.2, fill: C.mute,
        text: `${s.movable} close to the next stage` }));
    }
  }

  // The index ruler under the route, with the median at its exact position.
  const ry = top + d.stages.length * rowH + 12;
  const x = scaleX(0, 100, trackW);
  p.push(line({ x1: trackX, y1: ry, x2: trackX + trackW, y2: ry, stroke: C.hair, strokeWidth: 2 }));
  for (const s of d.stages) {
    p.push(line({ x1: trackX + x(s.minIndex), y1: ry - 3, x2: trackX + x(s.minIndex), y2: ry + 3,
      stroke: C.hair, strokeWidth: 0.7 }));
  }
  p.push(rect({ k: 'rect', x: trackX + x(d.q1), y: ry - 3.5, w: Math.max(2, x(d.q3) - x(d.q1)), h: 7,
    r: 2, fill: C.strength, opacity: 0.25 }));
  p.push(circle({ cx: trackX + x(d.median), cy: ry, r: 3.6, fill: C.strength }));
  p.push(text({ x: 0, y: ry + 3, size: 6.6, fill: C.mute, text: 'the index, 0 to 100' }));
  p.push(callout({ x: trackX + x(d.median), y: ry + 20, toX: trackX + x(d.median), toY: ry + 4.5,
    text: `the middle person, ${one(d.median)}`, anchor: 'middle' }));

  const occupied = d.stages.filter((s) => s.n > 0);
  const centre = d.stages.find((s) => s.stage === d.centreStage);
  if (centre) {
    p.push(callout({ x: W - countW - 8, y: top + (d.centreStage - 1) * rowH - 11,
      toX: W - countW - 8, toY: top + (d.centreStage - 1) * rowH - 5,
      text: `${centre.n} of ${d.n} are here`, anchor: 'end' }));
  }

  return {
    w: W, h: H, prims: p,
    title: 'Your workforce across the ten stages of the route',
    alt: `The ten stages of the route, with your ${d.n} people placed on them. `
      + `Most are at stage ${d.centreStage}, ${centre?.stageName ?? ''}, with ${centre?.n ?? 0} people. `
      + `Your workforce occupies ${occupied.length} of the ten stages, reaching from stage `
      + `${occupied[0]?.stage ?? 1} to stage ${occupied[occupied.length - 1]?.stage ?? 1}. `
      + `The middle person's index is ${one(d.median)} out of 100.`,
  };
}

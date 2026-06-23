/* ============================================================================
   SCORING ENGINE  (isomorphic: runs identically on client and server)
   Produces: per-dimension 0-100, two axis scores (resilience, readiness),
   a persona, critical flags, an honesty/consistency gap, an abstention signal,
   and the productivity-illusion gap.
   ============================================================================ */

import { dimensions, personas, axes, type Dimension, type Item, type Persona, type PersonaKey, type AxisId } from '@/data/compass';

export type Baseline = { b1: number; b2: number };

export type DimResult = { dim: Dimension; avg: number; pct: number };

export type ConsistencyGap = { dim: Dimension; gap: number };

export type Band = { key: 'flourishing' | 'forming' | 'emerging' | 'eroding'; label: string; color: string };

export type CompassResult = {
  dimResults: Record<string, DimResult>;
  resilience: number;
  readiness: number;
  overall: number;
  persona: Persona;
  pkey: PersonaKey;
  critFlags: Dimension[];
  consistencyGaps: ConsistencyGap[];
  abstainer: boolean;
  usageVal: number | null;
  illusion: number;
  measuredBand: number;
  strengths: DimResult[];
  risks: DimResult[];
  baseline: Baseline | null;
};

export type Answers = Record<string, number>;

// raw Likert (1-5) -> apply reverse
const itemScore = (item: Item, raw: number): number => (item.reverse ? 6 - raw : raw);

export const compute = (answers: Answers, baseline: Baseline | null, usageVal: number | null): CompassResult => {
  const dimResults: Record<string, DimResult> = {};
  const critFlags: Dimension[] = [];
  const consistencyGaps: ConsistencyGap[] = [];

  dimensions.forEach((dim) => {
    let sum = 0;
    let count = 0;
    dim.items.forEach((it) => {
      const raw = answers[it.id];
      if (raw != null) {
        sum += itemScore(it, raw);
        count++;
      }
    });
    // scenario contributes to the dimension too (already directional 1-5)
    if (dim.scenario) {
      const sv = answers[dim.scenario.id];
      if (sv != null) {
        sum += sv;
        count++;
      }
    }
    const avg = count ? sum / count : 3; // 1..5
    const pct = Math.round(((avg - 1) / 4) * 100); // 0..100
    dimResults[dim.id] = { dim, avg, pct };

    // critical flag: a critical dimension in the danger band
    if (dim.critical && pct < 40) {
      critFlags.push(dim);
    }

    // consistency (honesty) check: claim Likert vs scenario behavior
    if (dim.scenario && dim.scenario.claimItem) {
      const claim = answers[dim.scenario.claimItem];
      const beh = answers[dim.scenario.id];
      if (claim != null && beh != null) {
        const gap = claim - beh; // positive => says better than behaves
        if (gap >= 2) {
          consistencyGaps.push({ dim, gap });
        }
      }
    }
  });

  // ---- axis scores (mean of member dimensions) ----
  const axisAvg = (axisId: AxisId): number => {
    const ds = dimensions.filter((d) => d.axis === axisId);
    const m = ds.reduce((a, d) => a + dimResults[d.id].pct, 0) / ds.length;
    return Math.round(m);
  };
  let resilience = axisAvg('resilience');
  let readiness = axisAvg('readiness');

  // ---- ABSTENTION ADJUSTMENT (anti-gaming) ----
  // Very low real AI usage means readiness cannot be quietly "protected" by
  // simply not using AI. We dampen readiness toward its true exposure and mark
  // the abstainer signal so the report names the trade-off honestly.
  let abstainer = false;
  if (usageVal != null && usageVal <= 2) {
    abstainer = true;
    const damp = usageVal === 1 ? 0.55 : 0.72;
    readiness = Math.round(readiness * damp);
  }

  // overall index (kept as an internal sub-metric, not the headline)
  const overall = Math.round((resilience + readiness) / 2);

  // ---- persona from the 2x2 ----
  // Thresholds set above the neutral midpoint (50) so that genuinely strong
  // answers, not merely neutral ones, earn the high-axis personas.
  const RT = 58;
  const DT = 58;
  const hiR = resilience >= RT;
  const hiD = readiness >= DT;
  let pkey: PersonaKey;
  if (hiR && hiD) pkey = 'guide';
  else if (hiR && !hiD) pkey = 'anchor';
  else if (!hiR && hiD) pkey = 'sprinter';
  else pkey = 'wanderer';
  const persona = personas[pkey];

  // ---- productivity illusion gap ----
  // baseline optimism (B1, 1..5) vs measured band (overall mapped to 1..5)
  const measuredBand = overall >= 80 ? 5 : overall >= 62 ? 4 : overall >= 44 ? 3 : overall >= 26 ? 2 : 1;
  const illusion = (baseline?.b1 ?? 3) - measuredBand; // + => felt better than it is

  // ---- top strengths / risks (by dimension pct) ----
  const ranked = Object.values(dimResults).slice().sort((a, b) => b.pct - a.pct);
  const strengths = ranked.slice(0, 3);
  const risks = ranked.slice(-3).reverse();

  return {
    dimResults, resilience, readiness, overall,
    persona, pkey, critFlags, consistencyGaps, abstainer, usageVal,
    illusion, measuredBand, strengths, risks, baseline
  };
};

// Named blind spots / anti-gaming reveal. Shared by the results screen and the
// emailed PDF so both tell the same story.
export const vulnList = (R: CompassResult): Array<{ title: string; body: string }> => {
  const items: Array<{ title: string; body: string }> = [];
  if (R.abstainer) {
    items.push({
      title: 'The abstention trade-off',
      body: 'You use AI very little, which protects your independent thinking, that is real. But avoiding AI is not the same as being safe. The skills employers now rank highest include the AI fluency you are skipping, and that gap widens every year. Your resilience is high; your readiness is quietly exposed. Safety today is not preparedness for tomorrow.'
    });
  }
  if (R.illusion >= 2) {
    items.push({
      title: 'A productivity-illusion gap',
      body: `You predicted this modality was considerably healthier than your own answers show (a gap of +${R.illusion} on our scale). This is the single most documented effect in the field: better output makes us feel more capable while we quietly become less so. Trust the measurement here, not the feeling.`
    });
  } else if (R.illusion <= -1) {
    items.push({
      title: 'You are harder on yourself than the evidence',
      body: 'You expected a worse result than your answers produced. A little humility is healthy, but do not discount genuine strengths, build on them.'
    });
  }
  if (R.consistencyGaps.length) {
    const names = R.consistencyGaps.map((g) => g.dim.title).join(', ');
    items.push({
      title: 'Where intention and habit diverge',
      body: `On ${names}, what you say you do and what actually happens in the real moment do not line up, the behavior is weaker than the claim. This is normal and human, but it is exactly where good intentions quietly fail. Watch these in practice, not just in principle.`
    });
  }
  if (R.critFlags.length) {
    const names = R.critFlags.map((d) => d.title).join(', ');
    items.push({
      title: 'A critical dimension in the danger zone',
      body: `${names} ${R.critFlags.length > 1 ? 'are' : 'is'} scoring low enough to matter regardless of your overall result. A high average can hide a single serious vulnerability, an isolated learner leaning on AI for companionship, or a mind that cannot work unaided. Do not let the headline number reassure you here.`
    });
  }
  if (R.pkey === 'sprinter') {
    items.push({
      title: 'You can pass and still be exposed',
      body: 'High readiness can mask low resilience. You look future-ready, and you are, but the capacity underneath is thinning. The test you should fear is not the one with AI; it is the one without it.'
    });
  }
  if (!items.length) {
    items.push({
      title: 'Stay watchful',
      body: 'No major vulnerabilities surfaced, which is rare and worth protecting. The danger now is complacency: re-take this in a few months and make sure you are still moving toward The Guide, not drifting back.'
    });
  }
  return items;
};

// Four-band formation ramp (0-39 Eroding, 40-59 Emerging, 60-79 Forming,
// 80-100 Flourishing). Used for every score, bar, ring, and the radar fill.
export const bandOf = (pct: number): Band => {
  if (pct >= 80) return { key: 'flourishing', label: 'Flourishing', color: 'var(--growth)' };
  if (pct >= 60) return { key: 'forming', label: 'Forming', color: 'var(--growth-bright)' };
  if (pct >= 40) return { key: 'emerging', label: 'Emerging', color: 'var(--amber)' };
  return { key: 'eroding', label: 'Eroding', color: 'var(--crimson)' };
};

// Hex equivalents of the band colors, for non-CSS contexts (PDF, charts).
export const bandHex = (pct: number): string => (pct >= 80 ? '#2F6F62' : pct >= 60 ? '#3E8C7C' : pct >= 40 ? '#C58A33' : '#9E1D20');

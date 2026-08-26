/**
 * Developmental continuum (§26-§37): continuous index → 10 stages with
 * substages, gating for advanced stages (§36), borderline handling (§4.2 fix),
 * bottleneck detection (§34), and next-target logic (§32).
 */
import type { Bottleneck, ConstructId, DimensionResult, StageResult, UsageProfile } from "./types";
import { CONSTRUCTS, STAGES, CONTINUUM, type StageDef } from "./config";
import { round1 } from "./scoring";

type Dims = Record<ConstructId, DimensionResult>;

/** Weighted developmental index, 0..100. Weights live in config.CONSTRUCTS. */
export function developmentalIndex(dims: Dims): number {
  let sum = 0;
  for (const def of Object.values(CONSTRUCTS)) sum += dims[def.id].score * def.continuumWeight;
  return round1(sum);
}

function stageForIndex(index: number): StageDef {
  let cur = STAGES[0];
  for (const s of STAGES) if (index >= s.minIndex) cur = s;
  return cur;
}

/** The highest stage a profile's gates allow, regardless of index (§36). */
function gateCap(dims: Dims): { cap: number; reasons: string[] } {
  let cap = STAGES.length;
  let reasons: string[] = [];
  for (const s of STAGES) {
    if (!s.gates) continue;
    const failed = Object.entries(s.gates)
      .filter(([c, min]) => dims[c as ConstructId].score < (min as number))
      .map(([c, min]) => `${CONSTRUCTS[c as ConstructId].name} is ${dims[c as ConstructId].score}, and stage ${s.stage} (${s.name}) requires at least ${min}`);
    if (failed.length > 0) { cap = Math.min(cap, s.stage - 1); if (reasons.length === 0) reasons = failed; }
  }
  return { cap, reasons };
}

export function placeOnContinuum(dims: Dims): StageResult {
  const rawIndex = developmentalIndex(dims);
  const byIndex = stageForIndex(rawIndex);
  const { cap, reasons } = gateCap(dims);

  let stageDef = byIndex;
  let gated: StageResult["gated"];
  if (byIndex.stage > cap) {
    stageDef = STAGES[Math.max(0, cap - 1)];
    gated = { cappedFrom: byIndex.stage, reasons };
  }

  // substage within the stage's index band
  const next = STAGES.find(s => s.stage === stageDef.stage + 1);
  const bandStart = stageDef.minIndex;
  const bandEnd = next ? next.minIndex : 100;
  const pos = Math.max(0, Math.min(1, (rawIndex - bandStart) / Math.max(1, bandEnd - bandStart)));
  const substage = pos < CONTINUUM.substageEarly ? "early"
    : pos < CONTINUUM.substageEstablished ? "established" : "transitioning";

  // borderline: within the band of a boundary in either direction, on the ungated stage
  let borderline: StageResult["borderline"];
  if (!gated) {
    const distUp = next ? next.minIndex - rawIndex : Infinity;
    const distDown = rawIndex - bandStart;
    if (distUp <= CONTINUUM.borderlineBand) borderline = { adjacentStage: stageDef.stage + 1, distance: round1(distUp) };
    else if (distDown <= CONTINUUM.borderlineBand && stageDef.stage > 1) borderline = { adjacentStage: stageDef.stage - 1, distance: round1(distDown) };
  }

  return {
    index: gated ? round1(Math.min(rawIndex, (STAGES.find(s => s.stage === stageDef.stage + 1)?.minIndex ?? 100) - 0.1)) : rawIndex,
    rawIndex,
    stage: stageDef.stage, stageId: stageDef.id, stageName: stageDef.name,
    substage, borderline, gated,
  };
}

export function nextTarget(stage: StageResult): { stage: number; stageName: string; requirements: string[] } {
  const current = STAGES.find(s => s.stage === stage.stage)!;
  const next = STAGES.find(s => s.stage === stage.stage + 1);
  if (!next) {
    return { stage: current.stage, stageName: current.name,
      requirements: current.transitionRequirements };
  }
  const reqs = [...current.transitionRequirements];
  if (stage.gated) reqs.unshift(...stage.gated.reasons.map(r => `Close the gate: ${r}.`));
  return { stage: next.stage, stageName: next.name, requirements: reqs };
}

/**
 * §34: the bottleneck is the greatest developmental constraint, not necessarily
 * the lowest score. Gating failures dominate; otherwise the constraint is the
 * construct with the largest weighted deficit against the next stage's gates
 * (or against a healthy floor of 60 when the next stage has no gates).
 */
export function findBottleneck(dims: Dims, stage: StageResult): Bottleneck {
  if (stage.gated) {
    // first failed gate names the construct
    const firstReason = stage.gated.reasons[0];
    const construct = (Object.values(CONSTRUCTS).find(c => firstReason.startsWith(c.name))?.id ?? "verification") as ConstructId;
    return { construct, viaGate: true,
      reason: `Your developmental index (${stage.rawIndex}) already supports a higher stage, but ${CONSTRUCTS[construct].name.toLowerCase()} is holding the classification down. ${firstReason}. Raising it unlocks the stage your other capabilities have earned.` };
  }
  const next = STAGES.find(s => s.stage === stage.stage + 1);
  const targets: Partial<Record<ConstructId, number>> = next?.gates ?? {};
  let best: { c: ConstructId; deficit: number } | null = null;
  for (const def of Object.values(CONSTRUCTS)) {
    const floor = (targets[def.id] ?? 60);
    const deficit = Math.max(0, floor - dims[def.id].score) * def.continuumWeight;
    if (!best || deficit > best.deficit) best = { c: def.id, deficit };
  }
  const c = best!.c;
  if (best!.deficit <= 0.1) {
    return { construct: c, viaGate: false, saturated: true,
      reason: "No single dimension is holding you back sharply; progression now comes from consolidating the whole pattern under changing tools and higher-stakes work." };
  }
  return { construct: c, viaGate: false,
    reason: `The largest single constraint on your progression is ${CONSTRUCTS[c].name.toLowerCase()} (currently ${dims[c].score}). It is not necessarily your lowest number, but given how the next stage is defined, it is the capability whose growth would move you furthest.` };
}

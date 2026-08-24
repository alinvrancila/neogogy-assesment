/**
 * Orchestrator. Isomorphic (no I/O): safe on client and server, like v1's
 * engine.ts, and therefore usable for retroactive rescoring of stored records.
 */
import type { CompassResult, ConstructId, Submission } from "./types";
import { SCORING } from "./config";
import {
  scoreDimensions, usageProfile, composites, calibration, overallConfidence,
} from "./scoring";
import { detectPatterns } from "./patterns";
import { placeOnContinuum, nextTarget, findBottleneck, developmentalIndex } from "./continuum";
import { classify, fingerprint } from "./archetypes";
import { buildRecommendations } from "./recommendations";

export { generateReport } from "./narrative";
export { applicableItems, allItems } from "./scoring";
export * from "./types";

export function compute(sub: Submission): CompassResult {
  const { dims, gaps, signals } = scoreDimensions(sub.persona, sub);
  const up = usageProfile(sub, dims);
  const comp = composites(dims, up);
  const patterns = detectPatterns(dims, up);
  const stage = placeOnContinuum(dims);
  const target = nextTarget(stage);
  const bottleneck = findBottleneck(dims, stage);
  const archetype = classify(dims, up);
  const recs = buildRecommendations(signals, bottleneck, up);
  const calib = calibration(sub, stage.rawIndex);
  const conf = overallConfidence(sub.persona, sub, gaps.filter(g => g.flagged).length);

  const entries = Object.values(dims);
  const strengths = entries.filter(d => d.score >= SCORING.strengthFloor)
    .sort((a, b) => b.score - a.score).slice(0, 5)
    .map(d => ({ construct: d.construct, score: d.score }));
  const vulnerabilities = entries.filter(d => d.score <= SCORING.vulnerabilityCeiling)
    .sort((a, b) => a.score - b.score).slice(0, 5)
    .map(d => ({ construct: d.construct, score: d.score }));

  return {
    persona: sub.persona,
    usageProfile: up,
    dimensions: dims,
    composites: comp,
    patterns,
    riskSignals: signals,
    strengths,
    vulnerabilities,
    stage,
    nextTarget: target,
    bottleneck,
    archetype,
    fingerprint: fingerprint(dims, comp),
    recommendations: recs,
    calibration: calib,
    overallConfidence: conf.level,
    confidenceNotes: conf.notes,
  };
}

export { developmentalIndex };

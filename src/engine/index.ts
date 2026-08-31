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
import { archetypeDisplay, stageName } from "./display";
import { buildRiskRegister, buildNinetyDayPlan } from "./business";

export {
  generateReport, generateReportSections, reportHead, confidenceLabel, REPORT_DISCLAIMER,
  dimensionDetails, fingerprintReadings, improvementPlan,
  type ReportSection, type ReportSectionKey, type ReportHead, type DimensionDetail,
} from "./narrative";
export { applicableItems, allItems } from "./scoring";
export * from "./types";

export function compute(sub: Submission): CompassResult {
  const { dims, gaps, signals } = scoreDimensions(sub.persona, sub);
  const up = usageProfile(sub, dims);
  const comp = composites(dims, up);
  const patterns = detectPatterns(dims, up, sub.persona);
  const stage = placeOnContinuum(dims, sub.persona);
  const target = nextTarget(stage);
  // Stage and archetype names are display, so they are resolved once here and
  // every consumer, including a stored record, carries the persona's language.
  stage.stageName = stageName(sub.persona, stage.stage);
  target.stageName = stageName(sub.persona, target.stage);
  const bottleneck = findBottleneck(dims, stage, sub.persona);
  const archetype = classify(dims, up);
  const recs = buildRecommendations(signals, bottleneck, up, sub.persona);
  const calib = calibration(sub, stage.rawIndex);
  const conf = overallConfidence(sub.persona, sub, gaps.filter(g => g.flagged).length);

  const entries = Object.values(dims);
  const strengths = entries.filter(d => d.score >= SCORING.strengthFloor)
    .sort((a, b) => b.score - a.score).slice(0, 5)
    .map(d => ({ construct: d.construct, score: d.score }));
  const vulnerabilities = entries.filter(d => d.score <= SCORING.vulnerabilityCeiling)
    .sort((a, b) => a.score - b.score).slice(0, 5)
    .map(d => ({ construct: d.construct, score: d.score }));

  const isBusiness = sub.persona === "business";
  const riskRegister = isBusiness ? buildRiskRegister(signals, patterns, recs, dims, sub.persona) : [];
  const ninetyDayPlan = isBusiness ? buildNinetyDayPlan(recs, riskRegister, up) : [];

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
    archetype: archetypeDisplay(sub.persona, archetype),
    fingerprint: fingerprint(dims, comp, sub.persona),
    recommendations: recs,
    calibration: calib,
    overallConfidence: conf.level,
    confidenceNotes: conf.notes,
    riskRegister,
    ninetyDayPlan,
  };
}

export { developmentalIndex };

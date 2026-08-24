/**
 * Report narrative engine (§42-§48). Produces the structured personalized
 * report as markdown. Every major conclusion is tied to evidence (§44), and
 * limited evidence is stated, not papered over (§46). Strengths and
 * vulnerabilities appear only when genuinely present: a strong profile is
 * TOLD it is strong (fixes v1's guaranteed-non-empty blind spots and
 * always-3 risks), and its remaining risk is named honestly as maintenance.
 */
import type { CompassResult, ConstructId } from "./types";
import { CONSTRUCTS, STAGES } from "./config";
import { helpHarm } from "./patterns";

const PERSONA_LABEL: Record<string, string> = {
  student: "student", teacher: "teacher", parent: "parent", administrator: "educational leader",
};

const CONF_LABEL: Record<string, string> = {
  high: "High confidence", moderate: "Moderate confidence",
  preliminary: "Preliminary profile", insufficient: "Insufficient evidence",
};

function dimLine(r: CompassResult, c: ConstructId): string {
  const d = r.dimensions[c];
  const def = CONSTRUCTS[c];
  const shown = def.reportedAsRisk
    ? `Dependency Risk ${d.reportedScore} (independent capability ${d.score})`
    : `${def.name} ${d.score}`;
  const conf = d.confidence !== "high" ? ` · ${CONF_LABEL[d.confidence].toLowerCase()}` : "";
  const gap = d.consistencyGap?.flagged
    ? ` · note: your self-description here ran ahead of your situational answers, so the situational evidence was weighted more heavily`
    : "";
  return `- **${shown}** (${d.microState})${conf}${gap}. ${def.principle}`;
}

export function generateReport(r: CompassResult): string {
  const L: string[] = [];
  const stageDef = STAGES.find(s => s.stage === r.stage.stage)!;
  const hh = helpHarm(r.patterns);

  // 1. Executive profile
  L.push(`# Neogogy Formation Compass · Personal Report`);
  L.push(`*Profile for a ${PERSONA_LABEL[r.persona]} · ${CONF_LABEL[r.overallConfidence]}*`);
  L.push(``);
  L.push(`## 1. Executive profile`);
  L.push(`**Archetype: ${r.archetype.name}.** ${r.archetype.tagline}`);
  L.push(``);
  L.push(r.archetype.narrative);
  L.push(``);
  L.push(`**Fingerprint:** ${r.fingerprint.join(" · ")}`);
  if (r.confidenceNotes.length) {
    L.push(``);
    for (const n of r.confidenceNotes) L.push(`> ${n}`);
  }

  // 2. Continuum position
  L.push(``);
  L.push(`## 2. Your position on the Neogogy continuum`);
  L.push(`**Stage ${r.stage.stage} of 10: ${r.stage.stageName}** (${r.stage.substage}) · developmental index ${r.stage.rawIndex}.`);
  L.push(``);
  L.push(stageDef.short);
  if (r.stage.borderline) {
    L.push(``);
    L.push(`You are within ${r.stage.borderline.distance} points of stage ${r.stage.borderline.adjacentStage}; treat this placement as a zone, not a verdict. Small, real changes in habit will move it.`);
  }
  if (r.stage.gated) {
    L.push(``);
    L.push(`Your overall index would support stage ${r.stage.gated.cappedFrom}, but advanced stages require minimum thresholds on the safety-critical dimensions, and one of yours sits below the line: ${r.stage.gated.reasons[0]}. This is deliberate: strong fluency is not allowed to paper over weak judgment.`);
  }

  // 3. Developmental signature (dimensions)
  L.push(``);
  L.push(`## 3. Your developmental signature`);
  for (const c of Object.keys(CONSTRUCTS) as ConstructId[]) L.push(dimLine(r, c));
  L.push(``);
  L.push(`Composites: future readiness ${r.composites.futureReadiness} · augmentation ${r.composites.augmentation} · judgment ${r.composites.judgment} · capability transfer ${r.composites.capabilityTransfer} · dependency index ${r.composites.dependencyIndex} · underexposure ${r.composites.underexposure}.`);

  // 4-5. Help / harm
  L.push(``);
  L.push(`## 4. Where AI appears to be helping you`);
  if (hh.helping.length) for (const p of hh.helping) L.push(`- **${p.label}.** ${p.narrative}`);
  else if (r.usageProfile.usage <= 2) L.push(`With limited current use, there is little evidence either way here; this section will become meaningful as real exposure accumulates.`);
  else {
    const strongIso = r.strengths.filter(x => ["amplification", "fluency", "creativity"].includes(x.construct));
    if (strongIso.length) {
      L.push(`Individual dimensions show real promise (${strongIso.map(x => CONSTRUCTS[x.construct].name).join(", ")}), but the corroborating pattern that would confirm genuine benefit, where amplification travels with transfer and independent capability, has not yet formed. The ingredients are present; the compound is not.`);
    } else {
      L.push(`Your responses show serviceable use, but no strong evidence yet that AI is deepening understanding, widening options, or building capability rather than output. That is the opportunity, not an accusation.`);
    }
  }
  L.push(``);
  L.push(`## 5. Where AI may be working against you`);
  if (hh.harming.length) for (const p of hh.harming) L.push(`- **${p.label}.** ${p.narrative}`);
  else L.push(`No harm pattern crossed its threshold in your responses. That is a genuinely good result; the honest caveat is that this instrument sees what you reported, and its protective value depends on your answers staying honest as your use grows.`);
  if (hh.mixed.length) {
    L.push(``);
    for (const p of hh.mixed) L.push(`- *${p.label}.* ${p.narrative}`);
  }

  // 6. Strengths / vulnerabilities (only genuine ones)
  L.push(``);
  L.push(`## 6. Strengths and vulnerabilities`);
  if (r.strengths.length) L.push(`**Genuine strengths:** ${r.strengths.map(x => `${CONSTRUCTS[x.construct].name} (${x.score})`).join(", ")}.`);
  else L.push(`No dimension yet clears the bar for a genuine strength (65+). Nothing is collapsing either; your profile's story is formation, not repair.`);
  if (r.vulnerabilities.length) L.push(`**Genuine vulnerabilities:** ${r.vulnerabilities.map(x => `${CONSTRUCTS[x.construct].name} (${x.score})`).join(", ")}.`);
  else L.push(`No dimension falls below the vulnerability line (45). This report will not manufacture three risks to fill a template.`);

  // 7. Self-knowledge
  L.push(``);
  L.push(`## 7. Self-knowledge check`);
  L.push(r.calibration.note);
  if (r.calibration.calibrationGap !== undefined && Math.abs(r.calibration.calibrationGap) >= 2) {
    L.push(``);
    L.push(`Separately from how healthy things *feel*, your *prediction* of this result missed by ${Math.abs(r.calibration.calibrationGap)} bands. Calibration, knowing what your own result will be, is itself a skill this instrument tracks, and yours has room to grow.`);
  }

  // 8. Bottleneck
  L.push(``);
  L.push(`## 8. What is keeping you here`);
  L.push(r.bottleneck.reason);

  // 9. Next stage
  L.push(``);
  L.push(`## 9. Your next stage`);
  L.push(`**Target: Stage ${r.nextTarget.stage}, ${r.nextTarget.stageName}.** To get there:`);
  for (const req of r.nextTarget.requirements) L.push(`- ${req}`);

  // 10. Roadmap
  L.push(``);
  L.push(`## 10. Your development roadmap`);
  for (const rec of r.recommendations) {
    L.push(`### ${rec.capability} *(${rec.priority})*`);
    L.push(`**Change:** ${rec.behaviorChange}`);
    L.push(`**Practice:** ${rec.practice}`);
    L.push(`**Progress looks like:** ${rec.evidenceOfProgress}`);
    L.push(`**Watch for:** ${rec.riskToMonitor}`);
    L.push(``);
  }

  // 11. Personal experiment (§16 of the report structure)
  L.push(`## 11. One experiment to run on yourself`);
  L.push(`Take two comparable tasks from your real week. Do one with AI as you normally would, one without. Afterward compare not just time and quality, but what you can still explain, remember, and redo a week later. That comparison, run occasionally and honestly, is the best ongoing test of whether AI is building you or replacing you.`);

  L.push(``);
  L.push(`---`);
  L.push(`*These results are assessment indices derived from your self-reported responses; they describe patterns your answers are consistent with, not clinical or validated psychometric measurements.*`);
  return L.join("\n");
}

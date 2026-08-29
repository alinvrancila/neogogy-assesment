/**
 * Report narrative engine (§42-§48). Produces the structured personalized
 * report as markdown. Every major conclusion is tied to evidence (§44), and
 * limited evidence is stated, not papered over (§46). Strengths and
 * vulnerabilities appear only when genuinely present: a strong profile is
 * TOLD it is strong (fixes v1's guaranteed-non-empty blind spots and
 * always-3 risks), and its remaining risk is named honestly as maintenance.
 *
 * Structure (Part E, Phase 3): generateReportSections() returns the report as
 * keyed sections so the on-screen results and the PDF can render the same
 * prose in their own layouts. generateReport() composes those sections into
 * the markdown document. Section prose lives here and nowhere else; the
 * screen and PDF layers are layout only.
 */
import type { CompassResult, ConstructId } from "./types";
import { CONSTRUCTS, STAGES } from "./config";
import { CONSTRUCT_CONTENT, STAGE_DETAIL, EVIDENCE_BASE, FRAMEWORK_SOURCES } from "./content";
import { helpHarm } from "./patterns";

const PERSONA_LABEL: Record<string, string> = {
  student: "student", teacher: "teacher", parent: "parent", administrator: "educational leader",
};

const CONF_LABEL: Record<string, string> = {
  high: "High confidence", moderate: "Moderate confidence",
  preliminary: "Preliminary profile", insufficient: "Insufficient evidence",
};

export type ReportSectionKey =
  | "profile" | "continuum" | "signature" | "helping" | "harming"
  | "strengths" | "selfKnowledge" | "bottleneck" | "nextStage"
  | "roadmap" | "plan" | "evidence" | "experiment";

export interface ReportSection {
  key: ReportSectionKey;
  /** 1..11, the numbering used in the markdown report. */
  n: number;
  title: string;
  /** Markdown body lines, without the section heading. */
  lines: string[];
}

export interface ReportHead {
  title: string;
  subtitle: string;
}

export const REPORT_DISCLAIMER =
  "These results are assessment indices derived from your self-reported responses; they describe patterns your answers are consistent with, not clinical or validated psychometric measurements.";

export function reportHead(r: CompassResult): ReportHead {
  return {
    title: "Neogogy Formation Compass · Personal Report",
    subtitle: `Profile for a ${PERSONA_LABEL[r.persona]} · ${CONF_LABEL[r.overallConfidence]}`,
  };
}

export function confidenceLabel(level: string): string {
  return CONF_LABEL[level] ?? level;
}

function bandReading(r: CompassResult, c: ConstructId): string {
  const content = CONSTRUCT_CONTENT[c];
  const st = r.dimensions[c].microState;
  return st === "strong" ? content.atStrong : st === "developing" ? content.atDeveloping : content.atWatch;
}

function dimLine(r: CompassResult, c: ConstructId): string {
  const d = r.dimensions[c];
  const def = CONSTRUCTS[c];
  const shown = def.reportedAsRisk
    ? `Dependency Risk ${d.reportedScore} (independent capability ${d.score})`
    : `${def.name} ${d.score}`;
  const conf = d.confidence !== "high" ? ` · ${CONF_LABEL[d.confidence].toLowerCase()}` : "";
  return `- **${shown}** (${d.microState})${conf}. ${def.principle}`;
}

/** The unpacked treatment: what it measures, how you read, and the evidence. */
function dimBlock(r: CompassResult, c: ConstructId): string[] {
  const d = r.dimensions[c];
  const def = CONSTRUCTS[c];
  const content = CONSTRUCT_CONTENT[c];
  const shown = def.reportedAsRisk
    ? `Dependency Risk ${d.reportedScore}, independent capability ${d.score}`
    : `${def.name} ${d.score}`;
  const L: string[] = [];
  L.push(`### ${shown}`);
  L.push(`*What this measures.* ${content.whatItMeasures}`);
  L.push(`*Why it matters.* ${content.whyItMatters}`);
  L.push(`*Your reading.* ${bandReading(r, c)}`);
  if (d.consistencyGap?.flagged) {
    L.push(`*Worth noticing.* When you described yourself here you rated yourself higher than your answers to the real-situation questions suggested. That gap is common and human. We gave more weight to what you said you would actually do, because what happens under pressure describes a habit better than what we intend.`);
  }
  if (d.confidence !== "high") {
    L.push(`*How sure we are:* ${CONF_LABEL[d.confidence].toLowerCase()}. Fewer of your answers spoke to this one, so treat it as something to think about rather than a firm finding.`);
  }
  L.push(`*Research.* ${content.research.claim} (${content.research.source})`);
  L.push(`*What moves it.*`);
  for (const pr of content.practices) L.push(`- ${pr}`);
  return L;
}

/** Immediate, 30 day and 90 day horizons, assembled from detected behaviour. */
export function improvementPlan(r: CompassResult): { horizon: string; timeframe: string; items: string[] }[] {
  const weakest = [...Object.values(r.dimensions)].sort((a, b) => a.score - b.score);
  const bottleneckContent = CONSTRUCT_CONTENT[r.bottleneck.construct];
  const secondary = weakest.find((d) => d.construct !== r.bottleneck.construct);

  const now: string[] = [];
  if (!r.bottleneck.saturated) {
    now.push(`Start where the constraint is: ${CONSTRUCTS[r.bottleneck.construct].name}. ${bottleneckContent.practices[0]}`);
  }
  const first = r.recommendations[0];
  if (first) now.push(`${first.capability}: ${first.practice}`);
  now.push(`Pick one recurring task this week and do it without AI, then compare it against how you would normally produce it. That comparison is the measurement everything else here depends on.`);

  const thirty: string[] = [];
  for (const rec of r.recommendations.slice(1, 3)) thirty.push(`${rec.capability}: ${rec.practice}`);
  if (secondary) {
    thirty.push(`${CONSTRUCTS[secondary.construct].name} is your next lowest reading. ${CONSTRUCT_CONTENT[secondary.construct].practices[0]}`);
  }
  if (!r.bottleneck.saturated) thirty.push(bottleneckContent.practices[1]);
  thirty.push(`Re-read your roadmap and mark which practices actually happened. A plan that is not reviewed becomes a document rather than a change.`);

  const ninety: string[] = [];
  for (const req of r.nextTarget.requirements.slice(0, 3)) ninety.push(req);
  ninety.push(`Retake this assessment. Your answers are stored with your result, so the comparison is like for like and will show movement rather than mood.`);
  ninety.push(`Set a recurring review of your own AI habits, whatever the result says. Adaptive Growth is the dimension that keeps every other one current.`);

  return [
    { horizon: "Start now", timeframe: "This week", items: now },
    { horizon: "Build the habit", timeframe: "Next 30 days", items: thirty },
    { horizon: "Move a stage", timeframe: "Next 90 days", items: ninety },
  ];
}

export interface DimensionDetail {
  construct: ConstructId;
  /** Name as reported, so dependencySafety reads as Dependency Risk. */
  label: string;
  /** The number shown to the respondent (risk-oriented for dependencySafety). */
  shown: number;
  /** The healthy-is-high reading, used for colour and banding. */
  healthy: number;
  /** Present only for dependencySafety. */
  independentCapability?: number;
  microState: "strong" | "developing" | "watch";
  confidence: string;
  confidenceLabel: string;
  flaggedGap: boolean;
  whatItMeasures: string;
  whyItMatters: string;
  reading: string;
  research: { claim: string; source: string };
  practices: string[];
}

/** Every dimension with its content, ready to render as a card. */
export function dimensionDetails(r: CompassResult): DimensionDetail[] {
  return (Object.keys(CONSTRUCTS) as ConstructId[]).map((c) => {
    const d = r.dimensions[c];
    const def = CONSTRUCTS[c];
    const content = CONSTRUCT_CONTENT[c];
    return {
      construct: c,
      label: def.reportedAsRisk ? "Dependency Risk" : def.name,
      shown: def.reportedAsRisk ? d.reportedScore : d.score,
      healthy: d.score,
      independentCapability: def.reportedAsRisk ? d.score : undefined,
      microState: d.microState,
      confidence: d.confidence,
      confidenceLabel: CONF_LABEL[d.confidence],
      flaggedGap: !!d.consistencyGap?.flagged,
      whatItMeasures: content.whatItMeasures,
      whyItMatters: content.whyItMatters,
      reading: bandReading(r, c),
      research: content.research,
      practices: content.practices,
    };
  });
}

/** The seven quick readings, split into label and level for meters. */
export function fingerprintReadings(r: CompassResult): Array<{ level: string; label: string }> {
  return r.fingerprint.map((f) => {
    const parts = f.split(" ");
    const level = parts.shift() ?? "";
    const rest = parts.join(" ").toLowerCase();
    return {
      level: level.charAt(0) + level.slice(1).toLowerCase(),
      label: (rest.charAt(0).toUpperCase() + rest.slice(1)).replace(/\bai\b/gi, "AI"),
    };
  });
}

/**
 * The report as keyed sections, in Part B10 order. Consumed by the results
 * screen, the PDF, and generateReport().
 */
export function generateReportSections(r: CompassResult): ReportSection[] {
  const stageDef = STAGES.find(s => s.stage === r.stage.stage)!;
  const hh = helpHarm(r.patterns);
  const S: ReportSection[] = [];

  // 1. Executive profile
  {
    const L: string[] = [];
    L.push(`Your answers describe a recognisable pattern, and this is the one they match most closely. It is a description of how you are working with AI right now, not a label for who you are.`);
    L.push(``);
    L.push(`**${r.archetype.name}.** ${r.archetype.tagline}`);
    L.push(``);
    L.push(r.archetype.narrative);
    L.push(``);
    // The fingerprint is stored in capitals for compactness. Sentence case reads
// better in prose, but "AI" has to stay an acronym.
    const readable = r.fingerprint.map((f) => {
      const lower = f.toLowerCase();
      const sentence = lower.charAt(0).toUpperCase() + lower.slice(1);
      return sentence.replace(/\bai\b/g, "AI");
    });
    L.push(`**The short version.** Seven quick readings of your profile:`);
    for (const f of readable) L.push(`- ${f}`);
    if (r.confidenceNotes.length) {
      L.push(``);
      for (const n of r.confidenceNotes) L.push(`> ${n}`);
    }
    S.push({ key: "profile", n: 1, title: "What your answers say about you", lines: L });
  }

  // 2. Continuum position
  {
    const L: string[] = [];
    const subPlain = r.stage.substage === "early"
      ? "you have recently arrived here"
      : r.stage.substage === "established"
        ? "you are settled in this stage"
        : "you are moving toward the next one";
    L.push(`**Stage ${r.stage.stage} of 10: ${r.stage.stageName}.** Your developmental index is ${r.stage.rawIndex} out of 100. That number is simply how far along the route your answers place you, where 0 is no meaningful use of AI and 100 is a mature, self-renewing practice. Within this stage, ${subPlain}.`);
    L.push(``);
    L.push(stageDef.short);
    L.push(``);
    const det = STAGE_DETAIL[r.stage.stage];
    if (det) {
      L.push(`*What this stage usually looks like.* ${det.looksLike}`);
      L.push(`*The trap at this stage.* ${det.trap}`);
    }
    L.push(``);
    L.push(`The full continuum runs: ${STAGES.map(x => `${x.stage}. ${x.name}`).join(", ")}.`);
    L.push(``);
    L.push(`Placement is continuous rather than a box you fall into, and the stages above you are reached by specific, nameable changes rather than by general improvement. Stages 5 and above also carry gates: minimum readings on agency, verification, independent capability, responsible use and transfer, so that fluency alone cannot carry someone past a weakness that matters.`);
    if (r.stage.borderline) {
      L.push(``);
      L.push(`You are within ${r.stage.borderline.distance} points of stage ${r.stage.borderline.adjacentStage}; treat this placement as a zone, not a verdict. Small, real changes in habit will move it.`);
    }
    if (r.stage.gated) {
      L.push(``);
      L.push(`Your overall index would support stage ${r.stage.gated.cappedFrom}, but advanced stages require minimum thresholds on the safety-critical dimensions, and one of yours sits below the line: ${r.stage.gated.reasons[0]}. This is deliberate: strong fluency is not allowed to paper over weak judgment.`);
    }
    S.push({ key: "continuum", n: 2, title: "Where you are on the route", lines: L });
  }

  // 3. Developmental signature
  {
    const L: string[] = [];
    L.push(`Ten dimensions, each scored 0 to 100. Higher is healthier on every one except Dependency Risk, which is shown as a risk, so lower is healthier there. Each carries its own confidence level, because some dimensions rest on more of your evidence than others.`);
    L.push(``);
    L.push(`**At a glance**`);
    for (const c of Object.keys(CONSTRUCTS) as ConstructId[]) L.push(dimLine(r, c));
    L.push(``);
    L.push(`**Six bigger questions.** Each of these combines several dimensions to answer something you probably want to know. On the first four, higher is better. On the last two, lower is better, because they measure a risk rather than a strength.`);
    L.push(`- **Are you ready for what is coming? ${r.composites.futureReadiness} out of 100.** How skilled and adaptable you are with these tools, reduced if you have had little real practice.`);
    L.push(`- **Is AI making your thinking better, or just faster? ${r.composites.augmentation} out of 100.** Higher means it is changing what you think, not only how quickly you produce it.`);
    L.push(`- **How sound is your judgment? ${r.composites.judgment} out of 100.** Checking, ownership of decisions, and clear boundaries, taken together.`);
    L.push(`- **Is assisted work becoming your own? ${r.composites.capabilityTransfer} out of 100.** Higher means what you do with AI is turning into something you can do without it.`);
    L.push(`- **How much depends on the tool? ${r.composites.dependencyIndex} out of 100.** Higher means more of what you produce would be hard to reproduce without AI.`);
    L.push(`- **Are you practising enough to keep up? ${r.composites.underexposure} out of 100.** Higher means limited hands-on practice. This is a different risk from dependency, and it is not the same as being careful.`);
    L.push(``);
    L.push(`**Each dimension, unpacked**`);
    for (const c of Object.keys(CONSTRUCTS) as ConstructId[]) L.push(...dimBlock(r, c));
    S.push({ key: "signature", n: 3, title: "Your ten dimensions, one at a time", lines: L });
  }

  // 4. Helping
  {
    const L: string[] = [];
    L.push(`This section reports patterns rather than scores. A pattern is a combination across several dimensions that means something the individual numbers do not: amplification travelling with transfer and retained independence, for example, is a different finding from any one of those being high on its own. Patterns are only reported when they actually cross their thresholds in your answers, so this section is sometimes short, and a short section here is information rather than an omission.`);
    L.push(``);
    if (hh.helping.length) {
      for (const p of hh.helping) L.push(`- **${p.label}.** ${p.narrative}`);
      L.push(``);
      L.push(`These are the parts of your practice worth protecting deliberately. Patterns like these are built slowly and lost quickly, usually not through a decision but through a busy period in which the habit underneath them quietly stops happening.`);
    } else if (r.usageProfile.usage <= 2) {
      L.push(`With limited current use, there is little evidence either way here; this section will become meaningful as real exposure accumulates.`);
    } else {
      const strongIso = r.strengths.filter(x => ["amplification", "fluency", "creativity"].includes(x.construct));
      if (strongIso.length) {
        L.push(`Individual dimensions show real promise (${strongIso.map(x => CONSTRUCTS[x.construct].name).join(", ")}), but the corroborating pattern that would confirm genuine benefit, where amplification travels with transfer and independent capability, has not yet formed. The ingredients are present; the compound is not.`);
      } else {
        L.push(`Your responses show serviceable use, but no strong evidence yet that AI is deepening understanding, widening options, or building capability rather than output. That is the opportunity, not an accusation.`);
      }
      L.push(``);
      L.push(`Worth saying plainly: benefit from these tools is not automatic. The largest documented learning gains came from the same technology used with deliberate design, roughly double the gains of established classroom practice (Kestin et al., Scientific Reports, 2025), while unrestricted use of the same kind of tool left learners around 17 percent worse on a later unaided exam (Bastani et al., PNAS, 2025). Same technology, opposite outcomes. The variable is how it is used, which is what this section is looking for.`);
    }
    S.push({ key: "helping", n: 4, title: "Where AI seems to be helping you", lines: L });
  }

  // 5. Harming
  {
    const L: string[] = [];
    if (hh.harming.length) {
      L.push(`Each item below fired because a specific combination in your answers crossed a threshold. None of them is a character judgment, and none is a prediction. They describe a pattern that your responses are consistent with today.`);
      L.push(``);
      for (const p of hh.harming) L.push(`- **${p.label}.** ${p.narrative}`);
      L.push(``);
      L.push(`The reason these matter more than a low score on its own is that they tend to be self-reinforcing. Work that is easier feels like work that is going well, so the pattern removes the very signal that would prompt you to change it. That is why this instrument asks about situations rather than only about opinions.`);
    } else {
      L.push(`No harm pattern crossed its threshold in your responses. That is a genuinely good result, and it is worth stating plainly rather than hedging into a warning.`);
      L.push(``);
      L.push(`Two honest caveats. This instrument sees what you reported, so its protective value depends on your answers staying honest as your use grows. And harm patterns here are combinations, not single readings: a dimension can be soft without any pattern firing, so read your signature above alongside this.`);
    }
    if (hh.mixed.length) {
      L.push(``);
      for (const p of hh.mixed) L.push(`- *${p.label}.* ${p.narrative}`);
    }
    S.push({ key: "harming", n: 5, title: "Where AI may be working against you", lines: L });
  }

  // 6. Strengths and vulnerabilities
  {
    const L: string[] = [];
    L.push(`These lists have a floor and a ceiling rather than a fixed length. A dimension is named a strength only at 65 or above, and a vulnerability only at 45 or below. Either list can be empty, and an empty list is a real result: this report does not fill a template with three strengths and three risks regardless of what you reported.`);
    L.push(``);
    if (r.strengths.length) {
      L.push(`**Genuine strengths:** ${r.strengths.map(x => `${CONSTRUCTS[x.construct].name} (${x.score})`).join(", ")}.`);
      L.push(``);
      for (const x of r.strengths.slice(0, 3)) {
        L.push(`- **${CONSTRUCTS[x.construct].name}.** ${CONSTRUCT_CONTENT[x.construct].atStrong}`);
      }
      L.push(``);
      L.push(`Strengths are worth naming because they are what you build the rest on, and because they are the thing most likely to be assumed rather than maintained.`);
    } else {
      L.push(`No dimension yet clears the bar for a genuine strength, which is 65. Nothing is collapsing either. Your profile's story at the moment is formation rather than repair, and that is a more workable starting point than it sounds.`);
    }
    L.push(``);
    if (r.vulnerabilities.length) {
      L.push(`**Genuine vulnerabilities:** ${r.vulnerabilities.map(x => `${CONSTRUCTS[x.construct].name} (${x.score})`).join(", ")}.`);
      L.push(``);
      for (const x of r.vulnerabilities.slice(0, 3)) {
        const c = CONSTRUCT_CONTENT[x.construct];
        L.push(`- **${CONSTRUCTS[x.construct].name} (${x.score}).** ${c.atWatch} A first step: ${c.practices[0].charAt(0).toLowerCase()}${c.practices[0].slice(1)}`);
      }
    } else {
      L.push(`No dimension falls below the vulnerability line, which is 45. That is worth reading as the genuine result it is, rather than as an invitation to look harder for something wrong.`);
    }
    S.push({ key: "strengths", n: 6, title: "What you do well, and what needs attention", lines: L });
  }

  // 7. Self-knowledge
  {
    const L: string[] = [];
    L.push(`Before answering anything, you told us two things: how healthy your relationship with AI feels, and where you expected this result to land. Neither was scored. They are compared with your measured result here, because they measure two different things and both are useful.`);
    L.push(``);
    L.push(`**The first is about feel.** It is the gap between how good something feels and how it measures. It is the most documented effect in this field: assistance improves the visible output, the improved output feels like improved capability, and the feeling persists even as the underlying capability moves the other way (Bastani et al., PNAS, 2025). **The second is about aim.** It is simply how close your prediction came, which is worth knowing on its own, because people who can predict their own performance tend to manage it better.`);
    L.push(``);
    L.push(r.calibration.note);
    if (r.calibration.calibrationGap !== undefined && Math.abs(r.calibration.calibrationGap) >= 2) {
      L.push(``);
      L.push(`Separately from how healthy things *feel*, your *prediction* of this result missed by ${Math.abs(r.calibration.calibrationGap)} bands. Calibration, knowing what your own result will be, is itself a skill this instrument tracks, and yours has room to grow.`);
    }
    S.push({ key: "selfKnowledge", n: 7, title: "How your sense of it compares with your answers", lines: L });
  }

  // 8. Bottleneck
  {
    const L: string[] = [];
    L.push(r.bottleneck.reason);
    if (!r.bottleneck.saturated) {
      const bc = CONSTRUCT_CONTENT[r.bottleneck.construct];
      L.push(``);
      L.push(`*Why this one and not your lowest score.* A bottleneck is the dimension doing most to hold your position, which is not always the weakest number. A low reading on a lightly weighted dimension can matter less than a middling reading on one that gates the stages above you.`);
      L.push(``);
      L.push(`*What it measures.* ${bc.whatItMeasures}`);
      L.push(`*Why it matters here.* ${bc.whyItMatters}`);
      L.push(`*Research.* ${bc.research.claim} (${bc.research.source})`);
      L.push(``);
      L.push(`*The three practices that move it*`);
      for (const pr of bc.practices) L.push(`- ${pr}`);
    }
    S.push({ key: "bottleneck", n: 8, title: "Why you are at this stage and not the next one", lines: L });
  }

  // 9. Next stage
  {
    const L: string[] = [];
    const atTop = r.nextTarget.stage === r.stage.stage;
    L.push(`**Target: Stage ${r.nextTarget.stage}, ${r.nextTarget.stageName}.**`);
    const nd = STAGE_DETAIL[r.nextTarget.stage];
    if (nd) {
      L.push(``);
      L.push(atTop
        ? `You are at the far end of the continuum, so the work changes from climbing to holding. ${nd.looksLike}`
        : `*What it looks like from there.* ${nd.looksLike}`);
      L.push(`*What to watch for once you arrive.* ${nd.trap}`);
    }
    L.push(``);
    L.push(atTop ? `To hold this position:` : `To get there:`);
    for (const req of r.nextTarget.requirements) L.push(`- ${req}`);
    L.push(``);
    L.push(`Movement on this continuum comes from changed habits rather than changed intentions, and it shows up first in the situational answers rather than in how you would describe yourself.`);
    S.push({ key: "nextStage", n: 9, title: "Your next stage", lines: L });
  }

  // 10. Roadmap
  {
    const L: string[] = [];
    for (const rec of r.recommendations) {
      L.push(`### ${rec.capability} *(${rec.priority})*`);
      L.push(`**Change:** ${rec.behaviorChange}`);
      L.push(`**Practice:** ${rec.practice}`);
      L.push(`**Progress looks like:** ${rec.evidenceOfProgress}`);
      L.push(`**Watch for:** ${rec.riskToMonitor}`);
      L.push(``);
    }
    S.push({ key: "roadmap", n: 10, title: "Your practices, in detail", lines: L });
  }

  // 11. Improvement plan
  {
    const L: string[] = [];
    L.push(`You now know where you are, why you are there, and what your ten dimensions look like. This is what to do about it, in the order to do it. The timings are deliberate: one week is short enough that you will actually start, and ninety days is long enough for a changed habit to show up in your answers rather than in your intentions.`);
    for (const block of improvementPlan(r)) {
      L.push(``);
      L.push(`### ${block.horizon} (${block.timeframe})`);
      for (const it of block.items) L.push(`- ${it}`);
    }
    S.push({ key: "plan", n: 11, title: "What to do next, in order", lines: L });
  }

  // 12. Evidence base
  {
    const L: string[] = [];
    L.push(`This instrument is built on a specific claim: that cognitive erosion and future readiness move independently, and that the combination worth catching is high capability sitting on low protection, because it feels like success while it develops. The studies below are the ones this assessment is willing to cite by name.`);
    for (const e of EVIDENCE_BASE) {
      L.push(``);
      L.push(`- ${e.claim} *(${e.source})*`);
    }
    L.push(``);
    L.push(`Everywhere else, this report points at a field of research rather than a single paper, because the underlying findings are well established while no single study settles them: retrieval practice and transfer, cognitive load, design fixation, metacognition and self-regulated learning, and the fluency effects that make polished output harder to doubt than rough output making the same claim.`);
    L.push(``);
    L.push(`**Where the framework itself comes from.** The ten dimensions you were measured on come from the Neogogy framework, set out in these two books. They are the source of the model rather than independent evidence for it, which is a distinction worth keeping clear: they explain the thinking, while the studies above are what the thinking is tested against.`);
    for (const b of FRAMEWORK_SOURCES) {
      L.push(``);
      L.push(`- **${b.title}** (${b.year}), ${b.author}. ${b.note}`);
    }
    L.push(``);
    L.push(`Both are available at ican.ph/books.`);
    L.push(``);
    L.push(`**Two honest limits.** Each dimension rests on two self-description questions, one reverse-worded question and one real-situation question. That is fewer questions per dimension than a formal psychological test would use, which is exactly why you see a confidence level on each one rather than a single confident number. And all of it is self-reported: this assessment sees what you told it, so its usefulness to you depends on your answers staying honest as your use of AI grows.`);
    S.push({ key: "evidence", n: 12, title: "What this is built on, and what it cannot tell you", lines: L });
  }

  // 13. Personal experiment
  S.push({
    key: "experiment", n: 13, title: "One thing to try on yourself",
    lines: [`Take two comparable tasks from your real week. Do one with AI as you normally would, one without. Afterward compare not just time and quality, but what you can still explain, remember, and redo a week later. That comparison, run occasionally and honestly, is the best ongoing test of whether AI is building you or replacing you.`],
  });

  return S;
}

export function generateReport(r: CompassResult): string {
  const head = reportHead(r);
  const L: string[] = [];
  L.push(`# ${head.title}`);
  L.push(`*${head.subtitle}*`);
  const sep = () => { if (L[L.length - 1] !== ``) L.push(``); };
  for (const s of generateReportSections(r)) {
    sep();
    L.push(`## ${s.n}. ${s.title}`);
    for (const line of s.lines) L.push(line);
  }
  sep();
  L.push(`---`);
  L.push(`*${REPORT_DISCLAIMER}*`);
  return L.join("\n");
}

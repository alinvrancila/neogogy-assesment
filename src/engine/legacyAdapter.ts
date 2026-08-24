/**
 * Legacy adapter: rescore v0.1.2 submissions under the v2 engine.
 *
 * The v1 store retains the complete raw `answers` object plus usageVal, B1,
 * and B2 on every record (spec §6.2), which makes retroactive rescoring cheap.
 * v1 items map onto v2 constructs 1:1 by construct family:
 *
 *   v1 dimension            v2 construct
 *   agency        → agency          attention  → (folded, see below)
 *   judgment      → verification    memory     → dependencySafety (partial) + transfer
 *   integrity     → responsibleUse  fluency    → fluency
 *   transfer      → transfer        creation   → creativity
 *   collaboration → responsibleUse (relational facet, secondary)
 *   adaptability  → adaptability
 *
 * v1 has no direct amplification or skillGrowth items; those dimensions come
 * back with "preliminary"/"insufficient" confidence on rescored legacy records,
 * which is the honest representation (spec §46): the old instrument simply did
 * not measure them. Never fabricate certainty for them.
 *
 * v1 scenarios all used the shared 5-option engagement ladder, so they remain
 * usable as directional behavioral evidence, just less construct-specific than
 * v2 scenarios. They keep scenario weighting.
 */
import type { CompassResult, ConstructId, Submission } from "./types";
import { compute } from "./index";

export interface LegacyRecord {
  role: string; // student | teacher | parent | leader
  usageVal: number;
  baseline: { b1?: number; b2?: number } | number; // v1 stored both; tolerate either shape
  answers: Record<string, number>;
}

const ROLE_MAP: Record<string, Submission["persona"]> = {
  student: "student", teacher: "teacher", parent: "parent",
  leader: "administrator", administrator: "administrator",
};

/** v1 item id prefix → v2 target: [construct, v2 item suffix]. */
const V1_MAP: Record<string, { construct: ConstructId; kind: "claim" | "rev" | "s" }[]> = {
  agency_1: [{ construct: "agency", kind: "claim" }],
  agency_2: [{ construct: "agency", kind: "rev" }],
  agency_s: [{ construct: "agency", kind: "s" }],
  attention_1: [{ construct: "dependencySafety", kind: "claim" }], // protected attention ≈ unaided persistence
  attention_2: [{ construct: "dependencySafety", kind: "rev" }],
  attention_s: [{ construct: "dependencySafety", kind: "s" }],
  judgment_1: [{ construct: "verification", kind: "claim" }],
  judgment_2: [{ construct: "verification", kind: "rev" }],
  judgment_s: [{ construct: "verification", kind: "s" }],
  memory_1: [{ construct: "transfer", kind: "claim" }],
  memory_2: [{ construct: "transfer", kind: "rev" }],
  memory_s: [{ construct: "transfer", kind: "s" }],
  integrity_1: [{ construct: "responsibleUse", kind: "claim" }],
  integrity_2: [{ construct: "responsibleUse", kind: "rev" }],
  integrity_s: [{ construct: "responsibleUse", kind: "s" }],
  fluency_1: [{ construct: "fluency", kind: "claim" }],
  fluency_2: [{ construct: "fluency", kind: "rev" }],
  fluency_s: [{ construct: "fluency", kind: "s" }],
  transfer_1: [{ construct: "skillGrowth", kind: "claim" }], // v1 transfer items split across v2 transfer/skillGrowth
  transfer_2: [{ construct: "skillGrowth", kind: "rev" }],
  transfer_s: [{ construct: "skillGrowth", kind: "s" }],
  creation_1: [{ construct: "creativity", kind: "claim" }],
  creation_2: [{ construct: "creativity", kind: "rev" }],
  creation_s: [{ construct: "creativity", kind: "s" }],
  collaboration_1: [{ construct: "responsibleUse", kind: "claim" }],
  collaboration_2: [{ construct: "responsibleUse", kind: "rev" }],
  collaboration_s: [{ construct: "responsibleUse", kind: "s" }],
  adaptability_1: [{ construct: "adaptability", kind: "claim" }],
  adaptability_2: [{ construct: "adaptability", kind: "rev" }],
  adaptability_s: [{ construct: "adaptability", kind: "s" }],
};

/**
 * v1 reverse items store the RAW answer (inversion happened at scoring), so we
 * pass raw values straight through: the v2 engine inverts `_rev` items itself.
 */
export function rescoreLegacy(rec: LegacyRecord): CompassResult {
  const persona = ROLE_MAP[rec.role] ?? "student";
  const answers: Record<string, number> = {};
  const seen: Record<string, { sum: number; n: number; kind: string }> = {};

  for (const [v1id, raw] of Object.entries(rec.answers)) {
    const targets = V1_MAP[v1id];
    if (!targets || raw === undefined) continue;
    for (const t of targets) {
      const suffix = t.kind === "s" ? "s" : t.kind;
      const key = `${persona}_${t.construct}_${suffix}`;
      const e = (seen[key] ??= { sum: 0, n: 0, kind: t.kind });
      e.sum += raw; e.n += 1;
    }
  }
  for (const [key, e] of Object.entries(seen)) answers[key] = Math.round(e.sum / e.n);

  const b1 = typeof rec.baseline === "number" ? rec.baseline : rec.baseline?.b1;
  const b2 = typeof rec.baseline === "number" ? undefined : rec.baseline?.b2;
  return compute({ persona, usage: rec.usageVal, b1, b2, answers });
}

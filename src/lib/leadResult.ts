/**
 * Resolve any stored lead to a v2 CompassResult.
 *
 * engineVersion 2 records carry the result already. v1 records are rescored
 * through the legacy adapter rather than rendered by the retired v1 engine, so
 * nothing outside this file needs to know v1 ever existed. Rescored results
 * are flagged so callers can label them honestly.
 */
import { rescoreLegacy, type LegacyRecord } from '@/engine/legacyAdapter';
import type { CompassResult } from '@/engine';
import type { LeadRecord } from '@/lib/storage';

export type ResolvedResult =
  | { ok: true; result: CompassResult; rescored: boolean }
  | { ok: false; reason: string };

export function resolveLeadResult(lead: LeadRecord): ResolvedResult {
  if (lead.engineVersion === 2 && lead.result) {
    return { ok: true, result: lead.result as CompassResult, rescored: false };
  }
  if (!lead.answers || !Object.keys(lead.answers).length) {
    return { ok: false, reason: 'This submission has no stored answers, so it cannot be scored.' };
  }
  const legacy: LegacyRecord = {
    role: lead.role || 'student',
    usageVal: lead.usageVal ?? 3,
    baseline: lead.baseline ?? { b1: undefined, b2: undefined },
    answers: lead.answers,
  };
  return { ok: true, result: rescoreLegacy(legacy), rescored: true };
}

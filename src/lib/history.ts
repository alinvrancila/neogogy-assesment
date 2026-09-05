/**
 * Repeat-attempt history.
 *
 * Attempts are matched by email so a returning respondent can be shown how
 * their position moved. Nothing here scores anything: it reads stored results
 * and computes differences between them.
 */
import { listLeads, type LeadRecord } from '@/lib/storage';
import type { CompassResult } from '@/engine';
import type { ConstructId } from '@/engine/types';
import { CONSTRUCTS } from '@/engine/config';

export interface DimensionDelta {
  construct: ConstructId;
  name: string;
  /** Reported orientation, so dependency risk compares as a risk. */
  previous: number;
  current: number;
  delta: number;
  /** True when the change is an improvement, accounting for reversed scales. */
  improved: boolean | null;
  reportedAsRisk: boolean;
}

export interface AttemptComparison {
  attemptNumber: number;
  previousAt: string;
  daysBetween: number;
  previousIndex: number;
  currentIndex: number;
  indexDelta: number;
  previousStage: number;
  previousStageName: string;
  currentStage: number;
  currentStageName: string;
  stageDelta: number;
  dimensions: DimensionDelta[];
}

const norm = (email: string) => email.trim().toLowerCase();

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Every prior v2 attempt for an email, oldest first. */
/**
 * A person's earlier sittings of the same assessment.
 *
 * Persona is part of the match, not only the email. The seven sets ask
 * different questions, place on differently named stages and, for Business and
 * Minister, score against a different route entirely, so an index from one is
 * not comparable with an index from another. Matching on email alone produced
 * exactly the failure it sounds like: a teacher who also took the parent set
 * was shown a climb of sixty seven points that never happened, in the largest
 * type on the report.
 */
export async function priorAttempts(
  email: string, excludeId?: string, persona?: string
): Promise<LeadRecord[]> {
  if (!email.trim()) return [];
  const target = norm(email);
  const all = await listLeads();
  return all
    .filter((l) => l.engineVersion === 2 && !!l.result && norm(l.email || '') === target)
    .filter((l) => (persona ? l.persona === persona : true))
    .filter((l) => l.id !== excludeId)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

/**
 * Compare the current result against the most recent prior attempt.
 * Returns null when there is nothing to compare against.
 */
export function compareToPrevious(
  current: CompassResult,
  previousLead: LeadRecord,
  attemptNumber: number,
  now: Date
): AttemptComparison | null {
  const previous = previousLead.result as CompassResult | undefined;
  if (!previous?.stage || !previous.dimensions) return null;

  const prevAt = previousLead.createdAt ? new Date(previousLead.createdAt) : null;
  const days = prevAt && !Number.isNaN(prevAt.getTime())
    ? Math.max(0, Math.round((now.getTime() - prevAt.getTime()) / 86_400_000))
    : 0;

  const dimensions: DimensionDelta[] = (Object.keys(CONSTRUCTS) as ConstructId[]).map((id) => {
    const def = CONSTRUCTS[id];
    const prevDim = previous.dimensions[id];
    const curDim = current.dimensions[id];
    const asRisk = !!def.reportedAsRisk;
    const p = asRisk ? prevDim?.reportedScore : prevDim?.score;
    const c = asRisk ? curDim?.reportedScore : curDim?.score;
    const previousValue = round1(p ?? 0);
    const currentValue = round1(c ?? 0);
    const delta = round1(currentValue - previousValue);
    return {
      construct: id,
      name: asRisk ? 'Dependency Risk' : def.name,
      previous: previousValue,
      current: currentValue,
      delta,
      // On a risk scale a fall is the improvement.
      improved: delta === 0 ? null : asRisk ? delta < 0 : delta > 0,
      reportedAsRisk: asRisk,
    };
  });

  return {
    attemptNumber,
    previousAt: previousLead.createdAt || '',
    daysBetween: days,
    previousIndex: round1(previous.stage.rawIndex),
    currentIndex: round1(current.stage.rawIndex),
    indexDelta: round1(current.stage.rawIndex - previous.stage.rawIndex),
    previousStage: previous.stage.stage,
    previousStageName: previous.stage.stageName,
    currentStage: current.stage.stage,
    currentStageName: current.stage.stageName,
    stageDelta: current.stage.stage - previous.stage.stage,
    dimensions,
  };
}

/** Convenience for the submit route: find and compare in one step. */
export async function buildComparison(
  email: string,
  current: CompassResult,
  now: Date,
  excludeId?: string
): Promise<AttemptComparison | null> {
  // Same person, same assessment. A different set is a different instrument.
  const prior = await priorAttempts(email, excludeId, current.persona);
  if (!prior.length) return null;
  const mostRecent = prior[prior.length - 1];
  return compareToPrevious(current, mostRecent, prior.length + 1, now);
}

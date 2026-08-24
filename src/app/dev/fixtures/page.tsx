import { notFound } from 'next/navigation';
import { compute, applicableItems } from '@/engine';
import type { CompassResult, Persona, Submission } from '@/engine/types';
import { ContinuumStrip, DimensionRadar, NextStagePanel } from '@/components/compass/Visuals';
import '@/app/compass.css';

export const dynamic = 'force-dynamic';

/** Dev-only inspection surface for the visuals at their edges. */

/**
 * Reverse items are inverted at scoring, so the healthiest answer on a reverse
 * item is the lowest option, not the highest. A naive "all fives" submission is
 * therefore not a healthy respondent. These helpers keep fixtures honest.
 */
function maxValue(it: { options?: Array<{ value: number }> }): number {
  return it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5;
}

function build(
  persona: Persona,
  usage: number,
  pick: (item: ReturnType<typeof applicableItems>[number], index: number) => number,
  b1 = 3,
  b2 = 3
): Submission {
  const items = applicableItems(persona, usage);
  const answers: Record<string, number> = {};
  items.forEach((it, i) => {
    answers[it.id] = Math.max(0, Math.min(maxValue(it), pick(it, i)));
  });
  return { persona, usage, b1, b2, answers };
}

const healthiest = (it: ReturnType<typeof applicableItems>[number]) =>
  it.type === 'reverse' ? 1 : maxValue(it);
const unhealthiest = (it: ReturnType<typeof applicableItems>[number]) =>
  it.type === 'reverse' ? maxValue(it) : 1;

function fixtures(): Array<{ name: string; note: string; result: CompassResult }> {
  const out: Array<{ name: string; note: string; result: CompassResult }> = [];

  out.push({
    name: 'All lowest',
    note: 'Every answer at the unhealthiest option.',
    result: compute(build('student', 3, unhealthiest)),
  });

  out.push({
    name: 'All highest',
    note: 'Every answer at the healthiest option.',
    result: compute(build('administrator', 5, healthiest)),
  });

  out.push({
    name: 'Gated',
    note: 'Strong everywhere except verification, so the stage is capped below the earned index.',
    result: compute(build('teacher', 5, (it) =>
      it.construct === 'verification' ? unhealthiest(it) : healthiest(it))),
  });

  // Borderline: sweep a mix ratio until the engine reports a borderline zone.
  let borderline: CompassResult | null = null;
  for (let k = 0; k <= 60 && !borderline; k++) {
    const r = compute(build('parent', 3, (it, i) => Math.min(maxValue(it), ((i * 7 + k) % 5) + 1)));
    if (r.stage.borderline) borderline = r;
  }
  if (borderline) {
    out.push({
      name: 'Borderline',
      note: 'Within three index points of a stage boundary, so the placement is shown as a zone.',
      result: borderline,
    });
  }

  out.push({
    name: 'Insufficient confidence',
    note: 'Almost nothing answered.',
    result: compute({ persona: 'student', usage: 3, b1: 3, b2: 3, answers: { student_agency_claim: 3 } }),
  });

  return out;
}

export default function FixturesPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const items = fixtures();

  return (
    <div className="nfc">
      <div className="wrap results">
        <h2 className="section-title">Visual fixtures</h2>
        <p className="muted">Dev only. Each profile below is computed by the engine, not hand written.</p>
        {items.map((f) => (
          <section className="results-section" key={f.name}>
            <div className="rs-head"><span className="eyebrow">{f.name}</span></div>
            <h3>
              {f.result.archetype.name} · stage {f.result.stage.stage} · index {f.result.stage.rawIndex} ·{' '}
              {f.result.overallConfidence}
            </h3>
            <p className="muted">{f.note}</p>
            <ContinuumStrip result={f.result} />
            <div className="two-col">
              <DimensionRadar result={f.result} />
              <div>
                <NextStagePanel result={f.result} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { compute, applicableItems } from '@/engine';
import type { Persona, Submission } from '@/engine/types';
import ResultsPreview from '@/components/compass/ResultsPreview';
import '@/app/compass.css';

export const dynamic = 'force-dynamic';

/** Dev-only: renders the full results page without taking the assessment.
 *  /dev/results            a realistic mixed profile
 *  /dev/results?p=high     strong profile
 *  /dev/results?p=low      weak profile
 *  /dev/results?p=gated    strong index held down by a gate
 *  /dev/results?p=thin     insufficient confidence
 *  /dev/results?persona=teacher|parent|administrator|student
 */
type It = ReturnType<typeof applicableItems>[number];
const maxValue = (it: It) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
const healthiest = (it: It) => (it.type === 'reverse' ? 1 : maxValue(it));
const unhealthiest = (it: It) => (it.type === 'reverse' ? maxValue(it) : 1);

function build(persona: Persona, usage: number, pick: (it: It, i: number) => number): Submission {
  const items = applicableItems(persona, usage);
  const answers: Record<string, number> = {};
  items.forEach((it, i) => { answers[it.id] = Math.max(0, Math.min(maxValue(it), pick(it, i))); });
  return { persona, usage, b1: 4, b2: 3, answers };
}

export default async function DevResultsPage(
  { searchParams }: { searchParams: Promise<{ p?: string; persona?: string }> }
) {
  if (process.env.NODE_ENV === 'production') notFound();
  const sp = await searchParams;
  const persona = (['student', 'teacher', 'parent', 'administrator'].includes(sp.persona || '')
    ? sp.persona : 'student') as Persona;

  const variant = sp.p || 'mixed';
  let sub: Submission;
  if (variant === 'high') sub = build(persona, 4, healthiest);
  else if (variant === 'low') sub = build(persona, 3, unhealthiest);
  else if (variant === 'gated') {
    sub = build(persona, 5, (it) => (it.construct === 'verification' ? unhealthiest(it) : healthiest(it)));
  } else if (variant === 'thin') {
    sub = { persona, usage: 3, b1: 4, b2: 3, answers: { [`${persona}_agency_claim`]: 3 } };
  } else {
    // A believable middle profile: decent fluency, softer verification and independence.
    sub = build(persona, 4, (it) => {
      const soft = it.construct === 'verification' || it.construct === 'dependencySafety';
      const strong = it.construct === 'fluency' || it.construct === 'adaptability';
      const level = soft ? 2 : strong ? 5 : 4;
      return it.type === 'reverse' ? 6 - level : Math.min(maxValue(it), level);
    });
  }

  return <ResultsPreview result={compute(sub)} />;
}

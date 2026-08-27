import CompassApp from '@/components/compass/CompassApp';
import { compute, applicableItems } from '@/engine';
import type { CompassResult, Item } from '@/engine/types';

/**
 * The landing preview shows a real engine result computed from a fixed set of
 * illustrative answers, not invented numbers. It is labelled as an example
 * everywhere it appears. Computing it here keeps scoring off the client.
 */
function sampleResult(): CompassResult {
  const items = applicableItems('student', 4);
  const answers: Record<string, number> = {};
  const maxOf = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
  items.forEach((it) => {
    // A believable middle profile: capable with the tools, thinner on checking
    // and on independent capability.
    const soft = it.construct === 'verification' || it.construct === 'dependencySafety';
    const strong = it.construct === 'fluency' || it.construct === 'adaptability';
    const level = soft ? 2 : strong ? 5 : 4;
    answers[it.id] = it.type === 'reverse' ? 6 - level : Math.min(maxOf(it), level);
  });
  return compute({ persona: 'student', usage: 4, b1: 4, b2: 3, answers });
}

export default function Page() {
  return <CompassApp sample={sampleResult()} />;
}

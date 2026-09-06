import { applicableItems } from '@/engine';
import { PERSONA_CONTENT } from '@/content/personas';
import { SCALE_LABELS } from '@/items/shared';
import { reportTitle } from '@/engine/display';

const out = PERSONA_CONTENT.map((p) => {
  const items = applicableItems(p.id, 4);
  return {
    name: p.name,
    title: reportTitle(p.id),
    count: items.length + 1,
    items: items.map((it) => ({
      id: it.id, type: it.type, construct: it.construct, prompt: it.prompt,
      context: it.context, why: it.why, riskSignal: (it as { riskSignal?: string }).riskSignal,
      options: it.options,
      scaleLabels: it.scale ? SCALE_LABELS[it.scale] : undefined,
    })),
  };
});
process.stdout.write(JSON.stringify(out));

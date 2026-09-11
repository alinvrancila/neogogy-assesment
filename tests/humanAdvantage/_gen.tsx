import fs from 'fs';
import { compute, applicableItems } from '@/engine';
import { buildOrganisationAnalytics } from '@/engine/orgAnalytics';
import { generateOrgReportPdf } from '@/lib/orgReportPdf';
import type { GroupMember } from '@/engine/group';
import type { ConstructId, Item, Persona, Submission } from '@/engine/types';

const maxV = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
function member(p: Persona, u: number, b: number, i: number,
                by: Partial<Record<ConstructId, number>> = {}, lowReason?: number): GroupMember {
  const answers: Record<string, number> = {};
  applicableItems(p, u).forEach((it) => {
    const top = maxV(it); const lv = (it.construct && by[it.construct]) ?? b;
    const h = Math.max(1, Math.min(top, Math.round(((lv - 1) / 4) * (top - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? top + 1 - h : h;
  });
  if (lowReason) answers['lowuse_reason'] = lowReason;
  return { key: `r${i}`, persona: p, usage: u, felt: 4, predicted: 3,
    result: compute({ persona: p, usage: u, b1: 4, b2: 3, answers } as Submission),
    takenAt: `2026-0${(i % 3) + 1}-1${i % 9}T00:00:00.000Z`,
    versions: { instrument: '2.3', scoring: '2.1', scenario: '2.0', language: 'en-GB' } };
}

/** A realistic mixed workforce, the size the brief calls the design cohort. */
function realistic(n: number, seed = 0): GroupMember[] {
  const out: GroupMember[] = [];
  const shapes: Array<[number, number, Partial<Record<ConstructId, number>>]> = [
    [4, 3, {}], [4, 4, {}], [5, 3, { verification: 2, responsibleUse: 2 }],
    [3, 3, {}], [4, 2, { fluency: 2, adaptability: 2 }], [5, 4, {}],
    [2, 3, {}], [4, 4, { agency: 2, dependencySafety: 2 }], [5, 5, {}],
    [3, 2, {}], [4, 3, { transfer: 2, skillGrowth: 2 }], [4, 5, {}],
    [1, 4, {}], [5, 2, {}], [4, 4, { amplification: 2, creativity: 2 }],
  ];
  for (let i = 0; i < n; i++) {
    const [u, b, by] = shapes[(i + seed) % shapes.length];
    out.push(member(i % 7 === 6 ? 'teacher' : 'professional', u, b, i, by));
  }
  return out;
}

const COHORTS: Array<[string, GroupMember[]]> = [
  ['design-50', realistic(50)],
  ['small-8', realistic(8, 3)],
  ['floor-3', realistic(3, 5)],
  ['medium-29', realistic(29, 1)],
  ['inference-30', realistic(30, 2)],
  ['large-120', realistic(120, 4)],
  ['universally-strong', Array.from({ length: 24 }, (_, i) => member('professional', 4, 5, i))],
  ['universally-weak', Array.from({ length: 24 }, (_, i) => member('professional', 2, 1, i))],
  ['polarised', Array.from({ length: 24 }, (_, i) => member('professional', 4, i % 2 ? 5 : 1, i))],
  ['high-use-low-protection', Array.from({ length: 24 }, (_, i) =>
    member('professional', 5, 5, i, { verification: 1, agency: 1, responsibleUse: 1, dependencySafety: 1 }))],
  ['low-use-high-capability', Array.from({ length: 24 }, (_, i) =>
    member('professional', 1, 5, i, {}, 1))],
  ['mixed-personas', [
    ...Array.from({ length: 12 }, (_, i) => member('professional', 4, 3, i)),
    ...Array.from({ length: 9 }, (_, i) => member('teacher', 4, 3, 100 + i)),
    ...Array.from({ length: 8 }, (_, i) => member('administrator', 4, 4, 200 + i)),
  ]],
];

async function main() {
  const rows: string[] = [];
  for (const [name, members] of COHORTS) {
    try {
      const a = buildOrganisationAnalytics(
        name === 'design-50' ? 'Meridian Operations Group' : `QA cohort: ${name}`, members);
      const pdf = await generateOrgReportPdf(a, 'Letter');
      fs.writeFileSync(`/tmp/orgqa/${name}.pdf`, pdf);
      rows.push(`  ${name.padEnd(26)} n=${String(a.group.n).padStart(3)}  ${String(Math.round(pdf.length/1024)).padStart(4)}KB  `
        + `stage ${a.group.centre.stage}  cohorts ${a.developmentCohorts.cohorts.length}  `
        + `practices ${a.practicePortfolio.total}  withheld ${a.privacyState.filter(p=>p.state==='withheld').length}`);
    } catch (e) {
      rows.push(`  ${name.padEnd(26)} REFUSED: ${(e as Error).message.slice(0, 70)}`);
    }
  }
  // A4 too, on the design cohort.
  const a4 = await generateOrgReportPdf(buildOrganisationAnalytics('Meridian Operations Group', realistic(50)), 'A4');
  fs.writeFileSync('/tmp/orgqa/design-50-A4.pdf', a4);
  rows.push(`  ${'design-50 (A4)'.padEnd(26)}          ${String(Math.round(a4.length/1024)).padStart(4)}KB`);
  console.log(rows.join('\n'));
}
main();

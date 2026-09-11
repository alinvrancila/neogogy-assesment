/**
 * The sentence templates, section 6.3.
 *
 * Every one is a pure function of aggregate values. No prose is tied to a
 * sample, no language model runs at render time, and nothing is written into a
 * template: a chapter asks for a sentence and gets the same sentence for the
 * same numbers, every time, which is what makes the report auditable.
 *
 * Keys are exported alongside the functions so the whole table can be walked by
 * a test and by a future localisation pass.
 */

const one = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);
const pct = (k: number, n: number): number => (n ? Math.round((k / n) * 100) : 0);

/** A count, with its percentage beside it and never instead of it. */
export const count = (k: number, n: number): string => `${k} of ${n} people (${pct(k, n)}%).`;

export const median = (name: string, value: number, band: string, bandCopy: string): string =>
  `The middle person in your group scores ${one(value)} on ${name}. That is in the ${band} band: ${bandCopy}`;

/** The reading of a middle half, by its width in points. */
export const spreadReading = (width: number): string =>
  width < 10 ? 'your people are similar on this and one approach can serve the core'
    : width <= 20 ? 'there is a real difference between your stronger and weaker half'
      : 'one approach will not fit everyone here';

export const middleHalf = (q1: number, q3: number): string =>
  `The middle half of your people sit between ${one(q1)} and ${one(q3)}, a spread of `
  + `${one(q3 - q1)} points, so ${spreadReading(q3 - q1)}.`;

export const range = (min: number, max: number): string =>
  `Your people reach from ${one(min)} to ${one(max)}.`;

export const polarised = (name: string, kStrong: number, kWatch: number): string =>
  `${kStrong} people are in the strength band and ${kWatch} in the watch band on ${name}. `
  + 'This is not one workforce problem but at least two employee populations: a single shared '
  + 'session would be too basic for one and too thin for the other. Coach this in two groups.';

export const preliminary = (name: string, k: number, n: number): string =>
  `${k} of ${n} readings on ${name} are preliminary, meaning they rest on fewer answers than `
  + 'usual. Treat the median lightly and expect it to firm up on a retake.';

export const vulnerability = (name: string, k: number, n: number, line = 45): string =>
  `${k} of ${n} people are at or below the vulnerability line (${line}) on ${name}. `
  + 'That is the number of individual reports worth opening on this capability.';

export type LeanResponse = 'more real, bounded practice'
  | 'guardrails and deliberate unaided practice' | 'both, run for different people';

export const lean = (kDis: number, kBal: number, kDep: number, n: number, response: LeanResponse): string =>
  `${kDis} of ${n} people lean towards disconnection, ${kBal} are balanced, and ${kDep} lean `
  + `towards dependence. The larger response your group needs is ${response}.`;

export const mobility = (k: number, n: number, conditions: string): string =>
  `${k} of ${n} people appear close to their next developmental stage under current scoring `
  + `rules. Movement depends on ${conditions}.`;

/* ------------------------------------------------- the shape of a workforce */

export interface ShapeInput {
  n: number;
  /** Stage, count, name. Sorted by stage. */
  stages: Array<{ stage: number; stageName: string; n: number }>;
  centre: { stage: number; stageName: string; n: number };
}

/**
 * The workforce shape, first rule that applies, in the order the brief sets.
 *
 * The order matters: a workforce can be both concentrated and spread by the
 * arithmetic, and the two camps reading is the one a manager needs first
 * because it is the one that says a single programme cannot work.
 */
export function workforceShape(d: ShapeInput): string {
  const share = (k: number) => (d.n ? (k / d.n) * 100 : 0);
  const big = d.stages.filter((s) => share(s.n) >= 30).sort((a, b) => b.n - a.n);

  // Two camps: two stages that each hold 30 per cent or more and are not adjacent.
  for (let i = 0; i < big.length; i++) {
    for (let j = i + 1; j < big.length; j++) {
      if (Math.abs(big[i].stage - big[j].stage) >= 2) {
        const [a, b] = [big[i], big[j]].sort((x, y) => x.stage - y.stage);
        return `Your workforce has two camps, at stage ${a.stage} (${a.n} people) and stage `
          + `${b.stage} (${b.n} people). They need different things, and the chapters that follow `
          + 'treat them separately where the numbers allow.';
      }
    }
  }

  const concentrated = d.stages.find((s) => share(s.n) >= 50);
  if (concentrated) {
    const above = d.stages.filter((s) => s.stage > concentrated.stage).reduce((a, s) => a + s.n, 0);
    const below = d.stages.filter((s) => s.stage < concentrated.stage).reduce((a, s) => a + s.n, 0);
    return `Your workforce is concentrated at stage ${concentrated.stage}, ${concentrated.stageName}: `
      + `${concentrated.n} of ${d.n}. One shared programme is realistic for this core, with separate `
      + `attention for the ${above} people ahead of it and the ${below} people behind it.`;
  }

  if (!d.stages.some((s) => share(s.n) >= 30)) {
    return `Your people are spread across ${d.stages.length} stages, so a single programme would fit `
      + 'few of them. The cohort and bottleneck chapters show where the shared needs are.';
  }

  const low = d.stages[0], high = d.stages[d.stages.length - 1];
  return `Most of your people are at stage ${d.centre.stage}, ${d.centre.stageName} `
    + `(${d.centre.n} of ${d.n}), with the rest reaching from stage ${low.stage} to stage ${high.stage}.`;
}

/** Reported independently of the shape, when either edge exists. */
export function edges(d: ShapeInput): string[] {
  const out: string[] = [];
  const ahead = d.stages.filter((s) => s.stage - d.centre.stage >= 2).reduce((a, s) => a + s.n, 0);
  const behind = d.stages.filter((s) => d.centre.stage - s.stage >= 2).reduce((a, s) => a + s.n, 0);
  if (ahead > 0) {
    out.push(`${ahead} ${ahead === 1 ? 'person sits' : 'people sit'} two or more stages ahead of the `
      + 'centre. They can coach, and their practice is worth protecting.');
  }
  if (behind > 0) {
    out.push(`${behind} ${behind === 1 ? 'person sits' : 'people sit'} two or more stages behind the `
      + 'centre and will need a first task with a colleague alongside before any shared programme '
      + 'reaches them.');
  }
  return out;
}

/* ----------------------------------------------------------- the four blocks */

/** The fixed labels, in the fixed order, under every significant chart. */
export const BLOCK_LABELS = [
  'How to read this',
  'What your workforce is telling you',
  'Why this matters to the business',
  'What management should do',
] as const;

export interface Interpretation {
  headline: string;
  howToRead: string;
  interpretation: string;
  businessMeaning: string;
  recommendedResponse: string;
  caveat?: string;
}

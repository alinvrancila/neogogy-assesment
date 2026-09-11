/**
 * The interpretation engine, section 6.1.
 *
 * Deterministic functions from aggregate values to structured text. Every
 * significant chart in the report gets its four explanatory blocks from here,
 * so no statistic is ever orphaned and no sentence is written into a template.
 *
 * The rule the whole file serves is 2.4: a bad rendering is "Verification
 * median: 56.4". A good one says what it means for the workforce and what
 * management should do about it, in language a manager could repeat to a
 * colleague.
 */

import {
  count, lean as leanSentence, median as medianSentence, middleHalf, mobility as mobilitySentence,
  polarised as polarisedSentence, preliminary as preliminarySentence, range as rangeSentence,
  spreadReading, vulnerability as vulnerabilitySentence, workforceShape, edges,
  type Interpretation,
} from './orgCopy';
import { DIMENSIONS, compositeEntry, bandOf } from './dictionary';
import { SCORING } from './config';
import type { GroupResult } from './group';
import type { ConstructId } from './types';
import type { OrganisationReportAnalytics } from './orgAnalytics';

const one = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);

/* -------------------------------------------------------------- continuum */

export function interpretContinuum(g: GroupResult): Interpretation {
  const shape = workforceShape({
    n: g.n,
    stages: g.distribution.map((d) => ({ stage: d.stage, stageName: d.stageName, n: d.n })),
    centre: { stage: g.centre.stage, stageName: g.centre.stageName, n: g.centre.n },
  });
  return {
    headline: shape,
    // The worked example in section 6.4 renders from exactly this sentence.
    howToRead: `The middle person in your organisation scores ${one(g.index.median)} out of 100, `
      + `which places them at stage ${g.centre.stage}, ${g.centre.stageName}. `
      + `${middleHalf(g.index.q1, g.index.q3)} ${rangeSentence(g.index.min, g.index.max)}`,
    interpretation: [shape, ...edges({
      n: g.n,
      stages: g.distribution.map((d) => ({ stage: d.stage, stageName: d.stageName, n: d.n })),
      centre: { stage: g.centre.stage, stageName: g.centre.stageName, n: g.centre.n },
    })].join(' '),
    businessMeaning: g.consistency.reading,
    recommendedResponse: g.consistency.label === 'low'
      ? 'Plan development by cohort rather than as one programme. Chapter 12 shows the populations and chapter 19 maps them on to tiers.'
      : 'A shared programme can carry the core of your workforce. Give separate attention to the people at each end, which chapter 16 counts.',
  };
}

/* ------------------------------------------------------------------- lean */

export function interpretLean(g: GroupResult): Interpretation {
  const l = g.lean;
  return {
    headline: l.towardsDependence.n > l.towardsDisconnection.n
      ? 'Your larger risk is over-reliance, not avoidance'
      : l.towardsDisconnection.n > l.towardsDependence.n
        ? 'Your larger risk is avoidance, not over-reliance'
        : 'Your workforce carries both risks in roughly equal measure',
    howToRead: 'There are two ways to be off the path. Towards dependence means the work would be '
      + 'hard to reproduce without the tool. Towards disconnection means there is little real '
      + 'practice behind how a person sees AI. Each bar counts people, not scores.',
    interpretation: leanSentence(l.towardsDisconnection.n, l.balanced.n, l.towardsDependence.n, g.n, l.response),
    businessMeaning: 'These two conditions need opposite responses, so a single AI programme aimed '
      + 'at the middle would push one group further into the risk it already carries.',
    recommendedResponse: l.response === 'both, run for different people'
      ? 'Run both responses, to different people. Chapter 12 identifies who belongs in each.'
      : l.response === 'more real, bounded practice'
        ? 'Lead with bounded practice on real work. More caution would deepen the problem your numbers actually show.'
        : 'Lead with guardrails and deliberate unaided practice, so capability is rebuilt while use continues.',
    caveat: 'A person using little AI by choice, with judgment intact, is counted as deliberately '
      + 'selective rather than disconnected.',
  };
}

/* -------------------------------------------------------------- dimension */

export function interpretDimension(g: GroupResult, id: ConstructId): Interpretation {
  const d = g.dimensions.find((x) => x.construct === id)!;
  const e = DIMENSIONS[id];
  const band = bandOf(d.spread.median);
  const bandCopy = e.bandCopy[band === 'strength' ? 'strength' : band === 'developing' ? 'developing' : 'watch'];
  const parts = [
    medianSentence(e.executiveName, d.spread.median, band, bandCopy),
    middleHalf(d.spread.q1, d.spread.q3),
  ];
  if (d.polarised) parts.push(polarisedSentence(e.executiveName, d.bands.strong.n, d.bands.watch.n));
  if (d.vulnerable.n > 0) parts.push(vulnerabilitySentence(e.executiveName, d.vulnerable.n, g.n, SCORING.vulnerabilityCeiling));
  return {
    headline: band === 'strength'
      ? `${e.executiveName} is a strength across your workforce`
      : band === 'developing'
        ? `${e.executiveName} is developing rather than consistently strong`
        : `${e.executiveName} needs attention across your workforce`,
    howToRead: `${e.whatItMeasures} Every score runs from 0 to 100 and describes practice on the day `
      + 'your people answered.',
    interpretation: parts.join(' '),
    businessMeaning: e.businessMeaning,
    recommendedResponse: d.polarised
      ? 'Coach this in two groups. A single shared session would be too basic for one population and too thin for the other.'
      : band === 'strength'
        ? 'Protect it. A strength is the thing most likely to be assumed rather than maintained, and it is what the rest is built on.'
        : `Build it deliberately. Chapter 18 carries the practices your own people were given for ${e.executiveName}.`,
    caveat: d.preliminary.n > 0
      ? preliminarySentence(e.executiveName, d.preliminary.n, g.n) : undefined,
  };
}

/* -------------------------------------------------------------- composite */

export function interpretComposite(g: GroupResult, id: string): Interpretation {
  const c = g.composites.find((x) => x.id === id)!;
  const e = compositeEntry(id);
  const lower = !!c.lowerIsHealthier;
  // On a concern-high composite the bands read the other way, so the band copy
  // is chosen by concern rather than by the raw number.
  const key = lower
    ? (c.spread.median >= SCORING.strengthFloor ? 'watch' : c.spread.median >= SCORING.microWatch ? 'developing' : 'strength')
    : bandOf(c.spread.median);
  return {
    headline: e?.question ?? c.label,
    howToRead: lower
      ? `This one runs the other way: lower is healthier. The middle person scores ${one(c.spread.median)} of 100.`
      : `The middle person scores ${one(c.spread.median)} of 100, and the bar shows where the middle half sit.`,
    interpretation: `${e?.bandCopy[key] ?? ''} ${middleHalf(c.spread.q1, c.spread.q3)}`.trim(),
    businessMeaning: `The middle half spans ${one(c.spread.q3 - c.spread.q1)} points, so ${spreadReading(c.spread.q3 - c.spread.q1)}.`,
    recommendedResponse: key === 'strength'
      ? 'Hold this where it is while the other readings move.'
      : 'Chapter 17 ranks where this sits against the other development priorities.',
  };
}

/* ----------------------------------------------------------------- matrix */

export function interpretMatrix(
  cells: Array<{ title: string; n: number; share: number; response?: string }>,
  base: number,
  /** Why this cross matters to an employer. Supplied by the chapter. */
  businessMeaning: string,
  asideLabel?: string, asideN?: number,
): Interpretation {
  const biggest = [...cells].sort((a, b) => b.n - a.n)[0];
  return {
    headline: biggest && biggest.n > 0
      ? `Most of your people are in "${biggest.title}"`
      : 'Your people are spread across the four cells',
    howToRead: `Each cell counts people, and the four together cover the ${base} `
      + `${base === 1 ? 'person' : 'people'} this map describes`
      + (asideLabel && asideN ? `, with ${asideN} reported separately as ${asideLabel}.` : '.'),
    interpretation: cells.map((c) => `${c.title}: ${count(c.n, base)}`).join(' '),
    businessMeaning,
    recommendedResponse: biggest?.response
      ?? 'The response for each cell is printed inside it.',
  };
}

/* -------------------------------------------------------- healthy adoption */

export function interpretHealthyAdoption(a: OrganisationReportAnalytics): Interpretation {
  const g = a.group;
  const h = g.headline.healthyAdoption;
  const b = g.adoptionBlockers;
  const notMeeting = g.n - h.n;
  const sole = b.singleMostCommonBlocker;
  return {
    headline: `${h.n} of ${g.n} people meet all four conditions for healthy adoption`,
    howToRead: 'Healthy adoption asks for four things at once: regular or deliberately selective '
      + 'use, and strength on judgment, on the line people hold, and on independent capability. '
      + 'The funnel shows where people fall out.',
    interpretation: notMeeting === 0
      ? 'Everyone here meets the standard.'
      : `${count(notMeeting, g.n)} do not yet meet it. Of those, ${b.failingExactlyOne.n} fail on `
        + `exactly one condition`
        + (sole ? `, and the most common single condition is "${sole.criterion}" (${sole.n} people).` : '.'),
    businessMeaning: 'This is the share of your workforce using AI the way you would want everyone '
      + 'to. The people failing a single condition are the cheapest group to move, because one '
      + 'thing stands between them and the standard.',
    recommendedResponse: sole
      ? `Start with the people who fail only on "${sole.criterion}". That is the shortest route to `
        + 'raising this number.'
      : 'Chapter 18 carries the practices that address each condition.',
  };
}

/* --------------------------------------------------------------- patterns */

export function interpretPatterns(g: GroupResult): Interpretation {
  const help = g.patterns.help, harm = g.patterns.harm;
  const topHarm = harm[0], topHelp = help[0];
  return {
    headline: topHarm
      ? `The habit to watch is "${topHarm.label}"`
      : 'No watch pattern has formed across your workforce',
    howToRead: 'A pattern fires when several readings line up in a way that reinforces itself. '
      + 'Each count is of the people who could raise that pattern, which is not always the whole '
      + 'workforce, because some patterns belong to one edition of the assessment.',
    interpretation: [
      topHelp ? `${topHelp.label}: ${count(topHelp.n, topHelp.base)}` : '',
      topHarm ? `${topHarm.label}: ${count(topHarm.n, topHarm.base)}` : '',
      `${count(g.patterns.noHarm.n, g.n)} carry no watch pattern at all.`,
    ].filter(Boolean).join(' '),
    businessMeaning: 'Patterns are self-reinforcing, which is why they are worth naming: they tend '
      + 'to deepen on their own unless something interrupts them.',
    recommendedResponse: topHarm
      ? 'Chapter 11 ranks these against the other exposures, and chapter 18 carries the practice that addresses each.'
      : 'Keep the conditions that are producing this. Chapter 10 names what is working.',
  };
}

/* ------------------------------------------------------------ calibration */

export function interpretCalibration(g: GroupResult): Interpretation {
  const c = g.calibration;
  const over = c.felt.healthier.n, under = c.felt.lessHealthy.n, right = c.felt.matched.n;
  return {
    headline: over > under
      ? 'Your workforce feels healthier than it measures'
      : under > over
        ? 'Your workforce judges itself more harshly than it measures'
        : 'Your workforce sees its own position about right',
    howToRead: `Before answering, people said how healthy their AI habits felt and predicted their `
      + `result. This compares both with what was measured. ${c.felt.n} of ${g.n} answered.`,
    interpretation: `${right} felt about right, ${over} felt healthier than measured, and ${under} `
      + `felt less healthy than measured. On the prediction, ${c.predicted.accurate.n} were exact `
      + `and ${c.predicted.withinOne.n} were within one band.`,
    businessMeaning: over > under
      ? 'A group whose confidence is ahead of its practice does not usually seek training on its '
        + 'own, which makes this a scheduling problem rather than a willingness one.'
      : 'A group that underrates itself often holds capability its managers have not recognised.',
    recommendedResponse: 'Use this to decide whether development should be offered or scheduled. '
      + 'Do not read it as a statement about any individual.',
    caveat: 'This shows how a group sees itself. It does not establish why, and it is not evidence '
      + 'of anyone being careless or dishonest.',
  };
}

/* --------------------------------------------------------- said vs chosen */

export function interpretSaidVsChosen(g: GroupResult): Interpretation {
  const rows = [...g.saidVsChosen].sort((a, b) => b.weakerInSituations.n - a.weakerInSituations.n);
  const top = rows[0];
  return {
    headline: top && top.weakerInSituations.n > 0
      ? `The widest gap between what people say and what they choose is on ${top.name}`
      : 'What your people say and what they choose broadly agree',
    howToRead: 'Every dimension is asked about twice: once as a description of yourself, once as a '
      + 'situation with a choice. This compares the two, per dimension, across the group.',
    interpretation: top
      ? `On ${top.name}, ${top.weakerInSituations.n} people chose less healthily in situations than `
        + `they described themselves, and ${top.healthierInSituations.n} chose more healthily than `
        + 'they described.'
      : '',
    businessMeaning: 'This does not mean respondents are dishonest. It shows where stated beliefs '
      + 'and practical responses diverge. Culture is expressed in behaviour, not only intention.',
    recommendedResponse: 'Where situations are weaker than self-description, training has to use '
      + 'situations and practice, because self-report is already generous there. Where situations '
      + 'are healthier, name and recognise the standard people are holding without crediting themselves for it.',
    caveat: 'A gap is a difference between two kinds of answer, not a measure of honesty.',
  };
}

/* ------------------------------------------------------------------ gates */

export function interpretGates(g: GroupResult): Interpretation {
  const top = g.gateAnalysis[0];
  return {
    headline: top
      ? `${top.name} is the guardrail holding the most people`
      : 'No practice gate is currently holding anyone back',
    howToRead: 'A stage asks for minimum readings before it opens. A gate is what holds a fluent '
      + 'person at a stage until a weakness that matters is addressed.',
    interpretation: top
      ? `${count(top.held.n, g.n)} are held by ${top.name}, which stage ${top.stage} requires at `
        + `${top.required}. The middle person among them reads ${one(top.currentMedian)}, a gap of `
        + `${one(top.gap)} points, and ${top.closeToClearing} are within five points of clearing it.`
      : 'Everyone whose index would carry them higher already meets the readings their next stage asks for.',
    businessMeaning: 'A gate is the cheapest kind of development to target, because the people '
      + 'behind it have already done the rest of the work.',
    recommendedResponse: top
      ? `Target ${top.name} first for the people it holds. Chapter 16 counts how many would move.`
      : 'Nothing to unlock here. Development effort is better spent on the bottleneck in chapter 15.',
  };
}

/* --------------------------------------------------------------- mobility */

export function interpretMobility(g: GroupResult): Interpretation {
  const movable = g.mobility.reduce((a, m) => a + m.immediatelyMovable, 0);
  const gated = g.mobility.reduce((a, m) => a + m.gateConstrained, 0);
  return {
    headline: `${movable} of ${g.n} people are close to their next stage`,
    howToRead: 'Each stage splits three ways: people within five index points of the next stage, '
      + 'people whose index is already there but who are held by a gate, and people for whom the '
      + 'index itself has further to travel.',
    interpretation: mobilitySentence(movable, g.n,
      'practice changing rather than intention changing, and on the gates in chapter 15')
      + ` A further ${gated} are held by a gate rather than by their index.`,
    businessMeaning: 'This is the realistic size of a quarter of movement, not a target.',
    recommendedResponse: gated > movable
      ? 'More of your people are held by a guardrail than by their overall position, so gate work will move more people than general development.'
      : 'General development will move more people here than gate work will.',
    caveat: 'Movement depends on conditions the assessment does not control, and is never promised.',
  };
}

/* ------------------------------------------------------------- priorities */

export function interpretPriorities(a: OrganisationReportAnalytics): Interpretation {
  const actNow = a.priorities.filter((p) => p.region === 'act now');
  const top = a.priorities[0];
  return {
    headline: actNow.length
      ? `${actNow.length} ${actNow.length === 1 ? 'practice' : 'practices'} sit in "act now"`
      : 'Nothing here needs immediate intervention',
    howToRead: 'Reach runs across, importance runs up, and the size of each bubble is how far the '
      + 'group is from the threshold it would need to clear. Every bubble is a practice, never a person.',
    interpretation: top
      ? `The widest-reaching priority is ${top.capability}, which ${top.reach} of ${a.group.n} `
        + `people were given by their own report.`
      : '',
    businessMeaning: 'Importance is built from three facts: how urgent the practice is in its own '
      + 'library, whether the capability it addresses gates a stage for anyone here, and how many '
      + 'people sit at or below the vulnerability line on it. No money is modelled.',
    recommendedResponse: 'Take the act now region first. Chapter 20 sequences it across ninety days.',
  };
}

/* ----------------------------------------------------------- the executive */

/** Chapter 1's generated story, from stage centre, lean, polarisation, bottleneck and adoption. */
export function executiveStory(a: OrganisationReportAnalytics): string {
  const g = a.group;
  const polarisedCount = g.dimensions.filter((d) => d.polarised).length;
  const topConstraint = g.constraints[0];
  const opening = g.centre.stage <= 3
    ? 'Your workforce is early on the route, and the first task is real, bounded practice rather than policy.'
    : g.centre.stage <= 5
      ? 'Your workforce has moved beyond basic AI awareness. Most of your people already operate in functional territory, so the challenge is no longer adoption.'
      : 'Your workforce is past functional use, and the question now is whether capability is being built as fast as output is.';
  const middle = topConstraint
    ? ` The next opportunity is turning current use into thoughtful integration while protecting `
      + `${topConstraint.name.toLowerCase()}, which is the constraint holding the most people here.`
    : ' The next opportunity is consolidating the pattern under changing tools and higher-stakes work.';
  const close = polarisedCount >= 2
    ? ` Because ${polarisedCount} capabilities are polarised, a single generic AI course is unlikely to be sufficient.`
    : g.consistency.label === 'high'
      ? ' Your people sit within a narrow range, so one shared programme can carry the core of them.'
      : ' Your people sit at different levels, so plan a shared core with separate attention at each end.';
  return opening + middle + close;
}

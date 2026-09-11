/**
 * The twenty-two chapters.
 *
 * Each takes the aggregate and a width, and returns Blocks. None of them reads
 * a GroupMember, computes a statistic, or writes a sentence: the numbers come
 * from the adapter, the prose comes from the interpretation engine, and the
 * drawing comes from a scene function.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { Block, ChapterStrip, ChapterClose, Explain, S, TOKENS as T } from '../kit/blocks';
import { SceneView } from '../render/pdf';
import { chapterMeta } from './registry';
import { rangeScene } from '../charts/range';
import { quadrantScene } from '../charts/quadrant';
import { journeyScene } from '../charts/journey';
import { heatmapScene } from '../charts/heatmap';
import { divergingScene, exposureScene, bottleneckScene, mirrorScene } from '../charts/bars';
import { bandRulerScene, medianIllustrationScene, miniRouteScene, stackedBandScene, useBarScene } from '../charts/guide';
import { scorecardScene, strengthScene, profileGridScene, cohortScene, practiceScene, moduleScene } from '../charts/cards';
import { gateFunnelScene, mobilityScene, priorityScene, tierScene, timelineScene, polarisationScene } from '../charts/flow';
import { stageTableScene, registerScene, segmentScene, baselineScene } from '../charts/tables';
import {
  interpretContinuum, interpretLean, interpretDimension, interpretComposite, interpretMatrix,
  interpretHealthyAdoption, interpretPatterns, interpretCalibration, interpretSaidVsChosen,
  interpretGates, interpretMobility, interpretPriorities, executiveStory,
} from '@/engine/orgInterpret';
import { DIMENSIONS, COMPOSITES } from '@/engine/dictionary';
import { STAGE_BUSINESS, PROFILE_BUSINESS, TIER_ORDER, TIER_BLURB } from '@/engine/orgStageCopy';
import { ARCHETYPES } from '@/engine/archetypes';
import { STAGES, SCORING } from '@/engine/config';
import { count as countSentence } from '@/engine/orgCopy';
import type { OrganisationReportAnalytics } from '@/engine/orgAnalytics';
import type { ConstructId } from '@/engine/types';

type P = { a: OrganisationReportAnalytics; width: number };

const Head = ({ n }: { n: number }) => {
  const m = chapterMeta(n);
  return (
    <>
      <Text style={S.eyebrow}>Chapter {m.number}</Text>
      <Text style={S.h1}>{m.title}</Text>
    </>
  );
};
const Close = ({ n, line }: { n: number; line: string }) => (
  <ChapterClose line={line} source={chapterMeta(n).source} />
);
const Para = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ ...S.body, marginBottom: 7 }}>{children}</Text>
);

/* ============================================================ 1. the answer */

export function Ch01({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(1);
  const cards = scorecardScene([
    { figure: String(g.centre.stage), label: 'workforce position',
      meaning: `${g.centre.stageName}, holding ${g.centre.n} of ${g.n}` },
    { figure: `${g.headline.healthyAdoption.n}/${g.n}`, label: 'healthy adoption',
      meaning: 'use, judgment, boundaries and independence together' },
    { figure: String(Math.round(g.index.median)), label: 'the middle person’s index',
      meaning: `the middle half spans ${Math.round(g.consistency.widthOfMiddleHalf)} points`, fill: g.index.median },
    ...['futureReadiness', 'judgment', 'capabilityTransfer'].map((id) => {
      const c = g.composites.find((x) => x.id === id)!;
      const band = c.spread.median >= 65 ? 'strength' : c.spread.median >= 40 ? 'developing' : 'watch';
      return { figure: String(Math.round(c.spread.median)), label: c.label.toLowerCase(),
        meaning: COMPOSITES.find((x) => x.id === id)?.question ?? '', band: band as 'strength', fill: c.spread.median };
    }),
    { figure: String(g.lean.towardsDependence.n), label: 'lean towards dependence',
      meaning: `against ${g.lean.towardsDisconnection.n} towards disconnection` },
    { figure: String(g.mobility.reduce((s, x) => s + x.immediatelyMovable, 0)), label: 'close to the next stage',
      meaning: 'under current scoring rules, not a promise' },
    { figure: g.constraints[0] ? String(g.constraints[0].n) : '0', label: 'held by the top constraint',
      meaning: g.constraints[0] ? DIMENSIONS[g.constraints[0].construct].executiveName : 'no single constraint dominates' },
    { figure: String(g.dimensions.filter((d) => d.polarised).length), label: 'capabilities split in two',
      meaning: 'where one shared session would serve neither half' },
    { figure: g.consistency.label, label: 'workforce consistency',
      meaning: `middle half spans ${Math.round(g.consistency.widthOfMiddleHalf)} points` },
  ], width);

  const exposure = exposureScene(
    g.governance.map((x) => ({
      name: DIMENSIONS[x.construct].executiveName,
      exposureLabel: DIMENSIONS[x.construct].exposureLabel ?? '',
      atOrBelow: x.atOrBelowVulnerability.n,
    })), g.n, width);

  const three = a.priorities.filter((p) => p.region === 'act now').slice(0, 3);
  return (
    <View>
      <Head n={1} />
      <ChapterStrip question={m.question} answer={executiveStory(a)}
        figure={`${g.n}`} figureLabel="people in this reading"
        mini={miniRouteScene(g.centre.stage, 150)} />
      <View style={{ marginBottom: 14 }} wrap={false}><SceneView scene={cards} /></View>
      <Block scene={exposure} i={{
        headline: 'Where your exposure sits',
        howToRead: 'Three capabilities carry most of an organisation’s practical exposure. Each bar '
          + 'is your whole workforce, with the people at or below the vulnerability line marked.',
        interpretation: g.governance.map((x) =>
          `${DIMENSIONS[x.construct].executiveName}: ${x.atOrBelowVulnerability.n} of ${g.n}`).join('. ') + '.',
        businessMeaning: 'These are the counts a regulator, a client or an insurer would ask about, '
          + 'and the number of individual reports worth opening on each.',
        recommendedResponse: 'Chapter 11 carries the register and the practice that addresses each.',
      }} wide />
      <View wrap={false} style={{ backgroundColor: T.paper, borderRadius: 6, padding: 12, marginTop: 4 }}>
        <Text style={{ ...S.h2, marginBottom: 6 }}>If you do only three things next, do these</Text>
        {three.length ? three.map((p, i) => (
          <Text key={p.tag} style={{ ...S.body, fontSize: 8.8, marginBottom: 4 }}>
            {i + 1}. {p.capability}. Reaches {p.reach} of {g.n} people. Expected to move: {p.metricToMove}.
          </Text>
        )) : (
          <Text style={S.muted}>Nothing in this reading needs immediate intervention. Chapter 17 ranks
            what is worth doing next in order.</Text>
        )}
      </View>
      <Close n={1} line={executiveStory(a).split('.')[0] + '.'} />
    </View>
  );
}

/* ====================================================== 2. how to read it */

export function Ch02({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(2);
  return (
    <View>
      <Head n={2} />
      <ChapterStrip question={m.question} answer="Every term you will meet later is defined here, once."
        figure="0 to 100" figureLabel="the scale every score uses" />
      <Block scene={bandRulerScene(width)} i={{
        headline: 'Three bands, and a fourth line that crosses them',
        howToRead: 'Every score runs from 0 to 100 and describes practice on the day your people '
          + 'answered: how they were working with AI, not how competent they are, and not their standing at work.',
        interpretation: '65 and above is a strength. 40 to 64.9 is developing. Below 40 is watch. '
          + 'Separately, 45 and below is the vulnerability line.',
        businessMeaning: 'These are four classifications and not three. A reading of 42 is developing '
          + 'and also vulnerable. A reading of 38 is watch and also vulnerable. A reading of 50 is '
          + 'developing and not vulnerable.',
        recommendedResponse: 'Read the band for where a capability sits, and the vulnerability line '
          + 'for how many individual reports are worth opening.',
      }} wide />
      <Block scene={medianIllustrationScene(width)} i={{
        headline: 'The median is the middle person, not the average',
        howToRead: 'Line your people up from the lowest score to the highest. The median is the score '
          + 'of the person standing in the middle: half score at or above it, half at or below.',
        interpretation: 'It is not the average, and that is deliberate: one unusually high or low '
          + 'person moves an average a long way and moves the median hardly at all. With an even '
          + 'number of people, the median sits halfway between the two in the middle.',
        businessMeaning: 'The middle half runs from the person a quarter of the way up the line to '
          + 'the person three quarters of the way up. Narrow means one programme can serve the core. '
          + 'Wide means it will not fit everyone.',
        recommendedResponse: 'Plan against the bands and the middle half rather than against a single average.',
      }} wide />
      <Para>
        Some further terms. <Text style={{ fontWeight: 600 }}>Polarised</Text> means the group holds both a
        strength and a vulnerability on the same capability, which is at least two employee populations.
        <Text style={{ fontWeight: 600 }}> Preliminary</Text> means a reading rests on fewer answers than usual, so
        read it lightly and expect it to firm up on a retake. <Text style={{ fontWeight: 600 }}>Gates</Text> are
        minimum readings a stage asks for before it opens, so that fluency alone cannot carry a person past a
        weakness that matters.
      </Para>
      <Para>
        There are two ways to be off the path. Towards dependence means the work would be hard to reproduce
        without the tool, and the response is guardrails and deliberate unaided practice. Towards disconnection
        means there is little real practice behind a person’s view of AI, and the response is more real practice,
        not more caution. The index treats dependence as the costlier of the two, deliberately, because it erodes
        capability that is slow to rebuild.
      </Para>
      <Para>
        Two composites run the other way, where <Text style={{ fontWeight: 600 }}>lower is healthier</Text>: how much
        depends on the tool, and how much practice is missing. Wherever they appear the chart says so and the
        reading is reversed, so a longer bar never looks better.
      </Para>
      <Para>
        Counts lead throughout. With a small group a count is more honest than a percentage, so percentages
        appear beside counts and never instead of them. This report does not name, rank, appraise or select
        anyone. A segment appears only at seven or more people, and a cut is withheld when it would leave fewer
        than seven on the other side, because a cut that leaves three people identifies them.
      </Para>
      <Close n={2} line="Every score is practice on the day, on a scale of 0 to 100, read in bands." />
    </View>
  );
}

/* =============================================== 3. the journey (kept from the slice) */

export function Ch03({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(3);
  const i = interpretContinuum(g);
  const byStage = new Map(g.distribution.map((d) => [d.stage, d]));
  const gateByStage = new Map(g.gateAnalysis.map((x) => [x.stage, x.name]));
  const movableByStage = new Map(g.mobility.map((x) => [x.stage, x.immediatelyMovable]));
  const journey = journeyScene({
    width, n: g.n, median: g.index.median, q1: g.index.q1, q3: g.index.q3, centreStage: g.centre.stage,
    stages: STAGES.map((s) => ({
      stage: s.stage, stageName: byStage.get(s.stage)?.stageName ?? s.name, short: s.short,
      minIndex: s.minIndex, n: byStage.get(s.stage)?.n ?? 0, share: byStage.get(s.stage)?.share ?? 0,
      movable: movableByStage.get(s.stage) ?? 0, gate: gateByStage.get(s.stage),
    })),
  });
  const table = stageTableScene(STAGE_BUSINESS.map((s) => ({
    stage: s.stage, name: byStage.get(s.stage)?.stageName ?? STAGES[s.stage - 1].name,
    looksLike: s.looksLike, meansForBusiness: s.meansForBusiness, needNext: s.needNext,
    n: byStage.get(s.stage)?.n ?? 0, present: (byStage.get(s.stage)?.n ?? 0) > 0,
  })), g.n, width);
  return (
    <View>
      <Head n={3} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={String(g.centre.stage)} figureLabel={`the stage holding most of your people: ${g.centre.stageName}`}
        mini={miniRouteScene(g.centre.stage, 140)} />
      <Block scene={journey} i={i} wide />
      <Block scene={rangeScene({
        width, title: 'The same reading on the standard ruler',
        median: g.index.median, q1: g.index.q1, q3: g.index.q3, min: g.index.min, max: g.index.max, n: g.n,
        stageMarks: STAGES.filter((s) => s.stage % 2 === 1).map((s) => ({ at: s.minIndex, label: String(s.stage) })),
      })} i={{
        headline: 'The same reading, on the ruler used everywhere else',
        howToRead: 'The bar is the middle half of your people, the dot is the middle person, and the '
          + 'line behind shows how far the group reaches.',
        interpretation: i.howToRead,
        businessMeaning: g.consistency.reading,
        recommendedResponse: i.recommendedResponse,
      }} wide />
      <Block scene={table} i={{
        headline: 'What each stage means for an employer',
        howToRead: 'All ten stages are shown whether or not anyone is standing on them, so the route '
          + 'is visible rather than only the part your workforce occupies. Rows with people are highlighted.',
        interpretation: `Your workforce occupies ${g.distribution.length} of the ten stages.`,
        businessMeaning: 'A stage is a neighbourhood rather than a coordinate. It tells you what you '
          + 'can reasonably expect someone to handle, and what they need before the next step.',
        recommendedResponse: 'Read the row your centre sits on, then the row above it. That is the '
          + 'move most of your workforce is making next.',
      }} wide />
      <Close n={3} line={i.headline} />
    </View>
  );
}

/* ========================================================== 4. which way it leans */

export function Ch04({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(4);
  const i = interpretLean(g);
  const chart = divergingScene({
    width, title: i.headline, n: g.n,
    left: { label: 'towards disconnection', n: g.lean.towardsDisconnection.n, note: 'needs more real, bounded practice' },
    middle: { label: 'balanced', n: g.lean.balanced.n },
    right: { label: 'towards dependence', n: g.lean.towardsDependence.n, note: 'needs guardrails and unaided practice' },
  });
  const under = g.composites.find((c) => c.id === 'underexposure')!;
  const dep = g.composites.find((c) => c.id === 'dependencyIndex')!;
  return (
    <View>
      <Head n={4} />
      <ChapterStrip question={m.question} answer={i.interpretation}
        figure={String(Math.max(g.lean.towardsDependence.n, g.lean.towardsDisconnection.n))}
        figureLabel="people on the side that leads" />
      <Block scene={chart} i={i} wide />
      <Block scene={rangeScene({
        width, title: 'How much of the work depends on the tool', lowerIsHealthier: true,
        median: dep.spread.median, q1: dep.spread.q1, q3: dep.spread.q3, min: dep.spread.min, max: dep.spread.max, n: g.n,
      })} i={interpretComposite(g, 'dependencyIndex')} wide />
      <Block scene={rangeScene({
        width, title: 'How much real practice is missing', lowerIsHealthier: true,
        median: under.spread.median, q1: under.spread.q1, q3: under.spread.q3, min: under.spread.min, max: under.spread.max, n: g.n,
      })} i={interpretComposite(g, 'underexposure')} wide />
      <Close n={4} line={`${i.headline}. This chapter decides which programme runs first.`} />
    </View>
  );
}

/* ============================================ 5. readiness against protection */

export function Ch05({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(5);
  const cells = a.readinessProtectionMatrix.cells;
  const at = (k: string) => (k === 'hh' ? 'tr' : k === 'hl' ? 'br' : k === 'lh' ? 'tl' : 'bl') as 'tr';
  const chart = quadrantScene({
    width, title: 'Are you building AI capability safely?',
    xLabel: 'capability and readiness', yLabel: 'human protection',
    xLow: 'lower', xHigh: 'higher', yLow: 'lower', yHigh: 'higher',
    base: a.readinessProtectionMatrix.base,
    cells: cells.map((c) => ({ key: c.key, at: at(c.key), title: c.title, n: c.n, share: c.share,
      response: c.subtitle, highlight: c.key === 'hl' })),
  });
  const i = interpretMatrix(cells, a.readinessProtectionMatrix.base,
    'This is the cross that says whether your organisation is building AI capability safely rather '
    + 'than only quickly. Capability without protection is the combination this instrument exists to catch.');
  return (
    <View>
      <Head n={5} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={String(cells.find((c) => c.key === 'hl')?.n ?? 0)}
        figureLabel="powerful but exposed" />
      <Para>
        The objective is not maximum AI use. The objective is increasing capability while preserving human
        judgment, agency and independent capability. This map puts those two things on separate axes so that a
        workforce which is fluent and unprotected cannot be mistaken for one that is ready.
      </Para>
      <Block scene={chart} i={i} wide />
      {cells.map((c) => (
        <View key={c.key} wrap={false} style={{ marginBottom: 8 }}>
          <Text style={{ ...S.body, fontSize: 8.8, fontWeight: 600 }}>{c.title}: {c.n} of {a.readinessProtectionMatrix.base}</Text>
          <Text style={S.muted}>{c.response}</Text>
        </View>
      ))}
      <Close n={5} line={i.headline} />
    </View>
  );
}

/* ================================================== 6. the ten dimensions */

export function Ch06({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(6);
  const rows = g.dimensions.map((d) => ({
    executiveName: DIMENSIONS[d.construct].executiveName,
    canonicalName: d.canonicalName,
    cluster: DIMENSIONS[d.construct].cluster,
    median: d.spread.median,
    strong: d.bands.strong.n, developing: d.bands.developing.n, watch: d.bands.watch.n,
    vulnerable: d.vulnerable.n,
    spreadWidth: Math.round((d.spread.q3 - d.spread.q1) * 10) / 10,
    polarised: d.polarised, n: g.n,
  }));
  const ordered = [...g.dimensions].sort((x, y) => x.spread.median - y.spread.median);
  return (
    <View>
      <Head n={6} />
      <ChapterStrip question={m.question}
        answer={`${rows.filter((r) => r.median >= 65).length} capabilities are a strength across your workforce, `
          + `${rows.filter((r) => r.median <= 45).length} sit at or below the vulnerability line, and `
          + `${rows.filter((r) => r.polarised).length} are split in two.`}
        figure={String(rows.filter((r) => r.polarised).length)} figureLabel="capabilities split in two" />
      <Block scene={heatmapScene(rows, g.n, width)} i={{
        headline: 'Where your workforce is strong, developing, vulnerable and divided',
        howToRead: 'Ten capabilities, grouped by what they protect. The median column is coloured by '
          + 'band, the count columns carry in-cell bars, and the split column marks a capability where '
          + 'the workforce holds both a strength and a vulnerability at once.',
        interpretation: `${rows.filter((r) => r.median >= 65).length} capabilities have a median in the `
          + `strength band, ${rows.filter((r) => r.median <= 45).length} at or below the vulnerability line.`,
        businessMeaning: 'This page is the one to keep. It shows, at a glance, where the organisation '
          + 'is strong, where most people are still developing, where vulnerability sits, and where a '
          + 'single shared session would serve neither half of the workforce.',
        recommendedResponse: 'Work down the page from the lowest median, and treat any split capability '
          + 'as two populations rather than one.',
      }} wide />
      {ordered.map((d) => {
        const e = DIMENSIONS[d.construct];
        const i = interpretDimension(g, d.construct);
        return (
          <View key={d.construct} wrap={false} style={{ marginBottom: 14 }}>
            <Text style={S.h2}>{e.executiveName}</Text>
            <Text style={{ ...S.muted, fontSize: 6.6, marginBottom: 4 }}>
              {e.canonicalName} · {e.cluster}
            </Text>
            <SceneView scene={rangeScene({
              width, title: i.headline, quiet: true,
              median: d.spread.median, q1: d.spread.q1, q3: d.spread.q3,
              min: d.spread.min, max: d.spread.max, n: g.n,
            })} />
            <SceneView scene={stackedBandScene({
              strong: d.bands.strong.n, developing: d.bands.developing.n,
              watch: d.bands.watch.n, vulnerable: d.vulnerable.n, n: g.n,
            }, Math.min(240, width))} />
            <Explain i={i} wide />
          </View>
        );
      })}
      <Close n={6} line={`${ordered[0] ? DIMENSIONS[ordered[0].construct].executiveName : 'No capability'} has the lowest median of the ten.`} />
    </View>
  );
}

/* ======================================================= 7. the six questions */

export function Ch07({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(7);
  return (
    <View>
      <Head n={7} />
      <ChapterStrip question={m.question}
        answer="Six readings, each phrased as a question an executive team would actually ask."
        figure="6" figureLabel="composite readings" />
      {COMPOSITES.map((c) => {
        const sp = g.composites.find((x) => x.id === c.id)!;
        return (
          <Block key={c.id} scene={rangeScene({
            width, title: c.question, lowerIsHealthier: c.healthyDirection === 'lower',
            median: sp.spread.median, q1: sp.spread.q1, q3: sp.spread.q3,
            min: sp.spread.min, max: sp.spread.max, n: g.n,
          })} i={interpretComposite(g, c.id)} wide />
        );
      })}
      <Close n={7} line="Six questions, answered from the same ten dimensions read six different ways." />
    </View>
  );
}

/* ================================================== 8. use against capability */

export function Ch08({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(8);
  const q = g.quadrants.capabilityUse;
  const at = (k: string) => (k === 'hh' ? 'tr' : k === 'hl' ? 'tl' : k === 'lh' ? 'br' : 'bl') as 'tr';
  const chart = quadrantScene({
    width, title: 'How much your people use AI, against what they can actually do',
    xLabel: 'how much AI they use', yLabel: 'capability',
    xLow: 'less', xHigh: 'more', yLow: 'thinner', yHigh: 'stronger',
    base: g.quadrants.capabilityUseBase,
    asideLabel: 'deliberately selective use, with judgment intact',
    asideN: g.quadrants.deliberateNonUse.n,
    cells: q.map((c) => ({ key: c.key, at: at(c.key), title: c.label, n: c.n, share: c.share,
      response: c.action, highlight: c.key === 'lh' })),
  });
  const i = interpretMatrix(q.map((c) => ({ title: c.label, n: c.n, share: c.share, response: c.action })),
    g.quadrants.capabilityUseBase,
    'Adoption and capability are different things, and this is where they come apart.',
    'deliberately selective use', g.quadrants.deliberateNonUse.n);
  const heavy = q.find((c) => c.key === 'lh');
  return (
    <View>
      <Head n={8} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={String(heavy?.n ?? 0)} figureLabel="using it heavily with capability still thin" />
      <Block scene={chart} i={i} wide />
      {heavy && heavy.n > 0 ? (
        <Para>
          This is not an adoption problem. These people are already using AI. The organisational problem is
          that capability and safeguards have not caught up with usage.
        </Para>
      ) : null}
      <Block scene={useBarScene(g.usageDistribution, g.n, width)} i={{
        headline: 'How much AI your people report using',
        howToRead: 'Each bar counts people at one reported level of use. This is what they told us '
          + 'before answering anything else.',
        interpretation: g.usageDistribution.filter((u) => u.n > 0)
          .map((u) => `${u.label}: ${u.n} of ${g.n}`).join('. ') + '.',
        businessMeaning: 'Reported use is the denominator for everything else in this chapter. A '
          + 'workforce that barely uses AI has a different problem from one that uses it constantly.',
        recommendedResponse: g.quadrants.deliberateNonUse.n > 0
          ? `${g.quadrants.deliberateNonUse.n} of your people use little AI by choice with judgment intact. Do not read that as resistance.`
          : 'Read this beside the capability axis above rather than on its own.',
      }} wide />
      <Close n={8} line={i.headline} />
    </View>
  );
}

/* ============================================ 9. fluency against protection */

export function Ch09({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(9);
  const q = g.quadrants.fluencyJudgment;
  const at = (k: string) => (k === 'fp' ? 'tr' : k === 'fu' ? 'br' : k === 'np' ? 'tl' : 'bl') as 'tr';
  const chart = quadrantScene({
    width, title: 'Are AI skills developing faster than AI judgment?',
    xLabel: 'practical AI fluency', yLabel: 'judgment',
    xLow: 'not yet fluent', xHigh: 'fluent', yLow: 'thinner', yHigh: 'protected',
    base: g.quadrants.fluencyJudgmentBase,
    cells: q.map((c) => ({ key: c.key, at: at(c.key), title: c.label, n: c.n, share: c.share,
      response: c.action, highlight: c.key === 'fu' })),
  });
  const i = interpretMatrix(q.map((c) => ({ title: c.label, n: c.n, share: c.share, response: c.action })),
    g.quadrants.fluencyJudgmentBase,
    'Fluency without judgment is the combination this instrument exists to catch, because it looks '
    + 'like progress from the outside.');
  return (
    <View>
      <Head n={9} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={String(g.quadrants.fluentAndAtWatch.n)} figureLabel="fluent with judgment in the watch band" />
      <Block scene={chart} i={i} wide />
      <Para>
        A high-use, high-fluency workforce with weak checking can look advanced while carrying hidden
        exposure. Of the people who are fluent, {g.quadrants.fluentAndAtWatch.n} of {g.n} have judgment in the
        watch band, and that subset is the group to act on first. The response is judgment work, not tool
        training.
      </Para>
      <Close n={9} line={i.headline} />
    </View>
  );
}

/* ======================================================= 10. strengths */

export function Ch10({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(10);
  const items = g.strengths.map((d) => {
    const e = DIMENSIONS[d.construct];
    return {
      signal: `${e.executiveName}: ${d.bands.strong.n} of ${g.n} in the strength band`,
      whyItMatters: e.businessMeaning,
      preserve: e.bandCopy.strength,
      scale: `Have these people show one colleague how they do it. Chapter 18 carries the practice.`,
    };
  });
  const extras: typeof items = [];
  if (g.patterns.help[0]) {
    extras.push({ signal: `${g.patterns.help[0].label}: ${g.patterns.help[0].n} of ${g.patterns.help[0].base}`,
      whyItMatters: 'A help pattern is self-reinforcing, which means it tends to deepen on its own.',
      preserve: 'Whatever conditions are producing it, which are usually local rather than organisational.',
      scale: 'Find out what those people do differently and make it repeatable.' });
  }
  if (g.headline.healthyAdoption.n > 0) {
    extras.push({ signal: `Healthy adoption: ${g.headline.healthyAdoption.n} of ${g.n} meet all four conditions`,
      whyItMatters: 'These are the people using AI the way you would want everyone to.',
      preserve: 'Their independence and their checking, both of which thin under time pressure.',
      scale: 'They are your internal exemplars, and chapter 19 puts them in the top tiers.' });
  }
  const all = [...items, ...extras];
  return (
    <View>
      <Head n={10} />
      <ChapterStrip question={m.question}
        answer={all.length
          ? `${all.length} things are working and are worth protecting before anything else changes.`
          : 'No capability currently reaches the strength band across this workforce, which is itself the finding.'}
        figure={String(g.dimensions.filter((d) => d.bands.strong.n > 0).length)}
        figureLabel="capabilities with at least one person in the strength band" />
      {all.length ? (
        <Block scene={strengthScene(all, width)} i={{
          headline: 'What is working, and what to protect',
          howToRead: 'Each card names a signal, why it matters, what to preserve, and how to spread it.',
          interpretation: all.map((x) => x.signal).join('. ') + '.',
          businessMeaning: 'A strength is what the rest is built on, and it is the thing most likely to '
            + 'be assumed rather than maintained.',
          recommendedResponse: 'Protect these before adding anything. Development that costs you a '
            + 'strength is not a gain.',
        }} wide />
      ) : (
        <Para>
          No capability has a median in the strength band across this workforce yet. That is a finding
          rather than an absence: it tells you the development effort in the chapters that follow has a
          broad base to work from rather than a narrow one to protect.
        </Para>
      )}
      <Close n={10} line={all.length ? `${all.length} strengths worth protecting before anything else changes.` : 'No capability yet reaches the strength band across this workforce.'} />
    </View>
  );
}

/* ==================================================== 11. risks and exposure */

export function Ch11({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(11);
  const meters = g.governance.map((x) => ({
    name: DIMENSIONS[x.construct].executiveName,
    exposureLabel: DIMENSIONS[x.construct].exposureLabel ?? '',
    atOrBelow: x.atOrBelowVulnerability.n,
  }));
  const register = [
    ...g.governance.map((x) => ({
      exposure: (DIMENSIONS[x.construct].exposureLabel ?? '').replace(/^./, (c) => c.toUpperCase()),
      dimension: DIMENSIONS[x.construct].executiveName,
      atOrBelow: x.atOrBelowVulnerability.n,
      practice: DIMENSIONS[x.construct].recommendedPractice.replace(/_/g, ' '),
    })),
    { exposure: 'Dependence', dimension: DIMENSIONS.dependencySafety.executiveName,
      atOrBelow: g.dimensions.find((d) => d.construct === 'dependencySafety')!.vulnerable.n,
      practice: DIMENSIONS.dependencySafety.recommendedPractice.replace(/_/g, ' ') },
    { exposure: 'Skill erosion', dimension: DIMENSIONS.skillGrowth.executiveName,
      atOrBelow: g.dimensions.find((d) => d.construct === 'skillGrowth')!.vulnerable.n,
      practice: DIMENSIONS.skillGrowth.recommendedPractice.replace(/_/g, ' ') },
  ];
  const i = interpretPatterns(g);
  return (
    <View>
      <Head n={11} />
      <ChapterStrip question={m.question}
        answer={`${Math.max(...meters.map((x) => x.atOrBelow))} of ${g.n} people sit at or below the `
          + 'vulnerability line on your largest exposure.'}
        figure={String(meters.reduce((s, x) => s + x.atOrBelow, 0))}
        figureLabel="readings at or below the line across the three governance capabilities" />
      <Block scene={exposureScene(meters, g.n, width)} i={{
        headline: 'Three exposures, counted in people',
        howToRead: 'Each bar is your whole workforce. The marked part is the people at or below the '
          + 'vulnerability line on that capability.',
        interpretation: meters.map((x) => `${x.name}: ${x.atOrBelow} of ${g.n}`).join('. ') + '.',
        businessMeaning: 'Confidential information, unverified claims reaching real work, and decisions '
          + 'that belong to a person being made by a tool. These are the three an outsider would ask about.',
        recommendedResponse: 'Set a standard for each, and build it into the workflow rather than into a '
          + 'policy document. The register below names the practice that addresses each one.',
      }} wide />
      <Block scene={registerScene(register, g.n, width)} i={{
        headline: 'The exposure register',
        howToRead: 'One row per exposure, with the capability that carries it, the number of people at '
          + 'or below the line, and the practice that addresses it.',
        interpretation: `${register.reduce((s, r) => s + r.atOrBelow, 0)} readings across ${register.length} exposures sit at or below the line.`,
        businessMeaning: 'No costs are estimated here and none should be inferred. The count is the '
          + 'number of individual reports worth opening, not a probability of anything happening.',
        recommendedResponse: 'Take the largest count first. It is both the widest exposure and the '
          + 'cheapest to reduce, because the practice is already written.',
      }} wide />
      <Block scene={polarisationScene(
        g.dimensions.filter((d) => d.polarised)
          .map((d) => ({ name: DIMENSIONS[d.construct].executiveName, strong: d.bands.strong.n, watch: d.bands.watch.n })),
        g.n, width)} i={i} wide />
      <Close n={11} line={`Your largest exposure is on ${[...meters].sort((x, y) => y.atOrBelow - x.atOrBelow)[0]?.name ?? 'none of the three'}.`} />
    </View>
  );
}

/* ================================================ 12. not one group */

export function Ch12({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(12);
  const profiles = ARCHETYPES.map((arch) => {
    const hit = g.archetypes.find((x) => x.id === arch.id);
    return { name: arch.name, n: hit?.n ?? 0, share: hit?.share ?? 0, present: (hit?.n ?? 0) > 0 };
  });
  const cohorts = a.developmentCohorts.cohorts;
  const panels = a.privacyState
    .filter((p) => !/intervals|sensitive/i.test(p.cut))
    .map((p) => {
      const seg = g.segments.find((s) => `${s.dimension}: ${s.value}` === p.cut);
      return {
        cut: p.cut, shown: p.state === 'shown', needs: p.needs,
        n: seg?.n, median: seg?.index?.median,
        modalStage: seg?.modalStage ? `most at stage ${seg.modalStage.stage}` : undefined,
        // Resolved through the dictionary. This printed "Human Agency" on the
        // page, which is the engine's name for the construct and not the one
        // the body of this report speaks.
        constraint: seg?.constraint ? DIMENSIONS[seg.constraint.construct].executiveName : undefined,
      };
    });
  return (
    <View>
      <Head n={12} />
      <ChapterStrip question={m.question}
        answer={`Your workforce holds ${profiles.filter((p) => p.present).length} of the nine profiles and `
          + `${cohorts.length} developmental cohorts, which is why one shared programme is unlikely to fit all of it.`}
        figure={String(cohorts.length)} figureLabel="developmental cohorts" />
      <Block scene={profileGridScene(profiles, g.n, width)} i={{
        headline: 'How your workforce currently relates to AI',
        howToRead: 'All nine profiles are shown whether or not anyone holds them. A profile is a '
          + 'pattern of current practice, assigned from the same answers as everything else.',
        interpretation: profiles.filter((p) => p.present)
          .map((p) => `${p.name}: ${p.n} of ${g.n}`).join('. ') + '.',
        businessMeaning: 'Profiles describe current patterns of AI practice, not fixed employee types. '
          + 'A person moves between them as their practice changes, which is the point of the report.',
        recommendedResponse: 'Lead each pattern differently. The first conversation that works for one '
          + 'profile is the wrong opening for another.',
      }} wide />
      {profiles.filter((p) => p.present).map((p) => {
        const arch = ARCHETYPES.find((x) => x.name === p.name)!;
        const biz = PROFILE_BUSINESS[arch.id];
        if (!biz) return null;
        return (
          <View key={arch.id} wrap={false} style={{ marginBottom: 9 }}>
            <Text style={{ ...S.body, fontSize: 8.6, fontWeight: 600 }}>{p.name} · {p.n} of {g.n}</Text>
            <Text style={S.muted}>Opportunity: {biz.opportunity} Risk: {biz.risk}</Text>
            <Text style={S.muted}>Emphasis: {biz.emphasis}</Text>
            <Text style={S.muted}>First conversation: {biz.firstConversation}</Text>
          </View>
        );
      })}
      <Block scene={cohortScene(cohorts, g.n, width)} i={{
        headline: 'Your workforce, grouped by what it needs next',
        howToRead: 'Cohorts are assigned by need rather than by department or seniority, so they stay '
          + 'privacy-safe at any size and describe development rather than people.',
        interpretation: cohorts.map((c) => `${c.name}: ${c.n} of ${g.n}`).join('. ') + '.'
          + (a.developmentCohorts.merged.length
            ? ` ${a.developmentCohorts.merged.join(' and ')} had too few people to report separately and were folded into the nearest theme.`
            : ''),
        businessMeaning: 'This is the shape of the training problem. Each cohort needs a different kind '
          + 'of programme, and chapter 19 maps them on to tiers.',
        recommendedResponse: 'Size your programmes against these counts rather than against the whole workforce.',
      }} wide />
      <Block scene={segmentScene(panels, width)} i={{
        headline: 'Which parts of your organisation can be read separately',
        howToRead: 'A cut is shown only when it holds seven or more people and leaves seven or more '
          + 'outside it. Everything else is withheld, and says what it would take to appear.',
        interpretation: `${panels.filter((p) => p.shown).length} of ${panels.length} requested cuts can be shown.`,
        businessMeaning: 'The platform currently knows which assessment each person took and how much '
          + 'AI they report using. It does not hold department, site, role level or tenure, so those cuts '
          + 'cannot be made at any group size until they are collected.',
        recommendedResponse: 'If you want development planned by department or site, those fields have '
          + 'to be collected at enrolment. Nothing in this report can reconstruct them.',
        caveat: 'A withheld cut carries no count here, because the count is the thing that would identify people.',
      }} wide />
      <Close n={12} line={`${cohorts.length} cohorts and ${profiles.filter((p) => p.present).length} profiles: this is not one workforce.`} />
    </View>
  );
}

/* ============================================ 13. said against chosen */

export function Ch13({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(13);
  const rows = g.saidVsChosen.map((s) => ({
    name: s.name, aligned: s.aligned.n, healthier: s.healthierInSituations.n, weaker: s.weakerInSituations.n,
  }));
  const i = interpretSaidVsChosen(g);
  return (
    <View>
      <Head n={13} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={String(Math.max(...rows.map((r) => r.weaker)))}
        figureLabel="the widest gap, in people, on a single capability" />
      <Block scene={mirrorScene(rows, g.n, width)} i={i} wide />
      <Para>
        This does not mean respondents are dishonest. It shows where stated beliefs and practical responses
        diverge, and culture is expressed in behaviour rather than in intention. On the left are standards people
        hold and do not credit themselves for, which are worth naming and recognising. On the right are practices
        people describe and do not keep under pressure, where training has to use situations and practice, because
        self-report is already generous there.
      </Para>
      <Close n={13} line={i.headline} />
    </View>
  );
}

/* ==================================================== 14. calibration */

export function Ch14({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(14);
  const i = interpretCalibration(g);
  const feel = divergingScene({
    width, title: 'How healthy your people felt, against what was measured', n: g.calibration.felt.n,
    left: { label: 'felt less healthy than measured', n: g.calibration.felt.lessHealthy.n },
    middle: { label: 'about right', n: g.calibration.felt.matched.n },
    right: { label: 'felt healthier than measured', n: g.calibration.felt.healthier.n },
  });
  const pred = divergingScene({
    width, title: 'How accurately they predicted their own result', n: g.calibration.predicted.n,
    left: { label: 'exact', n: g.calibration.predicted.accurate.n },
    middle: { label: 'within one band', n: g.calibration.predicted.withinOne.n },
    right: { label: 'further off', n: g.calibration.predicted.wider.n },
  });
  return (
    <View>
      <Head n={14} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={`${g.calibration.felt.matched.n}/${g.calibration.felt.n}`}
        figureLabel="saw their own position about right" />
      <Block scene={feel} i={i} wide />
      <Block scene={pred} i={{
        headline: 'Prediction is the sharper of the two readings',
        howToRead: 'Before answering, people predicted which band their result would fall in. This '
          + 'compares the prediction with the measurement.',
        interpretation: `${g.calibration.predicted.accurate.n} were exact, `
          + `${g.calibration.predicted.withinOne.n} within one band, and `
          + `${g.calibration.predicted.wider.n} further off, of ${g.calibration.predicted.n} who answered.`,
        businessMeaning: 'A workforce that predicts itself well usually manages its own development well, '
          + 'and one that does not usually needs development scheduled rather than offered.',
        recommendedResponse: 'Use this to decide whether to offer development or to schedule it.',
        caveat: 'This is a reading about a group. It establishes nothing about any individual, and it '
          + 'is not evidence of carelessness.',
      }} wide />
      <Close n={14} line={i.headline} />
    </View>
  );
}

/* ================================================ 15. the constraint */

export function Ch15({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(15);
  const rows = g.constraints.map((c) => ({
    name: DIMENSIONS[c.construct].executiveName, n: c.n,
    medianGap: g.constraintGap.find((x) => x.construct === c.construct)?.medianGap ?? 0,
  }));
  const steps = g.gateAnalysis.map((x) => ({
    name: x.name, stage: x.stage, required: x.required, held: x.held.n,
    currentMedian: x.currentMedian, gap: x.gap, close: x.closeToClearing,
  }));
  const i = interpretGates(g);
  return (
    <View>
      <Head n={15} />
      <ChapterStrip question={m.question}
        answer={rows[0] ? `${rows[0].name} is the constraint for ${rows[0].n} of ${g.n} people, more than any other capability.` : 'No single capability is acting as the constraint across this workforce.'}
        figure={rows[0] ? String(rows[0].n) : '0'} figureLabel="people held by the top constraint" />
      <Block scene={bottleneckScene(rows, g.n, width)} i={{
        headline: rows[0] ? `${rows[0].name} is holding the most people back` : 'No single constraint dominates',
        howToRead: 'A bottleneck is the dimension doing most to hold a person’s position, which is not '
          + 'always their lowest number. Each bar counts the people for whom that capability is the constraint.',
        interpretation: rows.slice(0, 3).map((r) => `${r.name}: ${r.n} of ${g.n}`).join('. ') + '.',
        businessMeaning: 'The tallest bar is where a training budget goes first, because it moves more '
          + 'people per unit of effort than anything else on the page.',
        recommendedResponse: rows[0]
          ? `Target ${rows[0].name}. The median person held by it needs ${rows[0].medianGap} points to clear it.`
          : 'Spread effort across the portfolio in chapter 18 rather than concentrating it.',
      }} wide />
      <Block scene={gateFunnelScene(steps, g.n, width)} i={i} wide />
      <Close n={15} line={rows[0] ? `${rows[0].name} is the single capability that would move the most people.` : 'No single capability would move more people than any other.'} />
    </View>
  );
}

/* ==================================================== 16. mobility */

export function Ch16({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(16);
  const i = interpretMobility(g);
  const rows = g.mobility.map((x) => ({
    stage: x.stage, stageName: x.stageName, n: x.n,
    movable: x.immediatelyMovable, gated: x.gateConstrained, development: x.developmentRequired,
    intoName: x.intoName,
  }));
  return (
    <View>
      <Head n={16} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={String(g.mobility.reduce((s, x) => s + x.immediatelyMovable, 0))}
        figureLabel="within reach of their next stage" />
      <Block scene={mobilityScene(rows, g.n, width)} i={i} wide />
      <Para>
        Movement on this continuum comes from changed habits rather than changed intentions, and it shows up
        first in situational answers rather than in how people describe themselves. Nothing here is a promise:
        the counts say who is within reach under the current scoring rules, and the conditions are the
        organisation’s to create.
      </Para>
      <Close n={16} line={i.headline} />
    </View>
  );
}

/* ==================================================== 17. priorities */

export function Ch17({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(17);
  const i = interpretPriorities(a);
  const bubbles = a.priorities.map((p) => ({
    capability: p.capability, reach: p.reach, importance: p.importance,
    distance: p.distance, region: p.region,
  }));
  const actNow = a.priorities.filter((p) => p.region === 'act now');
  return (
    <View>
      <Head n={17} />
      <ChapterStrip question={m.question} answer={i.headline}
        figure={String(actNow.length)} figureLabel="practices in the act now region" />
      <Block scene={priorityScene(bubbles, g.n, Math.min(width, 470))} i={i} wide />
      <View wrap={false}>
        <Text style={S.h2}>The three to take first</Text>
        {(actNow.length ? actNow : a.priorities).slice(0, 3).map((p, k) => (
          <Text key={p.tag} style={{ ...S.body, fontSize: 8.8, marginBottom: 4 }}>
            {k + 1}. {p.capability}. Reaches {p.reach} of {g.n}. Expected to move: {p.metricToMove}.
          </Text>
        ))}
      </View>
      <Close n={17} line={i.headline} />
    </View>
  );
}

/* ==================================================== 18. the portfolio */

export function Ch18({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(18);
  const themes = a.practicePortfolio.themes;
  return (
    <View>
      <Head n={18} />
      <ChapterStrip question={m.question}
        answer={`${a.practicePortfolio.total} distinct practices were given to people in this workforce by their own reports.`}
        figure={String(a.practicePortfolio.total)} figureLabel="practices, across every person" />
      <Para>
        Nothing in this chapter is new advice written for a group. Every practice below was given to somebody
        inside this workforce by their own report, and the counts are simply how many people received each one.
        This is the curriculum your organisation already has, tallied.
      </Para>
      {themes.map((t) => (
        <Block key={t.theme} scene={practiceScene(t.theme, t.entries.map((e) => ({
          capability: e.capability, n: e.n, share: e.share, priority: e.priority, unlocks: e.unlocks,
        })), g.n, width)} i={{
          headline: t.theme,
          howToRead: 'Each row is one practice, with its urgency and how many people were given it.',
          interpretation: t.entries.slice(0, 3).map((e) => `${e.capability}: ${e.n} of ${g.n}`).join('. ') + '.',
          businessMeaning: t.entries[0]
            ? `The widest-reaching here is "${t.entries[0].capability}". The progress indicator is: ${t.entries[0].evidenceOfProgress}`
            : '',
          recommendedResponse: t.entries[0]
            ? `Watch for: ${t.entries[0].riskToMonitor}`
            : 'Nothing at this theme in this workforce.',
        }} wide />
      ))}
      <Close n={18} line={`${a.practicePortfolio.total} practices, grouped into ${themes.length} themes. This is the L and D brief.`} />
    </View>
  );
}

/* ============================================== 19. training architecture */

export function Ch19({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(19);
  const tiers = TIER_ORDER.map((tier) => {
    const cohorts = a.developmentCohorts.cohorts.filter((c) => c.tier === tier);
    return { tier, cohorts: cohorts.map((c) => c.name), n: cohorts.reduce((s, c) => s + c.n, 0) };
  });
  return (
    <View>
      <Head n={19} />
      <ChapterStrip question={m.question}
        answer={`${tiers.filter((t) => t.n > 0).length} of the six programme tiers have people in them.`}
        figure={String(tiers.filter((t) => t.n > 0).length)} figureLabel="tiers you would need to run" />
      <Block scene={tierScene(tiers, g.n, width)} i={{
        headline: 'What kind of programme each part of your workforce needs',
        howToRead: 'Six tiers, from a standing start to teaching others. Each cohort from chapter 12 '
          + 'maps on to exactly one. A tier with nobody in it is shown empty rather than hidden.',
        interpretation: tiers.filter((t) => t.n > 0).map((t) => `${t.tier}: ${t.n} of ${g.n}`).join('. ') + '.',
        businessMeaning: 'This is programme-agnostic. It says what kind of learning each population '
          + 'needs, not who should deliver it.',
        recommendedResponse: 'Build the tier with the most people first, and use the top tiers as your '
          + 'internal teaching capacity rather than buying it in.',
      }} wide />
      {tiers.filter((t) => t.n > 0).map((t) => (
        <View key={t.tier} wrap={false} style={{ marginBottom: 7 }}>
          <Text style={{ ...S.body, fontSize: 8.6, fontWeight: 600 }}>{t.tier}: {t.n} of {g.n}</Text>
          <Text style={S.muted}>{TIER_BLURB[t.tier]}</Text>
        </View>
      ))}
      <Close n={19} line={`${tiers.filter((t) => t.n > 0).length} tiers, sized from the cohorts rather than from the headcount.`} />
    </View>
  );
}

/* ================================================= 20. the ninety day plan */

export function Ch20({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(20);
  const bands = a.roadmap.map((b) => ({
    title: b.title, window: b.window, note: b.note,
    actions: b.actions.map((x) => ({ capability: x.capability, priority: x.priority, reach: x.reach, metricToMove: x.metricToMove })),
  }));
  return (
    <View>
      <Head n={20} />
      <ChapterStrip question={m.question}
        answer="Three bands of work, sequenced by urgency and by how many people each action reaches."
        figure="90" figureLabel="days, in three bands" />
      <Block scene={timelineScene(bands, g.n, width)} i={{
        headline: 'The next ninety days',
        howToRead: 'Each band carries the practices at one level of urgency, ordered by how many of '
          + 'your people were given them.',
        interpretation: bands.map((b) => `${b.title}: ${b.actions.length} actions`).join('. ') + '.',
        businessMeaning: 'The counts are what the assessment supplies. Owner and target date are the '
          + 'organisation’s to set, and are left blank deliberately rather than guessed at.',
        recommendedResponse: 'Run the first band before the second. Movement comes from changed habits '
          + 'rather than changed intentions, and it shows up first in situational answers.',
      }} wide />
      {bands.map((b) => (
        <View key={b.title} wrap={false} style={{ marginBottom: 10 }}>
          <Text style={S.h2}>{b.title}</Text>
          <Text style={{ ...S.muted, marginBottom: 4 }}>{b.note}</Text>
          {b.actions.length ? b.actions.map((x) => (
            <Text key={x.capability} style={{ ...S.body, fontSize: 8.4, marginBottom: 3 }}>
              {x.capability}. Reaches {x.reach} of {g.n}. Metric expected to move: {x.metricToMove}.
              Owner: ________  Target date: ________
            </Text>
          )) : <Text style={S.muted}>Nothing at this level of urgency in this workforce.</Text>}
        </View>
      ))}
      <Close n={20} line="Three bands, sequenced by urgency and reach. Owner and date are yours to set." />
    </View>
  );
}

/* =============================================== 21. what to measure next */

export function Ch21({ a, width }: P) {
  const m = chapterMeta(21);
  return (
    <View>
      <Head n={21} />
      <ChapterStrip question={m.question}
        answer={`${a.futureMeasurement.length} modules are not collected today. Each is listed with what it would add, and no values.`}
        figure={String(a.futureMeasurement.length)} figureLabel="modules not collected" />
      <Para>
        This report is honest about what it does not know. Nothing below has been estimated, modelled or
        inferred, and no figure in this report depends on any of it. Each module is an extension point rather
        than a gap.
      </Para>
      <Block scene={moduleScene(a.futureMeasurement.map((x) => ({ name: x.name, whatItWouldAdd: x.whatItWouldAdd })), width)} i={{
        headline: 'What the next measurement layer would add',
        howToRead: 'Each card names a module the platform does not collect and what adding it would let '
          + 'this report say.',
        interpretation: a.futureMeasurement.map((x) => x.name).join(', ') + '.',
        businessMeaning: 'Productivity figures, cost savings and return on investment all depend on the '
          + 'modules below. That is why this report does not carry them.',
        recommendedResponse: 'If you want value attribution, the value and economic modules are the two '
          + 'to collect first, and both need a baseline taken before an intervention rather than after.',
      }} wide />
      <Close n={21} line="Six modules not collected, each declared rather than estimated." />
    </View>
  );
}

/* ================================================= 22. retake or baseline */

export function Ch22({ a, width }: P) {
  const g = a.group;
  const m = chapterMeta(22);
  const baseline = a.trend.comparable === false;
  return (
    <View>
      <Head n={22} />
      <ChapterStrip question={m.question}
        answer={baseline ? 'This is your baseline. A second wave is what turns it into movement.' : 'This wave can be compared with the last one.'}
        figure={g.provenance.comparable ? 'yes' : 'not yet'} figureLabel="comparable with another wave" />
      {baseline ? (
        <Block scene={baselineScene(a.trend.comparable === false ? a.trend.reason : '', Math.min(width, 470))} i={{
          headline: 'This is your baseline',
          howToRead: 'A comparison across waves is only valid when the instrument, scoring, scenario '
            + 'and language versions all match. This page says whether they do.',
          interpretation: a.trend.comparable === false ? a.trend.reason : '',
          businessMeaning: 'Without a second wave there is no movement to report, and a report that '
            + 'invented one would be worse than this page.',
          recommendedResponse: 'Reassess after the ninety day plan in chapter 20. The next report will '
            + 'show stage movement, which capabilities improved and declined, and which gates were cleared.',
        }} wide />
      ) : (
        <Para>This wave is comparable with the previous one on all four versions, and the movement is
          reported above.</Para>
      )}
      <View wrap={false} style={{ marginTop: 6 }}>
        <Text style={S.h2}>What produced these readings</Text>
        <Text style={S.muted}>
          Instrument {g.versions.instrument}, scoring {g.versions.scoring}, scenarios {g.versions.scenario},
          language {g.versions.language}. {g.provenance.note}
        </Text>
      </View>
      <Close n={22} line={baseline ? 'This is your baseline. Reassess after the ninety day plan.' : 'This wave is comparable with the last.'} />
    </View>
  );
}

export const CHAPTER_COMPONENTS: Array<{ n: number; C: (p: P) => React.ReactElement }> = [
  { n: 1, C: Ch01 }, { n: 2, C: Ch02 }, { n: 3, C: Ch03 }, { n: 4, C: Ch04 },
  { n: 5, C: Ch05 }, { n: 6, C: Ch06 }, { n: 7, C: Ch07 }, { n: 8, C: Ch08 },
  { n: 9, C: Ch09 }, { n: 10, C: Ch10 }, { n: 11, C: Ch11 }, { n: 12, C: Ch12 },
  { n: 13, C: Ch13 }, { n: 14, C: Ch14 }, { n: 15, C: Ch15 }, { n: 16, C: Ch16 },
  { n: 17, C: Ch17 }, { n: 18, C: Ch18 }, { n: 19, C: Ch19 }, { n: 20, C: Ch20 },
  { n: 21, C: Ch21 }, { n: 22, C: Ch22 },
];

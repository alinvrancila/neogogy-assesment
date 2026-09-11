/**
 * Chapter 3. Your workforce on the AI readiness journey. Level 1.
 *
 * The question a business owner asks: how far along is my workforce, and how
 * alike are my people?
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { Block, ChapterStrip, ChapterClose, S } from '../kit/blocks';
import { journeyScene } from '../charts/journey';
import { rangeScene } from '../charts/range';
import { interpretContinuum } from '@/engine/orgInterpret';
import { STAGES } from '@/engine/config';
import type { OrganisationReportAnalytics } from '@/engine/orgAnalytics';

export const CH03 = {
  number: 3,
  title: 'Your workforce on the AI readiness journey',
  question: 'How far along is my workforce, and how alike are my people?',
  source: 'the "Where you are on the route" section of each individual report',
  level: 1,
};

export function Chapter03({ a, width }: { a: OrganisationReportAnalytics; width: number }) {
  const g = a.group;
  const i = interpretContinuum(g);

  const byStage = new Map(g.distribution.map((d) => [d.stage, d]));
  const gateByStage = new Map(g.gateAnalysis.map((x) => [x.stage, x.name]));
  const movableByStage = new Map(g.mobility.map((m) => [m.stage, m.immediatelyMovable]));

  const journey = journeyScene({
    width,
    n: g.n,
    median: g.index.median, q1: g.index.q1, q3: g.index.q3,
    centreStage: g.centre.stage,
    stages: STAGES.map((s) => ({
      stage: s.stage,
      stageName: byStage.get(s.stage)?.stageName ?? s.name,
      short: s.short,
      minIndex: s.minIndex,
      n: byStage.get(s.stage)?.n ?? 0,
      share: byStage.get(s.stage)?.share ?? 0,
      movable: movableByStage.get(s.stage) ?? 0,
      gate: gateByStage.get(s.stage),
    })),
  });

  const ruler = rangeScene({
    width,
    title: 'The same reading on the standard ruler',
    median: g.index.median, q1: g.index.q1, q3: g.index.q3,
    min: g.index.min, max: g.index.max, n: g.n,
    stageMarks: STAGES.filter((s) => s.stage % 2 === 1)
      .map((s) => ({ at: s.minIndex, label: String(s.stage) })),
  });

  return (
    <View>
      <Text style={S.eyebrow}>Chapter {CH03.number}</Text>
      <Text style={S.h1}>{CH03.title}</Text>

      <ChapterStrip
        question={CH03.question}
        answer={i.headline}
        figure={String(g.centre.stage)}
        figureLabel={`the stage holding most of your people: ${g.centre.stageName}`}
      />

      <Block scene={journey} i={i} wide />

      <Block
        scene={ruler}
        i={{
          headline: 'The same reading, on the ruler used everywhere else',
          howToRead: 'The bar is the middle half of your people, the dot is the middle person, and '
            + 'the line behind shows how far the group reaches. The dashed line is the vulnerability line.',
          interpretation: i.howToRead,
          businessMeaning: g.consistency.reading,
          recommendedResponse: i.recommendedResponse,
        }}
        wide
      />

      <ChapterClose line={i.headline} source={CH03.source} />
    </View>
  );
}

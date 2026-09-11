/**
 * The layout kit for print.
 *
 * A Block is a chart and its four explanatory blocks as one unit that never
 * splits across a page. The brief is explicit that an explanation on the next
 * page is a defect, and `wrap={false}` is what enforces it: react-pdf will move
 * the whole unit to the next page rather than break it.
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { SceneView } from '../render/pdf';
import { BLOCK_LABELS, type Interpretation } from '@/engine/orgCopy';
import type { Scene } from '../scene';

const T = {
  ink: '#2C2621', mute: '#6E6155', hair: '#E0D5C6', gold: '#B08A3E',
  oxblood: '#7B2B32', paper: '#F6EDE4', page: '#FBF7F1', teal: '#2F6F62',
};

export const S = StyleSheet.create({
  h1: { fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 19, color: T.oxblood, marginBottom: 6 },
  h2: { fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 12.5, color: T.ink, marginBottom: 5 },
  eyebrow: { fontFamily: 'PlexMono', fontWeight: 500, fontSize: 7.4, letterSpacing: 1.4,
    textTransform: 'uppercase', color: T.gold, marginBottom: 7 },
  body: { fontSize: 9.2, lineHeight: 1.55, color: T.ink },
  muted: { fontSize: 8.2, lineHeight: 1.5, color: T.mute },
  blockLabel: { fontFamily: 'PlexSans', fontWeight: 600, fontSize: 7.6, color: T.ink, marginBottom: 2 },
  rule: { borderTopWidth: 1, borderTopColor: T.hair, marginTop: 10, marginBottom: 8 },
});

/**
 * The four explanatory blocks, fixed labels, fixed order.
 *
 * Two columns under a wide chart, one under a narrow one, so they never run on
 * to a following page.
 */
export const Explain = ({ i, wide }: { i: Interpretation; wide?: boolean }) => {
  const items: Array<[string, string]> = [
    [BLOCK_LABELS[0], i.howToRead],
    [BLOCK_LABELS[1], i.interpretation],
    [BLOCK_LABELS[2], i.businessMeaning],
    [BLOCK_LABELS[3], i.recommendedResponse],
  ];
  const col = (from: number, to: number) => (
    <View style={{ flex: 1, paddingRight: 12 }}>
      {items.slice(from, to).map(([label, copy]) => (
        <View key={label} style={{ marginBottom: 7 }}>
          <Text style={S.blockLabel}>{label}</Text>
          <Text style={S.muted}>{copy}</Text>
        </View>
      ))}
    </View>
  );
  return (
    <View>
      <View style={S.rule} />
      <View style={{ flexDirection: 'row' }}>
        {wide ? <>{col(0, 2)}{col(2, 4)}</> : col(0, 4)}
      </View>
      {i.caveat ? <Text style={{ ...S.muted, fontSize: 7.6, marginTop: 2 }}>{i.caveat}</Text> : null}
    </View>
  );
};

/**
 * A chart with its explanation, as one indivisible layout unit.
 */
export const Block = ({ scene, i, wide }: { scene: Scene; i: Interpretation; wide?: boolean }) => (
  <View style={{ marginBottom: 16 }} wrap={false}>
    <Text style={S.h2}>{scene.title}</Text>
    <SceneView scene={scene} />
    <Explain i={i} wide={wide} />
  </View>
);

/** The strip every chapter opens with: question, answer, figure, mini visual. */
export const ChapterStrip = ({ question, answer, figure, figureLabel, mini }: {
  question: string; answer: string; figure: string; figureLabel: string; mini?: Scene;
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: T.paper,
    borderRadius: 6, padding: 12, marginBottom: 14 }} wrap={false}>
    <View style={{ flex: 1, paddingRight: 14 }}>
      <Text style={{ ...S.muted, fontSize: 7.6, marginBottom: 3 }}>{question}</Text>
      <Text style={{ ...S.body, fontSize: 10 }}>{answer}</Text>
    </View>
    <View style={{ width: 96, alignItems: 'flex-end' }}>
      <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 22, color: T.oxblood }}>{figure}</Text>
      <Text style={{ ...S.muted, fontSize: 6.8, textAlign: 'right' }}>{figureLabel}</Text>
    </View>
    {mini ? <View style={{ marginLeft: 8 }}><SceneView scene={mini} /></View> : null}
  </View>
);

/** The one-line summary box, and where the chapter's data comes from. */
export const ChapterClose = ({ line, source }: { line: string; source: string }) => (
  <View wrap={false} style={{ marginTop: 6 }}>
    <View style={{ borderLeftWidth: 2, borderLeftColor: T.gold, paddingLeft: 9, paddingVertical: 5 }}>
      <Text style={{ ...S.body, fontSize: 9 }}>
        <Text style={{ fontWeight: 600 }}>In one line: </Text>{line}
      </Text>
    </View>
    <Text style={{ ...S.muted, fontSize: 6.8, marginTop: 5 }}>
      Where this comes from: {source}
    </Text>
  </View>
);

export { T as TOKENS };

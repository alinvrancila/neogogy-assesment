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
  ink: '#2C2621', mute: '#6E6155', hair: '#E0D5C6', gold: '#B08A3E', terracotta: '#A8412C',
  oxblood: '#7B2B32', paper: '#F6EDE4', page: '#FBF7F1', teal: '#2F6F62',
};

/**
 * The page's type scale.
 *
 * Four ranks, each a clear jump: the chapter title, the section heading, the
 * running text, and the secondary text under it. Nothing a reader has to read
 * is set below nine and a half points, and the line heights are open enough
 * that a four sentence block does not read as a wall.
 */
export const S = StyleSheet.create({
  h1: { fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 23, color: T.oxblood,
    marginBottom: 10, lineHeight: 1.18 },
  h2: { fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 15, color: T.ink,
    marginBottom: 9, lineHeight: 1.25 },
  eyebrow: { fontFamily: 'PlexMono', fontWeight: 500, fontSize: 8.5, letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.gold, marginBottom: 9 },
  body: { fontSize: 10.5, lineHeight: 1.62, color: T.ink },
  muted: { fontSize: 9.5, lineHeight: 1.58, color: T.mute },
  blockLabel: { fontFamily: 'PlexSans', fontWeight: 600, fontSize: 9, color: T.ink, marginBottom: 3 },
  rule: { borderTopWidth: 1, borderTopColor: T.hair, marginTop: 16, marginBottom: 12 },
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
    <View style={{ flex: 1, paddingRight: 20 }}>
      {items.slice(from, to).map(([label, copy]) => (
        <View key={label} style={{ marginBottom: 12 }}>
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
      {i.caveat ? <Text style={{ ...S.muted, fontSize: 9, marginTop: 4 }}>{i.caveat}</Text> : null}
    </View>
  );
};

/**
 * A chart with its explanation, as one indivisible layout unit.
 */
export const Block = ({ scene, i, wide }: { scene: Scene; i: Interpretation; wide?: boolean }) => (
  <View style={{ marginBottom: 26 }} wrap={false}>
    <Text style={S.h2}>{scene.title}</Text>
    <View style={{ marginBottom: 4 }}><SceneView scene={scene} /></View>
    <Explain i={i} wide={wide} />
  </View>
);

/** The strip every chapter opens with: question, answer, figure, mini visual. */
export const ChapterStrip = ({ question, answer, figure, figureLabel, mini }: {
  question: string; answer: string; figure: string; figureLabel: string; mini?: Scene;
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: T.paper,
    borderRadius: 6, padding: 18, marginBottom: 22 }} wrap={false}>
    <View style={{ flex: 1, paddingRight: 18 }}>
      <Text style={{ ...S.muted, fontSize: 9, marginBottom: 6 }}>{question}</Text>
      <Text style={{ ...S.body, fontSize: 12, lineHeight: 1.5 }}>{answer}</Text>
    </View>
    <View style={{ width: 118, alignItems: 'flex-end' }}>
      <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 28, color: T.oxblood }}>{figure}</Text>
      <Text style={{ ...S.muted, fontSize: 8.5, textAlign: 'right', lineHeight: 1.4 }}>{figureLabel}</Text>
    </View>
    {mini ? <View style={{ marginLeft: 8 }}><SceneView scene={mini} /></View> : null}
  </View>
);

/** The one-line summary box, and where the chapter's data comes from. */
export const ChapterClose = ({ line, source }: { line: string; source: string }) => (
  <View wrap={false} style={{ marginTop: 12 }}>
    <View style={{ borderLeftWidth: 3, borderLeftColor: T.gold, paddingLeft: 13, paddingVertical: 8 }}>
      <Text style={{ ...S.body, fontSize: 11 }}>
        <Text style={{ fontWeight: 600 }}>In one line: </Text>{line}
      </Text>
    </View>
    <Text style={{ ...S.muted, fontSize: 8.5, marginTop: 8 }}>
      Where this comes from: {source}
    </Text>
  </View>
);

export { T as TOKENS };

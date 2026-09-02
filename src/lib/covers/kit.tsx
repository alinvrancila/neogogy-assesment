/**
 * The shared foundation for all six covers: fonts, the readability scale, and
 * the four blocks every cover carries. The blocks are shared; the composition
 * is not. Each persona places them itself.
 *
 * The scale is the rule this file exists to enforce. A long result title is
 * given another line, then more width, and only then a smaller size, and never
 * below the floor. A person's name is never truncated on a cover with their
 * name on it.
 */

import React from 'react';
import path from 'path';
import { Font, Image, Text, View } from '@react-pdf/renderer';
import type { AssessmentCoverData } from './data';

const F = (n: string) => path.join(process.cwd(), 'public', 'fonts', n);
export const ART = (n: string) => path.join(process.cwd(), 'public', 'covers', n);

// Static weights, vendored into the repository. A variable font registered
// twice does not resolve in this renderer, and a font fetched at run time would
// make a report depend on a third party being up.
Font.register({
  family: 'SourceSerif',
  fonts: [
    { src: F('SourceSerif4-Regular.ttf'), fontWeight: 400 },
    { src: F('SourceSerif4-SemiBold.ttf'), fontWeight: 600 },
    { src: F('SourceSerif4-SemiBoldItalic.ttf'), fontWeight: 600, fontStyle: 'italic' },
  ],
});
Font.register({
  family: 'PlexSans',
  fonts: [
    { src: F('IBMPlexSans-Regular.ttf'), fontWeight: 400 },
    { src: F('IBMPlexSans-SemiBold.ttf'), fontWeight: 600 },
  ],
});
Font.register({
  family: 'PlexMono',
  fonts: [
    { src: F('IBMPlexMono-Regular.ttf'), fontWeight: 400 },
    { src: F('IBMPlexMono-Medium.ttf'), fontWeight: 500 },
  ],
});

/** US Letter, in points, as the brief specifies for the cover. */
export const LETTER = { w: 612, h: 792 };
/** The safe area: 0.55in of content margin, 0.4in for the metadata rail. */
export const SAFE = 39.6;
export const RAIL_SAFE = 28.8;

export type Output = 'pdf' | 'screen' | 'thumbnail';

/* ------------------------------------------------------------ the scale */

type Length = 'short' | 'medium' | 'long';

export const resultLength = (s: string): Length =>
  (s.length > 52 ? 'long' : s.length > 30 ? 'medium' : 'short');
export const nameLength = (s: string): Length =>
  (s.length > 34 ? 'long' : s.length > 22 ? 'medium' : 'short');

/** Result title sizes, in points. The floor is 36 and is never crossed. */
const RESULT_SIZE: Record<Length, number> = { short: 58, medium: 48, long: 39 };
/** Name sizes. The floor is 18. */
const NAME_SIZE: Record<Length, number> = { short: 29, medium: 24, long: 19 };

export const resultSize = (s: string) => RESULT_SIZE[resultLength(s)];
export const nameSize = (s: string) => NAME_SIZE[nameLength(s)];

/* ----------------------------------------------------------- the blocks */

export function BrandMark({ tint, subdued }: { tint: string; subdued?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: 26, height: 26, backgroundColor: '#FFFFFF', borderRadius: 3,
        alignItems: 'center', justifyContent: 'center', marginRight: 8,
      }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={ART('mark.png')} style={{ width: 20, height: 20, objectFit: 'contain' }} />
      </View>
      <View>
        <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 13, color: tint }}>
          Neogogy
        </Text>
        <Text style={{
          fontFamily: 'PlexMono', fontWeight: 500, fontSize: 5.2, letterSpacing: 1,
          color: subdued ?? tint, marginTop: 1,
        }}>
          HUMAN ADVANTAGE ASSESSMENT
        </Text>
      </View>
    </View>
  );
}

/** The assessment's own name. Kept legible rather than squeezed into caps. */
export function AssessmentIdentity({ name, tint, align = 'right' }: {
  name: string; tint: string; align?: 'left' | 'right';
}) {
  const long = name.length > 30;
  return (
    <Text style={{
      fontFamily: 'PlexMono', fontWeight: 500,
      fontSize: long ? 8 : 9, letterSpacing: long ? 1 : 1.5,
      color: tint, textAlign: align, maxWidth: 230,
    }}>
      {name.toUpperCase()}
    </Text>
  );
}

export function ResultBlock({ data, tint, summaryTint, align = 'left', width, eyebrowTint }: {
  data: AssessmentCoverData;
  tint: string;
  summaryTint: string;
  align?: 'left' | 'right';
  width: number;
  eyebrowTint?: string;
}) {
  return (
    <View style={{ width, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Text style={{
        fontFamily: 'PlexMono', fontWeight: 500, fontSize: 8, letterSpacing: 1.5,
        color: eyebrowTint ?? summaryTint, marginBottom: 10, textAlign: align,
      }}>
        YOUR ASSESSMENT RESULT
      </Text>
      <Text style={{
        fontFamily: 'SourceSerif', fontWeight: 600,
        fontSize: resultSize(data.resultTitle), color: tint,
        lineHeight: 1.06, textAlign: align, marginBottom: 14,
      }}>
        {data.resultTitle}
      </Text>
      <Text style={{
        fontFamily: 'PlexSans', fontSize: 12.5, color: summaryTint,
        lineHeight: 1.5, textAlign: align, maxWidth: Math.min(width, 268),
      }}>
        {data.resultSummary}
      </Text>
    </View>
  );
}

export function PersonName({ data, tint, labelTint, align = 'left', width }: {
  data: AssessmentCoverData; tint: string; labelTint: string;
  align?: 'left' | 'right'; width?: number;
}) {
  return (
    <View style={{ width, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Text style={{
        fontFamily: 'PlexMono', fontWeight: 500, fontSize: 8, letterSpacing: 1.5,
        color: labelTint, marginBottom: 6, textAlign: align,
      }}>
        PREPARED FOR
      </Text>
      <Text style={{
        fontFamily: 'SourceSerif', fontWeight: 600, fontSize: nameSize(data.personName),
        color: tint, lineHeight: 1.14, textAlign: align,
      }}>
        {data.personName}
      </Text>
    </View>
  );
}

/** The concept label the artwork carries. Decorative, and never load-bearing. */
export function ConceptLabel({ data, tint, subTint, align = 'left' }: {
  data: AssessmentCoverData; tint: string; subTint: string; align?: 'left' | 'right';
}) {
  if (!data.conceptTitle) return null;
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start', maxWidth: 220 }}>
      <Text style={{
        fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 13.5, color: tint,
        fontStyle: 'italic', textAlign: align,
      }}>
        {data.conceptTitle}
      </Text>
      {data.conceptSubtitle ? (
        <Text style={{
          fontFamily: 'PlexMono', fontWeight: 500, fontSize: 6.4, letterSpacing: 0.9,
          color: subTint, marginTop: 3, textAlign: align,
        }}>
          {data.conceptSubtitle.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}

/** The practical rail. Wraps rather than clips, whatever the values are. */
export function CoverMetadata({ data, labelTint, valueTint, ruleTint }: {
  data: AssessmentCoverData; labelTint: string; valueTint: string; ruleTint?: string;
}) {
  const cells = [
    { label: 'ASSESSMENT DATE', value: data.assessmentDate, flex: 1.1 },
    ...(data.reportId ? [{ label: 'REPORT ID', value: data.reportId, flex: 1.2 }] : []),
    ...(data.accessUrl ? [{ label: 'ACCESS', value: data.accessUrl, flex: 1.3 }] : []),
    ...(data.existingMetadata ?? []).map((m) => ({ label: m.label.toUpperCase(), value: m.value, flex: 1 })),
  ];
  return (
    <View>
      {ruleTint ? <View style={{ height: 1, backgroundColor: ruleTint, marginBottom: 10 }} /> : null}
      <View style={{ flexDirection: 'row' }}>
        {cells.map((c) => (
          <View key={c.label} style={{ flex: c.flex, paddingRight: 12 }}>
            <Text style={{
              fontFamily: 'PlexMono', fontWeight: 500, fontSize: 6.8, letterSpacing: 1,
              color: labelTint, marginBottom: 4,
            }}>
              {c.label}
            </Text>
            <Text style={{ fontFamily: 'PlexSans', fontWeight: 600, fontSize: 10, color: valueTint }}>
              {c.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** A wash that guarantees contrast over artwork, whatever the crop shows. */
export function ContrastField({ color, opacity = 0.88, style }: {
  color: string; opacity?: number; style: Record<string, unknown>;
}) {
  return <View style={{ ...style, backgroundColor: color, opacity } as never} />;
}

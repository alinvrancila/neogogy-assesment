/**
 * Six covers, six compositions.
 *
 * They share a typographic grammar and nothing else. Each one places the same
 * blocks where its own artwork leaves room, so the six are distinguishable
 * before a word is read: which side the result sits on, where the identity
 * block lands, how much of the page the image takes, and what the one
 * geometric gesture is.
 */

import React from 'react';
import { Image, Page, Text, View, Svg, Path, Line, Circle, Rect, Defs, LinearGradient, Stop } from '@react-pdf/renderer';
import type { AssessmentCoverData } from './data';
import {
  ART, LETTER, SAFE, RAIL_SAFE, BrandMark, AssessmentIdentity, ResultBlock,
  PersonName, ConceptLabel, CoverMetadata, resultSize,
} from './kit';

const page = (bg: string) => ({ width: LETTER.w, height: LETTER.h, backgroundColor: bg });
const abs = { position: 'absolute' as const };

/* ------------------------------------------- 1. Student, Field of Questions */
export function StudentCover({ data }: { data: AssessmentCoverData }) {
  const INK = '#22364B';
  const MUTE = '#5B6E80';
  const CORAL = '#C4674F';
  return (
    <Page size={[LETTER.w, LETTER.h]} style={page('#E8ECEE')}>
      {/* artwork across the lower 74 percent, rising to the right */}
      <View style={{ ...abs, left: 0, right: 0, bottom: 0, height: LETTER.h * 0.74 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={ART('student.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>
      <View style={{ ...abs, left: 0, right: 0, top: 0, height: LETTER.h * 0.52, backgroundColor: '#E8ECEE', opacity: 0.86 }} />

      {/* the expanding fan of inquiry lines */}
      <Svg style={{ ...abs, left: 0, top: 0 }} width={LETTER.w} height={LETTER.h}>
        {Array.from({ length: 7 }, (_, i) => (
          <Line key={i} x1={LETTER.w * 0.30} y1={LETTER.h * 0.60}
            x2={LETTER.w * (0.55 + i * 0.10)} y2={LETTER.h * (0.98 - i * 0.075)}
            stroke={CORAL} strokeOpacity={0.35} strokeWidth={0.9} />
        ))}
      </Svg>

      <View style={{ ...abs, left: SAFE, right: SAFE, top: SAFE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <BrandMark tint={INK} subdued={MUTE} />
        <AssessmentIdentity name={data.assessmentName} tint={INK} />
      </View>

      <View style={{ ...abs, left: SAFE, top: 128 }}>
        <ResultBlock data={data} tint={INK} summaryTint={MUTE} width={330} eyebrowTint={INK} />
      </View>

      {/* the identity block sits over its own field, so the crop cannot eat it */}
      <View style={{ ...abs, left: SAFE, bottom: 108, width: 262, backgroundColor: '#22364B', opacity: 0.9, height: 82 }} />
      <View style={{ ...abs, left: SAFE + 18, bottom: 122 }}>
        <PersonName data={data} tint="#FFFFFF" labelTint="rgba(255,255,255,0.78)" />
      </View>

      <View style={{
        ...abs, right: SAFE - 62, top: LETTER.h * 0.44,
        transform: 'rotate(90deg)', width: 200,
      }}>
        <ConceptLabel data={data} tint="#FFFFFF" subTint="rgba(255,255,255,0.88)" />
      </View>

      <View style={{ ...abs, left: RAIL_SAFE, right: RAIL_SAFE, bottom: RAIL_SAFE }}>
        <CoverMetadata data={data} labelTint="rgba(255,255,255,0.82)" valueTint="#FFFFFF" ruleTint="rgba(255,255,255,0.5)" />
      </View>
    </Page>
  );
}

/* ------------------------------------------ 2. Teacher, Table of Many Lights */
export function TeacherCover({ data }: { data: AssessmentCoverData }) {
  const FIELD = '#1F3B32';
  const GOLD = '#E7C169';
  const CHALK = '#EFEAE0';
  const plateTop = LETTER.h * 0.15;
  const plateH = LETTER.h * 0.44;
  return (
    <Page size={[LETTER.w, LETTER.h]} style={page(FIELD)}>
      <View style={{ ...abs, left: SAFE, right: SAFE, top: SAFE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <BrandMark tint={CHALK} subdued="rgba(239,234,224,0.72)" />
        <AssessmentIdentity name={data.assessmentName} tint={GOLD} />
      </View>

      {/* a contained horizontal plate rather than a bleed */}
      <View style={{ ...abs, left: SAFE, right: SAFE, top: plateTop, height: plateH }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={ART('teacher.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>

      {/* concentric rings around the point of human judgment */}
      <Svg style={{ ...abs, left: SAFE, top: plateTop }} width={LETTER.w - SAFE * 2} height={plateH}>
        {[46, 84, 122, 160].map((r) => (
          <Circle key={r} cx={(LETTER.w - SAFE * 2) * 0.52} cy={plateH * 0.44} r={r}
            fill="none" stroke={GOLD} strokeOpacity={0.32} strokeWidth={0.8} />
        ))}
      </Svg>

      <View style={{ ...abs, left: SAFE + 16, top: plateTop + plateH - 74 }}>
        <PersonName data={data} tint="#FFFFFF" labelTint="rgba(255,255,255,0.82)" />
      </View>
      <View style={{ ...abs, right: SAFE + 16, top: plateTop + plateH - 74 }}>
        <ConceptLabel data={data} tint={GOLD} subTint="rgba(231,193,105,0.85)" align="right" />
      </View>

      {/* the mockup splits this band: result on the left, summary on the right.
          It is anchored to the rail rather than to the plate, so no dead band
          opens between the two however long the result name runs. */}
      <View style={{ ...abs, left: SAFE, right: SAFE, bottom: 88 }}>
        <Text style={{
          fontFamily: 'PlexMono', fontWeight: 500, fontSize: 8, letterSpacing: 1.5,
          color: 'rgba(239,234,224,0.7)', marginBottom: 14,
        }}>
          YOUR ASSESSMENT RESULT
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{
            fontFamily: 'SourceSerif', fontWeight: 600, fontSize: resultSize(data.resultTitle),
            color: GOLD, lineHeight: 1.06, width: 262,
          }}>
            {data.resultTitle}
          </Text>
          <Text style={{
            fontFamily: 'PlexSans', fontSize: 12.5, color: 'rgba(239,234,224,0.88)',
            lineHeight: 1.5, flex: 1, marginLeft: 22, marginBottom: 6,
          }}>
            {data.resultSummary}
          </Text>
        </View>
      </View>

      <View style={{ ...abs, left: RAIL_SAFE, right: RAIL_SAFE, bottom: RAIL_SAFE }}>
        <CoverMetadata data={data} labelTint="rgba(239,234,224,0.7)" valueTint={CHALK} ruleTint="rgba(239,234,224,0.28)" />
      </View>
    </Page>
  );
}

/* ---------------------------------------------- 3. Parent, The Shared Canopy */
export function ParentCover({ data }: { data: AssessmentCoverData }) {
  const CLAY = '#A9482F';
  const INK = '#4A3529';
  const MUTE = '#6E5646';
  return (
    <Page size={[LETTER.w, LETTER.h]} style={page('#F3E7DA')}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={ART('parent.jpg')} style={{ ...abs, left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* a luminous paper field from the right, so the type has calm ground */}
      <View style={{ ...abs, right: 0, top: 0, width: LETTER.w * 0.66, height: LETTER.h, backgroundColor: '#F6EFE6', opacity: 0.9 }} />

      {/* one open protective arch across the two paths */}
      <Svg style={{ ...abs, left: 0, top: 0 }} width={LETTER.w} height={LETTER.h}>
        <Path d={`M ${LETTER.w * 0.2} ${LETTER.h * 0.86} Q ${LETTER.w * 0.72} ${LETTER.h * 0.06} ${LETTER.w * 0.99} ${LETTER.h * 0.72}`}
          fill="none" stroke={CLAY} strokeOpacity={0.4} strokeWidth={1} />
      </Svg>

      {/* the canopy mesh runs behind the wordmark, so it gets its own light */}
      <Svg style={{ ...abs, left: 0, top: 0 }} width={LETTER.w * 0.4} height={132}>
        <Defs>
          <LinearGradient id="parentBrandWash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F6EFE6" stopOpacity={0.97} />
            <Stop offset="0.62" stopColor="#F6EFE6" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#F6EFE6" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={LETTER.w * 0.4} height={132} fill="url(#parentBrandWash)" />
      </Svg>

      <View style={{ ...abs, left: SAFE, right: SAFE, top: SAFE, flexDirection: 'row', justifyContent: 'space-between' }}>
        <BrandMark tint={INK} subdued={MUTE} />
        <AssessmentIdentity name={data.assessmentName} tint={CLAY} />
      </View>

      <View style={{ ...abs, right: SAFE, top: 118, alignItems: 'flex-end' }}>
        <ResultBlock data={data} tint={CLAY} summaryTint={MUTE} align="right" width={300} eyebrowTint={MUTE} />
      </View>

      <View style={{ ...abs, right: SAFE, bottom: 128, alignItems: 'flex-end' }}>
        <View style={{ width: 220, height: 1, backgroundColor: 'rgba(74,53,41,0.28)', marginBottom: 14 }} />
        <PersonName data={data} tint={CLAY} labelTint={MUTE} align="right" />
      </View>

      <View style={{ ...abs, left: SAFE, bottom: 128 }}>
        <ConceptLabel data={data} tint="#FFFFFF" subTint="rgba(255,255,255,0.86)" />
      </View>

      <View style={{ ...abs, left: 0, right: 0, bottom: 0, height: 74, backgroundColor: '#4A3529', opacity: 0.9 }} />
      <View style={{ ...abs, left: RAIL_SAFE, right: RAIL_SAFE, bottom: RAIL_SAFE }}>
        <CoverMetadata data={data} labelTint="rgba(255,255,255,0.76)" valueTint="#FFFFFF" />
      </View>
    </Page>
  );
}

/* ------------------------------------------- 4. Leader, The Consequence Room */
export function LeaderCover({ data }: { data: AssessmentCoverData }) {
  const SLATE = '#2E4756';
  const GOLD = '#E4B75F';
  const PAPER = '#EDE7DD';
  const colW = LETTER.w * 0.42;
  return (
    <Page size={[LETTER.w, LETTER.h]} style={page(SLATE)}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={ART('leader.jpg')} style={{ ...abs, right: 0, top: 0, width: LETTER.w * 0.66, height: LETTER.h, objectFit: 'cover' }} />
      <View style={{ ...abs, left: 0, top: 0, width: colW, height: LETTER.h, backgroundColor: SLATE }} />
      <View style={{ ...abs, left: colW, top: 0, width: 46, height: LETTER.h, backgroundColor: SLATE, opacity: 0.55 }} />

      {/* a restrained branching consequence line */}
      <Svg style={{ ...abs, left: 0, top: 0 }} width={LETTER.w} height={LETTER.h}>
        <Path d={`M ${colW * 0.4} ${LETTER.h * 0.52} L ${LETTER.w * 0.62} ${LETTER.h * 0.42}`} stroke={GOLD} strokeOpacity={0.5} strokeWidth={0.9} fill="none" />
        <Path d={`M ${colW * 0.4} ${LETTER.h * 0.52} L ${LETTER.w * 0.58} ${LETTER.h * 0.68}`} stroke={GOLD} strokeOpacity={0.35} strokeWidth={0.9} fill="none" />
      </Svg>

      <View style={{ ...abs, left: SAFE, top: SAFE }}><BrandMark tint={PAPER} subdued="rgba(237,231,221,0.7)" /></View>
      <View style={{ ...abs, right: SAFE, top: SAFE }}>
        <AssessmentIdentity name={data.assessmentName} tint="rgba(237,231,221,0.9)" />
      </View>

      <View style={{ ...abs, left: SAFE, top: 132 }}>
        <ResultBlock data={data} tint={GOLD} summaryTint="rgba(237,231,221,0.86)" width={colW - SAFE + 24} eyebrowTint="rgba(237,231,221,0.66)" />
      </View>

      <View style={{ ...abs, left: SAFE, bottom: 132 }}>
        <PersonName data={data} tint="#FFFFFF" labelTint="rgba(237,231,221,0.7)" />
      </View>

      <View style={{ ...abs, left: colW + 34, bottom: 150 }}>
        <ConceptLabel data={data} tint="#FFFFFF" subTint="rgba(255,255,255,0.82)" />
      </View>

      <View style={{ ...abs, left: RAIL_SAFE, right: RAIL_SAFE, bottom: RAIL_SAFE }}>
        <CoverMetadata data={data} labelTint="rgba(237,231,221,0.66)" valueTint={PAPER} ruleTint="rgba(237,231,221,0.34)" />
      </View>
    </Page>
  );
}

/* ------------------------------------------ 5. Minister, The Quiet Threshold */
export function MinisterCover({ data }: { data: AssessmentCoverData }) {
  const BURGUNDY = '#7B2B32';
  const INK = '#3A2B25';
  const MUTE = '#6B564C';
  const colW = LETTER.w * 0.48;
  return (
    <Page size={[LETTER.w, LETTER.h]} style={page('#F2E7DC')}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={ART('minister.jpg')} style={{ ...abs, right: 0, top: 0, width: LETTER.w * 0.62, height: LETTER.h, objectFit: 'cover' }} />
      <View style={{ ...abs, left: 0, top: 0, width: colW, height: LETTER.h, backgroundColor: '#F2E7DC' }} />

      {/* one vertical threshold line */}
      <View style={{ ...abs, left: colW, top: 62, width: 1.2, height: LETTER.h - 190, backgroundColor: '#D9A441', opacity: 0.75 }} />

      <View style={{ ...abs, left: SAFE, top: SAFE }}><BrandMark tint={INK} subdued={MUTE} /></View>
      <View style={{ ...abs, left: SAFE, top: SAFE + 46 }}>
        <AssessmentIdentity name={data.assessmentName} tint={BURGUNDY} align="left" />
      </View>

      <View style={{ ...abs, left: SAFE, top: 176 }}>
        <ResultBlock data={data} tint={BURGUNDY} summaryTint={INK} width={colW - SAFE - 14} eyebrowTint={MUTE} />
      </View>

      <View style={{ ...abs, left: SAFE, bottom: 150 }}>
        <View style={{ width: 200, height: 1, backgroundColor: 'rgba(58,43,37,0.24)', marginBottom: 16 }} />
        <PersonName data={data} tint={BURGUNDY} labelTint={MUTE} />
      </View>

      <View style={{ ...abs, right: SAFE, bottom: 210, alignItems: 'flex-end' }}>
        <ConceptLabel data={data} tint="#FFFFFF" subTint="rgba(255,255,255,0.84)" align="right" />
      </View>

      <View style={{ ...abs, left: 0, right: 0, bottom: 0, height: 74, backgroundColor: '#4A342F', opacity: 0.92 }} />
      <View style={{ ...abs, left: RAIL_SAFE, right: RAIL_SAFE, bottom: RAIL_SAFE }}>
        <CoverMetadata data={data} labelTint="rgba(255,255,255,0.74)" valueTint="#FFFFFF" />
      </View>
    </Page>
  );
}

/* ---------------------------------------- 6. Business, The Resilient Workshop */
export function BusinessCover({ data }: { data: AssessmentCoverData }) {
  const TERRACOTTA = '#A8412C';
  const GOLD = '#E9B96A';
  const PAPER = '#F6EDE4';
  const frameL = LETTER.w * 0.44;
  const frameT = LETTER.h * 0.075;
  return (
    <Page size={[LETTER.w, LETTER.h]} style={page(TERRACOTTA)}>
      {/* a framed plate in the upper right and centre, not a bleed */}
      <View style={{ ...abs, left: frameL, right: SAFE, top: frameT, bottom: LETTER.h * 0.2 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={ART('business.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>

      {/* the operating loop, visibly separate from the workshop beneath it */}
      <Svg style={{ ...abs, left: 0, top: 0 }} width={LETTER.w} height={LETTER.h}>
        <Circle cx={LETTER.w * 0.30} cy={LETTER.h * 0.42} r={LETTER.w * 0.23}
          fill="none" stroke={GOLD} strokeOpacity={0.55} strokeWidth={1.1} />
      </Svg>

      <View style={{ ...abs, left: SAFE, top: SAFE }}><BrandMark tint={PAPER} subdued="rgba(246,237,228,0.72)" /></View>
      <View style={{ ...abs, right: SAFE, top: SAFE }}>
        <AssessmentIdentity name={data.assessmentName} tint="rgba(246,237,228,0.92)" />
      </View>

      <View style={{ ...abs, left: SAFE, top: 148 }}>
        <ResultBlock data={data} tint={GOLD} summaryTint="rgba(246,237,228,0.9)" width={frameL - SAFE - 16} eyebrowTint="rgba(246,237,228,0.72)" />
      </View>

      <View style={{ ...abs, left: SAFE, bottom: 128 }}>
        <PersonName data={data} tint="#FFFFFF" labelTint="rgba(246,237,228,0.74)" />
      </View>

      <View style={{ ...abs, right: SAFE + 14, bottom: LETTER.h * 0.2 + 16, alignItems: 'flex-end' }}>
        <ConceptLabel data={data} tint="#FFFFFF" subTint="rgba(255,255,255,0.84)" align="right" />
      </View>

      <View style={{ ...abs, left: RAIL_SAFE, right: RAIL_SAFE, bottom: RAIL_SAFE }}>
        <CoverMetadata data={data} labelTint="rgba(246,237,228,0.72)" valueTint={PAPER} ruleTint="rgba(246,237,228,0.4)" />
      </View>
    </Page>
  );
}

const LAYOUTS = {
  student: StudentCover, teacher: TeacherCover, parent: ParentCover,
  leader: LeaderCover, minister: MinisterCover, business: BusinessCover,
} as const;

/** The one place a persona chooses its layout. Unknown personas fail loudly. */
export function AssessmentCover({ data }: { data: AssessmentCoverData }) {
  const Layout = LAYOUTS[data.persona];
  if (!Layout) throw new Error(`No cover layout for persona: ${String(data.persona)}`);
  return <Layout data={data} />;
}

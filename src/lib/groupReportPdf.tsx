/**
 * The group report.
 *
 * One document for an organisation, a class or a team, built entirely from
 * `buildGroupResult`. Layout only: nothing in this file computes a statistic or
 * writes a claim about a group. If a number is on a page here, the group engine
 * produced it, and the test suite recomputed it by hand.
 *
 * It opens on the Business Owner cover design, in that persona's terracotta and
 * gold, because a group reading is addressed to whoever runs the group rather
 * than to a respondent. The organisation's name takes the place a person's name
 * holds on an individual report.
 */

import React from 'react';
import path from 'path';
import {
  Page, Document, StyleSheet, Text, View, Svg, Rect, Circle, Line, Image, Link,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  LETTER, SAFE, RAIL_SAFE, BrandMark, ART,
} from './covers/kit';
import { BRAND, ECOSYSTEM, NEXT_STEP } from '@/brand';
import type { GroupDimension, GroupResult } from '@/engine/group';

const ORG = (file: string) => path.join(process.cwd(), 'public', file.replace(/^\//, ''));

const T = {
  terracotta: '#A8412C',
  oxblood: '#7B2B32',
  gold: '#B08A3E',
  goldSoft: '#E9B96A',
  paper: '#F6EDE4',
  page: '#FBF7F1',
  ink: '#2C2621',
  mute: '#6E6155',
  hair: '#E0D5C6',
  teal: '#2F6F62',
  warn: '#B4452F',
};

const S = StyleSheet.create({
  page: { backgroundColor: T.page, paddingTop: 46, paddingBottom: 58, paddingHorizontal: SAFE, fontFamily: 'PlexSans', color: T.ink },
  eyebrow: { fontFamily: 'PlexMono', fontWeight: 500, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: T.gold, marginBottom: 8 },
  h1: { fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 21, color: T.oxblood, marginBottom: 10 },
  h2: { fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 14, color: T.ink, marginBottom: 6 },
  body: { fontSize: 10, lineHeight: 1.55, color: T.ink, marginBottom: 8 },
  muted: { fontSize: 9, lineHeight: 1.5, color: T.mute },
  card: { borderWidth: 1, borderColor: T.hair, borderRadius: 6, padding: 14, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row' },
  gap: { height: 16 },
  rule: { height: 1, backgroundColor: T.hair, marginVertical: 14 },
  footer: { position: 'absolute', left: SAFE, right: SAFE, bottom: 26, flexDirection: 'row', justifyContent: 'space-between' },
  foot: { fontFamily: 'PlexMono', fontSize: 7.5, color: T.mute, letterSpacing: 0.6 },
});

const pct = (n: number) => `${Math.round(n)}%`;
const one = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const Footer = ({ label }: { label: string }) => (
  <View style={S.footer} fixed>
    <Text style={S.foot}>{label} · {BRAND.product}</Text>
    <Text style={S.foot} render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
  </View>
);

/* ------------------------------------------------------------------- cover */

function Cover({ g }: { g: GroupResult }) {
  const frameL = LETTER.w * 0.44;
  return (
    <Page size={[LETTER.w, LETTER.h]} style={{ backgroundColor: T.terracotta, fontFamily: 'PlexSans' }}>
      <View style={{ position: 'absolute', left: frameL, right: SAFE, top: LETTER.h * 0.075, bottom: LETTER.h * 0.2 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={ART('business.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>

      {/* the operating loop, the same gesture the Business Owner cover carries */}
      <Svg style={{ position: 'absolute', left: 0, top: 0 }} width={LETTER.w} height={LETTER.h}>
        <Circle cx={LETTER.w * 0.30} cy={LETTER.h * 0.42} r={LETTER.w * 0.23}
          fill="none" stroke={T.goldSoft} strokeOpacity={0.55} strokeWidth={1.1} />
      </Svg>

      <View style={{ position: 'absolute', left: SAFE, top: SAFE }}>
        <BrandMark tint={T.paper} subdued="rgba(246,237,228,0.72)" />
      </View>
      <View style={{ position: 'absolute', right: SAFE, top: SAFE, alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 8, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(246,237,228,0.92)' }}>
          Group Report
        </Text>
      </View>

      <View style={{ position: 'absolute', left: SAFE, top: 150, width: frameL - SAFE - 16 }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(246,237,228,0.72)', marginBottom: 12 }}>
          Prepared for
        </Text>
        <Text style={{
          fontFamily: 'SourceSerif', fontWeight: 600, color: T.goldSoft, lineHeight: 1.04,
          fontSize: g.label.length > 30 ? 30 : g.label.length > 18 ? 38 : 46,
        }}>
          {g.label}
        </Text>
        <Text style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(246,237,228,0.9)', marginTop: 14 }}>
          A reading of where this group stands with AI, how widely it is spread, what is holding most
          of it, and what would move it up.
        </Text>
      </View>

      <View style={{ position: 'absolute', left: SAFE, bottom: 132 }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 7.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(246,237,228,0.74)', marginBottom: 6 }}>
          Read across
        </Text>
        <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 26, color: '#FFFFFF' }}>
          {g.n} {g.n === 1 ? 'person' : 'people'}
        </Text>
      </View>

      <View style={{
        position: 'absolute', left: RAIL_SAFE, right: RAIL_SAFE, bottom: RAIL_SAFE,
        borderTopWidth: 1, borderTopColor: 'rgba(246,237,228,0.4)', paddingTop: 10, flexDirection: 'row',
      }}>
        {[['Report date', dateOf(g.generatedAt)],
          ['Assessments', g.personas.map((p) => `${p.label} (${p.n})`).join(', ')],
          ['Access', BRAND.site]].map(([k, v]) => (
          <View key={k} style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: 'PlexMono', fontSize: 6.5, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(246,237,228,0.72)', marginBottom: 3 }}>{k}</Text>
            <Text style={{ fontSize: 8.5, fontWeight: 600, color: T.paper }}>{v}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}

/* ------------------------------------------------------------- small parts */

const Stat = ({ k, v, note }: { k: string; v: string; note?: string }) => (
  <View style={{ flex: 1, paddingRight: 12 }}>
    <Text style={{ fontFamily: 'PlexMono', fontSize: 7, letterSpacing: 1.2, textTransform: 'uppercase', color: T.mute, marginBottom: 4 }}>{k}</Text>
    <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 22, color: T.oxblood }}>{v}</Text>
    {note ? <Text style={{ fontSize: 8, color: T.mute, marginTop: 3, lineHeight: 1.4 }}>{note}</Text> : null}
  </View>
);

/** The stage distribution: a count per camp, with the centre marked. */
function Distribution({ g }: { g: GroupResult }) {
  const W = LETTER.w - SAFE * 2 - 28;
  const max = Math.max(...g.distribution.map((d) => d.n));
  const rowH = 17;
  return (
    <View style={S.card} wrap={false}>
      <Text style={S.h2}>Where the group is standing</Text>
      <Text style={{ ...S.muted, marginBottom: 10 }}>
        One bar per stage, counting people. This is a distribution, not an average: the widest bar is
        where most of this group is, and the bars either side are how far it reaches.
      </Text>
      <Svg width={W} height={g.distribution.length * rowH + 6}>
        {g.distribution.map((d, i) => {
          const y = i * rowH + 4;
          const w = Math.max(2, (d.n / max) * (W - 190));
          const isCentre = d.stage === g.centre.stage;
          return (
            <React.Fragment key={d.stage}>
              <Rect x={0} y={y} width={w} height={11} rx={2}
                fill={isCentre ? T.terracotta : T.hair} />
              <Line x1={0} y1={y + 13.5} x2={W} y2={y + 13.5} stroke={T.hair} strokeWidth={0.5} />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ marginTop: -(g.distribution.length * rowH + 6) }}>
        {g.distribution.map((d) => (
          <View key={d.stage} style={{ height: rowH, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: W - 186 }} />
            <Text style={{ fontSize: 8.5, color: d.stage === g.centre.stage ? T.ink : T.mute, width: 130 }}>
              {d.stage}. {d.stageName}
            </Text>
            <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>
              {d.n} · {pct(d.share)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** One dimension: the mean, with the middle half of the group drawn around it. */
function DimRow({ d, w }: { d: GroupDimension; w: number }) {
  const x = (v: number) => (v / 100) * w;
  return (
    <View style={{ marginBottom: 9 }} wrap={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 9, color: T.ink }}>{d.name}</Text>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>
          mean {one(d.spread.mean)}  ·  {d.spread.min} to {d.spread.max}  ·  {d.watch.n} watching
        </Text>
      </View>
      <Svg width={w} height={12}>
        <Line x1={0} y1={6} x2={w} y2={6} stroke={T.hair} strokeWidth={3} />
        <Line x1={x(d.spread.min)} y1={6} x2={x(d.spread.max)} y2={6} stroke="#D8CBBA" strokeWidth={3} />
        <Rect x={x(d.spread.p25)} y={2} width={Math.max(2, x(d.spread.p75) - x(d.spread.p25))} height={8}
          rx={2} fill={d.reportedAsRisk ? '#C9A227' : T.teal} fillOpacity={0.35} />
        <Circle cx={x(d.spread.mean)} cy={6} r={4} fill={d.reportedAsRisk ? T.warn : T.teal} />
      </Svg>
    </View>
  );
}

/* -------------------------------------------------------------- the report */

export async function generateGroupPdf(g: GroupResult): Promise<Buffer> {
  const W = LETTER.w - SAFE * 2 - 28;
  const spreadNote = g.index.sd >= 18
    ? 'This is a wide group. A single average would describe almost nobody in it, so plan against the bands rather than the mean.'
    : g.index.sd >= 10
      ? 'The group is moderately spread. Most of it can be addressed together, with the two ends handled separately.'
      : 'The group is tightly clustered. What moves the centre will move most of it.';

  const doc = (
    <Document
      title={`${g.label} · Group Report`}
      author="International Center for Applied Neogogy"
      subject={`${BRAND.product}, group reading across ${g.n} people`}
    >
      <Cover g={g} />

      {/* -------------------------------------------------- where it stands */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Section 1</Text>
        <Text style={S.h1}>Where this group stands</Text>
        <Text style={S.body}>
          This reading covers {g.n} {g.n === 1 ? 'person' : 'people'} who completed the {BRAND.product}.
          It reports where they are standing, how far apart they are, what is holding most of them, and
          which practices would move the group as a whole. {g.confidence.note}
        </Text>

        <View style={{ ...S.card, ...S.row, marginBottom: 14 }} wrap={false}>
          <Stat k="Centre" v={`Stage ${g.centre.stage}`}
            note={`${g.centre.stageName}. ${g.centre.n} of ${g.n} people, ${pct(g.centre.share)}.`} />
          <Stat k="Mean index" v={one(g.index.mean)}
            note={`Median ${one(g.index.median)}. Middle half between ${one(g.index.p25)} and ${one(g.index.p75)}.`} />
          <Stat k="Range" v={`${one(g.index.min)} to ${one(g.index.max)}`}
            note={`A span of ${one(g.extremes.span)} points across the group.`} />
          <Stat k="Spread" v={one(g.index.sd)} note="Standard deviation of the index." />
        </View>

        <Text style={{ ...S.body, marginBottom: 14 }}>{spreadNote}</Text>

        <Distribution g={g} />

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>The two ends</Text>
          <Text style={{ ...S.muted, marginBottom: 10 }}>
            Named so the group can be supported at both ends rather than only at its middle. Neither
            reading is a judgement of a person: both describe practices on a date.
          </Text>
          {[['Furthest along', g.extremes.top], ['Earliest on the route', g.extremes.bottom]].map(([k, e]) => {
            const m = e as GroupResult['extremes']['top'];
            return (
              <View key={String(k)} style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, borderTopColor: T.hair }}>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 7.5, letterSpacing: 1.1, textTransform: 'uppercase', color: T.mute, width: 124 }}>{String(k)}</Text>
                <Text style={{ fontSize: 10, width: 116 }}>{m.label}</Text>
                <Text style={{ fontSize: 9.5, color: T.mute, flex: 1, paddingRight: 8 }}>Stage {m.stage}, {m.stageName}</Text>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 10, color: T.oxblood, width: 34, textAlign: 'right' }}>{one(m.index)}</Text>
              </View>
            );
          })}
        </View>

        <Footer label={g.label} />
      </Page>

      {/* ------------------------------------------------- the ten dimensions */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Section 2</Text>
        <Text style={S.h1}>The ten dimensions, across the group</Text>
        <Text style={S.body}>
          Each line is one dimension. The dot is the group mean, the shaded block is the middle half
          of the group, and the pale bar behind it is the full range from the lowest reading to the
          highest. A wide block means the group disagrees with itself on that dimension, which is
          usually more actionable than the mean.
        </Text>
        <View style={S.card}>
          {g.dimensions.map((d) => <DimRow key={d.construct} d={d} w={W - 28} />)}
        </View>

        <View style={S.gap} />

        <View style={S.row}>
          <View style={{ ...S.card, flex: 1, marginRight: 10 }} wrap={false}>
            <Text style={S.h2}>Holding strongest</Text>
            {g.strengths.map((d) => (
              <Text key={d.construct} style={{ fontSize: 9.5, marginBottom: 4 }}>
                {d.name}  <Text style={{ color: T.mute }}>mean {one(d.spread.mean)}, {d.strong.n} of {g.n} strong</Text>
              </Text>
            ))}
          </View>
          <View style={{ ...S.card, flex: 1 }} wrap={false}>
            <Text style={S.h2}>Needing attention</Text>
            {g.watchlist.map((d) => (
              <Text key={d.construct} style={{ fontSize: 9.5, marginBottom: 4 }}>
                {d.name}  <Text style={{ color: T.mute }}>mean {one(d.spread.mean)}, {d.watch.n} of {g.n} watching</Text>
              </Text>
            ))}
          </View>
        </View>

        <Footer label={g.label} />
      </Page>

      {/* ----------------------------------------------- what is holding it */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Section 3</Text>
        <Text style={S.h1}>What is holding this group</Text>
        <Text style={S.body}>
          Every individual report names one constraint: the capability doing most to hold that person
          where they are, which is not always their lowest score. Counting those constraints across
          the group shows what a shared intervention would have to address.
        </Text>

        <View style={S.card} wrap={false}>
          {g.constraints.length ? g.constraints.map((c) => (
            <View key={c.construct} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderTopWidth: 1, borderTopColor: T.hair }}>
              <Text style={{ fontSize: 10, flex: 1 }}>{c.name}</Text>
              <Svg width={160} height={9}>
                <Rect x={0} y={1} width={160} height={7} rx={2} fill={T.hair} />
                <Rect x={0} y={1} width={Math.max(2, (c.share / 100) * 160)} height={7} rx={2} fill={T.terracotta} />
              </Svg>
              <Text style={{ fontFamily: 'PlexMono', fontSize: 9, color: T.mute, width: 76, textAlign: 'right' }}>
                {c.n} of {g.n} · {pct(c.share)}
              </Text>
            </View>
          )) : (
            <Text style={S.muted}>
              No constraint is binding anyone in this group: every member has closed the deficits the
              route measures. That is unusual, and worth confirming against the individual reports.
            </Text>
          )}
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Signals across the group</Text>
          <Text style={{ ...S.muted, marginBottom: 10 }}>
            Counts, not diagnoses. Each one points at a set of individual reports worth reading.
          </Text>
          {[
            ['Held by a practice gate', g.flags.gated, 'Capable, but a specific practice is capping the stage they can reach.'],
            ['Underexposed', g.flags.underexposed, 'Little AI use, and not the deliberate kind: fluency and adaptability may be undeveloped.'],
            ['Capability on thin protection', g.flags.eroding, 'High readiness sitting on high dependence. This is the pattern the instrument exists to catch.'],
            ['Deliberately selective', g.flags.intentionalLowUse, 'Low use by choice, with capability intact. Not a concern.'],
            ['Thin evidence', g.flags.lowConfidence, 'Too few answers carried weight. Read these results lightly.'],
          ].map(([label, c, note]) => {
            const v = c as { n: number; share: number };
            return (
              <View key={String(label)} style={{ flexDirection: 'row', paddingVertical: 5, borderTopWidth: 1, borderTopColor: T.hair }}>
                <Text style={{ fontSize: 9.5, width: 168 }}>{String(label)}</Text>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 9.5, color: v.n ? T.oxblood : T.mute, width: 74 }}>
                  {v.n} · {pct(v.share)}
                </Text>
                <Text style={{ fontSize: 8.5, color: T.mute, flex: 1, lineHeight: 1.4 }}>{String(note)}</Text>
              </View>
            );
          })}
        </View>

        {g.movement.repeatTakers ? (
          <>
            <View style={S.gap} />
            <View style={S.card} wrap={false}>
              <Text style={S.h2}>Movement</Text>
              <Text style={{ ...S.muted, marginBottom: 8 }}>
                Across the {g.movement.repeatTakers} {g.movement.repeatTakers === 1 ? 'person' : 'people'} who
                have taken it more than once, comparing their first reading with their latest.
              </Text>
              <View style={S.row}>
                <Stat k="Improved" v={String(g.movement.improved)} />
                <Stat k="Held" v={String(g.movement.held)} />
                <Stat k="Declined" v={String(g.movement.declined)} />
                <Stat k="Mean change" v={`${g.movement.meanDelta > 0 ? '+' : ''}${one(g.movement.meanDelta)}`} />
              </View>
            </View>
          </>
        ) : null}

        <Footer label={g.label} />
      </Page>

      {/* ------------------------------------------------------ moving it up */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Section 4</Text>
        <Text style={S.h1}>How to move this group up</Text>
        <Text style={S.body}>
          Every practice below was already given to people inside this group by their own report. They
          appear here in the order of how many share them, so the first is the change that would reach
          the most people at once. Nothing here is new advice invented for a group.
        </Text>

        {g.moves.length ? g.moves.map((m, i) => (
          <View key={`${m.capability}-${i}`} style={{ ...S.card, marginBottom: 10 }} wrap={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 12, color: T.oxblood }}>
                {i + 1}. {m.capability}
              </Text>
              <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>
                {m.n} of {g.n} · {pct(m.share)}
              </Text>
            </View>
            <Text style={{ fontSize: 9.5, lineHeight: 1.5, marginBottom: 4 }}>{m.change}</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.5, color: T.mute }}>{m.practice}</Text>
          </View>
        )) : (
          <View style={S.card}>
            <Text style={S.muted}>
              No shared immediate practice came out of this group. Read the individual reports: the
              work here is person by person rather than programme wide.
            </Text>
          </View>
        )}

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Where the centre goes next</Text>
          <Text style={{ ...S.muted, marginBottom: 8 }}>
            Most of this group is at stage {g.centre.stage}, {g.centre.stageName}. Stage {g.nextStage.stage},
            {' '}{g.nextStage.stageName}, asks for the following.
          </Text>
          {g.nextStage.requirements.map((r, i) => (
            <Text key={i} style={{ fontSize: 9.5, lineHeight: 1.5, marginBottom: 4 }}>{'•'}  {r}</Text>
          ))}
        </View>

        <View style={S.rule} />

        <Text style={{ ...S.muted, marginBottom: 10 }}>
          These are assessment indices built from self reported answers, aggregated across a group.
          They are designed to support planning and reflection. They are not a clinical diagnosis, a
          psychological evaluation, or a validated psychometric measurement, and they should not be
          used to rank, appraise or select individuals.
        </Text>

        <View style={{ padding: '12 16', borderRadius: 6, backgroundColor: T.oxblood }} wrap={false}>
          <Text style={{ fontSize: 9.5, color: '#F6EFE6', marginBottom: 4 }}>{NEXT_STEP.line}</Text>
          <Link src={NEXT_STEP.url} style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 14, color: '#FFFFFF', textDecoration: 'none' }}>
            {NEXT_STEP.label}
          </Link>
        </View>

        <View style={{ marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: T.hair, padding: '14 18 10' }} wrap={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {ECOSYSTEM.map((o) => (
              <Link key={o.name} src={o.url} style={{ textDecoration: 'none' }}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={ORG(o.logo)} style={{ width: o.pdfW, height: (o.pdfW * o.h) / o.w }} />
              </Link>
            ))}
          </View>
          <Text style={{ fontFamily: 'PlexMono', fontSize: 7, letterSpacing: 1.1, textTransform: 'uppercase', color: T.mute, textAlign: 'center', marginTop: 10 }}>
            International Center for Applied Neogogy · ican.ph
          </Text>
        </View>

        <Footer label={g.label} />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

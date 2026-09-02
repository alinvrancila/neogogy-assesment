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
import type { GroupDimension, GroupResult, Spread } from '@/engine/group';
import type { OrgProfile } from './orgProfile';

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

function Cover({ g, p }: { g: GroupResult; p?: OrgProfile | null }) {
  const frameL = LETTER.w * 0.44;
  // the width the title actually has, which is what a long single word must fit
  const TITLE_BOX = frameL - SAFE - 16;
  const title = (p?.coverTitle || '').trim() || g.label;
  const subtitle = (p?.coverSubtitle || '').trim()
    || 'A reading of where this group stands with AI, how widely it is spread, what is holding most of it, and what would move it up.';
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

      {/* The organisation's own mark takes the place the assessment's mark holds
          on an individual report. Fitted to a fixed box, never stretched. */}
      <View style={{ position: 'absolute', left: SAFE, top: SAFE }}>
        {p?.logo ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 4, padding: 8, width: 148, height: 62, alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={p.logo} style={{ maxWidth: 132, maxHeight: 46, objectFit: 'contain' }} />
          </View>
        ) : (
          <BrandMark tint={T.paper} subdued="rgba(246,237,228,0.72)" />
        )}
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
          // sized by the longest word as well as the whole line: a single long
          // word cannot wrap, so it is what actually decides the fit
          fontSize: Math.min(
            title.length > 30 ? 30 : title.length > 18 ? 38 : 46,
            Math.max(20, Math.floor(TITLE_BOX / (0.58 * Math.max(...title.split(/\s+/).map((w) => w.length))))),
          ),
        }}>
          {title}
        </Text>
        {/* An empty field renders nothing rather than placeholder text. */}
        {subtitle ? (
          <Text style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(246,237,228,0.9)', marginTop: 14 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ position: 'absolute', left: SAFE, bottom: 196 }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 7.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(246,237,228,0.74)', marginBottom: 6 }}>
          Read across
        </Text>
        <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 26, color: '#FFFFFF' }}>
          {g.n} {g.n === 1 ? 'person' : 'people'}
        </Text>
      </View>

      {/* the four, in the lockup order the individual report uses */}
      <View style={{ position: 'absolute', left: SAFE, right: SAFE, bottom: 104 }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 7, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(246,237,228,0.74)', marginBottom: 8 }}>
          In partnership with
        </Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 5, paddingVertical: 9, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {ECOSYSTEM.map((o) => (
            <Link key={o.name} src={o.url} style={{ textDecoration: 'none' }}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={ORG(o.logo)} style={{ width: o.pdfW * 0.72, height: (o.pdfW * 0.72 * o.h) / o.w }} />
            </Link>
          ))}
        </View>
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

/**
 * One dimension: the median with the middle half drawn around it, the full
 * range behind that, and the band counts printed. The mean is in the export,
 * not in the headline.
 */
function DimRow({ d, w }: { d: GroupDimension; w: number }) {
  const x = (v: number) => (v / 100) * w;
  const s = d.spread;
  return (
    <View style={{ marginBottom: 10 }} wrap={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 9, color: T.ink }}>
          {d.name}
          {d.lowerIsHealthier ? <Text style={{ color: T.mute }}> (lower is healthier)</Text> : null}
          {d.polarised ? <Text style={{ color: T.warn }}>  polarised</Text> : null}
          {d.uniformlyLow ? <Text style={{ color: T.warn }}>  uniformly low</Text> : null}
        </Text>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 8, color: T.mute }}>
          median {one(s.median)} · Q1 {one(s.q1)} · Q3 {one(s.q3)} · {one(s.min)} to {one(s.max)}
        </Text>
      </View>
      <Svg width={w} height={11}>
        <Line x1={0} y1={5.5} x2={w} y2={5.5} stroke={T.hair} strokeWidth={3} />
        <Line x1={x(s.min)} y1={5.5} x2={x(s.max)} y2={5.5} stroke="#D8CBBA" strokeWidth={3} />
        <Rect x={x(s.q1)} y={1.5} width={Math.max(2, x(s.q3) - x(s.q1))} height={8}
          rx={2} fill={d.lowerIsHealthier ? '#C9A227' : T.teal} fillOpacity={0.35} />
        <Circle cx={x(s.median)} cy={5.5} r={4} fill={d.lowerIsHealthier ? T.warn : T.teal} />
      </Svg>
      <Text style={{ fontFamily: 'PlexMono', fontSize: 7.5, color: T.mute, marginTop: 2 }}>
        strong {d.bands.strong.n} · developing {d.bands.developing.n} · watch {d.bands.watch.n}
        {'   '}evidence, median {d.evidence.median} items
      </Text>
    </View>
  );
}

const SpreadLine = ({ label, s, low }: { label: string; s: Spread; low?: boolean }) => (
  <View style={{ flexDirection: 'row', paddingVertical: 3.5, borderTopWidth: 1, borderTopColor: T.hair }}>
    <Text style={{ fontSize: 9, flex: 1 }}>
      {label}{low ? <Text style={{ color: T.mute }}> (lower is healthier)</Text> : null}
    </Text>
    <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>
      median {one(s.median)} · Q1 {one(s.q1)} · Q3 {one(s.q3)} · {one(s.min)} to {one(s.max)}
      {s.ci ? ` · CI ${one(s.ci.low)} to ${one(s.ci.high)}` : ''}
    </Text>
  </View>
);

/** A count row with a bar, used wherever a tally is the finding. */
const Tally = ({ label, n, total, note }: { label: string; n: number; total: number; note?: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderTopWidth: 1, borderTopColor: T.hair }}>
    <Text style={{ fontSize: 9.5, width: 178 }}>{label}</Text>
    <Svg width={120} height={8}>
      <Rect x={0} y={0.5} width={120} height={7} rx={2} fill={T.hair} />
      <Rect x={0} y={0.5} width={Math.max(1.5, (n / Math.max(total, 1)) * 120)} height={7} rx={2} fill={T.terracotta} />
    </Svg>
    <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute, width: 72, textAlign: 'right' }}>
      {n} of {total}
    </Text>
    {note ? <Text style={{ fontSize: 8, color: T.mute, flex: 1, paddingLeft: 10, lineHeight: 1.35 }}>{note}</Text> : null}
  </View>
);

/* -------------------------------------------------------------- the report */

export async function generateGroupPdf(g: GroupResult, profile?: OrgProfile | null): Promise<Buffer> {
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
      <Cover g={g} p={profile} />

      {/* ------------------------------------------------ 1. executive answer */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Page 1</Text>
        <Text style={S.h1}>The executive answer</Text>
        <Text style={S.body}>
          Read across {g.n} {g.n === 1 ? 'person' : 'people'} between {dateOf(g.window.first)} and{' '}
          {dateOf(g.window.last)}. {g.confidence.note}
        </Text>

        <View style={{ ...S.card, ...S.row, marginBottom: 12 }} wrap={false}>
          <Stat k="Healthy adoption" v={`${g.headline.healthyAdoption.n} of ${g.n}`}
            note={`${pct(g.headline.healthyAdoption.share)} of the group. Components on the methods page.`} />
          <Stat k="Centre" v={`Stage ${g.centre.stage}`}
            note={`${g.centre.stageName}. ${g.centre.n} of ${g.n} people.`} />
          <Stat k="Index" v={one(g.index.median)}
            note={`Median. Q1 ${one(g.index.q1)}, Q3 ${one(g.index.q3)}, range ${one(g.index.min)} to ${one(g.index.max)}.`} />
          <Stat k="Shape" v={g.shape} note={`Standard deviation ${one(g.index.sd)}.`} />
        </View>

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>The one decision</Text>
          {g.constraints.length ? (
            <Text style={S.body}>
              {g.constraints[0].n} of {g.n} people are held by {g.constraints[0].name}, which is{' '}
              {pct(g.constraints[0].share)} of the group.{' '}
              {g.concentration.reading === 'one intervention reaches most'
                ? 'One intervention would reach most of this group, so a shared programme is the efficient move.'
                : g.concentration.reading === 'mixed'
                  ? 'A shared programme reaches a substantial minority; the rest needs segmented work.'
                  : 'Needs are fragmented across the group, so a single programme would miss most people. Work from the segment page rather than the group average.'}
            </Text>
          ) : (
            <Text style={S.body}>No constraint binds anyone in this group. Confirm against the individual reports.</Text>
          )}
          <Text style={{ ...S.muted, marginBottom: 6 }}>The practices that reach the most people:</Text>
          {g.moves.slice(0, 3).map((m, i) => (
            <Text key={i} style={{ fontSize: 9.5, lineHeight: 1.5, marginBottom: 3 }}>
              {i + 1}. {m.capability}, {m.n} of {g.n} people. {m.change}
            </Text>
          ))}
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>What this reading does not yet carry</Text>
          <Text style={{ ...S.muted, marginBottom: 6 }}>
            These need the cohort modules, which collect evidence of practice and task outcomes
            alongside the assessment. Nothing below is estimated here.
          </Text>
          {g.headline.notCollected.map((x) => (
            <Text key={x} style={{ fontSize: 9, color: T.mute, marginBottom: 2 }}>{'•'}  {x}</Text>
          ))}
        </View>

        <Footer label={g.label} />
      </Page>

      {/* --------------------------------------------- 2. workforce formation */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Page 2</Text>
        <Text style={S.h1}>Workforce formation</Text>

        <Distribution g={g} />
        <View style={S.gap} />

        <View style={S.card}>
          <Text style={S.h2}>The ten dimensions</Text>
          <Text style={{ ...S.muted, marginBottom: 10 }}>
            The dot is the median, the block is the middle half, the pale bar is the full range.
            Polarised means the group holds both a strength and a vulnerability on that dimension, so
            it needs segmented coaching rather than one shared practice.
          </Text>
          {g.dimensions.map((d) => <DimRow key={d.construct} d={d} w={W - 28} />)}
        </View>

        <Footer label={g.label} />
      </Page>

      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Page 2, continued</Text>
        <Text style={S.h1}>Composites, profile and calibration</Text>

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>The six composites</Text>
          {g.composites.map((c) => <SpreadLine key={c.id} label={c.label} s={c.spread} low={c.lowerIsHealthier} />)}
        </View>

        <View style={S.gap} />

        <View style={S.row}>
          <View style={{ ...S.card, flex: 1, marginRight: 10 }} wrap={false}>
            <Text style={S.h2}>Profiles present</Text>
            {g.archetypes.filter((a) => a.n > 0).map((a) => (
              <View key={a.id} style={{ flexDirection: 'row', paddingVertical: 2.5 }}>
                <Text style={{ fontSize: 9, flex: 1 }}>{a.name}</Text>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>{a.n}</Text>
              </View>
            ))}
            <Text style={{ ...S.muted, marginTop: 6 }}>
              {g.archetypes.filter((a) => a.n === 0).length} of the nine profiles are not present.
            </Text>
          </View>
          <View style={{ ...S.card, flex: 1 }} wrap={false}>
            <Text style={S.h2}>Patterns fired</Text>
            {g.patterns.harm.length ? g.patterns.harm.map((x) => (
              <View key={x.id} style={{ flexDirection: 'row', paddingVertical: 2.5 }}>
                <Text style={{ fontSize: 9, flex: 1, color: T.warn }}>{x.label}</Text>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>{x.n}</Text>
              </View>
            )) : <Text style={S.muted}>No harm pattern fired for anyone in this group.</Text>}
            {g.patterns.help.map((x) => (
              <View key={x.id} style={{ flexDirection: 'row', paddingVertical: 2.5 }}>
                <Text style={{ fontSize: 9, flex: 1, color: T.teal }}>{x.label}</Text>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>{x.n}</Text>
              </View>
            ))}
            <Text style={{ ...S.muted, marginTop: 6 }}>
              {g.patterns.noHarm.n} of {g.n} have no harm pattern at all.
            </Text>
          </View>
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Calibration</Text>
          <Text style={{ ...S.muted, marginBottom: 8 }}>
            How the group&apos;s own sense of its practice compares with what the answers describe. Two
            unscored questions, asked before the assessment and never used in scoring.
          </Text>
          {g.calibration.felt.n ? (
            <>
              <Tally label="Feels healthier than measured" n={g.calibration.felt.healthier.n} total={g.calibration.felt.n} />
              <Tally label="Feels about right" n={g.calibration.felt.matched.n} total={g.calibration.felt.n} />
              <Tally label="Feels less healthy than measured" n={g.calibration.felt.lessHealthy.n} total={g.calibration.felt.n} />
            </>
          ) : <Text style={S.muted}>The calibration questions were not answered by this group.</Text>}
          {g.calibration.predicted.n ? (
            <Text style={{ ...S.muted, marginTop: 8 }}>
              Of the {g.calibration.predicted.n} who predicted a result, {g.calibration.predicted.accurate.n} were
              exact and {g.calibration.predicted.withinOne.n} were within one band.
            </Text>
          ) : null}
        </View>

        {g.correlations.length ? (
          <>
            <View style={S.gap} />
            <View style={S.card} wrap={false}>
              <Text style={S.h2}>Relationships</Text>
              <Text style={{ ...S.muted, marginBottom: 6 }}>
                Spearman rank correlations, reported because this group is {g.n} people. Below thirty
                they are not shown at all.
              </Text>
              {g.correlations.map((c, i) => (
                <View key={i} style={{ flexDirection: 'row', paddingVertical: 3 }}>
                  <Text style={{ fontSize: 9, flex: 1 }}>{c.a} against {c.b}</Text>
                  <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>rho {c.rho}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Footer label={g.label} />
      </Page>

      {/* ------------------------------------------------------ 3. AI use map */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Page 3</Text>
        <Text style={S.h1}>AI use, against capability</Text>
        <Text style={S.body}>
          The tool, task, workflow and consequence map is not collected yet, so this page reports what
          the assessment itself carries: reported use intensity crossed with capability, which is the
          cross that decides who needs development and who needs control.
        </Text>

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Capability against use</Text>
          {g.quadrants.capabilityUse.map((q) => (
            <Tally key={q.key} label={q.label} n={q.n} total={g.n} note={q.action} />
          ))}
          <Text style={{ ...S.muted, marginTop: 8 }}>
            {g.quadrants.deliberateNonUse.n} of {g.n} use little AI deliberately, with capability
            intact. They are counted separately here rather than as low use, because they are not the
            same finding.
          </Text>
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Fluent, and protected or not</Text>
          <Text style={{ ...S.muted, marginBottom: 6 }}>
            Fluency without judgment is the combination this instrument exists to catch.
          </Text>
          {g.quadrants.fluencyJudgment.map((q) => (
            <Tally key={q.key} label={q.label} n={q.n} total={g.n} note={q.action} />
          ))}
        </View>

        <Footer label={g.label} />
      </Page>

      {/* ------------------------------------------- 4 and 5. value, protection */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Pages 4 and 5</Text>
        <Text style={S.h1}>Value and protection</Text>
        <Text style={S.body}>
          Task time, quality, rework and the matched task experiment are not collected yet, so no
          value figure is shown rather than an estimated one. What follows is the protection reading
          the assessment already carries.
        </Text>

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Governance readings from the assessment</Text>
          <Text style={{ ...S.muted, marginBottom: 6 }}>
            People at or below {g.bands.vulnerability} on each dimension, which is the vulnerability line.
          </Text>
          {g.governance.map((x) => (
            <Tally key={x.construct} label={x.name} n={x.atOrBelowVulnerability.n} total={g.n} />
          ))}
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Signals across the group</Text>
          <Text style={{ ...S.muted, marginBottom: 6 }}>
            Counts, not diagnoses. Each points at a set of individual reports worth reading.
          </Text>
          {[
            ['Held by a practice gate', g.flags.gated, 'A specific practice is capping the stage they can reach.'],
            ['Underexposed', g.flags.underexposed, 'Little use, and not the deliberate kind.'],
            ['Capability on thin protection', g.flags.eroding, 'High readiness sitting on high dependence.'],
            ['Deliberately selective', g.flags.intentionalLowUse, 'Low use by choice, capability intact. Not a concern.'],
            ['Thin evidence', g.flags.lowConfidence, 'Too few answers carried weight. Read lightly.'],
          ].map(([label, c, note]) => {
            const v = c as { n: number };
            return <Tally key={String(label)} label={String(label)} n={v.n} total={g.n} note={String(note)} />;
          })}
          {g.gateHeld.byGate.length ? (
            <Text style={{ ...S.muted, marginTop: 8 }}>
              Gates binding people: {g.gateHeld.byGate.map((x) => `${x.name} (${x.n})`).join(', ')}.
            </Text>
          ) : null}
        </View>

        <Footer label={g.label} />
      </Page>

      {/* --------------------------------------- 6 and 7. enablers, segments */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Pages 6 and 7</Text>
        <Text style={S.h1}>Conditions and segments</Text>
        <Text style={S.body}>
          The team climate and training modules are not collected yet, so organisational conditions
          are not reported. Segments below use what the platform already knows. A segment is shown
          only at {g.n >= 7 ? 'seven' : 'seven'} or more people, and is withheld when the remainder
          would be smaller than that, because a cut that leaves three people identifies them.
        </Text>

        <View style={S.card}>
          <Text style={S.h2}>Segments</Text>
          {g.segments.map((sg, i) => (
            <View key={i} style={{ paddingVertical: 4, borderTopWidth: 1, borderTopColor: T.hair }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 7.5, letterSpacing: 1, textTransform: 'uppercase', color: T.mute, width: 96 }}>{sg.dimension}</Text>
                <Text style={{ fontSize: 9.5, flex: 1 }}>{sg.value}</Text>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute, width: 40, textAlign: 'right' }}>{sg.n}</Text>
              </View>
              {sg.suppressed ? (
                <Text style={{ fontSize: 8.5, color: T.mute, marginTop: 2 }}>
                  Withheld: too few people to report without identifying them.
                </Text>
              ) : (
                <Text style={{ fontFamily: 'PlexMono', fontSize: 8, color: T.mute, marginTop: 2 }}>
                  median {one(sg.index!.median)} · Q1 {one(sg.index!.q1)} · Q3 {one(sg.index!.q3)}
                  {'  ·  '}most at stage {sg.modalStage!.stage}
                  {sg.constraint ? `  ·  held most by ${sg.constraint.name} (${sg.constraint.n})` : ''}
                </Text>
              )}
            </View>
          ))}
        </View>

        <Footer label={g.label} />
      </Page>

      {/* ------------------------------------------------- 8. action portfolio */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Page 8</Text>
        <Text style={S.h1}>Action portfolio and the stage move plan</Text>
        <Text style={S.body}>
          Every practice below was already given to people inside this group by their own report,
          ordered by how many share it. Nothing here is new advice written for a group. Owner, target
          date and leading indicator are for the organisation to set: the count is what the assessment
          can supply.
        </Text>

        {g.moves.slice(0, 5).map((m, i) => (
          <View key={i} style={{ ...S.card, marginBottom: 8 }} wrap={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 11.5, color: T.oxblood }}>
                {i + 1}. {m.capability}
              </Text>
              <Text style={{ fontFamily: 'PlexMono', fontSize: 8, color: T.mute }}>
                {m.priority} · reaches {m.n} of {g.n}
              </Text>
            </View>
            <Text style={{ fontSize: 9, lineHeight: 1.45, marginBottom: 3 }}>{m.change}</Text>
            <Text style={{ fontSize: 8.5, lineHeight: 1.45, color: T.mute }}>{m.practice}</Text>
          </View>
        ))}

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Moving people up, stage by stage</Text>
          <Text style={{ ...S.muted, marginBottom: 8 }}>
            What each camp needs to reach the next one, and how many people that is. The movable
            column counts those within five index points of the next camp, or held only by a gate.
          </Text>
          {g.stagePlan.map((sp) => (
            <View key={sp.stage} style={{ paddingVertical: 5, borderTopWidth: 1, borderTopColor: T.hair }} wrap={false}>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ fontSize: 9.5, flex: 1 }}>
                  Stage {sp.stage}, {sp.stageName} to stage {sp.into}, {sp.intoName}
                </Text>
                <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>
                  {sp.n} here · {sp.movable} movable
                </Text>
              </View>
              {sp.requirements.slice(0, 2).map((r, i) => (
                <Text key={i} style={{ fontSize: 8.5, color: T.mute, lineHeight: 1.4 }}>{'•'}  {r}</Text>
              ))}
            </View>
          ))}
        </View>

        <Footer label={g.label} />
      </Page>

      {/* ------------------------------------------------------- 9. movement */}
      {g.movement.repeatTakers ? (
        <Page size={[LETTER.w, LETTER.h]} style={S.page}>
          <Text style={S.eyebrow}>Page 9</Text>
          <Text style={S.h1}>Movement</Text>
          <Text style={S.body}>
            Across the {g.movement.repeatTakers} {g.movement.repeatTakers === 1 ? 'person' : 'people'} who
            have taken it more than once, comparing their first reading with their latest. Intervention
            dates are not recorded yet, so this cannot separate natural movement from movement after a
            programme, and no intervention lift is reported.
          </Text>
          <View style={{ ...S.card, ...S.row }} wrap={false}>
            <Stat k="Improved" v={String(g.movement.improved)} />
            <Stat k="Held" v={String(g.movement.held)} />
            <Stat k="Declined" v={String(g.movement.declined)} />
            <Stat k="Median change" v={`${g.movement.medianDelta > 0 ? '+' : ''}${one(g.movement.medianDelta)}`} />
          </View>
          {g.movement.transitions.length ? (
            <>
              <View style={S.gap} />
              <View style={S.card} wrap={false}>
                <Text style={S.h2}>Stage transitions</Text>
                {g.movement.transitions.map((t, i) => (
                  <View key={i} style={{ flexDirection: 'row', paddingVertical: 3, borderTopWidth: 1, borderTopColor: T.hair }}>
                    <Text style={{ fontSize: 9, flex: 1 }}>Stage {t.from} to stage {t.into}</Text>
                    <Text style={{ fontFamily: 'PlexMono', fontSize: 8.5, color: T.mute }}>{t.n}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          <Footer label={g.label} />
        </Page>
      ) : null}

      {/* -------------------------------------------------------- appendix */}
      <Page size={[LETTER.w, LETTER.h]} style={S.page}>
        <Text style={S.eyebrow}>Appendix</Text>
        <Text style={S.h1}>Method</Text>

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Versions</Text>
          <Text style={{ ...S.muted, marginBottom: 6 }}>
            A comparison across waves is valid only when all four match.
          </Text>
          {[['Instrument', g.versions.instrument], ['Scoring rules', g.versions.scoring],
            ['Scenarios', g.versions.scenario], ['Language', g.versions.language]].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', paddingVertical: 2.5 }}>
              <Text style={{ fontSize: 9, width: 120 }}>{k}</Text>
              <Text style={{ fontFamily: 'PlexMono', fontSize: 9, color: T.mute }}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>The band table</Text>
          <Text style={{ ...S.muted, marginBottom: 6 }}>
            One table for this scoring version, used everywhere in this report.
          </Text>
          {[[`Strength, named as a strength`, `${g.bands.strength} and above`],
            [`Strong band`, `${g.bands.strong} and above`],
            [`Developing band`, `${g.bands.watch} to ${g.bands.strong - 0.1}`],
            [`Watch band`, `below ${g.bands.watch}`],
            [`Vulnerability, named as a vulnerability`, `${g.bands.vulnerability} and below`]].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', paddingVertical: 2.5 }}>
              <Text style={{ fontSize: 9, flex: 1 }}>{k}</Text>
              <Text style={{ fontFamily: 'PlexMono', fontSize: 9, color: T.mute }}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Two names that are not the same thing</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 4 }}>
            <Text style={{ fontWeight: 600 }}>Dependency Risk</Text> is one of the ten dimensions. It is
            stored canonically with lower being healthier, and Independent Capability is one hundred
            minus that value. Where this report says Independent Capability it has done that subtraction.
          </Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
            <Text style={{ fontWeight: 600 }}>Dependency index</Text> is one of the six composites, built
            across several dimensions. Higher is a concern. The two are never interchangeable.
          </Text>
        </View>

        <View style={S.gap} />

        <View style={S.card} wrap={false}>
          <Text style={S.h2}>Sample and privacy limits</Text>
          {[
            `Counts lead. Decimals are descriptive, and a difference inside a confidence band is not a finding.`,
            `Below thirty respondents no confidence intervals and no correlations are reported. This group is ${g.n}.`,
            `A segment is reported at seven or more people, and a sensitive cut at ten or more. A cut whose remainder falls below the threshold is withheld too.`,
            `No respondent is named, ranked or singled out anywhere in this report, and no per-person row is exported.`,
            `Healthy adoption counts: ${g.headline.healthyAdoption.components.join('; ')}.`,
          ].map((t, i) => (
            <Text key={i} style={{ fontSize: 9, lineHeight: 1.5, color: T.mute, marginBottom: 4 }}>{'•'}  {t}</Text>
          ))}
        </View>

        <View style={S.rule} />

        <Text style={{ ...S.muted, marginBottom: 10 }}>
          These are assessment indices built from self reported answers, aggregated across a group.
          They are designed to support planning and reflection. They are not a clinical diagnosis, a
          psychological evaluation, or a validated psychometric measurement, and they must not be used
          to rank, appraise or select individuals.
        </Text>

        <View style={{ padding: '12 16', borderRadius: 6, backgroundColor: T.oxblood }} wrap={false}>
          <Text style={{ fontSize: 9.5, color: '#F6EFE6', marginBottom: 4 }}>{NEXT_STEP.line}</Text>
          <Link src={NEXT_STEP.url} style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 14, color: '#FFFFFF', textDecoration: 'none' }}>
            {NEXT_STEP.label}
          </Link>
        </View>

        <Footer label={g.label} />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

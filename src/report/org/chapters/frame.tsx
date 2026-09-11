/**
 * The cover, the visual contents and the appendix.
 */

import React from 'react';
import { View, Text, Image, Link } from '@react-pdf/renderer';
import { S, TOKENS as T } from '../kit/blocks';
import { SceneView } from '../render/pdf';
import { CHAPTER_META } from './registry';
import { miniRouteScene, bandRulerScene } from '../charts/guide';
import { rangeScene } from '../charts/range';
import { STAGES } from '@/engine/config';
import { DIMENSIONS, COMPOSITES, aliasesFor } from '@/engine/dictionary';
import { CONSTRUCT_IDS } from '@/engine/types';
import { BRAND, ECOSYSTEM, NEXT_STEP } from '@/brand';
import { SUPPRESSION, INFERENCE_FLOOR } from '@/engine/group';
import { GROUP } from '@/engine/config';
import type { OrganisationReportAnalytics } from '@/engine/orgAnalytics';
import path from 'path';

const ORG = (f: string) => path.join(process.cwd(), 'public', f.replace(/^\//, ''));
const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB',
  { day: 'numeric', month: 'long', year: 'numeric' });

export function Cover({ a, w, h }: { a: OrganisationReportAnalytics; w: number; h: number }) {
  const g = a.group;
  return (
    <View>
      <Text style={{ fontFamily: 'PlexMono', fontSize: 7.6, letterSpacing: 1.5,
        textTransform: 'uppercase', color: T.gold, marginBottom: 10 }}>
        {BRAND.product}
      </Text>
      <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 27, color: T.oxblood,
        lineHeight: 1.15, marginBottom: 8 }}>
        Organisational AI Readiness and Human Advantage Report
      </Text>
      <Text style={{ fontSize: 12, color: T.ink, marginBottom: 4 }}>Prepared for {g.label}</Text>
      <Text style={{ ...S.muted, marginBottom: 16 }}>
        Chapter 1 gives the answer in a page. Chapter 2 explains any term you meet later.
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          ['Respondents', `${g.n}`],
          ['Assessment window', `${dateOf(g.window.first)} to ${dateOf(g.window.last)}`],
          ['Assessments present', g.personas.map((p) => `${p.label} (${p.n})`).join(', ')],
          ['Attempts rule', g.cohort.attemptsRule],
          ...(g.cohort.exclusions.length
            ? [['Excluded', g.cohort.exclusions.map((e) => `${e.n}: ${e.reason}`).join('; ')]] : []),
        ].map(([k, v]) => (
          <View key={k} style={{ width: '50%', paddingRight: 12, marginBottom: 9 }}>
            <Text style={{ fontFamily: 'PlexMono', fontSize: 6.4, letterSpacing: 1.1,
              textTransform: 'uppercase', color: T.mute, marginBottom: 2 }}>{k}</Text>
            <Text style={{ fontSize: 8.6, color: T.ink }}>{v}</Text>
          </View>
        ))}
      </View>

      {g.cohort.smallCohort ? (
        <View style={{ backgroundColor: T.paper, borderRadius: 5, padding: 10, marginBottom: 12 }}>
          <Text style={{ ...S.body, fontSize: 8.6 }}>
            This is a small group. Every figure is indicative rather than settled, all segment cuts are
            withheld, and the shape of the workforce matters more here than any single number.
          </Text>
        </View>
      ) : null}

      <Text style={{ ...S.muted, fontSize: 8, marginBottom: 14 }}>
        The endpoint this report measures against is not maximum AI use. It is human capability
        strengthened through intelligent use of AI: judgment, agency, independent capability, learning
        transfer and responsible use. The best employee is not the person using the most AI.
      </Text>

      {/*
        The cover used to stop here, leaving the lower half of the page blank.
        These are the four figures a reader looks for before opening anything,
        drawn rather than only printed, so the cover answers something on its
        own instead of introducing a report that answers it three pages later.
      */}
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {[
          [String(g.centre.stage), 'the stage holding most of your people', g.centre.stageName],
          [`${g.headline.healthyAdoption.n} of ${g.n}`, 'meet all four conditions for healthy adoption',
            'use, judgment, boundaries and independence'],
          [String(g.dimensions.filter((d) => d.polarised).length), 'capabilities split in two',
            'where one shared session serves neither half'],
          [g.consistency.label, 'workforce consistency',
            `the middle half spans ${Math.round(g.consistency.widthOfMiddleHalf)} points`],
        ].map(([fig, label, note]) => (
          <View key={label} style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 24, color: T.oxblood }}>{fig}</Text>
            <View style={{ height: 2, backgroundColor: T.gold, width: 26, marginVertical: 5 }} />
            <Text style={{ fontSize: 7.4, color: T.ink, marginBottom: 2 }}>{label}</Text>
            <Text style={{ fontSize: 6.6, color: T.mute, lineHeight: 1.35 }}>{note}</Text>
          </View>
        ))}
      </View>

      {/*
        The full ten stage route was tried here and pushed the partnership strip
        on to a second page. A cover is one page. The index ruler carries the
        same reading in a fifth of the height, and chapter 3 draws the route.
      */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ ...S.muted, fontSize: 7, marginBottom: 4 }}>
          Where the middle of your workforce sits, on the scale every reading in this report uses
        </Text>
        <SceneView scene={rangeScene({
          width: w - 88, title: '', quiet: true,
          median: g.index.median, q1: g.index.q1, q3: g.index.q3,
          min: g.index.min, max: g.index.max, n: g.n,
          stageMarks: STAGES.filter((st) => st.stage % 2 === 1)
            .map((st) => ({ at: st.minIndex, label: `stage ${st.stage}` })),
        })} />
      </View>

      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 5, paddingVertical: 9,
        paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 6 }}>
        {ECOSYSTEM.map((o) => (
          <Link key={o.name} src={o.url} style={{ textDecoration: 'none' }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={ORG(o.logo)} style={{ width: o.pdfW * 0.78, height: (o.pdfW * 0.78 * o.h) / o.w }} />
          </Link>
        ))}
      </View>
      <Text style={{ ...S.muted, fontSize: 7, marginTop: 6 }}>
        {BRAND.poweredBy} · {BRAND.site}
      </Text>
    </View>
  );
}

export function Contents({ a, width }: { a: OrganisationReportAnalytics; width: number }) {
  const g = a.group;
  return (
    <View>
      <Text style={S.eyebrow}>Contents</Text>
      <Text style={S.h1}>What is in this report, and what each chapter answers</Text>
      <Text style={{ ...S.muted, marginBottom: 12 }}>
        Twenty-two chapters, about {CHAPTER_META.reduce((s, c) => s + c.minutes, 0)} minutes end to end.
        Chapter 1 alone takes a minute and carries the answer.
      </Text>
      {CHAPTER_META.map((c) => (
        <View key={c.number} wrap={false} style={{ flexDirection: 'row', paddingVertical: 4,
          borderTopWidth: 1, borderTopColor: T.hair }}>
          <Text style={{ fontFamily: 'PlexMono', fontSize: 7.4, color: T.gold, width: 22 }}>
            {String(c.number).padStart(2, '0')}
          </Text>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 8.6, color: T.ink }}>{c.title}</Text>
            <Text style={{ ...S.muted, fontSize: 7 }}>{c.question}</Text>
          </View>
          <Text style={{ fontFamily: 'PlexMono', fontSize: 6.8, color: T.mute, width: 42, textAlign: 'right' }}>
            {c.minutes} min
          </Text>
        </View>
      ))}
      <View style={{ marginTop: 14 }} wrap={false}>
        <Text style={{ ...S.muted, marginBottom: 6 }}>The visual language you will meet throughout:</Text>
        <SceneView scene={bandRulerScene(Math.min(width, 430))} />
        <SceneView scene={miniRouteScene(g.centre.stage, Math.min(width, 300))} />
      </View>
    </View>
  );
}

export function Appendix({ a }: { a: OrganisationReportAnalytics }) {
  const g = a.group;
  const Row = ({ k, v }: { k: string; v: string }) => (
    <View style={{ flexDirection: 'row', paddingVertical: 2.5, borderTopWidth: 1, borderTopColor: T.hair }}>
      <Text style={{ fontSize: 7.4, color: T.ink, width: 168 }}>{k}</Text>
      <Text style={{ fontSize: 7.2, color: T.mute, flex: 1 }}>{v}</Text>
    </View>
  );
  return (
    <View>
      <Text style={S.eyebrow}>Appendix</Text>
      <Text style={S.h1}>Method, definitions and limits</Text>

      <Text style={S.h2}>What produced these readings</Text>
      <Row k="Instrument" v={g.versions.instrument} />
      <Row k="Scoring rules" v={g.versions.scoring} />
      <Row k="Scenarios" v={g.versions.scenario} />
      <Row k="Language" v={g.versions.language} />
      <Row k="Comparability" v={g.provenance.note} />
      <Row k="Attempts rule" v={g.cohort.attemptsRule} />
      <Row k="Generated" v={dateOf(g.generatedAt)} />

      <Text style={{ ...S.h2, marginTop: 12 }}>The bands, as four classifications</Text>
      <Row k="Strength" v={`${g.bands.strength} and above`} />
      <Row k="Developing" v={`${g.bands.watch} to ${g.bands.strength - 0.1}`} />
      <Row k="Watch" v={`below ${g.bands.watch}`} />
      <Row k="Vulnerability line" v={`${g.bands.vulnerability} and below, which crosses the bands rather than dividing them`} />

      <Text style={{ ...S.h2, marginTop: 12 }}>Direction, and the one display transform</Text>
      <Text style={S.muted}>
        Every dimension in this report is plotted from the canonical score, on which higher is healthier
        without exception. The reliance construct is stored as Independent Capability and displayed under that
        name. Two composites genuinely run the other way and are labelled in bold wherever they appear. Two
        names that are not the same thing: Dependency Risk is a dimension, and the dependency index is a
        composite across several dimensions.
      </Text>

      <Text style={{ ...S.h2, marginTop: 12 }}>Every other name these capabilities answer to</Text>
      {CONSTRUCT_IDS.map((id) => (
        <Row key={id} k={DIMENSIONS[id].executiveName}
          v={[DIMENSIONS[id].canonicalName, ...aliasesFor(id).map((x) => x.name)]
            .filter((n, i, arr) => arr.indexOf(n) === i).join(' · ')} />
      ))}

      <Text style={{ ...S.h2, marginTop: 12 }}>Privacy and sample limits</Text>
      <Row k="Minimum for a report" v={`${GROUP.minimumForReport} respondents`} />
      <Row k="Stronger caveat below" v={`${GROUP.strongCaveatBelow} respondents`} />
      <Row k="Segment cuts" v={`${SUPPRESSION.descriptive} or more, and withheld when the remainder would fall below that`} />
      <Row k="Sensitive cuts" v={`${SUPPRESSION.sensitive} or more. None is currently collected.`} />
      <Row k="Intervals and correlations" v={`not reported below ${INFERENCE_FLOOR} respondents`} />
      <Row k="Cuts withheld in this report"
        v={a.privacyState.filter((p) => p.state === 'withheld').map((p) => p.cut).join('; ') || 'none'} />

      <Text style={{ ...S.h2, marginTop: 12 }}>Derived readings, in plain words</Text>
      <Row k="Healthy adoption" v="Regular or deliberately selective use, with judgment, the line held, and independent capability all at 65 or above." />
      <Row k="Lean" v="The underexposure composite read against the dependency index, by the same rule each individual report uses." />
      <Row k="Readiness against protection" v="Future readiness at 65 or above, against all three protection criteria at 65 or above." />
      <Row k="Developmental cohort" v="One per person, assigned by stage and by the capability acting as their constraint. Never by demographic." />
      <Row k="Priority score" v="Reach on one axis; urgency, gate role and vulnerability count on the other. No monetary weighting." />
      <Row k="Workforce consistency" v="The width of the middle half, in points. The standard deviation is below." />
      <Row k="Standard deviation" v={String(g.index.sd)} />

      <View style={{ borderTopWidth: 1, borderTopColor: T.hair, marginTop: 14, paddingTop: 10 }}>
        <Text style={{ ...S.muted, marginBottom: 8 }}>
          These are assessment indices built from self reported answers, aggregated across a group.
          They are designed to support planning and reflection. They are not a clinical diagnosis, a
          psychological evaluation, or a validated psychometric measurement, and they must not be used
          to rank, appraise or select individuals.
        </Text>
        <Text style={{ ...S.muted }}>
          {NEXT_STEP.line} <Link src={NEXT_STEP.url} style={{ color: T.oxblood }}>{NEXT_STEP.label}</Link>
        </Text>
      </View>
    </View>
  );
}

/**
 * The cover, the visual contents and the appendix.
 */

import React from 'react';
import { View, Text, Image, Link, Svg, Circle } from '@react-pdf/renderer';
import { S, TOKENS as T } from '../kit/blocks';
import { SceneView } from '../render/pdf';
import { CHAPTER_META } from './registry';
import { miniRouteScene, bandRulerScene } from '../charts/guide';
import { LETTER, SAFE, RAIL_SAFE, BrandMark, ART } from '@/lib/covers/kit';
import type { OrgProfile } from '@/lib/orgProfile';
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

/**
 * The cover.
 *
 * Built on the cover language the product already owns: a terracotta ground, a
 * full height artwork panel on the right, the organisation's own mark where the
 * assessment's mark sits on an individual report, and the gold serif title. The
 * first version of this page was a plain document header that stopped halfway
 * down, which looked like a draft beside every other cover the platform
 * produces.
 *
 * Four figures sit under the title, so the cover answers something on its own
 * rather than only introducing a report that answers it three pages later.
 */
export function Cover({ a, w, h, profile }: {
  a: OrganisationReportAnalytics; w: number; h: number; profile?: OrgProfile | null;
}) {
  const g = a.group;
  const frameL = w * 0.44;
  const TITLE_BOX = frameL - SAFE - 16;
  const title = (profile?.coverTitle || '').trim() || g.label;
  const subtitle = (profile?.coverSubtitle || '').trim()
    || 'What kind of AI workforce you have, where you are strong, where you are exposed, '
      + 'what is preventing readiness, and what to do next.';
  const longestWord = Math.max(...title.split(/\s+/).map((x) => x.length));
  const figures: Array<[string, string]> = [
    [String(g.centre.stage), `stage ${g.centre.stage}, ${g.centre.stageName}`],
    [`${g.headline.healthyAdoption.n} of ${g.n}`, 'meet the healthy adoption standard'],
    [String(g.dimensions.filter((d) => d.polarised).length), 'capabilities split in two'],
    [g.consistency.label, 'workforce consistency'],
  ];
  return (
    <>
      <View style={{ position: 'absolute', left: frameL, right: SAFE, top: h * 0.075, bottom: h * 0.235 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={ART('business.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>

      {/*
        The operating loop, the gesture this product's covers carry. Sized to
        the circle rather than to the sheet: a full page SVG is exactly the
        available height on A4, and react-pdf refused to place it, splitting the
        cover across two pages.
      */}
      {(() => {
        const r = w * 0.23, cx = w * 0.30, cy = h * 0.40;
        return (
          <Svg style={{ position: 'absolute', left: cx - r, top: cy - r }}
            width={r * 2 + 2} height={r * 2 + 2}>
            <Circle cx={r + 1} cy={r + 1} r={r}
              fill="none" stroke="#E9B96A" strokeOpacity={0.55} strokeWidth={1.1} />
          </Svg>
        );
      })()}

      <View style={{ position: 'absolute', left: SAFE, top: SAFE }}>
        {profile?.logo ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 4, padding: 8, width: 148, height: 62,
            alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={profile.logo} style={{ maxWidth: 132, maxHeight: 46, objectFit: 'contain' }} />
          </View>
        ) : (
          <BrandMark tint={T.paper} subdued="rgba(246,237,228,0.72)" />
        )}
      </View>
      <View style={{ position: 'absolute', right: SAFE, top: SAFE, alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 8, letterSpacing: 1.6,
          textTransform: 'uppercase', color: 'rgba(246,237,228,0.92)' }}>
          Organisational Report
        </Text>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 6.6, letterSpacing: 1.2,
          textTransform: 'uppercase', color: 'rgba(246,237,228,0.6)', marginTop: 4 }}>
          AI readiness and human advantage
        </Text>
      </View>

      <View style={{ position: 'absolute', left: SAFE, top: 142, width: TITLE_BOX }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 8, letterSpacing: 1.5,
          textTransform: 'uppercase', color: 'rgba(246,237,228,0.72)', marginBottom: 12 }}>
          Prepared for
        </Text>
        <Text style={{
          fontFamily: 'SourceSerif', fontWeight: 600, color: '#E9B96A', lineHeight: 1.04,
          // Sized by the longest word as well as by the whole line: a single
          // long word cannot wrap, so it is what actually decides the fit.
          fontSize: Math.min(
            title.length > 30 ? 30 : title.length > 18 ? 38 : 46,
            Math.max(20, Math.floor(TITLE_BOX / (0.58 * longestWord))),
          ),
        }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 10.5, lineHeight: 1.5, color: 'rgba(246,237,228,0.9)', marginTop: 14 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* What the report says, before it is opened. */}
      <View style={{ position: 'absolute', left: SAFE, bottom: 214, width: TITLE_BOX }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 7.5, letterSpacing: 1.4,
          textTransform: 'uppercase', color: 'rgba(246,237,228,0.74)', marginBottom: 9 }}>
          Read across {g.n} {g.n === 1 ? 'person' : 'people'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {figures.map(([fig, label]) => (
            <View key={label} style={{ width: '50%', paddingRight: 8, marginBottom: 9 }}>
              <Text style={{ fontFamily: 'SourceSerif', fontWeight: 600, fontSize: 21, color: '#FFFFFF' }}>{fig}</Text>
              <Text style={{ fontSize: 6.8, lineHeight: 1.35, color: 'rgba(246,237,228,0.78)' }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {g.cohort.smallCohort ? (
        <View style={{ position: 'absolute', left: SAFE, bottom: 186, width: TITLE_BOX }}>
          <Text style={{ fontSize: 7.4, lineHeight: 1.4, color: 'rgba(246,237,228,0.82)' }}>
            A small group. Every figure is indicative, all segment cuts are withheld, and the shape of
            the workforce matters more here than any single number.
          </Text>
        </View>
      ) : null}

      <View style={{ position: 'absolute', left: SAFE, right: SAFE, bottom: 104 }}>
        <Text style={{ fontFamily: 'PlexMono', fontSize: 7, letterSpacing: 1.4,
          textTransform: 'uppercase', color: 'rgba(246,237,228,0.74)', marginBottom: 8 }}>
          In partnership with
        </Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 5, paddingVertical: 9,
          paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
          ['Window', `${dateOf(g.window.first)} to ${dateOf(g.window.last)}`],
          ['Assessments', g.personas.map((x) => `${x.label} (${x.n})`).join(', ')],
          ['Access', BRAND.site]].map(([k, v]) => (
          <View key={k} style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: 'PlexMono', fontSize: 6.5, letterSpacing: 1.2,
              textTransform: 'uppercase', color: 'rgba(246,237,228,0.72)', marginBottom: 3 }}>{k}</Text>
            <Text style={{ fontSize: 8, fontWeight: 600, color: T.paper }}>{v}</Text>
          </View>
        ))}
      </View>
    </>
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

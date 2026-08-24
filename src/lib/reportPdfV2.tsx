/**
 * Formation Compass v2 report PDF.
 *
 * Layout only. Every word in this file that a respondent reads comes from the
 * narrative engine via generateReportSections(); nothing here writes prose
 * about a respondent. Blocks are marked wrap={false} so a content block is
 * never split across a page boundary.
 */
import React from 'react';
import path from 'path';
import {
  Page, Document, Font, StyleSheet, Text, View, Svg, Circle, Line, Polygon, Rect,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  generateReportSections, reportHead, confidenceLabel, REPORT_DISCLAIMER,
  type CompassResult, type ReportSection,
} from '@/engine';
import { CONSTRUCTS, STAGES } from '@/engine/config';
import type { ConstructId } from '@/engine/types';

const PAGE = { w: 595.28, h: 841.89 };
const M = 48;
const CW = PAGE.w - M * 2;

const T = {
  navy: '#1B2A4A',
  teal: '#00D4AA',
  paper: '#FCFAF6',
  ink: '#23303F',
  mute: '#6C7787',
  hair: '#DCE1E8',
  ivory: '#F2E8DC',
  hairDark: 'rgba(242,232,220,0.24)',
  muteDark: 'rgba(242,232,220,0.66)',
};

const fontPath = (f: string) => path.join(process.cwd(), 'src', 'fonts', f);
Font.register({
  family: 'Spectral',
  fonts: [
    { src: fontPath('Spectral-Regular.ttf'), fontWeight: 400 },
    { src: fontPath('Spectral-Medium.ttf'), fontWeight: 500 },
    { src: fontPath('Spectral-SemiBold.ttf'), fontWeight: 600 },
    { src: fontPath('Spectral-Bold.ttf'), fontWeight: 700 },
    { src: fontPath('Spectral-ExtraBold.ttf'), fontWeight: 800 },
  ],
});
Font.register({
  family: 'Plex',
  fonts: [
    { src: fontPath('IBMPlexMono-Regular.ttf'), fontWeight: 400 },
    { src: fontPath('IBMPlexMono-Medium.ttf'), fontWeight: 500 },
    { src: fontPath('IBMPlexMono-SemiBold.ttf'), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((w) => [w]);

const S = StyleSheet.create({
  light: {
    backgroundColor: T.paper, color: T.ink,
    paddingTop: 42, paddingBottom: 46, paddingHorizontal: M, fontFamily: 'Spectral',
  },
  dark: {
    backgroundColor: T.navy, color: T.ivory,
    paddingTop: 42, paddingBottom: 46, paddingHorizontal: M, fontFamily: 'Spectral',
  },
  eyebrow: {
    fontFamily: 'Plex', fontWeight: 500, fontSize: 8, letterSpacing: 1.4,
    textTransform: 'uppercase', color: T.mute, marginBottom: 6,
  },
  h2: { fontFamily: 'Spectral', fontWeight: 700, fontSize: 17, color: T.navy, marginBottom: 8 },
  h3: {
    fontFamily: 'Plex', fontWeight: 600, fontSize: 8.5, letterSpacing: 1.1,
    textTransform: 'uppercase', color: T.teal, marginTop: 10, marginBottom: 4,
  },
  body: { fontSize: 10, lineHeight: 1.55, color: T.ink, marginBottom: 6 },
  quote: {
    fontSize: 9.5, lineHeight: 1.5, color: T.mute,
    borderLeft: `2pt solid ${T.teal}`, paddingLeft: 9, marginBottom: 6,
  },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 12, fontSize: 10, color: T.teal },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.5, color: T.ink },
  rule: { borderBottom: `0.6pt solid ${T.hair}`, marginVertical: 12 },
  section: { marginBottom: 12 },
  foot: {
    position: 'absolute', bottom: 22, left: M, right: M,
    fontFamily: 'Plex', fontSize: 7.5, color: T.mute,
    flexDirection: 'row', justifyContent: 'space-between',
  },
});

/* ------------------------------------------------------------ inline text */

/** Render the engine's **bold** and *italic* markers as PDF text runs. */
function runs(line: string, bold = false) {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(<Text key={`t${i}`}>{line.slice(last, m.index)}</Text>);
    if (m[1] !== undefined) {
      out.push(<Text key={`b${i}`} style={{ fontWeight: 700 }}>{m[1]}</Text>);
    } else {
      out.push(<Text key={`i${i}`} style={{ fontWeight: 500 }}>{m[2]}</Text>);
    }
    last = m.index + m[0].length; i++;
  }
  if (last < line.length) out.push(<Text key={`t${i}`}>{line.slice(last)}</Text>);
  return <Text style={bold ? { fontWeight: 700 } : undefined}>{out}</Text>;
}

/** The engine's small markdown subset, as PDF blocks. */
function Lines({ lines }: { lines: string[] }) {
  const blocks: React.ReactNode[] = [];
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line) return;
    if (line.startsWith('### ')) {
      blocks.push(<Text key={i} style={S.h3}>{line.slice(4).replace(/\*/g, '')}</Text>);
    } else if (line.startsWith('- ')) {
      blocks.push(
        <View key={i} style={S.bullet}>
          <Text style={S.bulletDot}>{'•'}</Text>
          <Text style={S.bulletText}>{runs(line.slice(2))}</Text>
        </View>
      );
    } else if (line.startsWith('> ')) {
      blocks.push(<Text key={i} style={S.quote}>{runs(line.slice(2))}</Text>);
    } else {
      blocks.push(<Text key={i} style={S.body}>{runs(line)}</Text>);
    }
  });
  return <>{blocks}</>;
}

function SectionBlock({ s }: { s: ReportSection }) {
  return (
    <View style={S.section} wrap={false}>
      <Text style={S.eyebrow}>Section {s.n}</Text>
      <Text style={S.h2}>{s.title}</Text>
      <Lines lines={s.lines} />
    </View>
  );
}

/* --------------------------------------------------------------- graphics */

function StripSvg({ r }: { r: CompassResult }) {
  const W = CW; const H = 104; const padX = 12; const y = 46;
  const tw = W - padX * 2;
  const xOf = (i: number) => padX + (Math.max(0, Math.min(100, i)) / 100) * tw;
  const marker = xOf(r.stage.rawIndex);
  const here = STAGES.find((st) => st.stage === r.stage.stage)!;
  const next = STAGES.find((st) => st.stage === r.stage.stage + 1);
  const bandX1 = xOf(here.minIndex);
  const bandX2 = xOf(next ? next.minIndex : 100);

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={T.navy} rx={8} />

      {/* the stage band actually occupied, so a gated marker is not misread */}
      <Rect x={bandX1} y={y - 13} width={Math.max(4, bandX2 - bandX1)} height={26}
        fill={T.teal} fillOpacity={0.16} rx={3} />

      <Line x1={padX} y1={y} x2={W - padX} y2={y} stroke={T.hairDark} strokeWidth={1} />

      {STAGES.map((st) => {
        const x = xOf(st.minIndex);
        const isHere = st.stage === r.stage.stage;
        return (
          <React.Fragment key={st.stage}>
            <Line x1={x} y1={y - 6} x2={x} y2={y + 6}
              stroke={isHere ? T.teal : T.hairDark} strokeWidth={1} />
            <Text x={x - 2} y={y + 20} style={{ fontFamily: 'Plex', fontSize: 6.5 }}
              fill={isHere ? T.teal : T.muteDark}>
              {String(st.stage)}
            </Text>
          </React.Fragment>
        );
      })}

      {/* index marker: hollow when gating means it overstates the placement */}
      <Line x1={marker} y1={y - 15} x2={marker} y2={y + 9} stroke={T.teal} strokeWidth={1.3} />
      <Circle cx={marker} cy={y} r={4}
        fill={r.stage.gated ? T.navy : T.teal} stroke={T.teal} strokeWidth={1.3} />

      <Text x={padX} y={H - 8} style={{ fontFamily: 'Plex', fontSize: 7 }} fill={T.muteDark}>
        {r.stage.gated
          ? `Index ${r.stage.rawIndex} would reach stage ${r.stage.gated.cappedFrom}. Held at stage ${r.stage.stage}, see section 2.`
          : `Shaded band is stage ${r.stage.stage}. Marker is your index, ${r.stage.rawIndex}.`}
      </Text>
    </Svg>
  );
}

function RadarSvg({ r }: { r: CompassResult }) {
  const ids = Object.keys(CONSTRUCTS) as ConstructId[];
  const size = 210; const c = size / 2; const R = 72; const n = ids.length;
  const pt = (i: number, rad: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * rad, c + Math.sin(a) * rad] as const;
  };
  const val = (id: ConstructId) =>
    CONSTRUCTS[id].reportedAsRisk ? r.dimensions[id].reportedScore : r.dimensions[id].score;
  const poly = ids.map((id, i) => pt(i, (val(id) / 100) * R).join(',')).join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={T.navy} rx={8} />
      {[0.33, 0.66, 1].map((f) => (
        <Polygon key={f} points={ids.map((_, i) => pt(i, R * f).join(',')).join(' ')}
          fill="none" stroke={T.hairDark} strokeWidth={0.7} />
      ))}
      <Polygon points={poly} fill={T.teal} fillOpacity={0.18} stroke={T.teal} strokeWidth={1.2} />
    </Svg>
  );
}

/* ----------------------------------------------------------------- pages */

const Footer = () => (
  <View style={S.foot} fixed>
    <Text>Neogogy Formation Compass</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
  </View>
);

function Cover({ r, name, dateStr }: { r: CompassResult; name: string; dateStr: string }) {
  const head = reportHead(r);
  return (
    <Page size="A4" style={S.dark}>
      <View style={{ flexGrow: 1, justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, letterSpacing: 1.6, textTransform: 'uppercase', color: T.teal, marginBottom: 14 }}>
          {head.title}
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 34, color: T.ivory, lineHeight: 1.12 }}>
          {r.archetype.name}
        </Text>
        <Text style={{ fontSize: 12, color: T.muteDark, marginTop: 10, lineHeight: 1.5 }}>
          {r.archetype.tagline}
        </Text>
        <View style={{ height: 1, backgroundColor: T.hairDark, marginVertical: 22 }} />
        <Text style={{ fontFamily: 'Plex', fontSize: 9.5, color: T.ivory, marginBottom: 5 }}>
          Stage {r.stage.stage} of 10, {r.stage.stageName}
        </Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 9.5, color: T.muteDark, marginBottom: 5 }}>
          Developmental index {r.stage.rawIndex} ({r.stage.substage})
        </Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 9.5, color: T.muteDark }}>
          {confidenceLabel(r.overallConfidence)}
        </Text>
        <View style={{ marginTop: 26 }}>
          <StripSvg r={r} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: T.muteDark }}>{name || 'Your report'}</Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: T.muteDark }}>{dateStr}</Text>
      </View>
    </Page>
  );
}

export async function generateCompassPdf(args: {
  result: CompassResult;
  name?: string;
}): Promise<Buffer> {
  const { result: r, name = '' } = args;
  const sections = generateReportSections(r);
  const byKey = (k: string) => sections.find((s) => s.key === k)!;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = (
    <Document title="Neogogy Formation Compass" author="International Center for Applied Neogogy">
      <Cover r={r} name={name} dateStr={dateStr} />

      {/*
        One flowing light page. react-pdf paginates it, and every content block
        is wrap={false}, so blocks move whole to the next page rather than
        splitting. Pagination is therefore driven by content length instead of
        by fixed page assignments, which is what keeps pages full.
      */}
      <Page size="A4" style={S.light} wrap>
        <SectionBlock s={byKey('profile')} />

        <View style={S.section}>
          {/* the heading and its graphic stay welded; the prose after may flow */}
          <View wrap={false}>
            <Text style={S.eyebrow}>Section 2</Text>
            <Text style={S.h2}>{byKey('continuum').title}</Text>
            <View style={{ marginBottom: 10 }}><StripSvg r={r} /></View>
          </View>
          <Lines lines={byKey('continuum').lines} />
        </View>

        <View style={S.section}>
          <View wrap={false}>
            <Text style={S.eyebrow}>Section 3</Text>
            <Text style={S.h2}>{byKey('signature').title}</Text>
            <View style={{ alignItems: 'center', marginBottom: 8 }}><RadarSvg r={r} /></View>
            <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: T.mute, textAlign: 'center', marginBottom: 10 }}>
              Dependency Risk is plotted as risk, so lower is healthier on that spoke.
            </Text>
          </View>
          <Lines lines={byKey('signature').lines} />
        </View>

        <SectionBlock s={byKey('helping')} />
        <SectionBlock s={byKey('harming')} />
        <SectionBlock s={byKey('strengths')} />
        <SectionBlock s={byKey('selfKnowledge')} />
        <SectionBlock s={byKey('bottleneck')} />
        <SectionBlock s={byKey('nextStage')} />

        <View style={S.section}>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={S.eyebrow}>Section 10</Text>
            <Text style={S.h2}>{byKey('roadmap').title}</Text>
          </View>
          {r.recommendations.map((rec, i) => (
            <View key={i} style={{ marginBottom: 12 }} wrap={false}>
              <Text style={S.h3}>{rec.capability} ({rec.priority})</Text>
              <Text style={S.body}><Text style={{ fontWeight: 700 }}>Change: </Text>{rec.behaviorChange}</Text>
              <Text style={S.body}><Text style={{ fontWeight: 700 }}>Practice: </Text>{rec.practice}</Text>
              <Text style={S.body}><Text style={{ fontWeight: 700 }}>Progress looks like: </Text>{rec.evidenceOfProgress}</Text>
              <Text style={S.body}><Text style={{ fontWeight: 700 }}>Watch for: </Text>{rec.riskToMonitor}</Text>
            </View>
          ))}
        </View>

        <Footer />
      </Page>

      {/* Closing */}
      <Page size="A4" style={S.dark}>
        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 8.5, letterSpacing: 1.4, textTransform: 'uppercase', color: T.teal, marginBottom: 10 }}>
            Section 11
          </Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 20, color: T.ivory, marginBottom: 14 }}>
            {byKey('experiment').title}
          </Text>
          {byKey('experiment').lines.filter(Boolean).map((l, i) => (
            <Text key={i} style={{ fontSize: 11, lineHeight: 1.6, color: T.muteDark, marginBottom: 8 }}>{l}</Text>
          ))}
          <View style={{ height: 1, backgroundColor: T.hairDark, marginVertical: 22 }} />
          <Text style={{ fontSize: 9, lineHeight: 1.55, color: T.muteDark }}>{REPORT_DISCLAIMER}</Text>
        </View>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: T.muteDark }}>
          International Center for Applied Neogogy · www.ican.ph
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

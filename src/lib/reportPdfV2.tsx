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
  Page, Document, Font, StyleSheet, Text, View, Svg, Circle, Line, Polygon, Rect, Image,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  generateReportSections, reportHead, confidenceLabel, REPORT_DISCLAIMER,
  dimensionDetails, fingerprintReadings, improvementPlan,
  type CompassResult, type ReportSection, type DimensionDetail,
} from '@/engine';
import type { AttemptComparison } from '@/lib/history';
import { CONSTRUCTS, STAGES } from '@/engine/config';
import type { ConstructId } from '@/engine/types';

const PAGE = { w: 595.28, h: 841.89 };
const M = 48;
const CW = PAGE.w - M * 2;

const T = {
  navy: '#2B2926',          // deep ink, used for the dark pages
  teal: '#159E88',
  oxblood: '#7D2730',
  paper: '#F5EFE5',
  card: '#FBF8F1',
  ink: '#2B2926',
  mute: '#746E64',
  hair: '#D7CEC0',
  ivory: '#F7F1E4',
  gold: '#E5AA45',
  hairDark: 'rgba(247,241,228,0.26)',
  muteDark: 'rgba(247,241,228,0.72)',
};

/** One colour scale, matching the web exactly. */
const bandColor = (healthy: number) =>
  healthy >= 65 ? '#159E88' : healthy >= 40 ? '#E5AA45' : '#CF796E';

/** The painted backdrop, shared with the web page. Decorative only. */
const BACKDROP = path.join(process.cwd(), 'public', 'ascent-backdrop.jpg');

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
  cover: {
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
  h2: { fontFamily: 'Spectral', fontWeight: 700, fontSize: 17, color: T.oxblood, marginBottom: 8 },
  h3: {
    fontFamily: 'Plex', fontWeight: 600, fontSize: 8.5, letterSpacing: 1.1,
    textTransform: 'uppercase', color: T.teal, marginTop: 10, marginBottom: 4,
  },
  body: { fontSize: 10, lineHeight: 1.55, color: T.ink, marginBottom: 6 },
  quote: {
    fontSize: 9.5, lineHeight: 1.5, color: T.mute,
    borderLeft: `2pt solid ${T.gold}`, paddingLeft: 9, marginBottom: 6,
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

/** Lines before the first sub-heading. */
function introOnly(lines: string[]): string[] {
  const at = lines.findIndex((l) => l.startsWith('### '));
  return at === -1 ? lines : lines.slice(0, at);
}

/** Lines up to a marker, where a chart replaces the prose below it. */
function upTo(lines: string[], marker: string): string[] {
  const at = lines.findIndex((l) => l.includes(marker));
  return at === -1 ? lines : lines.slice(0, at);
}

function SectionBlock({ s }: { s: ReportSection }) {
  // The heading stays with the start of its prose (minPresenceAhead), but the
  // prose itself flows. Sections are long enough now that making the whole
  // section atomic would strand pages rather than protect blocks.
  return (
    <View style={S.section}>
      <View wrap={false} minPresenceAhead={70}>
          <Text style={S.h2}>{s.title}</Text>
      </View>
      <Lines lines={s.lines} />
    </View>
  );
}

/* --------------------------------------------------------------- graphics */

function StripSvg({ r }: { r: CompassResult }) {
  const W = CW; const H = 78; const padX = 12; const y = 34;
  const tw = W - padX * 2;
  const xOf = (i: number) => padX + (Math.max(0, Math.min(100, i)) / 100) * tw;
  const marker = xOf(r.stage.rawIndex);
  const here = STAGES.find((st) => st.stage === r.stage.stage)!;
  const next = STAGES.find((st) => st.stage === r.stage.stage + 1);
  const bandX1 = xOf(here.minIndex);
  const bandX2 = xOf(next ? next.minIndex : 100);

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={T.card} rx={8} stroke={T.hair} strokeWidth={1} />

      {/* the stage band actually occupied, so a gated marker is not misread */}
      <Rect x={bandX1} y={y - 11} width={Math.max(4, bandX2 - bandX1)} height={22}
        fill={T.teal} fillOpacity={0.16} rx={3} />

      <Line x1={padX} y1={y} x2={W - padX} y2={y} stroke={T.hair} strokeWidth={1} />

      {STAGES.map((st) => {
        const x = xOf(st.minIndex);
        const isHere = st.stage === r.stage.stage;
        return (
          <React.Fragment key={st.stage}>
            <Line x1={x} y1={y - 6} x2={x} y2={y + 6}
              stroke={isHere ? T.teal : T.hair} strokeWidth={1} />
            <Text x={x - 2} y={y + 17} style={{ fontFamily: 'Plex', fontSize: 6.5 }}
              fill={isHere ? T.teal : T.mute}>
              {String(st.stage)}
            </Text>
          </React.Fragment>
        );
      })}

      {/* index marker: hollow when gating means it overstates the placement */}
      <Line x1={marker} y1={y - 13} x2={marker} y2={y + 8} stroke={T.teal} strokeWidth={1.3} />
      <Circle cx={marker} cy={y} r={4}
        fill={r.stage.gated ? T.card : T.teal} stroke={T.teal} strokeWidth={1.3} />

      <Text x={padX} y={H - 6} style={{ fontFamily: 'Plex', fontSize: 7 }} fill={T.mute}>
        {r.stage.gated
          ? `Index ${r.stage.rawIndex} would reach stage ${r.stage.gated.cappedFrom}. Held at stage ${r.stage.stage}, see section 2.`
          : `Shaded band is stage ${r.stage.stage}. Marker is your index, ${r.stage.rawIndex}.`}
      </Text>
    </Svg>
  );
}

function RadarSvg({ r }: { r: CompassResult }) {
  const ids = Object.keys(CONSTRUCTS) as ConstructId[];
  const size = 190; const c = size / 2; const R = 66; const n = ids.length;
  const pt = (i: number, rad: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * rad, c + Math.sin(a) * rad] as const;
  };
  const val = (id: ConstructId) =>
    CONSTRUCTS[id].reportedAsRisk ? r.dimensions[id].reportedScore : r.dimensions[id].score;
  const poly = ids.map((id, i) => pt(i, (val(id) / 100) * R).join(',')).join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={T.card} rx={8} stroke={T.hair} strokeWidth={1} />
      {[0.33, 0.66, 1].map((f) => (
        <Polygon key={f} points={ids.map((_, i) => pt(i, R * f).join(',')).join(' ')}
          fill="none" stroke={T.hair} strokeWidth={0.7} />
      ))}
      <Polygon points={poly} fill={T.teal} fillOpacity={0.18} stroke={T.teal} strokeWidth={1.2} />
    </Svg>
  );
}

/* --------------------------------------------- charts, mirroring the web */

/** The full ten stage ladder, as on the results page. */
function Ladder({ r }: { r: CompassResult }) {
  const here = r.stage.stage;
  const next = r.nextTarget.stage;
  return (
    <View style={{ borderRadius: 8, borderWidth: 1, borderColor: T.hair, backgroundColor: T.card, padding: 10 }}>
      {[...STAGES].reverse().map((s) => {
        const isHere = s.stage === here;
        const isNext = s.stage === next && next !== here;
        const reached = r.stage.rawIndex >= s.minIndex;
        return (
          <View key={s.stage} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={{ fontFamily: 'Plex', fontSize: 7, color: T.mute, width: 14, textAlign: 'right', marginRight: 6 }}>
              {s.stage}
            </Text>
            <View style={{
              width: isHere ? 9 : 6, height: isHere ? 9 : 6, borderRadius: 5, marginTop: 2, marginRight: 8,
              backgroundColor: isHere ? T.teal : reached ? T.teal : T.hair,
              opacity: isHere || reached ? 1 : 0.7,
            }} />
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'Spectral', fontSize: isHere ? 9.5 : 8.5,
                fontWeight: isHere ? 700 : 400,
                color: isHere ? T.oxblood : reached ? T.ink : T.mute,
              }}>
                {s.name}
                {isHere ? '   YOU ARE HERE' : isNext ? '   NEXT LEDGE' : ''}
              </Text>
              {(isHere || isNext) ? (
                <Text style={{ fontSize: 7.5, color: T.mute, marginTop: 1 }}>{s.short}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Sorted dimension bars with the shared colour key. */
function Bars({ r }: { r: CompassResult }) {
  const rows = (Object.keys(CONSTRUCTS) as ConstructId[])
    .map((id) => ({ id, d: r.dimensions[id], def: CONSTRUCTS[id] }))
    .sort((a, b) => b.d.score - a.d.score);
  return (
    <View>
      {rows.map(({ id, d, def }) => {
        const shown = def.reportedAsRisk ? d.reportedScore : d.score;
        const col = bandColor(d.score);
        return (
          <View key={id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3.5 }}>
            <Text style={{ fontSize: 8, width: 118, color: T.ink }}>
              {def.reportedAsRisk ? 'Dependency Risk' : def.name}
            </Text>
            <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: '#EDE5D7' }}>
              <View style={{ width: `${Math.max(2, shown)}%`, height: 7, borderRadius: 4, backgroundColor: col }} />
            </View>
            <Text style={{ fontFamily: 'Plex', fontSize: 8, width: 30, textAlign: 'right', color: col }}>{shown}</Text>
          </View>
        );
      })}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {[['#159E88', 'strong 65+'], ['#E5AA45', 'developing 40 to 64'], ['#CF796E', 'watch below 40']].map(([c, l]) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: c, marginRight: 4 }} />
            <Text style={{ fontFamily: 'Plex', fontSize: 6.5, color: T.mute }}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** The six composite readings as cards. */
function Composites({ r }: { r: CompassResult }) {
  const c = r.composites;
  const rows: Array<[string, number, number, string]> = [
    ['Future readiness', c.futureReadiness, c.futureReadiness, 'Fluency, adaptability and transfer'],
    ['Augmentation', c.augmentation, c.augmentation, 'Better thinking, not just faster output'],
    ['Judgment', c.judgment, c.judgment, 'Verification, agency and responsible use'],
    ['Capability transfer', c.capabilityTransfer, c.capabilityTransfer, 'Assisted work becoming your own'],
    ['Dependency index', c.dependencyIndex, 100 - c.dependencyIndex, 'Higher means more depends on the tool'],
    ['Underexposure', c.underexposure, 100 - c.underexposure, 'Higher means limited practice'],
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {rows.map(([label, value, healthy, note]) => (
        <View key={label} style={{
          width: '31.5%', marginRight: '2.75%', marginBottom: 8,
          borderWidth: 1, borderColor: T.hair, borderRadius: 8, padding: 8, backgroundColor: T.card,
        }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 15, color: bandColor(healthy) }}>{value}</Text>
          <Text style={{ fontSize: 8, fontWeight: 700, marginTop: 1 }}>{label}</Text>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: '#EDE5D7', marginTop: 4, marginBottom: 4 }}>
            <View style={{ width: `${Math.max(2, value)}%`, height: 4, borderRadius: 2, backgroundColor: bandColor(healthy) }} />
          </View>
          <Text style={{ fontSize: 6.8, color: T.mute, lineHeight: 1.35 }}>{note}</Text>
        </View>
      ))}
    </View>
  );
}

/** One dimension, drawn as the same card the web uses. */
function DimCard({ d }: { d: DimensionDetail }) {
  const col = bandColor(d.healthy);
  const state = d.microState === 'strong' ? 'STRENGTH'
    : d.microState === 'developing' ? 'DEVELOPING' : 'NEEDS ATTENTION';
  return (
    <View wrap={false} style={{
      borderWidth: 1, borderColor: T.hair, borderLeftWidth: 3, borderLeftColor: col,
      borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: T.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 17, color: col, width: 42 }}>{d.shown}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 10.5 }}>{d.label}</Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.5, letterSpacing: 0.8, color: col, marginTop: 1 }}>
            {state}{d.confidence !== 'high' ? `  ·  ${d.confidence.toUpperCase()}` : ''}
          </Text>
        </View>
      </View>

      {d.independentCapability !== undefined ? (
        <Text style={{ fontSize: 7.5, color: T.mute, marginBottom: 4 }}>
          Lower is healthier here. Independent capability {d.independentCapability}.
        </Text>
      ) : null}

      {/* the same 45 and 65 scale as the web card */}
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#EDE5D7', marginBottom: 2 }}>
        <View style={{ width: `${Math.max(2, d.healthy)}%`, height: 6, borderRadius: 3, backgroundColor: col }} />
      </View>
      <Text style={{ fontFamily: 'Plex', fontSize: 6, color: T.mute, marginBottom: 5 }}>
        45 needs attention below · 65 strength above
      </Text>

      <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.7, color: T.teal }}>WHAT IT MEASURES</Text>
      <Text style={{ fontSize: 8, lineHeight: 1.45, marginBottom: 3 }}>{d.whatItMeasures}</Text>
      <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.7, color: T.teal }}>YOUR READING</Text>
      <Text style={{ fontSize: 8, lineHeight: 1.45, marginBottom: 3 }}>{d.reading}</Text>
      <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.7, color: T.teal }}>WHAT MOVES IT</Text>
      {d.practices.map((p, i) => (
        <Text key={i} style={{ fontSize: 7.6, lineHeight: 1.4, color: T.ink }}>{'\u2022  '}{p}</Text>
      ))}
    </View>
  );
}

/** The seven quick readings as meters. */
function Fingerprint({ r }: { r: CompassResult }) {
  const pos = (lvl: string) => {
    const l = lvl.toLowerCase();
    if (l === 'high' || l === 'strong') return 88;
    if (l === 'moderate' || l === 'stable') return 58;
    if (l === 'low-moderate') return 40;
    if (l === 'elevated') return 78;
    return 20;
  };
  return (
    <View style={{ marginTop: 4 }}>
      {fingerprintReadings(r).map((f) => {
        const p = pos(f.level);
        const healthy = /dependency/i.test(f.label) ? 100 - p : p;
        return (
          <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text style={{ fontSize: 8, width: 120 }}>{f.label}</Text>
            <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: '#EDE5D7' }}>
              <View style={{ width: `${p}%`, height: 6, borderRadius: 3, backgroundColor: bandColor(healthy) }} />
            </View>
            <Text style={{ fontFamily: 'Plex', fontSize: 6.5, width: 52, textAlign: 'right', color: bandColor(healthy) }}>
              {f.level.toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Movement since the previous attempt. */
function Comparison({ c }: { c: AttemptComparison }) {
  const up = c.indexDelta > 0;
  const flat = c.indexDelta === 0;
  const col = flat ? T.mute : up ? T.teal : '#CF796E';
  const moved = c.dimensions.filter((d) => d.delta !== 0);
  return (
    <View style={S.section} wrap={false}>
      <Text style={S.eyebrow}>Since your last ascent</Text>
      <Text style={S.h2}>
        {flat ? 'You are holding your position' : up ? 'You have climbed higher' : 'You have moved down the route'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ borderWidth: 1, borderColor: col, borderRadius: 8, padding: 8, marginRight: 12 }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 20, color: col }}>
            {up ? '+' : ''}{c.indexDelta}
          </Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.8, color: T.mute }}>INDEX CHANGE</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.body}>
            Attempt {c.attemptNumber}. Index {c.previousIndex} to {c.currentIndex}, stage{' '}
            {c.previousStage}. {c.previousStageName} to {c.currentStage}. {c.currentStageName}.
          </Text>
        </View>
      </View>
      {moved.slice(0, 6).map((d) => (
        <View key={d.construct} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 }}>
          <Text style={{ fontSize: 8, fontWeight: 700 }}>{d.name}</Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: d.improved ? T.teal : '#CF796E' }}>
            {d.previous} to {d.current}{d.reportedAsRisk ? '  (lower is healthier)' : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The three horizon plan. */
function Plan({ r }: { r: CompassResult }) {
  return (
    <View>
      {improvementPlan(r).map((b, i) => (
        <View key={b.horizon} wrap={false} style={{
          borderLeftWidth: 2, borderLeftColor: T.teal, paddingLeft: 10, marginBottom: 10,
        }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 11, color: T.oxblood }}>
            {i + 1}. {b.horizon}
          </Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.5, letterSpacing: 0.8, color: T.mute, marginBottom: 3 }}>
            {b.timeframe.toUpperCase()}
          </Text>
          {b.items.map((it, j) => (
            <Text key={j} style={{ fontSize: 8, lineHeight: 1.45, marginBottom: 2 }}>{'\u2022  '}{it}</Text>
          ))}
        </View>
      ))}
    </View>
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
    <Page size="A4" style={S.cover}>
      {/* the same painted illustration the web page uses. This is react-pdf's
          Image primitive, not a DOM img, so it has no alt prop. */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={BACKDROP} style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE.w, height: PAGE.h * 0.52 }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: PAGE.w, height: PAGE.h * 0.62, backgroundColor: T.paper, opacity: 0.55 }} />
      <View style={{ marginTop: 40 }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, letterSpacing: 1.6, textTransform: 'uppercase', color: T.teal, marginBottom: 12 }}>
          Neogogy · AI relationship assessment
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 40, color: T.oxblood, lineHeight: 1.06 }}>
          Your ascent with AI
        </Text>
        <Text style={{ fontSize: 11.5, color: T.mute, marginTop: 10, lineHeight: 1.55, maxWidth: 380 }}>
          A developmental reading of how AI currently supports, or starts to substitute for, your
          judgment, capability and creative agency. A journey, not a verdict.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 26 }}>
          <View style={{
            width: 96, height: 96, borderRadius: 48, backgroundColor: T.oxblood,
            alignItems: 'center', justifyContent: 'center', marginRight: 18,
          }}>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 26, color: T.ivory }}>
              {r.stage.rawIndex}
            </Text>
            <Text style={{ fontFamily: 'Plex', fontSize: 5.6, letterSpacing: 1, color: T.ivory, marginTop: 2 }}>
              DEVELOPMENTAL INDEX
            </Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 15, color: T.ink }}>
              Stage {r.stage.stage} of 10, {r.stage.stageName}
            </Text>
            <Text style={{ fontFamily: 'Plex', fontSize: 9, color: T.mute, marginTop: 4 }}>
              {r.stage.substage} · {confidenceLabel(r.overallConfidence)}
            </Text>
            <Text style={{ fontFamily: 'Spectral', fontSize: 10.5, color: T.mute, marginTop: 6, maxWidth: 230 }}>
              {r.archetype.name}. {r.archetype.tagline}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 26 }}>
          <StripSvg r={r} />
        </View>
      </View>

      {/* sits over the painted area, so it carries its own light plate */}
      <View style={{
        position: 'absolute', bottom: 30, left: M, right: M,
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: T.paper, opacity: 0.92,
        paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6,
      }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: T.ink }}>{name || 'Your report'}</Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: T.ink }}>{dateStr}</Text>
      </View>
    </Page>
  );
}

export async function generateCompassPdf(args: {
  result: CompassResult;
  name?: string;
  comparison?: AttemptComparison | null;
}): Promise<Buffer> {
  const { result: r, name = '', comparison = null } = args;
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
        <View style={S.section}>
          <View wrap={false} minPresenceAhead={70}>
            <Text style={S.eyebrow}>Your profile</Text>
            <Text style={S.h2}>{byKey('profile').title}</Text>
          </View>
          <Lines lines={upTo(byKey('profile').lines, 'The short version')} />
          <View wrap={false}>
            <Text style={S.h3}>The short version</Text>
            <Fingerprint r={r} />
          </View>
        </View>

        <View style={S.section}>
          <View wrap={false}>
            <Text style={S.eyebrow}>Where you are</Text>
            <Text style={S.h2}>{byKey('continuum').title}</Text>
            <View style={{ marginBottom: 10 }}><StripSvg r={r} /></View>
          </View>
          <View wrap={false} style={{ marginBottom: 10 }}><Ladder r={r} /></View>
          <Lines lines={byKey('continuum').lines} />
        </View>

        {comparison ? <Comparison c={comparison} /> : null}

        <View style={S.section}>
          <View wrap={false}>
            <Text style={S.eyebrow}>The full picture</Text>
            <Text style={S.h2}>{byKey('signature').title}</Text>
            <View style={{ marginBottom: 10 }}><Bars r={r} /></View>
          </View>
          <View wrap={false} style={{ alignItems: 'center', marginBottom: 6 }}>
            <RadarSvg r={r} />
            <Text style={{ fontFamily: 'Plex', fontSize: 7, color: T.mute, textAlign: 'center', marginBottom: 8 }}>
              Dependency Risk is plotted as risk, so lower is healthier on that spoke.
            </Text>
          </View>
          <View wrap={false} style={{ marginBottom: 8 }}><Composites r={r} /></View>
          <Lines lines={upTo(byKey('signature').lines, 'Each dimension, unpacked')} />
        </View>

        {/* the ten dimensions as cards, replacing ten blocks of prose */}
        <View style={S.section}>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={S.eyebrow}>Each dimension, unpacked</Text>
            <Text style={S.h2}>Your ten dimensions, worst first</Text>
          </View>
          {[...dimensionDetails(r)].sort((a, b) => a.healthy - b.healthy)
            .map((d) => <DimCard key={d.construct} d={d} />)}
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

        <View style={S.section}>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={S.eyebrow}>What to do</Text>
            <Text style={S.h2}>{byKey('plan').title}</Text>
          </View>
          <Lines lines={introOnly(byKey('plan').lines)} />
          <Plan r={r} />
        </View>

        <SectionBlock s={byKey('evidence')} />

        <Footer />
      </Page>

      {/* Closing */}
      <Page size="A4" style={S.cover}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={BACKDROP} style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE.w, height: PAGE.h * 0.42, opacity: 0.85 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, width: PAGE.w, height: PAGE.h * 0.6, backgroundColor: T.paper, opacity: 0.5 }} />
        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 8.5, letterSpacing: 1.4, textTransform: 'uppercase', color: T.teal, marginBottom: 10 }}>
            Section {byKey('experiment').n}
          </Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 22, color: T.oxblood, marginBottom: 14 }}>
            {byKey('experiment').title}
          </Text>
          {byKey('experiment').lines.filter(Boolean).map((l, i) => (
            <Text key={i} style={{ fontSize: 11, lineHeight: 1.6, color: T.ink, marginBottom: 8, maxWidth: 400 }}>{l}</Text>
          ))}
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 13, color: T.oxblood, marginTop: 16 }}>
            The summit is a direction, not a finish line.
          </Text>
          <View style={{ height: 1, backgroundColor: T.hair, marginVertical: 20 }} />
          <Text style={{ fontSize: 9, lineHeight: 1.55, color: T.mute, maxWidth: 400 }}>{REPORT_DISCLAIMER}</Text>
        </View>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: T.mute }}>
          International Center for Applied Neogogy · www.ican.ph
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

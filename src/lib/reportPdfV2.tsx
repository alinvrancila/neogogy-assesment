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
  Path, Text as SvgText, Defs, LinearGradient, Stop,
} from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  generateReportSections, reportHead, confidenceLabel, REPORT_DISCLAIMER,
  dimensionDetails, fingerprintReadings, improvementPlan,
  type CompassResult, type ReportSection, type DimensionDetail,
} from '@/engine';
import type { AttemptComparison } from '@/lib/history';
import { CONSTRUCTS, STAGES } from '@/engine/config';
import {
  constructName, reportedConstructName, constructContent, stageName, indexName, reportTitle,
  disclaimerExtra, dimensionScope, SCOPE_LABEL, SCOPE_BLURB,
} from '@/engine/display';
import {
  VIEW as MAP_VIEW, pointAtIndex, routePath, routeRidge,
  GATE_DEFS,
} from '@/components/compass/ascent/route';
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

/** Darker variants for type: the fill colours are not legible as text on cream. */
const bandTextColor = (healthy: number) =>
  healthy >= 65 ? '#0F7A69' : healthy >= 40 ? '#A9741F' : '#B4564A';

/** The painted backdrop, shared with the web page. Decorative only. */
const BACKDROP = path.join(process.cwd(), 'public', 'ascent-backdrop.jpg');
/** Dusk variant, used full bleed on the cover. Decorative only. */
const COVER_ART = path.join(process.cwd(), 'public', 'ascent-cover.jpg');
/** The chapel window, drawn procedurally by scripts/art/render-pastor-cover.mjs. */
const MINISTER_ART = path.join(process.cwd(), 'public', 'minister-cover.jpg');
/** The crimson dial, drawn by scripts/art/render-business-cover.mjs. */
const BUSINESS_ART = path.join(process.cwd(), 'public', 'business-cover.jpg');

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
    backgroundColor: '#14120F', color: T.ivory,
    fontFamily: 'Spectral',
  },
  closing: {
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
  gap: { height: 12 },
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

/** Drop bullet lines where the same items are drawn as cards. */
const withoutBullets = (lines: string[]) => lines.filter((l) => !l.trimStart().startsWith('- '));

/** Lines up to a marker, where a chart replaces the prose below it. */
function upTo(lines: string[], marker: string): string[] {
  const at = lines.findIndex((l) => l.includes(marker));
  return at === -1 ? lines : lines.slice(0, at);
}

function SectionBlock({ s }: { s: ReportSection }) {
  // The heading stays with the start of its prose (minPresenceAhead), but the
  // prose itself flows. Sections are long enough now that making the whole
  // section atomic would strand pages rather than protect blocks.
  // A container View cannot be split by react-pdf when its own children are
  // atomic, which loops pagination, so sections are flat with a spacer.
  return (
    <>
      <View wrap={false} minPresenceAhead={70}>
          <Text style={S.h2}>{s.title}</Text>
      </View>
      <Lines lines={s.lines} />
      <View style={S.gap} />
    </>
  );
}

/* --------------------------------------------------------------- graphics */


function RadarSvg({ r }: { r: CompassResult }) {
  const ids = Object.keys(CONSTRUCTS) as ConstructId[];
  // Two-word labels ride the outside of the web, so each spoke can be named.
  const SHORT: Record<string, string> = {
    agency: 'Agency', verification: 'Verification', dependencySafety: 'Dependency',
    fluency: 'Fluency', transfer: 'Transfer', amplification: 'Amplification',
    skillGrowth: 'Skill growth', adaptability: 'Adaptability',
    responsibleUse: 'Responsible use', creativity: 'Creativity',
  };
  const W = 300; const H = 216; const cx = W / 2; const cy = H / 2 + 2; const R = 72;
  const n = ids.length;
  const pt = (i: number, rad: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad] as const;
  };
  const val = (id: ConstructId) =>
    CONSTRUCTS[id].reportedAsRisk ? r.dimensions[id].reportedScore : r.dimensions[id].score;
  const poly = ids.map((id, i) => pt(i, (val(id) / 100) * R).join(',')).join(' ');
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={T.card} rx={8} stroke={T.hair} strokeWidth={1} />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <Polygon key={f} points={ids.map((_, i) => pt(i, R * f).join(',')).join(' ')}
          fill="none" stroke={T.hair} strokeWidth={f === 1 ? 1 : 0.6} />
      ))}
      {ids.map((_, i) => {
        const [x, y] = pt(i, R);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={T.hair} strokeWidth={0.5} />;
      })}
      <Polygon points={poly} fill={T.teal} fillOpacity={0.2} stroke={T.teal} strokeWidth={1.4} />
      {ids.map((id, i) => {
        const [px, py] = pt(i, (val(id) / 100) * R);
        return <Circle key={`d${id}`} cx={px} cy={py} r={1.8} fill={T.teal} />;
      })}
      {ids.map((id, i) => {
        const [lx, ly] = pt(i, R + 16);
        const label = SHORT[id] ?? constructName(r.persona, id);
        // rough centring: the renderer has no text metrics inside Svg
        const x = Math.max(3, Math.min(W - label.length * 3.9 - 3, lx - label.length * 1.95));
        return (
          <SvgText key={`l${id}`} x={x} y={ly + 2} style={{ fontFamily: 'Plex', fontSize: 6.4 }} fill={T.mute}>
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

/* --------------------------------------------- charts, mirroring the web */

/**
 * The ascent map, drawn the same way as the page: the painted scene with the
 * live route, the ten camps and the marker placed at the exact index over it.
 * Geometry comes from the same module the web uses, so the two cannot drift.
 */
function AscentMap({ r }: { r: CompassResult }) {
  const W = CW;
  const H = Math.round((CW * MAP_VIEW.h) / MAP_VIEW.w);
  const sx = W / MAP_VIEW.w;
  const raw = r.stage.rawIndex;
  const gated = !!r.stage.gated;
  // A held climber stands at their camp. The engine's gated index sits at the
  // top of the band, a fraction below the next camp, which on a drawn route is
  // indistinguishable from standing at that next camp: the complaint this
  // placement answers. Ungated, the marker stays at the exact index.
  const campIndex = STAGES.find((st) => st.stage === r.stage.stage)?.minIndex ?? 0;
  const placed = gated ? campIndex : r.stage.index;
  const here = pointAtIndex(placed);
  const reach = pointAtIndex(raw);
  const nextStage = r.nextTarget.stage;
  const atTop = nextStage === r.stage.stage;
  const travelled = placed / 100;
  // Near the summit the callout would land in the label band, so it flips down.
  const calloutBelow = here.y < 250;
  const pillText = gated ? `YOU ARE HERE  STAGE ${r.stage.stage}` : `YOU ARE HERE  ${raw}`;
  const pillW = Math.round(pillText.length * 8.4) + 36;
  const pillX = Math.max(12, Math.min(MAP_VIEW.w - pillW - 12, here.x - pillW / 2));
  const pillY = calloutBelow ? here.y + 40 : here.y - 104;
  // The reach chip goes on the far side of its ring, so it can never sit over
  // the marker however small the withheld stretch is.
  const chipW = Math.round(`INDEX ${raw}`.length * 7.2) + 26;
  const chipX = reach.x + 16 + chipW < MAP_VIEW.w ? reach.x + 16 : reach.x - 16 - chipW;

  return (
    <View style={{ width: W, height: H, position: 'relative' }}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={BACKDROP} style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }}>
        <Svg width={W} height={H} viewBox={`0 0 ${MAP_VIEW.w} ${MAP_VIEW.h}`}>
          {/* the illustration is the setting; a wash keeps the route first,
              and the label band fades out rather than ending in a hard edge */}
          <Defs>
            <LinearGradient id="mapScrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F7F1E4" stopOpacity={0.94} />
              <Stop offset="0.62" stopColor="#F7F1E4" stopOpacity={0.8} />
              <Stop offset="1" stopColor="#F7F1E4" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={MAP_VIEW.w} height={MAP_VIEW.h} fill="#F7F1E4" fillOpacity={0.34} />
          <Rect x={0} y={0} width={MAP_VIEW.w} height={230} fill="url(#mapScrim)" />

          {/* the crest the route sits on */}
          <Polygon points={routeRidge(10)} fill="#6E6147" fillOpacity={0.2} />

          {/* route: a light halo, the travelled portion, then the rest dashed */}
          <Path d={routePath()} stroke="#FBF8F1" strokeWidth={11} strokeOpacity={0.75} fill="none" strokeLinecap="round" />
          <Path d={routePath()} stroke="#D7CEC0" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path
            d={routePath()} stroke={T.teal} strokeWidth={7} fill="none" strokeLinecap="round"
            strokeDasharray={`${Math.round(travelled * 1180)},1180`}
          />

          {/* Camps. Every camp carries its number and its name in the band
              above the range, on three staggered rows so that neighbouring
              names never share a line and the long ones have room. */}
          {STAGES.map((st) => {
            const p = pointAtIndex(st.minIndex);
            const isHere = st.stage === r.stage.stage;
            const isNext = !atTop && st.stage === nextStage;
            const reached = placed >= st.minIndex;
            const band = [46, 84, 122][st.stage % 3];
            const lx = Math.max(80, Math.min(MAP_VIEW.w - 130, p.x));
            // keep long names clear of the summit marker on the right edge
            const label = stageName(r.persona, st.stage);
            const nw = label.length * 6.6;
            const nx = Math.min(lx - Math.min(label.length * 3.4, 100), MAP_VIEW.w - 78 - nw);
            return (
              <React.Fragment key={st.stage}>
                <Line x1={lx} y1={band + 8} x2={p.x} y2={p.y - 14}
                  stroke="#C9BFAE" strokeWidth={1} strokeDasharray="2,4" />
                <SvgText x={lx - 5} y={band} style={{ fontFamily: 'Plex', fontSize: 16 }}
                  fill={isHere ? T.oxblood : isNext ? T.teal : T.mute}>
                  {String(st.stage)}
                </SvgText>
                <SvgText x={nx} y={band + 20} style={{ fontFamily: 'Spectral', fontSize: 15 }}
                  fill={isHere ? T.oxblood : isNext ? T.teal : T.ink}>
                  {label}
                </SvgText>
                <Circle cx={p.x} cy={p.y} r={isHere ? 11 : 7}
                  fill={reached ? T.teal : T.card}
                  stroke={isNext ? T.teal : '#C9BFAE'} strokeWidth={isNext ? 2.5 : 1.5} />
              </React.Fragment>
            );
          })}

          {/* Practice gates, drawn where they first bind, as on the page. */}
          {GATE_DEFS.map((g) => {
            const stageMin = STAGES.find((st) => st.stage === g.firstStage)?.minIndex ?? 0;
            const base = pointAtIndex(stageMin);
            const peers = GATE_DEFS.filter((o) => o.firstStage === g.firstStage);
            const slot = peers.findIndex((o) => o.construct === g.construct);
            const x = base.x + (slot - (peers.length - 1) / 2) * 22;
            return (
              <React.Fragment key={g.construct}>
                <Line x1={x} y1={base.y + 14} x2={x} y2={base.y + 44} stroke={T.gold} strokeWidth={1.2} />
                <Polygon
                  points={`${x},${base.y + 39} ${x + 7},${base.y + 46} ${x},${base.y + 53} ${x - 7},${base.y + 46}`}
                  fill={T.gold}
                />
              </React.Fragment>
            );
          })}

          {/* When a gate holds the placement, the stretch the score reaches but
              the gate withholds is drawn open, with a hollow marker at its end,
              so the map agrees with the stage named below it. */}
          {gated ? (
            <React.Fragment>
              <Path
                d={routePath()} stroke={T.gold} strokeWidth={5} fill="none" strokeLinecap="butt"
                strokeDasharray={`0,${Math.round(travelled * 1180)},${Math.round((raw / 100 - travelled) * 1180)},1180`}
              />
              <Circle cx={reach.x} cy={reach.y} r={8} fill={T.card} stroke={T.gold} strokeWidth={2.5} />
              <Rect
                x={chipX} y={reach.y - 12} width={chipW} height={24} rx={12}
                fill="#F7F1E4" fillOpacity={0.94} stroke={T.gold} strokeWidth={1}
              />
              <SvgText
                x={chipX + 13} y={reach.y + 4}
                style={{ fontFamily: 'Plex', fontSize: 12 }} fill={T.ink}>
                {`INDEX ${raw}`}
              </SvgText>
            </React.Fragment>
          ) : null}

          {/* The climber, at the exact index. The callout sits above the marker
              unless that would run into the label band, in which case below. */}
          <Circle cx={here.x} cy={here.y} r={14} fill={T.card} stroke={T.oxblood} strokeWidth={3} />
          <Circle cx={here.x} cy={here.y} r={6} fill={T.oxblood} />
          <Line
            x1={here.x} y1={here.y + (calloutBelow ? 14 : -14)}
            x2={here.x} y2={here.y + (calloutBelow ? 40 : -40)}
            stroke={T.oxblood} strokeWidth={2}
          />
          <Rect x={pillX} y={pillY} width={pillW} height={32} rx={16} fill={T.oxblood} />
          <SvgText x={pillX + 18} y={pillY + 21} style={{ fontFamily: 'Plex', fontSize: 14 }} fill="#F7F1E4">
            {pillText}
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}


/** The full ten stage ladder, as on the results page. */
function Ladder({ r }: { r: CompassResult }) {
  const here = r.stage.stage;
  const next = r.nextTarget.stage;
  return (
    <View style={{ borderRadius: 8, borderWidth: 1, borderColor: T.hair, backgroundColor: T.card, padding: 10 }}>
      {[...STAGES].reverse().map((s) => {
        const isHere = s.stage === here;
        const isNext = s.stage === next && next !== here;
        const reached = r.stage.index >= s.minIndex;
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
                {stageName(r.persona, s.stage)}
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
              {reportedConstructName(r.persona, id)}
            </Text>
            <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: '#EDE5D7' }}>
              <View style={{ width: `${Math.max(2, shown)}%`, height: 7, borderRadius: 4, backgroundColor: col }} />
            </View>
            <Text style={{ fontFamily: 'Plex', fontSize: 8, width: 30, textAlign: 'right', color: bandTextColor(d.score) }}>{shown}</Text>
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
          <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 15, color: bandTextColor(healthy) }}>{value}</Text>
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
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 17, color: bandTextColor(d.healthy), width: 42 }}>{d.shown}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 10.5 }}>{d.label}</Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.5, letterSpacing: 0.8, color: bandTextColor(d.healthy), marginTop: 1 }}>
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
            <Text style={{ fontFamily: 'Plex', fontSize: 6.5, width: 52, textAlign: 'right', color: bandTextColor(healthy) }}>
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

/** The bottleneck as a bar against the number it must clear. */
function GateGap({ r }: { r: CompassResult }) {
  if (r.bottleneck.saturated) return null;
  const c = r.bottleneck.construct;
  const d = r.dimensions[c];
  const next = r.nextTarget.stage;
  let required: number | undefined;
  let requiredStage: number | undefined;
  for (const st of STAGES) {
    if (st.stage < next) continue;
    const g = st.gates as Record<string, number> | undefined;
    if (g && g[c] !== undefined) { required = g[c]; requiredStage = st.stage; break; }
  }
  const col = bandColor(d.score);
  return (
    <View wrap={false} style={{
      borderWidth: 1, borderColor: T.hair, borderRadius: 8, padding: 10,
      backgroundColor: T.card, marginBottom: 8,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 10.5 }}>{constructName(r.persona, c)}</Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 15, color: bandTextColor(d.score) }}>{d.score}</Text>
      </View>
      <View style={{ height: 9, borderRadius: 5, backgroundColor: '#EDE5D7', marginTop: 6, position: 'relative' }}>
        <View style={{ width: `${Math.max(2, d.score)}%`, height: 9, borderRadius: 5, backgroundColor: col }} />
        {required !== undefined ? (
          <View style={{ position: 'absolute', left: `${required}%`, top: -3, width: 2, height: 15, backgroundColor: T.ink, opacity: 0.6 }} />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 6.5, color: T.mute }}>you are here</Text>
        {required !== undefined ? (
          <Text style={{ fontFamily: 'Plex', fontSize: 6.5, color: T.mute }}>
            stage {requiredStage} needs {required}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** All ten dimensions on one scale, against the 45 and 65 lines. */
function ThresholdStrip({ r }: { r: CompassResult }) {
  const rows = (Object.keys(CONSTRUCTS) as ConstructId[])
    .map((id) => ({
      name: reportedConstructName(r.persona, id),
      healthy: r.dimensions[id].score,
      shown: CONSTRUCTS[id].reportedAsRisk ? r.dimensions[id].reportedScore : r.dimensions[id].score,
    }))
    .sort((a, b) => a.healthy - b.healthy);
  return (
    <View wrap={false}>
      {/* the zones, named once, so the two rules read as meaning something */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ width: 108 }} />
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ width: '45%' }}>
            <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.7, color: '#B0685E' }}>NEEDS ATTENTION</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.7, color: T.gold }}>DEVELOPING</Text>
          </View>
          <View style={{ width: '35%' }}>
            <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.7, color: T.teal }}>STRENGTH</Text>
          </View>
        </View>
        <View style={{ width: 30 }} />
      </View>
      {rows.map((row) => (
        <View key={row.name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          <Text style={{ fontSize: 7.5, width: 108 }}>{row.name}</Text>
          <View style={{ flex: 1, height: 12, position: 'relative' }}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 2, backgroundColor: '#EDE5D7', borderRadius: 1 }} />
            <View style={{ position: 'absolute', left: '45%', top: 1, width: 1, height: 10, backgroundColor: T.ink, opacity: 0.28 }} />
            <View style={{ position: 'absolute', left: '65%', top: 1, width: 1, height: 10, backgroundColor: T.ink, opacity: 0.28 }} />
            <View style={{
              position: 'absolute', left: `${row.healthy}%`, top: 1.5,
              width: 9, height: 9, borderRadius: 5, backgroundColor: bandColor(row.healthy),
            }} />
          </View>
          <Text style={{ fontFamily: 'Plex', fontSize: 7.5, width: 30, textAlign: 'right', color: bandTextColor(row.healthy) }}>
            {row.shown}
          </Text>
        </View>
      ))}
      <Text style={{ fontFamily: 'Plex', fontSize: 6.2, color: T.mute, marginTop: 4 }}>
        {`Plotted on the healthy reading, so ${reportedConstructName(r.persona, 'dependencySafety')} sits by its independent capability rather than by the risk number. Below 45 is named a vulnerability, above 65 a strength.`}
      </Text>
    </View>
  );
}

/** Felt against predicted against measured, on one five band scale. */
function CalibrationScale({ r }: { r: CompassResult }) {
  const idx = r.stage.rawIndex;
  const measured = idx >= 80 ? 5 : idx >= 62 ? 4 : idx >= 44 ? 3 : idx >= 26 ? 2 : 1;
  const clamp = (b: number) => Math.max(1, Math.min(5, b));
  const rows: Array<[string, number, string]> = [];
  if (r.calibration.desirabilityGap !== undefined) {
    rows.push(['How it felt', clamp(measured + r.calibration.desirabilityGap), T.gold]);
  }
  if (r.calibration.calibrationGap !== undefined) {
    rows.push(['What you predicted', clamp(measured + r.calibration.calibrationGap), '#8a6b91']);
  }
  rows.push(['What your answers measured', measured, T.oxblood]);
  const BANDS = ['Lowest', 'Lower', 'Middle', 'Higher', 'Highest'];
  return (
    <View wrap={false} style={{ marginBottom: 8 }}>
      {/* the five bands named once, so the rows below have a scale */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
        <View style={{ width: 118 }} />
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {BANDS.map((b) => (
            <Text key={b} style={{
              flex: 1, marginRight: 3, fontFamily: 'Plex', fontSize: 5.6,
              letterSpacing: 0.5, color: T.mute,
            }}>
              {b.toUpperCase()}
            </Text>
          ))}
        </View>
        <View style={{ width: 42 }} />
      </View>
      {rows.map(([label, band, col]) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 7.5, width: 118 }}>{label}</Text>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {[1, 2, 3, 4, 5].map((b) => (
              <View key={b} style={{
                flex: 1, height: 12, marginRight: 3, borderRadius: 3,
                backgroundColor: b === band ? col : '#EDE5D7',
              }} />
            ))}
          </View>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.5, width: 42, textAlign: 'right', color: T.mute }}>
            {BANDS[band - 1]}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Fired patterns as cards, so helping and harming are visible at a glance. */
function PatternCards({ r, kind }: { r: CompassResult; kind: 'help' | 'harm' }) {
  const hits = r.patterns.filter((p) => p.kind === kind);
  const col = kind === 'help' ? T.teal : '#CF796E';
  // An empty list is a real result, so it gets a card rather than silence.
  if (!hits.length) {
    const clear = kind === 'harm';
    return (
      <View wrap={false} style={{
        borderWidth: 1, borderColor: clear ? T.teal : T.hair, borderRadius: 8,
        padding: 10, backgroundColor: T.card, marginTop: 4, marginBottom: 6,
        flexDirection: 'row', alignItems: 'center',
      }}>
        <View style={{
          width: 20, height: 20, borderRadius: 10, marginRight: 9,
          backgroundColor: clear ? T.teal : '#E6DCC9',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 10, color: clear ? '#F7F1E4' : T.mute }}>
            {clear ? '\u2713' : '\u2022'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 9.5, color: clear ? T.teal : T.ink }}>
            {clear ? 'No harm pattern fired' : 'No help pattern fired yet'}
          </Text>
          <Text style={{ fontSize: 8, lineHeight: 1.45, marginTop: 1, color: T.mute }}>
            {clear
              ? 'Nothing in your answers crossed a harm threshold. That is a real result, not a blank.'
              : 'Nothing crossed a help threshold yet. These are combinations, so they arrive together rather than one at a time.'}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={{ marginTop: 4 }}>
      {hits.map((p) => (
        <View key={p.id} wrap={false} style={{
          borderWidth: 1, borderColor: T.hair, borderLeftWidth: 3, borderLeftColor: col,
          borderRadius: 8, padding: 9, marginBottom: 6, backgroundColor: T.card,
        }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 9.5, color: col }}>
            {kind === 'help' ? '\u2191  ' : '\u2193  '}{p.label}
          </Text>
          <Text style={{ fontSize: 8, lineHeight: 1.45, marginTop: 2 }}>{p.narrative}</Text>
        </View>
      ))}
    </View>
  );
}

/** One practice as a card, so the roadmap scans instead of reading as prose. */
function PracticeCard({ rec, n }: { rec: CompassResult['recommendations'][number]; n: number }) {
  const col = rec.priority === 'immediate' ? T.oxblood : rec.priority === 'developmental' ? T.gold : T.teal;
  const Field = ({ k, v }: { k: string; v: string }) => (
    <View style={{ flexDirection: 'row', marginTop: 3 }}>
      <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.7, color: T.mute, width: 62 }}>
        {k}
      </Text>
      <Text style={{ flex: 1, fontSize: 8, lineHeight: 1.45 }}>{v}</Text>
    </View>
  );
  return (
    <View wrap={false} style={{
      borderWidth: 1, borderColor: T.hair, borderRadius: 8, padding: 10,
      backgroundColor: T.card, marginBottom: 8,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
        <View style={{
          width: 16, height: 16, borderRadius: 8, backgroundColor: col,
          alignItems: 'center', justifyContent: 'center', marginRight: 7,
        }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 8, color: '#F7F1E4' }}>{n}</Text>
        </View>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 10.5, flex: 1 }}>
          {rec.capability}
        </Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.8, color: col }}>
          {rec.priority.toUpperCase()}
        </Text>
      </View>
      <Field k="CHANGE" v={rec.behaviorChange} />
      <Field k="PRACTICE" v={rec.practice} />
      <Field k="PROGRESS" v={rec.evidenceOfProgress} />
      <Field k="WATCH FOR" v={rec.riskToMonitor} />
    </View>
  );
}

/** Current position beside the next one. */
function NextStagePanel({ r }: { r: CompassResult }) {
  const atTop = r.nextTarget.stage === r.stage.stage;
  return (
    <View wrap={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
      <View style={{ flex: 1, borderWidth: 1, borderColor: T.hair, borderRadius: 8, padding: 9, marginRight: 8 }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.9, color: T.mute }}>NOW</Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 10 }}>
          Stage {r.stage.stage}, {r.stage.stageName}
        </Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 6.5, color: T.mute, marginTop: 2 }}>
          {r.stage.substage} · index {r.stage.rawIndex}
        </Text>
      </View>
      <View style={{ flex: 1, borderWidth: 1, borderColor: T.teal, borderRadius: 8, padding: 9 }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.9, color: T.mute }}>
          {atTop ? 'MAINTAINING' : 'NEXT'}
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 10, color: T.teal }}>
          Stage {r.nextTarget.stage}, {r.nextTarget.stageName}
        </Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 6.5, color: T.mute, marginTop: 2 }}>
          {atTop ? 'the loop that keeps it' : 'what it asks of you'}
        </Text>
      </View>
    </View>
  );
}

/** Business Owner: one level of the assessment, with its readings drawn large. */
function ScopedBlockPdf({ r, scope }: { r: CompassResult; scope: 'owner' | 'business' }) {
  const ids = (Object.keys(CONSTRUCTS) as ConstructId[])
    .filter((id) => dimensionScope(r.persona, id) === scope);
  const rows = ids.map((id) => ({
    id,
    name: reportedConstructName(r.persona, id),
    healthy: r.dimensions[id].score,
    shown: CONSTRUCTS[id].reportedAsRisk ? r.dimensions[id].reportedScore : r.dimensions[id].score,
    reading: (() => {
      const c = constructContent(r.persona, id);
      const st = r.dimensions[id].microState;
      return st === 'strong' ? c.atStrong : st === 'developing' ? c.atDeveloping : c.atWatch;
    })(),
  })).sort((a, b) => a.healthy - b.healthy);
  const avg = Math.round(rows.reduce((a, x) => a + x.healthy, 0) / rows.length);
  const accent = scope === 'owner' ? T.gold : T.teal;

  return (
    <>
      <View wrap={false} minPresenceAhead={140}>
        <View style={{ height: 4, width: 54, backgroundColor: accent, marginBottom: 8 }} />
        <Text style={S.eyebrow}>{scope === 'owner' ? 'Level one' : 'Level two'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Text style={{ ...S.h2, marginBottom: 0 }}>{SCOPE_LABEL[scope]}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 30, color: accent }}>{avg}</Text>
            <Text style={{ fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.8, color: T.mute }}>
              {scope === 'owner' ? 'OWNER AVERAGE' : 'BUSINESS AVERAGE'}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 8.5, lineHeight: 1.5, color: T.mute, marginTop: 4, marginBottom: 10 }}>
          {SCOPE_BLURB[scope]}
        </Text>

        {rows.map((row) => (
          <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 8.5, width: 150 }}>{row.name}</Text>
            <View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: '#EDE5D7', position: 'relative' }}>
              <View style={{
                width: `${Math.max(2, row.healthy)}%`, height: 14, borderRadius: 7,
                backgroundColor: bandColor(row.healthy),
              }} />
              <View style={{ position: 'absolute', left: '45%', top: 0, width: 1, height: 14, backgroundColor: T.ink, opacity: 0.3 }} />
              <View style={{ position: 'absolute', left: '65%', top: 0, width: 1, height: 14, backgroundColor: T.ink, opacity: 0.3 }} />
            </View>
            <Text style={{
              fontFamily: 'Plex', fontSize: 9.5, width: 34, textAlign: 'right',
              color: bandTextColor(row.healthy),
            }}>
              {row.shown}
            </Text>
          </View>
        ))}
      </View>

      {rows.slice(0, 2).map((row) => (
        <View key={`n${row.id}`} wrap={false} style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 8.5, lineHeight: 1.5 }}>
            <Text style={{ fontWeight: 700 }}>{row.name}. </Text>{row.reading}
          </Text>
        </View>
      ))}
      <View style={S.gap} />
    </>
  );
}

const HEAD_CELL = {
  fontFamily: 'Plex' as const, fontSize: 6, letterSpacing: 0.9, color: T.mute,
};

/** Business Owner: the register, on its own page, rows that never split. */
function RiskRegisterPdf({ r }: { r: CompassResult }) {
  const LABEL: Record<string, string> = {
    legal: 'Legal and compliance', financial: 'Financial', operational: 'Operational',
    reputational: 'Reputational', strategic: 'Strategic',
  };
  const TINT: Record<string, string> = {
    legal: '#F6E3E0', financial: '#F7EBD6', operational: '#E4EFEC',
    reputational: '#F1E7F2', strategic: '#E7EAF2',
  };
  const INK: Record<string, string> = {
    legal: '#7C2D26', financial: '#7A5312', operational: '#14584C',
    reputational: '#5A3660', strategic: '#2A3757',
  };

  return (
    <Page size="A4" style={S.light} wrap>
      <View wrap={false}>
        <Text style={S.eyebrow}>The exposure</Text>
        <Text style={S.h2}>Risk register</Text>
      </View>
      {r.riskRegister.length === 0 ? (
        <Text style={S.body}>
          Nothing in your answers crossed an exposure threshold, so this register is empty. That is a
          real result rather than a blank, and it is worth running again as your use grows.
        </Text>
      ) : (
        <>
          <Text style={S.body}>
            Each line is an exposure your answers point to, the category it falls in, and the action
            chosen for it. Severity reflects how your answers landed, not a probability. The plan
            that follows is capped at five actions, so anything beyond that is listed here rather
            than hidden.
          </Text>
          <View wrap={false} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.hair, paddingBottom: 4, marginTop: 8 }}>
            <Text style={{ ...HEAD_CELL, flex: 3 }}>EXPOSURE</Text>
            <Text style={{ ...HEAD_CELL, width: 92 }}>CATEGORY</Text>
            <Text style={{ ...HEAD_CELL, width: 116 }}>EVIDENCE</Text>
            <Text style={{ ...HEAD_CELL, width: 108 }}>ACTION</Text>
          </View>
          {r.riskRegister.map((e) => (
            <View key={e.title} wrap={false} style={{
              flexDirection: 'row', paddingVertical: 7,
              borderBottomWidth: 1, borderBottomColor: T.hair,
            }}>
              <View style={{ flex: 3, paddingRight: 8 }}>
                <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 8.5 }}>{e.title}</Text>
                <Text style={{ fontSize: 7.5, color: T.mute, lineHeight: 1.4, marginTop: 1 }}>{e.description}</Text>
              </View>
              <View style={{ width: 92, paddingRight: 6 }}>
                <Text style={{
                  fontFamily: 'Plex', fontSize: 6, letterSpacing: 0.4,
                  color: INK[e.category], backgroundColor: TINT[e.category],
                  paddingVertical: 2, paddingHorizontal: 4, borderRadius: 8,
                }}>
                  {LABEL[e.category]}
                </Text>
              </View>
              <Text style={{ width: 116, fontFamily: 'Plex', fontSize: 6.8, color: T.mute, paddingRight: 6 }}>
                {e.evidence}
              </Text>
              <Text style={{ width: 108, fontSize: 7.5 }}>
                {e.action ?? 'Listed, not scheduled'}
              </Text>
            </View>
          ))}
        </>
      )}
      <Footer title={reportTitle(r.persona)} />
    </Page>
  );
}

/** Business Owner: the ninety day plan, on its own page, three blocks. */
function NinetyDayPdf({ r }: { r: CompassResult }) {
  return (
    <Page size="A4" style={S.light} wrap>
      <View wrap={false}>
        <Text style={S.eyebrow}>What to do</Text>
        <Text style={S.h2}>Your next ninety days</Text>
        <Text style={S.body}>
          Sequenced so that anything legal or financial comes first, because that kind of exposure
          keeps accumulating while other work is done. Each action carries the checkpoint that tells
          you it has actually happened.
        </Text>
      </View>
      {r.ninetyDayPlan.map((phase) => (
        <View key={phase.window} wrap={false} style={{
          borderWidth: 1, borderColor: T.hair, borderLeftWidth: 3, borderLeftColor: T.teal,
          borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: T.card,
        }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.4, letterSpacing: 0.9, color: T.mute }}>
            {phase.window.toUpperCase()}
          </Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 11, color: T.oxblood, marginTop: 2 }}>
            {phase.title}
          </Text>
          <Text style={{ fontSize: 7.6, color: T.mute, marginTop: 2, marginBottom: 4 }}>{phase.note}</Text>
          {phase.actions.map((a) => (
            <View key={a.capability} style={{ marginTop: 5, borderTopWidth: 1, borderTopColor: T.hair, paddingTop: 5 }}>
              <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 9 }}>{a.capability}</Text>
              <Text style={{ fontSize: 8, lineHeight: 1.45, marginTop: 1 }}>{a.practice}</Text>
              <Text style={{ fontSize: 7.4, color: T.mute, marginTop: 2 }}>
                <Text style={{ fontWeight: 700 }}>Checkpoint. </Text>{a.checkpoint}
              </Text>
            </View>
          ))}
        </View>
      ))}
      <Footer title={reportTitle(r.persona)} />
    </Page>
  );
}

/** Business Owner: what happens if the main tool disappears for a week. */
function ContinuityPdf({ r }: { r: CompassResult }) {
  const continuity = r.dimensions.dependencySafety.score;
  const capture = r.dimensions.transfer.score;
  const verdict = continuity >= 65 && capture >= 55
    ? 'Your responses are consistent with a business that would keep trading. Work would slow in places, and customers would be unlikely to see it.'
    : continuity >= 45
      ? 'Your responses suggest the business would keep going with visible strain: slower turnaround, and quality depending on who is available.'
      : 'Your answers suggest work would stop in the affected areas until the tool returned, because the process largely lives inside it.';
  return (
    <View wrap={false} style={{
      borderWidth: 1, borderColor: T.hair, borderLeftWidth: 3, borderLeftColor: T.teal,
      borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: T.card,
    }}>
      <Text style={S.eyebrow}>The continuity test</Text>
      <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
        What happens if your main AI tool disappears for a week
      </Text>
      <Text style={{ fontSize: 8.5, lineHeight: 1.5 }}>{verdict}</Text>
      <Text style={{ fontSize: 7.6, color: T.mute, marginTop: 4, lineHeight: 1.45 }}>
        {`Read from operational continuity (${continuity}) and institutional knowledge capture (${capture}). Continuity exposure sits at ${r.composites.dependencyIndex} out of 100, where higher means more of what you produce would be hard to reproduce without the tools.`}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------------- pages */

const Footer = ({ title = 'Neogogy Formation Compass' }: { title?: string }) => (
  <View style={S.foot} fixed>
    <Text>{title}</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
  </View>
);

/**
 * The Business Owner cover.
 *
 * No photograph. Deep navy, one teal rule, a large score and a lot of white
 * space, because this document gets forwarded to an accountant or a board and
 * has to look like a business paper rather than a personal report.
 */
/**
 * The Minister/Preacher cover.
 *
 * Ink-light, one accent, a great deal of white space, and no name field: this
 * check is anonymous and the file should look like it belongs to the person
 * holding it rather than to a system that recorded them.
 */
function PastorCover({ r, dateStr }: { r: CompassResult; dateStr: string }) {
  const ACCENT = '#2E6E63';
  const INK = '#2A2620';
  const MUTE = 'rgba(42,38,32,0.62)';
  const arch = r.archetype.name;
  const archSize = arch.length > 24 ? 28 : arch.length > 18 ? 32 : 38;
  return (
    <Page size="A4" style={{ backgroundColor: '#EDE6D8', color: INK, fontFamily: 'Spectral' }}>
      {/* the scene: an arched window with morning light through it */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={MINISTER_ART} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: M, paddingTop: 52 }}>
        <View style={{ width: 46, height: 3, backgroundColor: ACCENT, marginBottom: 12 }} />
        <Text style={{ fontFamily: 'Plex', fontSize: 8, letterSpacing: 2.4, color: ACCENT }}>
          PREACHING FORMATION CHECK
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontSize: 12, color: MUTE, marginTop: 14, lineHeight: 1.6, maxWidth: 330 }}>
          A private reading of how AI is shaping your preparation, your preaching, your care of
          people, and your own formation.
        </Text>
      </View>

      <View style={{ position: 'absolute', left: M, right: M, bottom: 176 }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 7, letterSpacing: 1.4, color: MUTE }}>
          WHERE YOUR PRACTICE STANDS
        </Text>
        <Text style={{
          fontFamily: 'Spectral', fontWeight: 800, fontSize: archSize, color: '#7B2B32',
          marginTop: 8, lineHeight: 1.1,
        }}>
          {arch}
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontSize: 11.5, color: MUTE, marginTop: 9, lineHeight: 1.55, maxWidth: 340 }}>
          {r.archetype.tagline}
        </Text>
      </View>

      <View style={{
        position: 'absolute', left: M, right: M, bottom: 104,
        flexDirection: 'row', alignItems: 'flex-end',
      }}>
        <View>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 52, color: ACCENT, lineHeight: 1 }}>
            {r.stage.rawIndex}
          </Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.6, letterSpacing: 1.1, color: MUTE, marginTop: 5 }}>
            FORMATION HEALTH SCORE, OUT OF 100
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.6, letterSpacing: 1.1, color: MUTE }}>
            {`STAGE ${r.stage.stage} OF 10`}
          </Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
            {r.stage.stageName}
          </Text>
        </View>
      </View>

      <View style={{
        position: 'absolute', left: M, right: M, bottom: 56,
        borderTopWidth: 1, borderTopColor: 'rgba(42,38,32,0.16)', paddingTop: 11,
      }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 7, color: MUTE, lineHeight: 1.6 }}>
          A private self-reflection index drawn from your own answers. Not a spiritual assessment of
          your calling, your faithfulness, or your ministry.
        </Text>
      </View>

      <View style={{ position: 'absolute', left: M, right: M, bottom: 28, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 7, color: MUTE }}>{dateStr}</Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 7, color: MUTE }}>assessment.neogogy.ai</Text>
      </View>
    </Page>
  );
}

/** Pastor: the Dependence Check, the outage reading, and the roadmap. */
function PastorBlocksPdf({ r }: { r: CompassResult }) {
  const ACCENT = '#2E6E63';
  const d = r.dependenceCheck;
  const capacity = r.dimensions.dependencySafety.score;
  const retained = r.dimensions.transfer.score;
  const outage = capacity >= 65 && retained >= 55
    ? 'Your answers are consistent with a preacher who would still have a word for Sunday. The week would be longer and the preparation would hold.'
    : capacity >= 45
      ? 'Your answers suggest you would get there, with a longer week and a thinner message than you would want.'
      : 'Your answers suggest the week would be hard, because much of the preparation now runs through the tools. That is recoverable, and the practices below are built for it.';
  return (
    <>
      {d ? (
        <View wrap={false} style={{
          borderWidth: 1, borderColor: T.hair, borderLeftWidth: 3, borderLeftColor: ACCENT,
          borderRadius: 8, padding: 11, marginBottom: 10, backgroundColor: T.card,
        }}>
          <Text style={S.eyebrow}>The Dependence Check</Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 11.5, marginBottom: 4 }}>
            {d.heading}
          </Text>
          <Text style={{ fontSize: 8.6, lineHeight: 1.55 }}>{d.narrative}</Text>
          {d.practice ? (
            <Text style={{ fontSize: 8.6, lineHeight: 1.55, marginTop: 5 }}>
              <Text style={{ fontWeight: 700 }}>One practice. </Text>{d.practice}
            </Text>
          ) : null}
          {d.resource ? (
            <Text style={{ fontSize: 7.6, color: T.mute, marginTop: 4 }}>{d.resource}</Text>
          ) : null}
          <Text style={{ fontSize: 7.4, color: T.mute, marginTop: 6 }}>
            A mirror rather than a measure. It does not affect your score or your stage, and the two
            questions behind it were not stored.
          </Text>
        </View>
      ) : null}

      <View wrap={false} style={{
        borderWidth: 1, borderColor: T.hair, borderLeftWidth: 3, borderLeftColor: ACCENT,
        borderRadius: 8, padding: 11, marginBottom: 10, backgroundColor: T.card,
      }}>
        <Text style={S.eyebrow}>The outage reading</Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 11.5, marginBottom: 4 }}>
          If every tool vanished this week
        </Text>
        <Text style={{ fontSize: 8.6, lineHeight: 1.55 }}>{outage}</Text>
        <Text style={{ fontSize: 7.6, color: T.mute, marginTop: 4 }}>
          {`Read from unaided preaching capacity (${capacity}) and formation retained (${retained}).`}
        </Text>
      </View>
    </>
  );
}

/** Pastor: this week, this month, this season, on its own page. */
function FormationRoadmapPdf({ r }: { r: CompassResult }) {
  return (
    <Page size="A4" style={S.light} wrap>
      <View wrap={false}>
        <Text style={S.eyebrow}>A way forward</Text>
        <Text style={S.h2}>This week, this month, this season</Text>
        <Text style={S.body}>
          One thing to start with, a rhythm to build, and the slower work of a season. Each carries
          what it would look like for it to be happening, so you can tell rather than guess. These
          are offered, not prescribed.
        </Text>
      </View>
      {(r.formationRoadmap ?? []).map((phase) => (
        <View key={phase.window} wrap={false} style={{
          borderWidth: 1, borderColor: T.hair, borderLeftWidth: 3, borderLeftColor: '#2E6E63',
          borderRadius: 8, padding: 11, marginBottom: 9, backgroundColor: T.card,
        }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 6.4, letterSpacing: 0.9, color: T.mute }}>
            {phase.window}
          </Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 11, color: T.oxblood, marginTop: 2 }}>
            {phase.title}
          </Text>
          <Text style={{ fontSize: 7.8, color: T.mute, marginTop: 2, marginBottom: 4 }}>{phase.note}</Text>
          {phase.actions.map((a) => (
            <View key={a.capability} style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: T.hair, paddingTop: 6 }}>
              <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 9.5 }}>{a.capability}</Text>
              <Text style={{ fontSize: 8.4, lineHeight: 1.5, marginTop: 2 }}>{a.practice}</Text>
              <Text style={{ fontSize: 7.6, color: T.mute, marginTop: 3 }}>
                <Text style={{ fontWeight: 700 }}>What it looks like. </Text>{a.checkpoint}
              </Text>
              {a.resource ? (
                <Text style={{ fontSize: 7.4, color: T.mute, marginTop: 2 }}>{a.resource}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}
      <Footer title={reportTitle(r.persona)} />
    </Page>
  );
}

function BusinessCover({ r, name, dateStr, company, industry }: {
  r: CompassResult; name: string; dateStr: string; company?: string; industry?: string;
}) {
  const NAVY = '#1B2A4A';
  const TEAL = '#00D4AA';
  const CRIMSON = '#C4384A';
  const PAPER = '#F4F6F9';
  const SOFT = 'rgba(244,246,249,0.72)';
  const FAINT = 'rgba(244,246,249,0.48)';
  const arch = r.archetype.name;
  const archSize = arch.length > 24 ? 30 : arch.length > 18 ? 34 : 40;

  return (
    <Page size="A4" style={{ backgroundColor: NAVY, color: PAPER, fontFamily: 'Spectral' }}>
      {/* the dial: a crimson sweep on a navy field, cropped by the page so it
          frames the type rather than sitting behind it as a picture */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={BUSINESS_ART} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>

      <View style={{ position: 'absolute', top: 0, left: M, width: 64, height: 5, backgroundColor: TEAL }} />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: M, paddingTop: 62 }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 8, letterSpacing: 2.6, color: TEAL }}>
          NEOGOGY  ·  BUSINESS AI HEALTH CHECK
        </Text>

        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, letterSpacing: 1.8, color: FAINT, marginTop: 54 }}>
          PREPARED FOR
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 34, color: PAPER, marginTop: 8, lineHeight: 1.1 }}>
          {company || name || 'Your business'}
        </Text>
        {(company && name) || industry ? (
          <Text style={{ fontFamily: 'Plex', fontSize: 9, color: SOFT, marginTop: 10 }}>
            {[company ? name : '', industry].filter(Boolean).join('   ·   ')}
          </Text>
        ) : null}

        <View style={{ height: 1, backgroundColor: 'rgba(244,246,249,0.18)', marginTop: 34, marginBottom: 34 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 22, height: 2, backgroundColor: CRIMSON, marginRight: 8 }} />
          <Text style={{ fontFamily: 'Plex', fontSize: 7.5, letterSpacing: 1.8, color: FAINT }}>
            WHERE THIS BUSINESS STANDS
          </Text>
        </View>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: archSize, color: PAPER, marginTop: 12, lineHeight: 1.06 }}>
          {arch}
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontSize: 12.5, color: SOFT, marginTop: 14, lineHeight: 1.55, maxWidth: 360 }}>
          {r.archetype.tagline}
        </Text>
      </View>

      {/* the two levels, given the middle of the page, because the split is
          the first thing an owner has to understand about this report */}
      <View style={{ position: 'absolute', left: M, right: M, top: 372, flexDirection: 'row' }}>
        {(['owner', 'business'] as const).map((scope) => {
          const ids = (Object.keys(CONSTRUCTS) as ConstructId[])
            .filter((id) => dimensionScope(r.persona, id) === scope);
          const avg = Math.round(ids.reduce((a, id) => a + r.dimensions[id].score, 0) / ids.length);
          const accent = scope === 'owner' ? '#F0B849' : TEAL;
          return (
            <View key={scope} style={{ flex: 1, paddingRight: 24 }}>
              <View style={{ height: 3, width: 34, backgroundColor: accent, marginBottom: 10 }} />
              <Text style={{ fontFamily: 'Plex', fontSize: 7, letterSpacing: 1.4, color: FAINT }}>
                {scope === 'owner' ? 'ABOUT YOU AS THE OWNER' : 'ABOUT THE BUSINESS'}
              </Text>
              <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 40, color: accent, marginTop: 6 }}>
                {avg}
              </Text>
              <Text style={{ fontFamily: 'Plex', fontSize: 7, color: SOFT, marginTop: 2 }}>
                {`${ids.length} of 10 readings`}
              </Text>
              <Text style={{ fontFamily: 'Spectral', fontSize: 9, color: SOFT, marginTop: 8, lineHeight: 1.5 }}>
                {scope === 'owner'
                  ? 'How you decide, how you think, and how well you fit tools to work.'
                  : 'What the business checks, keeps, would survive, and exposes.'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* the number, large, with the stage beside it */}
      <View style={{
        position: 'absolute', left: M, right: M, bottom: 132,
        flexDirection: 'row', alignItems: 'flex-end',
      }}>
        <View>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 84, color: TEAL, lineHeight: 1 }}>
            {r.stage.rawIndex}
          </Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 7, letterSpacing: 1.4, color: SOFT, marginTop: 6 }}>
            BUSINESS AI HEALTH SCORE, OUT OF 100
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 7, letterSpacing: 1.4, color: FAINT }}>
            {`STAGE ${r.stage.stage} OF 10`}
          </Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 19, color: PAPER, marginTop: 5 }}>
            {r.stage.stageName}
          </Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: SOFT, marginTop: 5 }}>
            {`${r.stage.substage}  ·  ${r.overallConfidence} confidence`}
          </Text>
        </View>
      </View>

      {/* the two levels, named on the cover so the split is not a surprise */}
      <View style={{
        position: 'absolute', left: M, right: M, bottom: 62,
        borderTopWidth: 1, borderTopColor: 'rgba(244,246,249,0.18)', paddingTop: 14,
        flexDirection: 'row', justifyContent: 'space-between',
      }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: SOFT, maxWidth: 330 }}>
          Assesses the business, and the owner who runs it, separately.
        </Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: FAINT }}>
          Assessment indices, not an audit
        </Text>
      </View>

      <View style={{
        position: 'absolute', left: M, right: M, bottom: 30,
        flexDirection: 'row', justifyContent: 'space-between',
      }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: FAINT }}>{dateStr}</Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: FAINT }}>assessment.neogogy.ai</Text>
      </View>
    </Page>
  );
}

function Cover({ r, name, dateStr, company, industry }: {
  r: CompassResult; name: string; dateStr: string; company?: string; industry?: string;
}) {
  const IVORY = '#F7F1E4';
  const SOFT = 'rgba(247,241,228,0.74)';
  const FAINT = 'rgba(247,241,228,0.55)';

  // The archetype is the headline. Long names are given a smaller size so they
  // still fit on two lines rather than overflowing the page.
  const archetype = r.archetype.name;
  const archSize = archetype.length > 22 ? 34 : archetype.length > 16 ? 40 : 46;

  return (
    <Page size="A4" style={S.cover}>
      {/* full bleed dusk scene, decorative only */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={COVER_ART} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: M, paddingTop: 54 }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 8, letterSpacing: 2.4, color: '#4FD3B8' }}>
          {r.persona === 'business'
            ? 'NEOGOGY  ·  BUSINESS AI HEALTH CHECK'
            : 'NEOGOGY  ·  THE FORMATION COMPASS'}
        </Text>

        {/* the reader's own name, given real presence */}
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, letterSpacing: 1.8, color: FAINT, marginTop: 40 }}>
          PREPARED FOR
        </Text>
        <Text style={{
          fontFamily: 'Spectral', fontWeight: 700, fontSize: 30, color: IVORY,
          marginTop: 6, lineHeight: 1.12,
        }}>
          {(r.persona === 'business' && company) || name || 'Your report'}
        </Text>
        {r.persona === 'business' && (company || industry) ? (
          <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: SOFT, marginTop: 8 }}>
            {[company ? name : '', industry].filter(Boolean).join('  ·  ')}
          </Text>
        ) : null}

        <View style={{ height: 1, backgroundColor: 'rgba(247,241,228,0.28)', marginTop: 26, marginBottom: 26 }} />

        {/* the result, as the headline */}
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, letterSpacing: 1.8, color: FAINT }}>
          {r.persona === 'business' ? 'YOUR BUSINESS AND AI' : 'YOUR ASCENT WITH AI'}
        </Text>
        <Text style={{
          fontFamily: 'Spectral', fontWeight: 800, fontSize: archSize, color: IVORY,
          marginTop: 10, lineHeight: 1.04,
        }}>
          {archetype}
        </Text>
        <Text style={{
          fontFamily: 'Spectral', fontSize: 12.5, color: SOFT, marginTop: 12,
          lineHeight: 1.5, maxWidth: 340,
        }}>
          {r.archetype.tagline}
        </Text>
      </View>

      {/* the stage band sits over the brightest part of the glow, so it
          carries its own scrim rather than relying on the artwork */}
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 96,
        height: 148, backgroundColor: '#14120F', opacity: 0.42,
      }} />

      {/* stage and index, sitting over the glow near the horizon */}
      <View style={{
        position: 'absolute', left: M, right: M, bottom: 118,
        flexDirection: 'row', alignItems: 'center',
      }}>
        <View style={{
          width: 104, height: 104, borderRadius: 52,
          borderWidth: 1.6, borderColor: 'rgba(247,241,228,0.55)',
          alignItems: 'center', justifyContent: 'center', marginRight: 20,
          backgroundColor: 'rgba(20,18,15,0.58)',
        }}>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 30, color: IVORY }}>
            {r.stage.rawIndex}
          </Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 5.4, letterSpacing: 1.1, color: IVORY, marginTop: 3, opacity: 0.82 }}>
            {r.persona === 'business' ? 'AI HEALTH SCORE' : 'DEVELOPMENTAL INDEX'}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Plex', fontSize: 7.5, letterSpacing: 1.6, color: '#4FD3B8' }}>
            STAGE {r.stage.stage} OF 10
          </Text>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 21, color: IVORY, marginTop: 3 }}>
            {r.stage.stageName}
          </Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 8, color: IVORY, marginTop: 5, opacity: 0.86 }}>
            {r.stage.substage}  ·  {confidenceLabel(r.overallConfidence).toLowerCase()}
          </Text>
        </View>
      </View>

      {/* a quiet line of orientation, and the imprint */}
      <View style={{ position: 'absolute', left: M, right: M, bottom: 52 }}>
        <View style={{ height: 1, backgroundColor: 'rgba(247,241,228,0.22)', marginBottom: 12 }} />
        <Text style={{ fontFamily: 'Spectral', fontSize: 10, color: SOFT, lineHeight: 1.5 }}>
          A journey, not a verdict. The summit is a direction, not a finish line.
        </Text>
      </View>

      <View style={{
        position: 'absolute', left: M, right: M, bottom: 26,
        flexDirection: 'row', justifyContent: 'space-between',
      }}>
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: FAINT }}>{dateStr}</Text>
        <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: FAINT }}>assessment.neogogy.ai</Text>
      </View>
    </Page>
  );
}

export async function generateCompassPdf(args: {
  result: CompassResult;
  name?: string;
  comparison?: AttemptComparison | null;
  /** Business Owner only, volunteered by the respondent. */
  company?: string;
  industry?: string;
}): Promise<Buffer> {
  const { result: r, name = '', comparison = null, company, industry } = args;
  const isBusiness = r.persona === 'business';
  const isPastor = r.persona === 'pastor';
  const sections = generateReportSections(r);
  const byKey = (k: string) => sections.find((s) => s.key === k)!;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = (
    <Document title={reportTitle(r.persona)} author="International Center for Applied Neogogy">
      {isPastor
        ? <PastorCover r={r} dateStr={dateStr} />
        : isBusiness
          ? <BusinessCover r={r} name={name} dateStr={dateStr} company={company} industry={industry} />
          : <Cover r={r} name={name} dateStr={dateStr} company={company} industry={industry} />}

      {/*
        One flowing light page. react-pdf paginates it, and every content block
        is wrap={false}, so blocks move whole to the next page rather than
        splitting. Pagination is therefore driven by content length instead of
        by fixed page assignments, which is what keeps pages full.
      */}
      <Page size="A4" style={S.light} wrap>
        {/* The map opens the page: a plate this tall cannot re-flow past a
            page break, so it is placed where it always has full height. */}
        <>
          <View wrap={false}>
            <Text style={S.eyebrow}>Where you are</Text>
            <Text style={S.h2}>{byKey('continuum').title}</Text>
            <View style={{ marginBottom: 8 }}><AscentMap r={r} /></View>
            {/* the same legend the page carries, so the marks are readable */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 4 }}>
              <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: T.teal, marginRight: 5 }} />
              <Text style={{ fontFamily: 'Plex', fontSize: 6.2, color: T.mute, marginRight: 12 }}>Route travelled</Text>
              <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: '#C9BFAE', marginRight: 5 }} />
              <Text style={{ fontFamily: 'Plex', fontSize: 6.2, color: T.mute, marginRight: 12 }}>Route ahead</Text>
              <View style={{
                width: 7, height: 7, borderRadius: 4, borderWidth: 1,
                borderColor: '#C9BFAE', backgroundColor: T.card, marginRight: 5,
              }} />
              <Text style={{ fontFamily: 'Plex', fontSize: 6.2, color: T.mute, marginRight: 12 }}>Stage camp</Text>
              <View style={{ width: 7, height: 7, backgroundColor: T.gold, marginRight: 5 }} />
              <Text style={{ fontFamily: 'Plex', fontSize: 6.2, color: T.mute, marginRight: 12 }}>Practice gate</Text>
              <View style={{
                width: 8, height: 8, borderRadius: 4, borderWidth: 2,
                borderColor: T.oxblood, backgroundColor: T.card, marginRight: 5,
              }} />
              <Text style={{
                fontFamily: 'Plex', fontSize: 6.2, color: T.mute,
                marginRight: r.stage.gated ? 12 : 0,
              }}>
                You
              </Text>
              {r.stage.gated ? (
                <>
                  <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: T.gold, marginRight: 5 }} />
                  <Text style={{ fontFamily: 'Plex', fontSize: 6.2, color: T.mute }}>
                    Held by a gate
                  </Text>
                </>
              ) : null}
            </View>
            <Text style={{ fontFamily: 'Plex', fontSize: 6.5, color: T.mute, marginBottom: 10 }}>
              {'Altitude reflects the developmental index, 0 at basecamp to 100 at the summit, and '}
              {'the gold marks are the practice gates, where a stage asks for a minimum reading '}
              {'before it opens. '}
              {r.stage.gated
                ? `You are drawn standing at camp ${r.stage.stage}, because a gate holds your stage there. The open ring ahead is where your index of ${r.stage.rawIndex} reaches, and the section below explains what closes the gap.`
                : 'The marker sits at your exact index rather than at the middle of a stage.'}
            </Text>
          </View>
          <View wrap={false} style={{ marginBottom: 10 }}><Ladder r={r} /></View>
          {isBusiness ? <ContinuityPdf r={r} /> : null}
          {isPastor ? <PastorBlocksPdf r={r} /> : null}
          <Lines lines={byKey('continuum').lines} />
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={70}>
            <Text style={S.eyebrow}>Your profile</Text>
            <Text style={S.h2}>{byKey('profile').title}</Text>
          </View>
          <Lines lines={upTo(byKey('profile').lines, 'The short version')} />
          <View wrap={false}>
            <Text style={S.h3}>The short version</Text>
            <Fingerprint r={r} />
          </View>
          <View style={S.gap} />
        </>

        {comparison ? <Comparison c={comparison} /> : null}

        <>
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
          <View style={S.gap} />
        </>

        {/* the ten dimensions as cards, replacing ten blocks of prose */}
        {isBusiness ? (
          <>
            <ScopedBlockPdf r={r} scope="owner" />
            <ScopedBlockPdf r={r} scope="business" />
          </>
        ) : null}

        <>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={S.eyebrow}>Each dimension, unpacked</Text>
            <Text style={S.h2}>Your ten dimensions, worst first</Text>
          </View>
          {[...dimensionDetails(r)].sort((a, b) => a.healthy - b.healthy)
            .map((d) => <DimCard key={d.construct} d={d} />)}
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={70}>
            <Text style={S.eyebrow}>What is working</Text>
            <Text style={S.h2}>{byKey('helping').title}</Text>
          </View>
          <Lines lines={withoutBullets(byKey('helping').lines)} />
          <PatternCards r={r} kind="help" />
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={70}>
            <Text style={S.eyebrow}>What to watch</Text>
            <Text style={S.h2}>{byKey('harming').title}</Text>
          </View>
          <Lines lines={withoutBullets(byKey('harming').lines)} />
          <PatternCards r={r} kind="harm" />
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={S.eyebrow}>At a glance</Text>
            <Text style={S.h2}>{byKey('strengths').title}</Text>
            <View style={{ marginBottom: 8 }}><ThresholdStrip r={r} /></View>
          </View>
          <Lines lines={byKey('strengths').lines} />
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={80}>
            <Text style={S.eyebrow}>Feel against measure</Text>
            <Text style={S.h2}>{byKey('selfKnowledge').title}</Text>
            <CalibrationScale r={r} />
          </View>
          <Lines lines={byKey('selfKnowledge').lines} />
          <View style={S.gap} />
        </>
        <>
          <View wrap={false} minPresenceAhead={80}>
            <Text style={S.eyebrow}>The constraint</Text>
            <Text style={S.h2}>{byKey('bottleneck').title}</Text>
            <GateGap r={r} />
          </View>
          <Lines lines={byKey('bottleneck').lines} />
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={80}>
            <Text style={S.eyebrow}>Where next</Text>
            <Text style={S.h2}>{byKey('nextStage').title}</Text>
            <NextStagePanel r={r} />
          </View>
          <Lines lines={byKey('nextStage').lines} />
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={S.eyebrow}>Section 10</Text>
            <Text style={S.h2}>{byKey('roadmap').title}</Text>
          </View>
          {r.recommendations.map((rec, i) => (
            <PracticeCard key={i} rec={rec} n={i + 1} />
          ))}
          <View style={S.gap} />
        </>

        <>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={S.eyebrow}>What to do</Text>
            <Text style={S.h2}>{byKey('plan').title}</Text>
          </View>
          <Lines lines={introOnly(byKey('plan').lines)} />
          <Plan r={r} />
          <View style={S.gap} />
        </>

        <SectionBlock s={byKey('evidence')} />

        <Footer title={reportTitle(r.persona)} />
      </Page>

      {/* Business Owner: the two outputs that need a page each, with tables
          whose rows never split across a break. */}
      {isBusiness ? <RiskRegisterPdf r={r} /> : null}
      {isBusiness && r.ninetyDayPlan.length ? <NinetyDayPdf r={r} /> : null}
      {isPastor && (r.formationRoadmap?.length ?? 0) > 0 ? <FormationRoadmapPdf r={r} /> : null}

      {/* Closing */}
      <Page size="A4" style={S.closing}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={BACKDROP} style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE.w, height: PAGE.h * 0.42, opacity: 0.85 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, width: PAGE.w, height: PAGE.h * 0.6, backgroundColor: T.paper, opacity: 0.5 }} />
        <View style={{ flexGrow: 1 }}>
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
          <Text style={{ fontSize: 9, lineHeight: 1.55, color: T.mute, maxWidth: 400 }}>
            {REPORT_DISCLAIMER}{disclaimerExtra(r.persona) ? ` ${disclaimerExtra(r.persona)}` : ''}
          </Text>
        </View>
        <Text style={{ fontFamily: 'Plex', fontSize: 8.5, color: T.mute }}>
          International Center for Applied Neogogy · www.ican.ph
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

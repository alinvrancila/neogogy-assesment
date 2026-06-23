import path from 'path';
import QRCode from 'qrcode';
import { Page, Document, Font, StyleSheet, Text, View, Svg, Path, Polygon, Circle, Line, Rect, Defs, LinearGradient, Stop, Text as SvgText } from '@react-pdf/renderer';
import { dimensions, evidence, roles, microInsights, type RoleId } from '@/data/compass';
import { compute, bandOf, bandHex, vulnList, type Answers, type Baseline, type CompassResult } from '@/lib/engine';

/* ============================================================================
   CONFIGURATION  ·  page size, brand tokens, band ramp (one place)
   ============================================================================ */
const CONFIG = { pageSize: 'A4' as 'A4' | 'LETTER' };
const PAGE = CONFIG.pageSize === 'LETTER' ? { w: 612, h: 792 } : { w: 595.28, h: 841.89 };
const M = 46;
const CW = PAGE.w - M * 2;

const T = {
  dark1: '#5A0D0B', dark2: '#1B0706', // dark-page gradient (deep maroon to near-black)
  paper: '#F2E8DC', paper2: '#FCF8F1',
  ink: '#26201C', mute: '#6A5E54', faint: '#8E8275',
  gold: '#85714E', goldSoft: '#B79F76',
  crimson: '#9E1D20', maroon: '#690F0D',
  line: '#E2D4BF', white: '#FFFFFF', ivory: '#F2E8DC',
  // band ramp
  eroding: '#9E1D20', emerging: '#C58A33', forming: '#3E8C7C', flourish: '#2F6F62'
};

// brightened persona accents for legibility on the dark pages
const ON_DARK: Record<string, string> = { guide: '#5FB4A1', anchor: '#CDB07A', sprinter: '#E06A53', wanderer: '#C3B5A6' };

const PCOLOR: Record<string, string> = { guide: '#2F6F62', anchor: '#85714E', sprinter: '#9E1D20', wanderer: '#7a6b5c' };
// [resilience, readiness] signature per persona
const SIG: Record<string, [string, string]> = { guide: ['High', 'High'], anchor: ['High', 'Low'], sprinter: ['Low', 'High'], wanderer: ['Low', 'Low'] };
// a fuller definition of each persona, since the model is new to most readers
const PERSONA_DEF: Record<string, string> = {
  guide: 'Fluent with AI and growing wiser for it: protected, prepared, and ready to lead others.',
  anchor: 'Independent and not dependent on AI, but not yet equipped with future-ready fluency.',
  sprinter: 'Fast and skilled with AI, while the thinking underneath quietly erodes.',
  wanderer: 'Drifting with AI, neither protecting the mind nor building skill. The most to gain.'
};

/* ============================================================================
   FONTS  ·  embedded (Spectral serif + IBM Plex Mono), no system fallback
   ============================================================================ */
const fontPath = (f: string) => path.join(process.cwd(), 'src', 'fonts', f);
Font.register({
  family: 'Spectral',
  fonts: [
    { src: fontPath('Spectral-Regular.ttf'), fontWeight: 400 },
    { src: fontPath('Spectral-Medium.ttf'), fontWeight: 500 },
    { src: fontPath('Spectral-SemiBold.ttf'), fontWeight: 600 },
    { src: fontPath('Spectral-Bold.ttf'), fontWeight: 700 },
    { src: fontPath('Spectral-ExtraBold.ttf'), fontWeight: 800 }
  ]
});
Font.register({
  family: 'Plex',
  fonts: [
    { src: fontPath('IBMPlexMono-Regular.ttf'), fontWeight: 400 },
    { src: fontPath('IBMPlexMono-Medium.ttf'), fontWeight: 500 },
    { src: fontPath('IBMPlexMono-SemiBold.ttf'), fontWeight: 600 }
  ]
});
Font.registerHyphenationCallback((w) => [w]);

const strip = (s: string) => s.replace(/<[^>]+>/g, '');

/* ============================================================================
   SHARED STYLES
   ============================================================================ */
const S = StyleSheet.create({
  light: { backgroundColor: T.paper, color: T.ink, paddingTop: 40, paddingBottom: 44, paddingHorizontal: M, fontFamily: 'Spectral' },
  body: { fontFamily: 'Spectral', fontWeight: 400, fontSize: 11, lineHeight: 1.55, color: '#3A352F' },
  h1: { fontFamily: 'Spectral', fontWeight: 800, fontSize: 30, color: T.maroon, lineHeight: 1.02 },
  card: { backgroundColor: T.paper2, border: `1pt solid ${T.line}`, borderRadius: 10 },
  footer: { position: 'absolute', bottom: 18, left: M, right: M, fontFamily: 'Plex', fontSize: 6.5, letterSpacing: 0.5, color: T.gold, textAlign: 'center', borderTop: `0.5pt solid ${T.line}`, paddingTop: 6 }
});

const Eyebrow = ({ children, color = T.gold }: { children: string; color?: string }) => (
  <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 8.5, letterSpacing: 2.2, color }}>{children.toUpperCase()}</Text>
);

const Footer = () => (
  <Text style={S.footer} fixed>
    THE NEOGOGY FORMATION COMPASS   ·   ALIN VRANCILA, PH.D.   ·   WWW.ICAN.PH
  </Text>
);

const Banner = ({ eyebrow, title, accent }: { eyebrow: string; title: string; accent: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
    <View style={{ width: 6, height: 34, borderRadius: 3, backgroundColor: accent, marginRight: 13, marginTop: 2 }} />
    <View>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={[S.h1, { marginTop: 3 }]}>{title}</Text>
    </View>
  </View>
);

/* ============================================================================
   SVG PRIMITIVES
   ============================================================================ */
const arcPath = (cx: number, cy: number, r: number, fromDeg: number, toDeg: number, steps = 64) => {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((fromDeg + (toDeg - fromDeg) * (i / steps)) * Math.PI) / 180;
    pts.push(`${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`);
  }
  return 'M ' + pts.join(' L ');
};

/* Ring gauge: circular progress arc filled to score, colored by band, numeral centered */
const RingGauge = ({ value, size, label, onDark = false }: { value: number; size: number; label?: string; onDark?: boolean }) => {
  const cx = size / 2;
  const cy = size / 2;
  const sw = Math.max(5, size * 0.085);
  const r = size / 2 - sw / 2 - 1;
  const color = bandHex(value);
  const track = onDark ? 'rgba(242,232,220,0.16)' : '#EBDDC8';
  const numColor = onDark ? T.ivory : T.maroon;
  const labColor = onDark ? 'rgba(242,232,220,0.7)' : T.gold;
  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={sw} />
        <Path d={arcPath(cx, cy, r, -90, -90 + (value / 100) * 360)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <SvgText x={cx} y={cy + size * 0.11} textAnchor="middle" fill={numColor} style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: size * 0.34 }}>{String(value)}</SvgText>
      </Svg>
      {label ? <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 8, letterSpacing: 1.5, color: labColor, marginTop: 5 }}>{label.toUpperCase()}</Text> : null}
    </View>
  );
};

/* Compass-radar hero: concentric rings, bearing ticks, glowing needle into the quadrant */
const CompassHero = ({ R, size }: { R: CompassResult; size: number }) => {
  const c = size / 2;
  const rings = [0.34, 0.58, 0.82, 1].map((f) => (size / 2 - 6) * f);
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 15 === 0;
    const r1 = size / 2 - 6;
    const r2 = r1 - (long ? 16 : i % 5 === 0 ? 10 : 5);
    ticks.push(<Line key={i} x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1} x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2} stroke={long ? ON_DARK[R.pkey] : 'rgba(242,232,220,0.4)'} strokeWidth={long ? 1.6 : 0.7} />);
  }
  // needle bearing from the scores
  const theta = Math.atan2(R.readiness - 50, R.resilience - 50);
  const len = size / 2 - 26;
  const nx = c + Math.sin(theta) * len;
  const ny = c - Math.cos(theta) * len;
  const acc = ON_DARK[R.pkey];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((rr, i) => <Circle key={i} cx={c} cy={c} r={rr} fill="none" stroke="rgba(242,232,220,0.14)" strokeWidth={i === 3 ? 1.4 : 0.8} />)}
      {ticks}
      {/* needle glow then needle */}
      <Line x1={c} y1={c} x2={nx} y2={ny} stroke={acc} strokeWidth={7} strokeLinecap="round" opacity={0.25} />
      <Line x1={c} y1={c} x2={nx} y2={ny} stroke={acc} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={nx} cy={ny} r={4.5} fill={acc} />
      <Circle cx={c} cy={c} r={9} fill={T.dark2} stroke={acc} strokeWidth={1.4} />
      <Circle cx={c} cy={c} r={3} fill={acc} />
    </Svg>
  );
};

/* Ten-dimension radar (compass geometry). The plotted radius is floored so the
   shape is always visible, and each spoke is labelled with its true score so the
   diagram stays legible even when every dimension is low. */
const DimRadar = ({ R }: { R: CompassResult }) => {
  const size = 226;
  const c = size / 2;
  const rad = c - 36;
  const n = dimensions.length;
  const ang = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const at = (i: number, rr: number) => `${c + Math.cos(ang(i)) * rr},${c + Math.sin(ang(i)) * rr}`;
  const vr = (pct: number) => Math.max(0.07, pct / 100);
  const rings = [0.25, 0.5, 0.75, 1].map((f) => dimensions.map((_, i) => at(i, rad * f)).join(' '));
  const valuePts = dimensions.map((d, i) => at(i, rad * vr(R.dimResults[d.id].pct))).join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((pts, i) => <Polygon key={i} points={pts} fill="none" stroke="#d6cab2" strokeWidth={0.6} />)}
      {dimensions.map((d, i) => {
        const [lx, ly] = at(i, rad).split(',').map(Number);
        return <Line key={i} x1={c} y1={c} x2={lx} y2={ly} stroke={d.axis === 'resilience' ? 'rgba(47,111,98,0.3)' : 'rgba(158,29,32,0.28)'} strokeWidth={0.6} />;
      })}
      <Polygon points={valuePts} fill={`${R.persona.accent}30`} stroke={R.persona.accent} strokeWidth={2} />
      {dimensions.map((d, i) => {
        const [dx, dy] = at(i, rad * vr(R.dimResults[d.id].pct)).split(',').map(Number);
        return <Circle key={d.id} cx={dx} cy={dy} r={2.6} fill={bandHex(R.dimResults[d.id].pct)} />;
      })}
      {dimensions.map((d, i) => {
        const pct = R.dimResults[d.id].pct;
        const [lx, ly] = at(i, rad + 13).split(',').map(Number);
        const anchor = Math.abs(lx - c) < 10 ? 'middle' : lx > c ? 'start' : 'end';
        return <SvgText key={`l${d.id}`} x={lx} y={ly} textAnchor={anchor} fill={d.axis === 'resilience' ? T.forming : T.crimson} style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 6 }}>{`${d.title.split(' ')[0]} ${pct}`}</SvgText>;
      })}
    </Svg>
  );
};

/* Climb visual: altitude is how formed you are. The four personas are stations
   on the slope, the reader's marker shows where they stand, and the summit is
   The Guide. Intuitive "where you are and how far to climb". */
const ClimbViz = ({ R }: { R: CompassResult }) => {
  const W = CW;
  const H = 312;
  const baseY = H - 38;
  const peakY = 34;
  const peakX = W * 0.5;
  const climb = baseY - peakY;
  const clamp = (t: number) => Math.max(0, Math.min(1, t));
  const altY = (t: number) => baseY - clamp(t) * climb;
  const leftX = (t: number) => peakX - (peakX - W * 0.14) * (1 - clamp(t));
  const rightX = (t: number) => peakX + (W * 0.86 - peakX) * (1 - clamp(t));
  const mountain = `${W * 0.05},${baseY} ${W * 0.28},${altY(0.46)} ${W * 0.39},${altY(0.34)} ${peakX},${peakY} ${W * 0.62},${altY(0.38)} ${W * 0.73},${altY(0.52)} ${W * 0.95},${baseY}`;
  const tU = Math.max(0.05, Math.min(0.96, R.overall / 100));
  const onLeft = R.resilience >= R.readiness;
  const ux = onLeft ? leftX(tU) : rightX(tU);
  const uy = altY(tU) - 4;
  const stations = [
    { k: 'wanderer', name: 'The Wanderer', x: peakX, y: altY(0.09) },
    { k: 'anchor', name: 'The Anchor', x: leftX(0.52), y: altY(0.52) },
    { k: 'sprinter', name: 'The Sprinter', x: rightX(0.52), y: altY(0.52) },
    { k: 'guide', name: 'The Guide', x: peakX, y: peakY + 4 }
  ];
  const bandMarks: Array<[string, number]> = [['Flourishing', 80], ['Forming', 60], ['Emerging', 40], ['Eroding', 0]];
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="mtn" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={T.eroding} />
          <Stop offset="0.42" stopColor={T.emerging} />
          <Stop offset="0.64" stopColor={T.forming} />
          <Stop offset="1" stopColor={T.flourish} />
        </LinearGradient>
      </Defs>
      {bandMarks.map(([, v]) => <Line key={`g${v}`} x1={W * 0.04} y1={altY(v / 100)} x2={W * 0.96} y2={altY(v / 100)} stroke="#E2D4BF" strokeWidth={0.6} />)}
      {bandMarks.map(([label, v]) => <SvgText key={`bl${v}`} x={W * 0.965} y={altY(v / 100) - 3} textAnchor="end" fill={T.faint} style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 6.5, letterSpacing: 0.4 }}>{`${label.toUpperCase()}  ${v === 0 ? '0' : v + '+'}`}</SvgText>)}
      <Polygon points={mountain} fill="url(#mtn)" opacity={0.9} />
      <Path d={`M ${peakX} ${baseY} C ${W * 0.3} ${altY(0.32)}, ${W * 0.68} ${altY(0.56)}, ${peakX} ${peakY + 10}`} stroke="rgba(255,255,255,0.6)" strokeWidth={1.6} fill="none" />
      {R.pkey !== 'guide' ? <Line x1={ux} y1={uy} x2={peakX} y2={peakY + 10} stroke={T.ink} strokeWidth={0.8} opacity={0.3} /> : null}
      {/* persona station dots (skip the reader's own; the YOU marker stands in) */}
      {stations.filter((s) => s.k !== R.pkey).map((s) => <Circle key={`d${s.k}`} cx={s.x} cy={s.y} r={3} fill={PCOLOR[s.k]} opacity={0.75} />)}
      {stations.filter((s) => s.k !== R.pkey).map((s) => <SvgText key={`t${s.k}`} x={s.x} y={s.y - 7} textAnchor="middle" fill={PCOLOR[s.k]} style={{ fontFamily: 'Spectral', fontWeight: 600, fontSize: 8 }} opacity={0.8}>{s.name}</SvgText>)}
      {/* summit flag */}
      <Line x1={peakX} y1={peakY + 10} x2={peakX} y2={peakY - 14} stroke={T.maroon} strokeWidth={1.4} />
      <Polygon points={`${peakX},${peakY - 14} ${peakX + 17},${peakY - 9} ${peakX},${peakY - 4}`} fill={T.forming} />
      {/* YOU marker, the reader's own persona, made to stand out */}
      <Circle cx={ux} cy={uy} r={15} fill={R.persona.accent} opacity={0.16} />
      <Circle cx={ux} cy={uy} r={8} fill={R.persona.accent} />
      <Circle cx={ux} cy={uy} r={3} fill={T.white} />
      <SvgText x={ux} y={uy - 25} textAnchor="middle" fill={T.mute} style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 6, letterSpacing: 1.5 }}>YOU ARE HERE</SvgText>
      <SvgText x={ux} y={uy - 13} textAnchor="middle" fill={R.persona.accent} style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 12.5 }}>{R.persona.name}</SvgText>
      <SvgText x={W * 0.5} y={baseY + 14} textAnchor="middle" fill={T.mute} style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 6.5, letterSpacing: 1 }}>BASE · DRIFTING</SvgText>
    </Svg>
  );
};

/* Divergence meter: perceived benefit vs actual effect, gap called out */
const DivergenceMeter = ({ R }: { R: CompassResult }) => {
  const perceived = R.baseline ? Math.round(((R.baseline.b1 - 1) / 4) * 100) : 50;
  const actual = R.overall;
  const W = CW - 40;
  const bar = (label: string, v: number, color: string) => (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 8, letterSpacing: 1, color: T.gold }}>{label}</Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 11, color }}>{v}</Text>
      </View>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: '#EBDDC8' }}>
        <View style={{ height: 12, borderRadius: 6, width: `${Math.max(3, v)}%`, backgroundColor: color }} />
      </View>
    </View>
  );
  return (
    <View style={{ marginTop: 4 }}>
      {bar('HOW HEALTHY IT FELT (PERCEIVED)', perceived, T.gold)}
      {bar('HOW IT ACTUALLY FORMS YOU (MEASURED)', actual, bandHex(actual))}
      <Svg width={W} height={1} viewBox={`0 0 ${W} 1`}><Line x1={0} y1={0} x2={W} y2={0} stroke={T.line} /></Svg>
      <Text style={{ fontFamily: 'Spectral', fontSize: 10.5, color: T.ink, marginTop: 8 }}>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, color: R.illusion >= 2 ? T.crimson : R.illusion <= -1 ? T.forming : T.gold }}>{R.illusion > 0 ? '+' : ''}{R.illusion} gap. </Text>
        {R.illusion >= 2 ? 'It feels considerably better than it actually forms you. That gap is where the real risk lives.' : R.illusion <= -1 ? 'You judged yourself more harshly than the evidence shows. Give yourself credit, then keep building.' : 'Your sense of this and its real effect are well aligned, a genuine strength.'}
      </Text>
    </View>
  );
};

/* QR code to ican.ph, drawn as vector modules */
const QrSvg = ({ text, size }: { text: string; size: number }) => {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const cell = size / n;
  const rects: React.ReactElement[] = [];
  for (let r = 0; r < n; r++) {
    for (let cI = 0; cI < n; cI++) {
      if (data[r * n + cI]) rects.push(<Rect key={`${r}-${cI}`} x={cI * cell} y={r * cell} width={cell + 0.3} height={cell + 0.3} fill={T.ink} />);
    }
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={T.white} />
      {rects}
    </Svg>
  );
};

const BandLegend = () => {
  const items = [['Eroding', '0 to 39', T.eroding], ['Emerging', '40 to 59', T.emerging], ['Forming', '60 to 79', T.forming], ['Flourishing', '80 to 100', T.flourish]];
  return (
    <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
      {items.map(([l, rng, c]) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: c, marginRight: 5 }} />
          <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: T.mute }}>{l} <Text style={{ color: T.faint }}>{rng}</Text></Text>
        </View>
      ))}
    </View>
  );
};

const DimRow = ({ d, pct }: { d: typeof dimensions[number]; pct: number }) => {
  const mi = microInsights[d.id];
  const insight = mi ? (pct >= 60 ? mi.strong : mi.watch) : '';
  return (
    <View style={{ marginBottom: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 700, fontSize: 9.5, color: T.ink }}>{d.title}</Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 10, color: bandHex(pct) }}>{pct} <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 6.5, color: T.gold }}>{bandOf(pct).label.toUpperCase()}</Text></Text>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: '#EBDDC8', marginTop: 2 }}>
        <View style={{ height: 5, borderRadius: 3, width: `${Math.max(3, pct)}%`, backgroundColor: bandHex(pct) }} />
      </View>
      <Text style={{ fontFamily: 'Spectral', fontSize: 7.8, lineHeight: 1.25, color: T.mute, marginTop: 2 }}>{insight}</Text>
    </View>
  );
};

/* ============================================================================
   DOCUMENT
   ============================================================================ */
export const generateNeogogyPdf = async ({
  name,
  role,
  modality,
  result
}: {
  name: string;
  role: string;
  modality: string;
  result: CompassResult;
}) => {
  const R = result;
  const P = R.persona;
  const ACC = P.accent;
  const ACCD = ON_DARK[R.pkey];
  const roleTitle = roles.find((r) => r.id === (role as RoleId))?.name ?? '';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const vulns = vulnList(R);
  const strongest = R.strengths[0];
  const weakest = R.risks[0];
  const nextLabel = R.pkey === 'guide' ? 'Your next step: turn outward' : 'Your next step: toward The Guide';
  const weakerAxis = R.resilience <= R.readiness ? 'Resilience' : 'Readiness';
  const weakerVal = Math.min(R.resilience, R.readiness);
  const directionText = R.pkey === 'guide'
    ? 'You are already at the goal, protected and prepared. Your move now is to turn outward and help others climb toward where you stand.'
    : `Everyone climbs toward the same corner: The Guide, top right, both protected and prepared. To move there, you most need to raise your ${weakerAxis} (now ${weakerVal}). ${weakerAxis === 'Resilience' ? 'Protect your own thinking and judgment even as you lean on AI.' : 'Build genuine, skilled, future-ready capability with AI, rather than avoiding it.'}`;
  const resDims = dimensions.filter((d) => d.axis === 'resilience');
  const reaDims = dimensions.filter((d) => d.axis === 'readiness');
  const meta = [
    ['Prepared for', name || 'You'],
    ['Assessing', modality || 'AI learning, in general'],
    ['Role', roleTitle || 'Explorer'],
    ['Date', dateStr]
  ];

  const DarkBg = () => (
    <View style={{ position: 'absolute', top: 0, left: 0, width: PAGE.w, height: PAGE.h }}>
      <Svg width={PAGE.w} height={PAGE.h} viewBox={`0 0 ${PAGE.w} ${PAGE.h}`}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={T.dark1} />
            <Stop offset="1" stopColor={T.dark2} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={PAGE.w} height={PAGE.h} fill="url(#bg)" />
        {/* faint compass rings bleeding off the lower-left corner */}
        {[120, 200, 280, 360, 440].map((r) => <Circle key={r} cx={-30} cy={PAGE.h + 30} r={r} fill="none" stroke="rgba(242,232,220,0.05)" strokeWidth={1} />)}
        {[120, 200, 280, 360].map((r) => <Circle key={`t${r}`} cx={PAGE.w + 40} cy={-40} r={r} fill="none" stroke="rgba(242,232,220,0.045)" strokeWidth={1} />)}
      </Svg>
    </View>
  );

  const doc = (
    <Document title="The Neogogy Formation Compass" author="Alin Vrancila, Ph.D.">
      {/* ===== PAGE 1: COVER (cinematic, dark) ===== */}
      <Page size={CONFIG.pageSize} style={{ backgroundColor: T.dark2, color: T.ivory, fontFamily: 'Spectral' }}>
        <DarkBg />
        <View style={{ paddingHorizontal: M, paddingTop: 40 }}>
        <Eyebrow color={T.goldSoft}>The Neogogy Formation Compass</Eyebrow>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, marginBottom: -10 }}>
          <CompassHero R={R} size={190} />
        </View>

        <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 10, letterSpacing: 3, color: T.goldSoft, marginTop: 8 }}>YOU ARE</Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 66, color: ACCD, lineHeight: 1, marginTop: 2 }}>{P.name}</Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 500, fontSize: 15, color: T.ivory, marginTop: 12, maxWidth: 360 }}>{P.tagline}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 22, marginTop: 30 }}>
          <RingGauge value={R.overall} size={118} label="Formation index" onDark />
          <RingGauge value={R.resilience} size={78} label="Resilience" onDark />
          <RingGauge value={R.readiness} size={78} label="Readiness" onDark />
        </View>
        </View>

        {/* boarding-pass metadata strip */}
        <View style={{ position: 'absolute', left: M, right: M, bottom: 70, flexDirection: 'row', borderTop: '0.7pt solid rgba(242,232,220,0.25)', borderBottom: '0.7pt solid rgba(242,232,220,0.25)', paddingVertical: 9 }}>
          {meta.map(([l, v], i) => (
            <View key={l} style={{ flex: i === 1 ? 1.5 : 1, paddingHorizontal: 4, borderLeft: i === 0 ? 'none' : '0.7pt solid rgba(242,232,220,0.18)' }}>
              <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 6.5, letterSpacing: 1, color: T.goldSoft }}>{l.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'Plex', fontWeight: 500, fontSize: 9, color: T.ivory, marginTop: 2 }}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={{ position: 'absolute', left: M, right: M, bottom: 30, fontFamily: 'Plex', fontSize: 6.5, letterSpacing: 0.6, color: 'rgba(242,232,220,0.55)', textAlign: 'center' }}>
          Created by Alin Vrancila, Ph.D.   ·   Grounded in the Neogogy framework and peer-reviewed research, 2023 to 2026   ·   www.ican.ph
        </Text>
      </Page>

      {/* ===== PAGE 2: THE FOUR PERSONAS + THE CLIMB (light) ===== */}
      <Page size={CONFIG.pageSize} style={S.light}>
        <Banner eyebrow="The four personas" title="Your climb to The Guide" accent={ACC} />
        <Text style={[S.body, { marginBottom: 10 }]}>Everyone is climbing toward the same summit: The Guide, both protected from AI’s harms and prepared to thrive with it. The higher you stand, the more formed you are. Here is the whole climb, where each of the four personas sits, and exactly where you are right now.</Text>
        <ClimbViz R={R} />

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {(['wanderer', 'anchor', 'sprinter', 'guide'] as const).map((k) => {
            const me = R.pkey === k;
            const chip = (lab: string, val: string) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 6, letterSpacing: 0.5, color: T.faint }}>{lab} </Text>
                <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 6.5, color: val === 'High' ? T.forming : T.crimson }}>{val.toUpperCase()}</Text>
              </View>
            );
            return (
              <View key={k} style={{ flex: me ? 1.34 : 1, backgroundColor: me ? '#FBF1E9' : T.paper2, border: `${me ? 1.8 : 1}pt solid ${me ? PCOLOR[k] : T.line}`, borderRadius: 9, padding: me ? 11 : 9 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: me ? 13.5 : 10.5, color: PCOLOR[k] }}>The {k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                  {me ? <Text style={{ fontFamily: 'Plex', fontWeight: 700, fontSize: 6.5, letterSpacing: 0.8, color: T.white, backgroundColor: PCOLOR[k], borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 6 }}>YOU</Text> : null}
                </View>
                <Text style={{ fontFamily: 'Spectral', fontSize: me ? 8.8 : 8, lineHeight: 1.32, color: me ? T.ink : T.mute, marginBottom: 6 }}>{PERSONA_DEF[k]}</Text>
                <View style={{ flexDirection: 'row' }}>
                  {chip('Res', SIG[k][0])}
                  {chip('Rea', SIG[k][1])}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: ACC, borderRadius: 10, padding: 13, marginTop: 12 }}>
          <Svg width={28} height={28} viewBox="0 0 30 30"><Path d="M 5 15 L 23 15 M 16 8 L 24 15 L 16 22" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 8, letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)' }}>WHICH WAY YOU GROW</Text>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 500, fontSize: 10.5, lineHeight: 1.4, color: '#FFFFFF', marginTop: 3 }}>{directionText}</Text>
          </View>
        </View>
        <Footer />
      </Page>

      {/* ===== PAGE 3: PERSONA DEEP DIVE (light) ===== */}
      <Page size={CONFIG.pageSize} style={S.light}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Banner eyebrow="Who you are right now" title={P.name} accent={ACC} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <RingGauge value={R.resilience} size={44} />
            <RingGauge value={R.readiness} size={44} />
          </View>
        </View>
        <Text style={[S.body, { marginBottom: 11 }]}>{P.portrait}</Text>

        <View style={[S.card, { padding: 12, borderLeft: `4pt solid ${ACC}`, marginBottom: 9 }]}>
          <Eyebrow color={ACC}>What this looks like</Eyebrow>
          <Text style={{ fontFamily: 'Spectral', fontSize: 10, lineHeight: 1.5, color: T.ink, marginTop: 4 }}>{P.looksLike}</Text>
        </View>
        <View style={[S.card, { padding: 12, borderLeft: `4pt solid ${T.emerging}`, backgroundColor: '#FBF4E9', marginBottom: 12 }]}>
          <Eyebrow color={T.emerging}>The research behind this</Eyebrow>
          <Text style={{ fontFamily: 'Spectral', fontSize: 10, lineHeight: 1.5, color: T.ink, marginTop: 4 }}>{P.research.text}</Text>
          <Text style={{ fontFamily: 'Plex', fontSize: 7.5, color: T.gold, marginTop: 4 }}>{P.research.src}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[S.card, { flex: 1, padding: 13, borderTop: `3pt solid ${T.forming}` }]}>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 13, color: T.forming, marginBottom: 9 }}>Strengths</Text>
            {P.strengths.map((s) => (
              <View key={s} style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Spectral', fontWeight: 800, color: T.forming, marginRight: 6, fontSize: 10 }}>+</Text>
                <Text style={{ flex: 1, fontFamily: 'Spectral', fontSize: 9.5, lineHeight: 1.4, color: '#3A352F' }}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={[S.card, { flex: 1, padding: 13, borderTop: `3pt solid ${T.crimson}` }]}>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 13, color: T.crimson, marginBottom: 9 }}>Blind spots</Text>
            {P.blindspots.map((s) => (
              <View key={s} style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Spectral', fontWeight: 800, color: T.crimson, marginRight: 6, fontSize: 10 }}>!</Text>
                <Text style={{ flex: 1, fontFamily: 'Spectral', fontSize: 9.5, lineHeight: 1.4, color: '#3A352F' }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: T.maroon, borderRadius: 10, padding: 15, marginTop: 13 }}>
          <Eyebrow color="#E8B7A0">The pull: what works against you</Eyebrow>
          <Text style={{ fontFamily: 'Spectral', fontWeight: 500, fontSize: 12, lineHeight: 1.5, color: T.ivory, marginTop: 5 }}>{strip(P.pull)}</Text>
        </View>
        <Footer />
      </Page>

      {/* ===== TEN DIMENSIONS (light, showpiece) ===== */}
      <Page size={CONFIG.pageSize} style={S.light}>
        <Banner eyebrow="The full picture" title="Your ten dimensions" accent={ACC} />
        <Text style={{ fontFamily: 'Spectral', fontSize: 9, color: T.mute, marginBottom: 8 }}>One weak dimension can undermine nine strong ones. Every number below carries a one-line read, and the radar shows your whole shape at a glance.</Text>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <BandLegend />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 232, alignItems: 'center', justifyContent: 'center' }}>
            <DimRadar R={R} />
          </View>
          <View style={{ flex: 1, paddingLeft: 14 }}>
            <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 7.5, letterSpacing: 1.5, color: T.forming, marginBottom: 5 }}>RESILIENCE  ·  PROTECTED FROM HARM</Text>
            {resDims.map((d) => <DimRow key={d.id} d={d} pct={R.dimResults[d.id].pct} />)}
            <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 7.5, letterSpacing: 1.5, color: T.crimson, marginTop: 3, marginBottom: 5 }}>READINESS  ·  PREPARED FOR THE FUTURE</Text>
            {reaDims.map((d) => <DimRow key={d.id} d={d} pct={R.dimResults[d.id].pct} />)}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
          <View style={[S.card, { flex: 1, padding: 10, borderLeft: `3pt solid ${T.forming}` }]}>
            <Eyebrow color={T.forming}>Your anchor</Eyebrow>
            <Text style={{ fontFamily: 'Spectral', fontSize: 9, color: T.ink, marginTop: 3 }}>{strongest.dim.title} ({strongest.pct}) is your strongest dimension. Build from it.</Text>
          </View>
          <View style={[S.card, { flex: 1, padding: 10, borderLeft: `3pt solid ${T.crimson}` }]}>
            <Eyebrow color={T.crimson}>Your edge to watch</Eyebrow>
            <Text style={{ fontFamily: 'Spectral', fontSize: 9, color: T.ink, marginTop: 3 }}>{weakest.dim.title} ({weakest.pct}) is where formation is thinnest. Start here.</Text>
          </View>
        </View>
        <Footer />
      </Page>

      {/* ===== PAGE 6: BLIND SPOTS + ILLUSION (light) ===== */}
      <Page size={CONFIG.pageSize} style={S.light}>
        <Banner eyebrow="Read this even if you scored well" title="Your blind spots, named" accent={ACC} />
        <Text style={[S.body, { marginBottom: 10 }]}>A good result is not the same as no risk. These are the vulnerabilities your specific pattern hides, the ways a person can pass and still be exposed.</Text>
        {vulns.map((v) => (
          <View key={v.title} style={{ borderLeft: `3pt solid ${T.emerging}`, backgroundColor: '#FBF4E9', borderRadius: 8, padding: 11, marginBottom: 8 }}>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 11, color: '#8a5a17', marginBottom: 3 }}>{v.title}</Text>
            <Text style={{ fontFamily: 'Spectral', fontSize: 9.5, lineHeight: 1.45, color: T.ink }}>{v.body}</Text>
          </View>
        ))}
        <View style={[S.card, { padding: 14, marginTop: 6 }]}>
          <Eyebrow color={T.gold}>The productivity-illusion meter</Eyebrow>
          <DivergenceMeter R={R} />
        </View>
        <Footer />
      </Page>

      {/* ===== NEXT MOVES (light) ===== ends on the positive, action note */}
      <Page size={CONFIG.pageSize} style={S.light}>
        <Banner eyebrow="From insight to action" title={nextLabel} accent={ACC} />
        <Text style={[S.body, { marginBottom: 16 }]}>{strip(P.nextstep)}</Text>
        {P.moves.map((m, i) => (
          <View key={m} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 13 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: ACC, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ color: T.white, fontFamily: 'Spectral', fontWeight: 800, fontSize: 14 }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontFamily: 'Spectral', fontSize: 11.5, lineHeight: 1.4, color: T.ink }}>{m}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF1EE', borderRadius: 10, padding: 14, marginTop: 8, borderLeft: `4pt solid ${T.forming}` }}>
          <Svg width={26} height={26} viewBox="0 0 26 26"><Path d="M 4 13 L 20 13 M 14 7 L 21 13 L 14 19" fill="none" stroke={T.forming} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          <Text style={{ flex: 1, fontFamily: 'Spectral', fontWeight: 500, fontSize: 10.5, color: T.ink, marginLeft: 10 }}>Every move above raises a real axis of your profile. Small, deliberate shifts compound into formation.</Text>
        </View>
        <Footer />
      </Page>

      {/* ===== CLOSING (dark hero) + EVIDENCE ===== */}
      <Page size={CONFIG.pageSize} style={{ backgroundColor: T.dark2, color: T.ivory, fontFamily: 'Spectral' }}>
        <DarkBg />
        <View style={{ paddingHorizontal: M, paddingTop: 44 }}>
        <Eyebrow color={T.goldSoft}>The one question beneath it all</Eyebrow>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 27, color: T.ivory, lineHeight: 1.12, marginTop: 12, maxWidth: 440 }}>
          Does this way of learning make you stronger or weaker once the machine is set aside?
        </Text>
        <Text style={{ fontFamily: 'Spectral', fontWeight: 400, fontSize: 11, lineHeight: 1.55, color: 'rgba(242,232,220,0.82)', marginTop: 14, maxWidth: 460 }}>
          A way of learning can lift your output on every visible measure while lowering you on every invisible one, and avoiding AI altogether trades one debt for another. Neogogy exists to keep both lines moving the same way, so that as the tools get smarter, you get wiser.
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 22, gap: 16, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(242,232,220,0.06)', borderRadius: 12, padding: 16, flex: 1, border: '0.7pt solid rgba(242,232,220,0.18)' }}>
            <Text style={{ fontFamily: 'Spectral', fontWeight: 800, fontSize: 14, color: ACCD, marginBottom: 5 }}>Keep going</Text>
            <Text style={{ fontFamily: 'Spectral', fontSize: 10, lineHeight: 1.5, color: T.ivory }}>Read Neogogy: Learning at the Speed of Mind and Understanding Neogogy. Bring this instrument to your school, team, or family, or become a Certified Neogogy Educator with ICAN.</Text>
            <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 10, letterSpacing: 1, color: T.ivory, marginTop: 9 }}>WWW.ICAN.PH</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: T.white, borderRadius: 8, padding: 7 }}>
              <QrSvg text="https://www.ican.ph" size={84} />
            </View>
            <Text style={{ fontFamily: 'Plex', fontSize: 6.5, letterSpacing: 1, color: 'rgba(242,232,220,0.7)', marginTop: 6 }}>SCAN TO VISIT</Text>
          </View>
        </View>

        <Text style={{ fontFamily: 'Plex', fontWeight: 600, fontSize: 8, letterSpacing: 2, color: T.goldSoft, marginTop: 22 }}>THE EVIDENCE BASE</Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
          {[evidence.slice(0, Math.ceil(evidence.length / 2)), evidence.slice(Math.ceil(evidence.length / 2))].map((col, ci) => (
            <View key={ci} style={{ flex: 1 }}>
              {col.map((e) => <Text key={e} style={{ fontFamily: 'Spectral', fontSize: 7, lineHeight: 1.4, color: 'rgba(242,232,220,0.72)', marginBottom: 5, paddingLeft: 9, textIndent: -9 }}>{e}</Text>)}
            </View>
          ))}
        </View>
        </View>

        <Text style={{ position: 'absolute', left: M, right: M, bottom: 26, fontFamily: 'Spectral', fontStyle: 'normal', fontSize: 9, color: 'rgba(242,232,220,0.7)', textAlign: 'center' }}>
          Re-take this assessment in a few months to track how your formation moves over time.
        </Text>
      </Page>
    </Document>
  );

  const { renderToStream } = await import('@react-pdf/renderer');
  const stream = await renderToStream(doc);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
};

export const generateNeogogyPdfFromInputs = async (args: {
  name: string;
  role: string;
  modality: string;
  answers: Answers;
  baseline: Baseline | null;
  usageVal: number | null;
}) => {
  const result = compute(args.answers, args.baseline, args.usageVal);
  return generateNeogogyPdf({ name: args.name, role: args.role, modality: args.modality, result });
};

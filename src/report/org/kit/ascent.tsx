/**
 * The ascent map, for a workforce.
 *
 * The individual report's signature drawing is a route climbing a mountain
 * range, with the ten camps along it and the reader placed at their exact
 * index. The organisation report replaced it with a list of bars, which threw
 * away both the recognition and the sense of a climb.
 *
 * This is the same terrain, the same route geometry and the same camps, showing
 * a group instead of a person: how many people stand at each camp, where the
 * middle person is, and how far the middle half of the workforce stretches
 * along the path. A manager who has seen an employee's report recognises this
 * page immediately, which is the point.
 */

import React from 'react';
import path from 'path';
import { Svg, Rect, Circle, Line, Path, Polygon, Text as SvgText, Image, View, Defs, LinearGradient, Stop } from '@react-pdf/renderer';
import { pointAtIndex, routePath, VIEW as MAP, GATE_DEFS } from '@/components/humanAdvantage/ascent/route';
import { STAGES } from '@/engine/config';
import type { GroupResult } from '@/engine/group';

const BACKDROP = path.join(process.cwd(), 'public', 'ascent-backdrop.jpg');

const T = {
  ink: '#2C2621', mute: '#6E6155', oxblood: '#7B2B32', gold: '#B08A3E',
  teal: '#2F6F62', card: '#FBF8F1', hair: '#C9BFAE',
};

export function GroupAscentMap({ g, width }: { g: GroupResult; width: number }) {
  const W = width;
  const H = Math.round((W * MAP.h) / MAP.w);
  const here = pointAtIndex(g.index.median);
  const q1 = pointAtIndex(g.index.q1);
  const q3 = pointAtIndex(g.index.q3);
  const L = 1180;                                  // the route's drawn length
  const at = (v: number) => Math.round((v / 100) * L);
  const byStage = new Map(g.distribution.map((d) => [d.stage, d]));
  const gateStages = new Set(g.gateAnalysis.map((x) => x.stage));

  const pill = `THE MIDDLE PERSON  ${g.index.median.toFixed(1)}`;
  const pillW = Math.round(pill.length * 8.4) + 36;
  const pillX = Math.max(12, Math.min(MAP.w - pillW - 12, here.x - pillW / 2));
  const below = here.y < 250;
  const pillY = below ? here.y + 40 : here.y - 104;

  return (
    <View style={{ width: W, height: H, position: 'relative' }}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={BACKDROP} style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }}>
        <Svg width={W} height={H} viewBox={`0 0 ${MAP.w} ${MAP.h}`}>
          <Defs>
            <LinearGradient id="orgScrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F7F1E4" stopOpacity={0.94} />
              <Stop offset="0.62" stopColor="#F7F1E4" stopOpacity={0.8} />
              <Stop offset="1" stopColor="#F7F1E4" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={MAP.w} height={MAP.h} fill="#F7F1E4" fillOpacity={0.34} />
          <Rect x={0} y={0} width={MAP.w} height={230} fill="url(#orgScrim)" />

          {/* The route: a halo, the path, then the stretch the middle half of
              the workforce occupies, then the travelled portion to the median. */}
          <Path d={routePath()} stroke="#FBF8F1" strokeWidth={11} strokeOpacity={0.75} fill="none" strokeLinecap="round" />
          <Path d={routePath()} stroke="#D7CEC0" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d={routePath()} stroke={T.teal} strokeWidth={13} strokeOpacity={0.22} fill="none"
            strokeLinecap="butt" strokeDasharray={`0,${at(g.index.q1)},${at(g.index.q3) - at(g.index.q1)},${L}`} />
          <Path d={routePath()} stroke={T.teal} strokeWidth={7} fill="none" strokeLinecap="round"
            strokeDasharray={`${at(g.index.median)},${L}`} />

          {/* The camps, each carrying how many people stand there. */}
          {STAGES.map((st) => {
            const p = pointAtIndex(st.minIndex);
            const row = byStage.get(st.stage);
            const n = row?.n ?? 0;
            const isCentre = st.stage === g.centre.stage;
            const reached = g.index.median >= st.minIndex;
            const band = [46, 84, 122][st.stage % 3];
            const lx = Math.max(80, Math.min(MAP.w - 130, p.x));
            const label = row?.stageName ?? st.name;
            const nx = Math.min(lx - Math.min(label.length * 3.4, 100), MAP.w - 78 - label.length * 6.6);
            return (
              <React.Fragment key={st.stage}>
                <Line x1={lx} y1={band + 8} x2={p.x} y2={p.y - 14}
                  stroke={T.hair} strokeWidth={1} strokeDasharray="2,4" />
                <SvgText x={lx - 5} y={band} style={{ fontFamily: 'PlexMono', fontSize: 16 }}
                  fill={isCentre ? T.oxblood : T.mute}>{String(st.stage)}</SvgText>
                <SvgText x={nx} y={band + 20} style={{ fontFamily: 'SourceSerif', fontSize: 15 }}
                  fill={isCentre ? T.oxblood : T.ink}>{label}</SvgText>
                <Circle cx={p.x} cy={p.y} r={n > 0 ? 10 + Math.min(10, n * 0.3) : 6}
                  fill={n > 0 ? T.teal : T.card} fillOpacity={n > 0 ? 0.9 : 1}
                  stroke={isCentre ? T.oxblood : T.hair} strokeWidth={isCentre ? 3 : 1.5} />
                {n > 0 ? (
                  <SvgText x={p.x} y={p.y + 5} textAnchor="middle"
                    style={{ fontFamily: 'PlexMono', fontSize: 13 }} fill="#FBF8F1">{String(n)}</SvgText>
                ) : null}
                {gateStages.has(st.stage) ? (
                  <Polygon points={`${p.x},${p.y + 20} ${p.x + 7},${p.y + 27} ${p.x},${p.y + 34} ${p.x - 7},${p.y + 27}`}
                    fill={T.gold} />
                ) : null}
              </React.Fragment>
            );
          })}

          {/* The middle person, at the exact index rather than at a camp. */}
          <Circle cx={here.x} cy={here.y} r={14} fill={T.card} stroke={T.oxblood} strokeWidth={3} />
          <Circle cx={here.x} cy={here.y} r={6} fill={T.oxblood} />
          <Line x1={here.x} y1={here.y + (below ? 14 : -14)} x2={here.x} y2={here.y + (below ? 40 : -40)}
            stroke={T.oxblood} strokeWidth={2} />
          <Rect x={pillX} y={pillY} width={pillW} height={32} rx={16} fill={T.oxblood} />
          <SvgText x={pillX + 18} y={pillY + 21} style={{ fontFamily: 'PlexMono', fontSize: 14 }} fill="#F7F1E4">
            {pill}
          </SvgText>

          {/* Where the middle half begins and ends, marked on the path. */}
          {[[q1, g.index.q1], [q3, g.index.q3]].map(([pt, v], i) => {
            const point = pt as { x: number; y: number };
            return (
              <Circle key={i} cx={point.x} cy={point.y} r={6} fill={T.card}
                stroke={T.teal} strokeWidth={2.5} />
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

/** The key, printed under the map. */
export const ASCENT_LEGEND =
  'Each camp carries the number of people standing at it. The band along the path is the middle half '
  + 'of your workforce, from the person a quarter of the way up to the person three quarters of the '
  + 'way up, and the ringed marker is the middle person at their exact index rather than at a camp. '
  + 'Gold marks a camp where a practice gate is holding people back.';

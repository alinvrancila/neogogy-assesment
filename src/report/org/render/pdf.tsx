/**
 * A Scene, drawn into a PDF. No chart logic lives here.
 */
import React from 'react';
import { Svg, Rect, Line, Circle, Path, Text as SvgText, G } from '@react-pdf/renderer';
import { C, type Prim, type Scene } from '../scene';

const font = (p: Extract<Prim, { k: 'text' }>) =>
  p.mono ? 'PlexMono' : p.serif ? 'SourceSerif' : 'PlexSans';

const anchorOf = (a?: string) => (a === 'middle' ? 'middle' : a === 'end' ? 'end' : 'start');

function draw(p: Prim, i: number): React.ReactElement | null {
  // An empty label is not a label. react-pdf hands one straight to textkit,
  // which tries to lay out a string with no font resolved and fails with
  // "font.layout is not a function", a message that says nothing about the
  // cause. Four chapters died on a conditional that returned '' rather than
  // omitting the primitive.
  if ((p.k === 'text' || p.k === 'callout') && !p.text.trim()) return null;
  switch (p.k) {
    case 'rect':
      return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r ?? 0}
        fill={p.fill ?? 'none'} stroke={p.stroke} strokeWidth={p.strokeWidth}
        fillOpacity={p.opacity} />;
    case 'line':
      return <Line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
        stroke={p.stroke} strokeWidth={p.strokeWidth ?? 1}
        strokeDasharray={p.dash ? p.dash.join(',') : undefined} strokeOpacity={p.opacity} />;
    case 'circle':
      return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill ?? 'none'}
        stroke={p.stroke} strokeWidth={p.strokeWidth} fillOpacity={p.opacity} />;
    case 'path':
      return <Path key={i} d={p.d} fill={p.fill ?? 'none'} stroke={p.stroke}
        strokeWidth={p.strokeWidth} fillOpacity={p.opacity} />;
    case 'text':
      // react-pdf carries SVG text typography on style rather than on props.
      return <SvgText key={i} x={p.x} y={p.y} fill={p.fill ?? C.ink}
        textAnchor={anchorOf(p.anchor)}
        style={{ fontSize: p.size, fontFamily: font(p), fontWeight: p.weight }}>{p.text}</SvgText>;
    case 'callout':
      // A leader line in the neutral ink, and the label beside it. The band
      // colour stays on the marker the callout points at, never on the label.
      return (
        <G key={i}>
          <Line x1={p.x} y1={p.y} x2={p.toX} y2={p.toY} stroke={C.mute} strokeWidth={0.6} />
          <Circle cx={p.toX} cy={p.toY} r={1.4} fill={C.mute} />
          <SvgText x={p.x} y={p.y - 3} fill={C.mute} textAnchor={anchorOf(p.anchor)}
            style={{ fontSize: 7.2, fontFamily: 'PlexSans' }}>{p.text}</SvgText>
        </G>
      );
    default:
      return null;
  }
}

export const SceneView = ({ scene }: { scene: Scene }) => (
  <Svg width={scene.w} height={scene.h}>
    {scene.prims.map(draw)}
  </Svg>
);

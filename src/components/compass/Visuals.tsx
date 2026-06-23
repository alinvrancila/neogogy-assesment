'use client';

import { useEffect, useId, useState } from 'react';
import { dimensions, axes } from '@/data/compass';
import { bandOf, bandHex, type CompassResult } from '@/lib/engine';

/* ----------------------------------------------------------------------------
   COMPASS GAUGE  ·  semicircular needle gauge, harm (left) to help (right).
   ---------------------------------------------------------------------------- */
export function CompassGauge({ value, size = 380, stroke = 22 }: { value: number; size?: number; stroke?: number }) {
  const gradId = useId();
  const cx = size / 2;
  const cy = size * 0.62;
  const r = size * 0.4;
  const a0 = Math.PI;
  const a1 = 0;
  const pt = (a: number, rr: number): [number, number] => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  const [sx, sy] = pt(a0, r);
  const [ex, ey] = pt(a1, r);

  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const a = a0 + (a1 - a0) * (i / 10);
    const r1 = r + (i % 5 === 0 ? 2 : 6);
    const r2 = r + (i % 5 === 0 ? 16 : 11);
    const [x1, y1] = pt(a, r1);
    const [x2, y2] = pt(a, r2);
    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 5 === 0 ? '#85714E' : '#C9B89B'} strokeWidth={i % 5 === 0 ? 2 : 1.2} />
    );
  }

  return (
    <svg viewBox={`0 0 ${size} ${size * 0.78}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9E1D20" />
          <stop offset="0.5" stopColor="#C58A33" />
          <stop offset="1" stopColor="#2F6F62" />
        </linearGradient>
      </defs>
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke="#EBDDC8" strokeWidth={stroke} strokeLinecap="round" />
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke - 8} strokeLinecap="round" opacity={0.92} />
      {ticks}
      <g className="needle" style={{ transform: `rotate(${(value / 100) * 180 - 90}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - (r - 10)} stroke="#690F0D" strokeWidth={4} strokeLinecap="round" />
        <circle cx={cx} cy={cy - (r - 10)} r={5} fill="#9E1D20" />
      </g>
      <circle cx={cx} cy={cy} r={13} fill="#690F0D" />
      <circle cx={cx} cy={cy} r={6} fill="#F2E8DC" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   QUADRANT MAP  ·  Readiness (x) vs Resilience (y), with the YOU dot and the
   trajectory arrow toward The Guide.
   ---------------------------------------------------------------------------- */
export function QuadrantMap({ result }: { result: CompassResult }) {
  const markerId = useId();
  const W = 720;
  const H = 460;
  const pad = 64;
  const x = pad + (result.readiness / 100) * (W - pad * 2);
  const y = H - pad - (result.resilience / 100) * (H - pad * 2);
  const gx = pad + 0.78 * (W - pad * 2);
  const gy = H - pad - 0.82 * (H - pad * 2);
  const accent = result.persona.accent;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
      <rect x={W / 2} y={pad} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(47,111,98,.08)" />
      <rect x={pad} y={pad} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(133,113,78,.08)" />
      <rect x={W / 2} y={H / 2} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(158,29,32,.07)" />
      <rect x={pad} y={H / 2} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(122,107,92,.07)" />
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#C9B89B" strokeWidth={1.5} />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#C9B89B" strokeWidth={1.5} />
      <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke="#E2D4BF" strokeWidth={1} strokeDasharray="4 5" />
      <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="#E2D4BF" strokeWidth={1} strokeDasharray="4 5" />
      <text x={W * 0.75} y={H * 0.2} textAnchor="middle" fontFamily="Fraunces,serif" fontSize={20} fill="#2F6F62" fontWeight={600}>The Guide</text>
      <text x={W * 0.27} y={H * 0.2} textAnchor="middle" fontFamily="Fraunces,serif" fontSize={20} fill="#85714E" fontWeight={600}>The Anchor</text>
      <text x={W * 0.75} y={H * 0.84} textAnchor="middle" fontFamily="Fraunces,serif" fontSize={20} fill="#9E1D20" fontWeight={600}>The Sprinter</text>
      <text x={W * 0.27} y={H * 0.84} textAnchor="middle" fontFamily="Fraunces,serif" fontSize={20} fill="#7a6b5c" fontWeight={600}>The Wanderer</text>
      <text x={W / 2} y={H - 22} textAnchor="middle" fontFamily="Spline Sans Mono,monospace" fontSize={12} letterSpacing="2" fill="#85714E">READINESS  →  prepared for the future</text>
      <text x={28} y={H / 2} textAnchor="middle" fontFamily="Spline Sans Mono,monospace" fontSize={12} letterSpacing="2" fill="#85714E" transform={`rotate(-90 28 ${H / 2})`}>RESILIENCE  →  protected from harm</text>
      {result.pkey !== 'guide' && (
        <>
          <defs>
            <marker id={markerId} markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6" fill="none" stroke="#690F0D" strokeWidth={1.6} />
            </marker>
          </defs>
          <line x1={x} y1={y} x2={gx} y2={gy} stroke="#690F0D" strokeWidth={1.6} strokeDasharray="2 6" markerEnd={`url(#${markerId})`} opacity={0.7} />
          <circle cx={gx} cy={gy} r={5} fill="none" stroke="#2F6F62" strokeWidth={1.6} />
        </>
      )}
      <circle cx={x} cy={y} r={13} fill={accent} opacity={0.25} />
      <circle cx={x} cy={y} r={7} fill={accent} />
      <text x={x} y={y - 18} textAnchor="middle" fontFamily="Spline Sans Mono,monospace" fontSize={11} fontWeight={600} fill="#26201C">YOU</text>
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   RADAR  ·  ten dimensions, 0-100, hand-rolled SVG (no chart lib).
   ---------------------------------------------------------------------------- */
export function RadarSvg({ result }: { result: CompassResult }) {
  const C = 170;
  const R = 116;
  const labelR = 132;
  const n = dimensions.length;
  const angle = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const ptAt = (i: number, rr: number): [number, number] => [C + Math.cos(angle(i)) * rr, C + Math.sin(angle(i)) * rr];

  const rings = [0.25, 0.5, 0.75, 1].map((f) =>
    dimensions.map((_, i) => ptAt(i, R * f).join(',')).join(' ')
  );
  const valuePts = dimensions.map((d, i) => ptAt(i, R * (result.dimResults[d.id].pct / 100)).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${C * 2} ${C * 2}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(133,113,78,.2)" strokeWidth={0.8} />
      ))}
      {dimensions.map((_, i) => {
        const [lx, ly] = ptAt(i, R);
        return <line key={i} x1={C} y1={C} x2={lx} y2={ly} stroke="rgba(133,113,78,.2)" strokeWidth={0.8} />;
      })}
      <polygon points={valuePts} fill="rgba(158,29,32,.14)" stroke="#9E1D20" strokeWidth={2} />
      {dimensions.map((d, i) => {
        const [dx, dy] = ptAt(i, R * (result.dimResults[d.id].pct / 100));
        return <circle key={d.id} cx={dx} cy={dy} r={2.6} fill="#690F0D" />;
      })}
      {dimensions.map((d, i) => {
        const [lx, ly] = ptAt(i, labelR);
        const anchor = Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end';
        const short = d.title.split(' ')[0];
        return (
          <text key={`l-${d.id}`} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontFamily="Spline Sans,sans-serif" fontSize={9} fill="#6A5E54">
            {short}
          </text>
        );
      })}
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   ICAN MARK  ·  inline SVG emblem (split neural / circuit hemispheres with the
   rising figure). Vector, so it always renders without a file dependency.
   ---------------------------------------------------------------------------- */
export function IcanMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} role="img" aria-label="ICAN">
      {/* left neural hemisphere */}
      <path d="M48 13 A 37 37 0 0 0 48 87" fill="none" stroke="#C9B89B" strokeWidth="1.3" opacity="0.55" />
      <g stroke="#9c844f" strokeWidth="1.3" opacity="0.85">
        <line x1="22" y1="30" x2="34" y2="40" /><line x1="34" y1="40" x2="20" y2="52" /><line x1="34" y1="40" x2="38" y2="62" /><line x1="20" y1="52" x2="30" y2="70" /><line x1="38" y1="62" x2="30" y2="70" /><line x1="22" y1="30" x2="16" y2="44" />
      </g>
      <g fill="#85714E">
        <circle cx="22" cy="30" r="3" /><circle cx="34" cy="40" r="3.4" /><circle cx="20" cy="52" r="3" /><circle cx="38" cy="62" r="3" /><circle cx="30" cy="70" r="3" /><circle cx="16" cy="44" r="2.3" />
      </g>
      {/* right circuit hemisphere */}
      <path d="M52 13 A 37 37 0 0 1 52 87" fill="none" stroke="#9aa0a8" strokeWidth="1.3" opacity="0.55" />
      <g stroke="#5A6068" strokeWidth="1.5" fill="none">
        <path d="M58 34 H 74 V 46" /><path d="M60 50 H 80" /><path d="M58 66 H 70 V 56" /><path d="M64 74 H 76" />
      </g>
      <g fill="#5A6068">
        <circle cx="74" cy="46" r="2.3" /><circle cx="80" cy="50" r="2.3" /><circle cx="70" cy="56" r="2.3" /><circle cx="76" cy="74" r="2.3" />
      </g>
      {/* central rising figure */}
      <circle cx="50" cy="20" r="6" fill="#690F0D" />
      <path d="M50 28 C 44 30 40 40 40 56 L 46 56 C 46 42 48 36 50 34 C 52 36 54 42 54 56 L 60 56 C 60 40 56 30 50 28 Z" fill="#690F0D" />
      {/* spark */}
      <path d="M50 49 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 z" fill="#E8C27A" opacity="0.92" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   ICAN LOGO  ·  served from /public/ican-logo.png; hides itself if absent.
   ---------------------------------------------------------------------------- */
export function IcanLogo({ height = 46, className }: { height?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <IcanMark size={height} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ican-logo.png"
      alt="International Center for Applied Neogogy"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
      onError={() => setFailed(true)}
    />
  );
}

/* ----------------------------------------------------------------------------
   REPORT PREVIEW  ·  a faux "what you get" report cover, shown on the hero so
   visitors see the deliverable rather than a bare gauge.
   ---------------------------------------------------------------------------- */
export function ReportPreview() {
  return (
    <div className="report-preview" aria-hidden="true">
      <div className="rp-page rp-back2" />
      <div className="rp-page rp-back1" />
      <div className="rp-page rp-cover">
        <div className="rp-band">
          <div className="rp-band-eyebrow">The Neogogy Formation Compass</div>
          <div className="rp-band-title">Your Formation Profile</div>
        </div>
        <div className="rp-pad">
          <div className="rp-youare">You are</div>
          <div className="rp-profile">[YOUR PROFILE]</div>
          <div className="rp-tagline">your personal portrait, revealed inside</div>
          <div className="rp-index">
            <div className="rp-index-top"><span className="rp-index-n">78</span><span className="rp-index-lab">Formation index</span></div>
            <div className="rp-indexbar"><span className="rp-indexmark" style={{ left: '78%' }} /></div>
            <div className="rp-indexends"><span className="de">Deforming</span><span className="fo">Forming</span></div>
          </div>
          <div className="rp-stats">
            <div className="rp-stat"><span>78</span><label>Formation</label></div>
            <div className="rp-stat"><span style={{ color: '#2F6F62' }}>82</span><label>Resilience</label></div>
            <div className="rp-stat"><span style={{ color: '#9E1D20' }}>74</span><label>Readiness</label></div>
          </div>
          <div className="rp-meta"><span>Prepared for you</span><span>www.ican.ph</span></div>
        </div>
      </div>
      <div className="rp-badge">Sample report</div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   DIMENSION BARS
   ---------------------------------------------------------------------------- */
export function DimensionBars({ result }: { result: CompassResult }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="dimbars">
      {dimensions.map((d) => {
        const r = result.dimResults[d.id];
        const band = bandOf(r.pct);
        const col = bandHex(r.pct);
        return (
          <div className="dimbar" key={d.id}>
            <div className="dbtop">
              <span className="dbname">{d.title}</span>
              <span className="dbscore">{r.pct}</span>
            </div>
            <div className="dbtrack">
              <div className="dbfill" style={{ width: mounted ? `${r.pct}%` : 0, background: col }} />
            </div>
            <div className="dbband" style={{ color: col }}>
              {band.label} · {axes[d.axis].name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

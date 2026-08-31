/**
 * The Business Owner cover scene, drawn procedurally.
 *
 * A deep navy field with a crimson arc sweeping across it: the dial of a health
 * reading, drawn large and cut off by the page so it reads as a mark rather than
 * a chart. Fine measuring rules, a low skyline of columns, and a teal thread
 * that picks up the accent used through the report.
 *
 * No photograph and no stock imagery. This document gets forwarded to an
 * accountant or a board, and it should look like it was made for that.
 */
export const BW = 1240;
export const BH = 1754;

const NAVY_DEEP = '#111C31';
const NAVY = '#1B2A4A';
const NAVY_LIFT = '#24365C';
const CRIMSON = '#8E2433';
const CRIMSON_LIT = '#C4384A';
const TEAL = '#00D4AA';

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

/** A ring segment, given a centre, a radius and two angles in degrees. */
function arcPath(cx, cy, r, a0, a1, width) {
  const rad = (d) => (d * Math.PI) / 180;
  const p = (ang, rr) => `${(cx + Math.cos(rad(ang)) * rr).toFixed(1)} ${(cy + Math.sin(rad(ang)) * rr).toFixed(1)}`;
  const ro = r + width / 2;
  const ri = r - width / 2;
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return [
    `M ${p(a0, ro)}`,
    `A ${ro} ${ro} 0 ${large} 1 ${p(a1, ro)}`,
    `L ${p(a1, ri)}`,
    `A ${ri} ${ri} 0 ${large} 0 ${p(a0, ri)}`,
    'Z',
  ].join(' ');
}

/** The measuring rules that make the arc read as a scale rather than a swoosh. */
function ticks(cx, cy, r, a0, a1, count) {
  const rad = (d) => (d * Math.PI) / 180;
  const out = [];
  for (let i = 0; i <= count; i += 1) {
    const a = a0 + ((a1 - a0) * i) / count;
    const major = i % 5 === 0;
    const inner = r + (major ? 44 : 30);
    const outer = r + 62;
    out.push(`<line x1="${(cx + Math.cos(rad(a)) * inner).toFixed(1)}" y1="${(cy + Math.sin(rad(a)) * inner).toFixed(1)}" x2="${(cx + Math.cos(rad(a)) * outer).toFixed(1)}" y2="${(cy + Math.sin(rad(a)) * outer).toFixed(1)}" stroke="#F4F6F9" stroke-opacity="${major ? 0.42 : 0.2}" stroke-width="${major ? 2.4 : 1.4}"/>`);
  }
  return out.join('');
}

/** A low run of columns: buildings, ledgers, whatever the reader prefers. */
function columns(baseY, seed) {
  const rand = rng(seed);
  const out = [];
  let x = -40;
  while (x < BW + 40) {
    const w = 34 + rand() * 66;
    const h = 40 + rand() * 190;
    out.push(`<rect x="${x.toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${NAVY_LIFT}" opacity="${(0.4 + rand() * 0.3).toFixed(2)}"/>`);
    x += w + 8 + rand() * 22;
  }
  return out.join('');
}

export function businessCoverSvg() {
  const cx = BW * 0.5;
  const cy = BH * 0.455;
  const r = BW * 0.46;

  const grid = [];
  for (let y = 0; y < BH; y += 46) {
    grid.push(`<line x1="0" y1="${y}" x2="${BW}" y2="${y}" stroke="#F4F6F9" stroke-opacity="0.035" stroke-width="1"/>`);
  }
  for (let x = 0; x < BW; x += 46) {
    grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${BH}" stroke="#F4F6F9" stroke-opacity="0.028" stroke-width="1"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">
  <defs>
    <linearGradient id="ground" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%"   stop-color="${NAVY}"/>
      <stop offset="55%"  stop-color="#182644"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${CRIMSON}"/>
      <stop offset="55%"  stop-color="${CRIMSON_LIT}"/>
      <stop offset="100%" stop-color="${CRIMSON}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="52%">
      <stop offset="0%"   stop-color="${CRIMSON_LIT}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${CRIMSON_LIT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="capTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${NAVY}" stop-opacity="0.92"/>
      <stop offset="66%"  stop-color="${NAVY}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${NAVY}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="capFoot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${NAVY_DEEP}" stop-opacity="0"/>
      <stop offset="45%"  stop-color="${NAVY_DEEP}" stop-opacity="0.42"/>
      <stop offset="72%"  stop-color="${NAVY_DEEP}" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="34"/></filter>
    <filter id="tooth" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="17" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.09"/></feComponentTransfer>
    </filter>
  </defs>

  <rect width="${BW}" height="${BH}" fill="url(#ground)"/>
  <g>${grid.join('')}</g>

  <!-- the dial, cropped by the page so it reads as a mark -->
  <circle cx="${cx}" cy="${cy}" r="${r * 1.1}" fill="url(#glow)" filter="url(#soft)"/>
  <circle cx="${cx}" cy="${cy}" r="${r + 62}" fill="none" stroke="#F4F6F9" stroke-opacity="0.1" stroke-width="1.4"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 78}" fill="none" stroke="${TEAL}" stroke-opacity="0.3" stroke-width="1.6"/>
  ${ticks(cx, cy, r, 128, 412, 40)}
  <path d="${arcPath(cx, cy, r, 128, 300, 26)}" fill="url(#sweep)"/>
  <path d="${arcPath(cx, cy, r, 300, 412, 26)}" fill="#F4F6F9" opacity="0.14"/>
  <circle cx="${(cx + Math.cos((300 * Math.PI) / 180) * r).toFixed(1)}" cy="${(cy + Math.sin((300 * Math.PI) / 180) * r).toFixed(1)}" r="15" fill="${TEAL}"/>

  <!-- a low skyline, so the mark sits on something -->
  <g opacity="0.85">${columns(BH * 0.905, 5)}</g>
  <line x1="0" y1="${BH * 0.905}" x2="${BW}" y2="${BH * 0.905}" stroke="${TEAL}" stroke-opacity="0.42" stroke-width="2"/>

  <!-- the bands the type sits on, faded into the field -->
  <rect x="0" y="0" width="${BW}" height="${BH * 0.3}" fill="url(#capTop)"/>
  <rect x="0" y="${BH * 0.5}" width="${BW}" height="${BH * 0.5}" fill="url(#capFoot)"/>

  <rect width="${BW}" height="${BH}" filter="url(#tooth)" opacity="0.55"/>
</svg>`;
}

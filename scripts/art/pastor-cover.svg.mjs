/**
 * The Minister/Preacher cover scene, drawn procedurally.
 *
 * An arched chapel window with morning light falling through it, over a warm
 * parchment ground. No photograph and no people: this belongs to whoever is
 * holding it. The motif is ministerial without being denominational, and the
 * palette stays ink-light so the type sits over it comfortably.
 */
export const PW = 1240;
export const PH = 1754;

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

/** A gothic arch: two shoulders rising into a point, as a closed path. */
function arch(cx, top, w, h) {
  const half = w / 2;
  const spring = top + h * 0.44;      // where the curve begins
  const base = top + h;
  return [
    `M ${cx - half} ${base}`,
    `L ${cx - half} ${spring}`,
    `Q ${cx - half} ${top + h * 0.06} ${cx} ${top}`,
    `Q ${cx + half} ${top + h * 0.06} ${cx + half} ${spring}`,
    `L ${cx + half} ${base}`,
    'Z',
  ].join(' ');
}

/** Tracery: the vertical mullions and the horizontal transom of a window. */
function tracery(cx, top, w, h) {
  const half = w / 2;
  const base = top + h;
  const lines = [];
  for (const f of [-0.5, 0, 0.5]) {
    const x = cx + half * f;
    lines.push(`<line x1="${x}" y1="${top + h * 0.16}" x2="${x}" y2="${base}" />`);
  }
  for (const f of [0.5, 0.72]) {
    const y = top + h * f;
    lines.push(`<line x1="${cx - half}" y1="${y}" x2="${cx + half}" y2="${y}" />`);
  }
  return lines.join('');
}

export function pastorCoverSvg() {
  const cx = PW / 2;
  const top = PH * 0.2;
  const w = PW * 0.46;
  const h = PH * 0.42;
  const rand = rng(31);

  // dust in the light shaft, the one thing that makes a window feel inhabited
  const motes = Array.from({ length: 90 }, () => {
    const x = cx - w * 0.55 + rand() * w * 1.1;
    const y = top + h * 0.35 + rand() * h * 1.15;
    const r = 0.8 + rand() * 2.4;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#FFF4D8" opacity="${(0.22 + rand() * 0.4).toFixed(2)}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#E9E1D1"/>
      <stop offset="45%"  stop-color="#DED4C0"/>
      <stop offset="100%" stop-color="#CFC3AB"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FFF8E6"/>
      <stop offset="38%"  stop-color="#FBE9BE"/>
      <stop offset="100%" stop-color="#EFCF92"/>
    </linearGradient>
    <linearGradient id="shaft" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%"   stop-color="#FFF0CC" stop-opacity="0.95"/>
      <stop offset="55%"  stop-color="#FFEDC4" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#FFEDC4" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="36%" r="46%">
      <stop offset="0%"   stop-color="#FFF2D6" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#FFF2D6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="40%" r="72%">
      <stop offset="52%"  stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#5A4A30" stop-opacity="0.3"/>
    </radialGradient>
    <linearGradient id="topBand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#F7F2E7" stop-opacity="0.97"/>
      <stop offset="62%"  stop-color="#F7F2E7" stop-opacity="0.86"/>
      <stop offset="100%" stop-color="#F7F2E7" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="footBand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#F7F2E7" stop-opacity="0"/>
      <stop offset="34%"  stop-color="#F7F2E7" stop-opacity="0.72"/>
      <stop offset="52%"  stop-color="#F7F2E7" stop-opacity="0.94"/>
      <stop offset="100%" stop-color="#F7F2E7" stop-opacity="0.97"/>
    </linearGradient>

    <filter id="soften"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="9" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.13"/></feComponentTransfer>
    </filter>
  </defs>

  <rect width="${PW}" height="${PH}" fill="url(#ground)"/>
  <ellipse cx="${cx}" cy="${top + h * 0.5}" rx="${PW * 0.6}" ry="${PH * 0.34}" fill="url(#halo)"/>

  <!-- the light that has already come through, laid on the floor -->
  <g filter="url(#soften)" opacity="0.9">
    <path d="M ${cx - w * 0.46} ${top + h} L ${cx + w * 0.46} ${top + h}
             L ${cx + w * 1.05} ${PH * 0.97} L ${cx - w * 1.02} ${PH * 0.97} Z"
          fill="url(#shaft)"/>
  </g>

  <!-- the window: recess, glass, tracery, then the arch line itself -->
  <path d="${arch(cx, top - 18, w + 40, h + 30)}" fill="#C6B99E" opacity="0.55"/>
  <path d="${arch(cx, top, w, h)}" fill="url(#glass)"/>
  <g stroke="#B3A181" stroke-width="4" opacity="0.7">
    ${tracery(cx, top, w, h)}
  </g>
  <path d="${arch(cx, top, w, h)}" fill="none" stroke="#8E7B58" stroke-width="6"/>

  <!-- a sill, so the window sits in a wall rather than floating -->
  <rect x="${cx - w * 0.68}" y="${top + h}" width="${w * 1.36}" height="16" rx="5" fill="#B9AC91"/>

  ${motes}

  <rect width="${PW}" height="${PH}" fill="url(#vignette)"/>

  <!-- the bands the type sits on, faded into the scene rather than laid over it
       as a hard edged panel -->
  <rect x="0" y="0" width="${PW}" height="${PH * 0.235}" fill="url(#topBand)"/>
  <rect x="0" y="${PH * 0.5}" width="${PW}" height="${PH * 0.5}" fill="url(#footBand)"/>

  <rect width="${PW}" height="${PH}" filter="url(#paper)" opacity="0.5"/>
</svg>`;
}

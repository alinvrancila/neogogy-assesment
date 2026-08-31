/**
 * The Minister/Preacher cover scene: abstract, not literal.
 *
 * Overlapping translucent fields in rich colour, the way light behaves passing
 * through several layers of glass at once. No building, no book, no dove: a
 * report about a person's inner practice should not open on a stock symbol of
 * religion. The palette is deep indigo through plum into amber, with a green
 * thread that carries the accent used through the rest of the report.
 */
export const MW = 1240;
export const MH = 1754;

const INDIGO_DEEP = '#160F2B';
const INDIGO = '#241A46';
const PLUM = '#4A1E48';
const ROSE = '#8C2A46';
const AMBER = '#D98A2B';
const GOLD = '#F0C15C';
const JADE = '#2E6E63';

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

/** A soft lozenge: the shape a beam makes where it lands. */
function lozenge(cx, cy, rx, ry, rot, fill, opacity) {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${fill}" opacity="${opacity}"/>`;
}

export function ministerCoverSvg() {
  const rand = rng(73);
  const cx = MW * 0.5;

  // radiating threads, fine enough to read as texture rather than as a sunburst
  const rays = [];
  const originX = MW * 0.52;
  const originY = MH * 0.12;
  for (let i = 0; i < 26; i += 1) {
    const a = (-24 + (i / 25) * 48) * (Math.PI / 180);
    const len = MH * (0.72 + rand() * 0.24);
    rays.push(`<line x1="${originX}" y1="${originY}" x2="${(originX + Math.sin(a) * len).toFixed(1)}" y2="${(originY + Math.cos(a) * len).toFixed(1)}" stroke="${GOLD}" stroke-opacity="${(0.04 + rand() * 0.07).toFixed(3)}" stroke-width="${(1 + rand() * 2.6).toFixed(1)}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}" height="${MH}" viewBox="0 0 ${MW} ${MH}">
  <defs>
    <linearGradient id="field" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%"   stop-color="${INDIGO}"/>
      <stop offset="46%"  stop-color="${PLUM}"/>
      <stop offset="100%" stop-color="${INDIGO_DEEP}"/>
    </linearGradient>
    <radialGradient id="dawn" cx="52%" cy="26%" r="62%">
      <stop offset="0%"   stop-color="${GOLD}" stop-opacity="0.55"/>
      <stop offset="42%"  stop-color="${AMBER}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${AMBER}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ember" cx="24%" cy="72%" r="46%">
      <stop offset="0%"   stop-color="${ROSE}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${ROSE}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="capTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${INDIGO_DEEP}" stop-opacity="0.9"/>
      <stop offset="70%"  stop-color="${INDIGO_DEEP}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${INDIGO_DEEP}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="capFoot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${INDIGO_DEEP}" stop-opacity="0"/>
      <stop offset="42%"  stop-color="${INDIGO_DEEP}" stop-opacity="0.62"/>
      <stop offset="72%"  stop-color="${INDIGO_DEEP}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${INDIGO_DEEP}" stop-opacity="0.96"/>
    </linearGradient>
    <filter id="blur90"><feGaussianBlur stdDeviation="90"/></filter>
    <filter id="blur38"><feGaussianBlur stdDeviation="38"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="3" seed="21" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.1"/></feComponentTransfer>
    </filter>
  </defs>

  <rect width="${MW}" height="${MH}" fill="url(#field)"/>
  <rect width="${MW}" height="${MH}" fill="url(#dawn)"/>
  <rect width="${MW}" height="${MH}" fill="url(#ember)"/>

  <g>${rays.join('')}</g>

  <!-- overlapping fields of colour, blurred so they read as light rather than shapes -->
  <g filter="url(#blur90)">
    ${lozenge(cx * 0.72, MH * 0.34, MW * 0.42, MH * 0.2, -22, AMBER, 0.34)}
    ${lozenge(cx * 1.34, MH * 0.46, MW * 0.34, MH * 0.17, 16, ROSE, 0.34)}
    ${lozenge(cx * 0.94, MH * 0.6, MW * 0.3, MH * 0.13, -8, JADE, 0.24)}
  </g>
  <g filter="url(#blur38)" opacity="0.55">
    ${lozenge(cx * 1.1, MH * 0.28, MW * 0.16, MH * 0.07, -34, GOLD, 0.5)}
    ${lozenge(cx * 0.62, MH * 0.52, MW * 0.12, MH * 0.05, 24, GOLD, 0.36)}
  </g>

  <!-- three hairlines: the only hard edges on the page -->
  <g stroke="${GOLD}" stroke-opacity="0.3">
    <line x1="0" y1="${MH * 0.395}" x2="${MW}" y2="${MH * 0.372}" stroke-width="1.2"/>
    <line x1="0" y1="${MH * 0.407}" x2="${MW}" y2="${MH * 0.384}" stroke-width="0.8" stroke-opacity="0.18"/>
  </g>
  <line x1="0" y1="${MH * 0.63}" x2="${MW}" y2="${MH * 0.652}" stroke="${JADE}" stroke-opacity="0.34" stroke-width="1.4"/>

  <rect x="0" y="0" width="${MW}" height="${MH * 0.3}" fill="url(#capTop)"/>
  <rect x="0" y="${MH * 0.46}" width="${MW}" height="${MH * 0.54}" fill="url(#capFoot)"/>
  <rect width="${MW}" height="${MH}" filter="url(#grain)" opacity="0.6"/>
</svg>`;
}

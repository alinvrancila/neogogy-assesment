/**
 * Generates the painted ascent backdrop as an SVG string.
 *
 * This is a decorative illustration only. It carries no data: every label,
 * route point and score is drawn live on top of it. Rendering it once to a
 * raster asset lets the same painted scene appear in the web page and in the
 * PDF, since the PDF renderer supports images but not SVG filters.
 */
export const W = 2400;
export const H = 1120;

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

/** A jagged range with sub-peaks, returned as a closed polygon. */
function range({ seed, peaks, baseY, startY, endY, jitter, roughness = 3 }) {
  const rand = rng(seed);
  const left = -200, right = W + 200, span = right - left;
  const pts = [[left, baseY]];
  for (let i = 0; i <= peaks; i++) {
    const t = i / peaks;
    const x = left + span * t;
    const ridge = startY + (endY - startY) * t;
    const isPeak = i % 2 === 0;
    const amp = jitter * (0.5 + rand() * 1.0);
    const y = isPeak ? ridge - amp : ridge + amp * 0.5;
    if (i > 0) {
      // small broken shoulders so edges read as rock rather than zigzag
      for (let k = 1; k <= roughness; k++) {
        const tt = (i - 1 + k / (roughness + 1)) / peaks;
        const xx = left + span * tt;
        const rr = startY + (endY - startY) * tt;
        pts.push([xx, rr + (rand() - 0.35) * jitter * 0.85]);
      }
    }
    pts.push([x, y]);
  }
  pts.push([right, baseY]);
  return pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}

/** Soft snow field clinging to the upper slopes of a range. */
function snow(seed, peaks, startY, endY, jitter) {
  const rand = rng(seed);
  const left = -200, right = W + 200, span = right - left;
  const top = [], bottom = [];
  for (let i = 0; i <= peaks; i++) {
    const t = i / peaks;
    const x = left + span * t;
    const ridge = startY + (endY - startY) * t;
    const isPeak = i % 2 === 0;
    const amp = jitter * (0.5 + rand() * 1.0);
    const y = isPeak ? ridge - amp : ridge + amp * 0.5;
    top.push([x, y]);
    bottom.push([x, y + 40 + rand() * 90]);
  }
  return [...top, ...bottom.reverse()].map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}

export function backdropSvg() {
  const bands = [];
  // haze bands between ranges give aerial perspective
  for (let i = 0; i < 5; i++) {
    const y = 340 + i * 130;
    bands.push(`<rect x="-200" y="${y}" width="${W + 400}" height="150" fill="#EFE6D6" opacity="${0.30 - i * 0.04}" filter="url(#soft)"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FBF6EB"/>
      <stop offset="42%"  stop-color="#F4ECDC"/>
      <stop offset="100%" stop-color="#E9DCC6"/>
    </linearGradient>
    <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D8CEBB"/><stop offset="100%" stop-color="#EAE2D3"/>
    </linearGradient>
    <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C4B7A0"/><stop offset="100%" stop-color="#D8CDB8"/>
    </linearGradient>
    <linearGradient id="r3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#A89876"/><stop offset="100%" stop-color="#C2B396"/>
    </linearGradient>
    <linearGradient id="r4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#867758"/><stop offset="100%" stop-color="#A3936F"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="44%" r="74%">
      <stop offset="58%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#4E3F2A" stop-opacity="0.22"/>
    </radialGradient>

    <filter id="soft"><feGaussianBlur stdDeviation="26"/></filter>

    <!-- painterly edge: displace the silhouette with fractal noise -->
    <filter id="paint" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="paint2" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="19" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <!-- watercolour granulation -->
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="3" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.16"/></feComponentTransfer>
    </filter>

    <!-- dry-brush streaks -->
    <filter id="brush" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="2" seed="11" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.10"/></feComponentTransfer>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>

  <!-- distant ranges, softened by haze -->
  <g filter="url(#paint)">
    <polygon points="${range({ seed: 7,  peaks: 17, baseY: H, startY: 700, endY: 250, jitter: 92 })}"  fill="url(#r1)" opacity="0.85"/>
  </g>
  ${bands[0]}${bands[1]}
  <g filter="url(#paint)">
    <polygon points="${range({ seed: 23, peaks: 13, baseY: H, startY: 800, endY: 330, jitter: 108 })}" fill="url(#r2)" opacity="0.9"/>
  </g>
  <polygon points="${snow(23, 13, 800, 330, 108)}" fill="#F7F2E7" opacity="0.55" filter="url(#paint2)"/>
  ${bands[2]}
  <g filter="url(#paint)">
    <polygon points="${range({ seed: 41, peaks: 10, baseY: H, startY: 880, endY: 430, jitter: 120 })}" fill="url(#r3)" opacity="0.94"/>
  </g>
  <polygon points="${snow(41, 10, 880, 430, 120)}" fill="#F5EFE2" opacity="0.4" filter="url(#paint2)"/>
  ${bands[3]}
  <g filter="url(#paint2)">
    <polygon points="${range({ seed: 67, peaks: 9,  baseY: H, startY: 880, endY: 430, jitter: 132 })}" fill="url(#r4)" opacity="0.96"/>
  </g>
  ${bands[4]}

  <!-- foreground shoulder, darker, gives the valley a floor with detail -->
  <defs>
    <linearGradient id="r5" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6F6247"/><stop offset="100%" stop-color="#8A7B5C"/>
    </linearGradient>
  </defs>
  <g filter="url(#paint2)">
    <polygon points="${range({ seed: 91, peaks: 7, baseY: H + 60, startY: 1090, endY: 760, jitter: 96 })}" fill="url(#r5)" opacity="0.9"/>
  </g>
  <rect x="-200" y="960" width="${W + 400}" height="230" fill="#EFE6D6" opacity="0.16" filter="url(#soft)"/>

  <!-- texture passes -->
  <rect width="${W}" height="${H}" filter="url(#brush)" opacity="0.55" style="mix-blend-mode:multiply"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.75" style="mix-blend-mode:multiply"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

/**
 * Cover variant: the same range at dusk, for the report cover.
 *
 * Deeper, cooler rock against a warm horizon glow, so large light type reads
 * cleanly over the lower two thirds. Still decorative: no data is encoded.
 */
export const CW = 1800;
export const CH = 2546; // A4 proportion

export function coverSvg() {
  function range({ seed, peaks, baseY, startY, endY, jitter, roughness = 3 }) {
    const rand = rng(seed);
    const left = -200, right = CW + 200, span = right - left;
    const pts = [[left, baseY]];
    for (let i = 0; i <= peaks; i++) {
      const t = i / peaks;
      const x = left + span * t;
      const ridge = startY + (endY - startY) * t;
      const isPeak = i % 2 === 0;
      const amp = jitter * (0.5 + rand() * 1.0);
      const y = isPeak ? ridge - amp : ridge + amp * 0.5;
      if (i > 0) {
        for (let k = 1; k <= roughness; k++) {
          const tt = (i - 1 + k / (roughness + 1)) / peaks;
          const xx = left + span * tt;
          const rr = startY + (endY - startY) * tt;
          pts.push([xx, rr + (rand() - 0.35) * jitter * 0.85]);
        }
      }
      pts.push([x, y]);
    }
    pts.push([right, baseY]);
    return pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#23262F"/>
      <stop offset="34%"  stop-color="#3B3730"/>
      <stop offset="58%"  stop-color="#7A5F3C"/>
      <stop offset="72%"  stop-color="#C08B4A"/>
      <stop offset="84%"  stop-color="#8A6636"/>
      <stop offset="100%" stop-color="#2E2A24"/>
    </linearGradient>
    <radialGradient id="sun" cx="66%" cy="72%" r="34%">
      <stop offset="0%"   stop-color="#FFD9A0" stop-opacity="0.95"/>
      <stop offset="45%"  stop-color="#E9A85C" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#E9A85C" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6B5F53"/><stop offset="100%" stop-color="#4A4239"/>
    </linearGradient>
    <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4A4038"/><stop offset="100%" stop-color="#332D28"/>
    </linearGradient>
    <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2E2823"/><stop offset="100%" stop-color="#1D1A17"/>
    </linearGradient>
    <linearGradient id="m4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#171512"/><stop offset="100%" stop-color="#0E0D0B"/>
    </linearGradient>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14161C" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#14161C" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft2"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="paintC" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.010" numOctaves="4" seed="9" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="grainC" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="4" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.13"/></feComponentTransfer>
    </filter>
  </defs>

  <rect width="${CW}" height="${CH}" fill="url(#dusk)"/>
  <rect width="${CW}" height="${CH}" fill="url(#sun)"/>

  <!-- haze above the horizon -->
  <rect x="-100" y="${CH * 0.66}" width="${CW + 200}" height="220" fill="#E7B473" opacity="0.20" filter="url(#soft2)"/>

  <!-- receding ranges, far to near -->
  <g filter="url(#paintC)">
    <polygon points="${range({ seed: 5,  peaks: 15, baseY: CH, startY: CH * 0.80, endY: CH * 0.60, jitter: 120 })}" fill="url(#m1)" opacity="0.75"/>
  </g>
  <rect x="-100" y="${CH * 0.70}" width="${CW + 200}" height="200" fill="#D9A468" opacity="0.16" filter="url(#soft2)"/>
  <g filter="url(#paintC)">
    <polygon points="${range({ seed: 21, peaks: 11, baseY: CH, startY: CH * 0.86, endY: CH * 0.66, jitter: 150 })}" fill="url(#m2)" opacity="0.9"/>
  </g>
  <g filter="url(#paintC)">
    <polygon points="${range({ seed: 47, peaks: 9,  baseY: CH, startY: CH * 0.92, endY: CH * 0.73, jitter: 165 })}" fill="url(#m3)"/>
  </g>
  <g filter="url(#paintC)">
    <polygon points="${range({ seed: 83, peaks: 7,  baseY: CH + 60, startY: CH * 0.99, endY: CH * 0.84, jitter: 150 })}" fill="url(#m4)"/>
  </g>

  <!-- keeps the upper third dark so large light type stays readable -->
  <rect width="${CW}" height="${CH * 0.62}" fill="url(#topShade)"/>
  <rect width="${CW}" height="${CH}" filter="url(#grainC)" opacity="0.7" style="mix-blend-mode:overlay"/>
</svg>`;
}

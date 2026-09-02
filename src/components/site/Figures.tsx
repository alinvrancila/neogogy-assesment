/**
 * Drawn figures for the page.
 *
 * The argument this page makes is not a photographable one. A picture of a
 * laptop says nothing about whether output is rising while capability is not,
 * so these are diagrams rather than decoration: each one carries a claim the
 * surrounding paragraph makes in words, and a reader who only looks at the
 * pictures still gets the argument.
 *
 * All procedural SVG, no external files, and every one is aria-hidden because
 * the text beside it already says what it says.
 */

const C = {
  ink: '#26201C',
  soft: '#6A5E54',
  line: '#E2D4BF',
  maroon: '#690F0D',
  crimson: '#9E1D20',
  gold: '#85714E',
  goldSoft: '#B79F76',
  growth: '#2F6F62',
  amber: '#C58A33',
};

const svg = (extra?: React.CSSProperties): React.SVGProps<SVGSVGElement> => ({
  role: 'presentation', 'aria-hidden': true, focusable: false,
  style: { display: 'block', width: '100%', height: 'auto', ...extra },
});

/* ------------------------------------------------ the two capability curves */

/** AI rises steeply. The question the page asks is what the other line does. */
export function RisingCurves() {
  return (
    <svg viewBox="0 0 460 300" {...svg()}>
      <defs>
        <linearGradient id="fgAi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.crimson} stopOpacity={0.16} />
          <stop offset="1" stopColor={C.crimson} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1="42" y1="258" x2="440" y2="258" stroke={C.line} strokeWidth="1.2" />
      <line x1="42" y1="24" x2="42" y2="258" stroke={C.line} strokeWidth="1.2" />
      <text x="42" y="284" fill={C.soft} fontSize="11" fontFamily="var(--f-mono)">now</text>
      <text x="392" y="284" fill={C.soft} fontSize="11" fontFamily="var(--f-mono)">ahead</text>

      <path d="M 42 244 C 170 236 286 176 440 34 L 440 258 L 42 258 Z" fill="url(#fgAi)" />
      <path d="M 42 244 C 170 236 286 176 440 34" fill="none" stroke={C.crimson} strokeWidth="2.6" strokeLinecap="round" />
      <text x="436" y="26" textAnchor="end" fill={C.crimson} fontSize="14" fontWeight="600" fontFamily="var(--f-display)">AI capability</text>

      <path d="M 42 236 C 150 232 250 226 440 214" fill="none" stroke={C.soft}
        strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" />
      <path d="M 42 236 C 150 224 250 190 440 128" fill="none" stroke={C.growth} strokeWidth="2.6" strokeLinecap="round" />
      <text x="436" y="112" textAnchor="end" fill={C.growth} fontSize="14" fontWeight="600" fontFamily="var(--f-display)">your capability</text>
      <text x="436" y="206" textAnchor="end" fill={C.soft} fontSize="12" fontFamily="var(--f-body)">or this</text>

      <circle cx="42" cy="240" r="5" fill={C.ink} />
      <text x="54" y="216" fill={C.ink} fontSize="12" fontFamily="var(--f-mono)">YOU ARE HERE</text>
    </svg>
  );
}

/* --------------------------------------------------------- the two risks */

/** Not a dial with a correct middle setting. Two failure modes, one practice. */
export function Spectrum() {
  return (
    <svg viewBox="0 0 900 190" {...svg()}>
      <defs>
        <linearGradient id="fgSpec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.crimson} stopOpacity={0.5} />
          <stop offset="0.5" stopColor={C.gold} stopOpacity={0.85} />
          <stop offset="1" stopColor={C.growth} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <rect x="40" y="86" width="820" height="10" rx="5" fill="url(#fgSpec)" />

      {[[130, 'Dependence', 'output high, capability thin', C.crimson],
        [450, 'Capable and intentional', 'you choose, and you can still do it', C.gold],
        [770, 'Disconnection', 'capability held, fluency undeveloped', C.growth]].map(
        ([x, label, note, col], i) => (
          <g key={String(label)}>
            <circle cx={x as number} cy="91" r={i === 1 ? 13 : 9} fill="#fff" stroke={col as string}
              strokeWidth={i === 1 ? 3.2 : 2.2} />
            {i === 1 ? <circle cx={x as number} cy="91" r="5" fill={col as string} /> : null}
            <text x={x as number} y="52" textAnchor="middle" fill={col as string}
              fontSize={i === 1 ? 19 : 17} fontWeight="600" fontFamily="var(--f-display)">{label}</text>
            <text x={x as number} y="132" textAnchor="middle" fill={C.soft} fontSize="12.5"
              fontFamily="var(--f-body)">{note}</text>
          </g>
        ))}

      <text x="450" y="168" textAnchor="middle" fill={C.soft} fontSize="12" fontFamily="var(--f-mono)"
        letterSpacing="1.6">NOT A SETTING ON A DIAL</text>
    </svg>
  );
}

/* ------------------------------------------------------- output and capability */

/** What a reader sees sits above the line. What the assessment reads sits under it. */
export function SurfaceDepth() {
  const above = ['Speed', 'Polished output', 'More content', 'Instant answers'];
  const below = ['Judgment', 'Memory', 'Independent capability', 'Verification', 'Authorship', 'Transfer'];
  return (
    <svg viewBox="0 0 520 400" {...svg()}>
      <defs>
        <linearGradient id="fgDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ink} stopOpacity={0.06} />
          <stop offset="1" stopColor={C.ink} stopOpacity={0.14} />
        </linearGradient>
      </defs>

      <text x="20" y="28" fill={C.soft} fontSize="15" fontFamily="var(--f-mono)" letterSpacing="1.5">EASY TO SEE</text>
      {above.map((t, i) => (
        <text key={t} x="20" y={64 + i * 30} fill={C.ink} fontSize="20" fontFamily="var(--f-body)">{t}</text>
      ))}

      <rect x="0" y="168" width="520" height="232" fill="url(#fgDeep)" />
      <line x1="0" y1="168" x2="520" y2="168" stroke={C.gold} strokeWidth="1.6" />
      <text x="500" y="158" textAnchor="end" fill={C.gold} fontSize="15" fontFamily="var(--f-mono)"
        letterSpacing="1.4">THE SURFACE</text>

      <text x="20" y="204" fill={C.soft} fontSize="15" fontFamily="var(--f-mono)" letterSpacing="1.5">HARDER TO SEE</text>
      {below.map((t, i) => (
        <text key={t} x="20" y={242 + i * 27} fill={C.maroon} fontSize="23" fontWeight="600"
          fontFamily="var(--f-display)">{t}</text>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------- the research */

/** 92 percent use it. A ring reads faster than the number alone. */
export function StatRing({ pct = 92 }: { pct?: number }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" {...svg({ width: 108 })}>
      <circle cx="60" cy="60" r={r} fill="none" stroke={C.line} strokeWidth="11" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={C.maroon} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="26" fill="none" stroke={C.line} strokeWidth="1" />
    </svg>
  );
}

/** 17 percent worse: two bars, the assisted one shorter where it counts. */
export function StatDrop() {
  return (
    <svg viewBox="0 0 120 120" {...svg({ width: 108 })}>
      <line x1="14" y1="104" x2="112" y2="104" stroke={C.line} strokeWidth="1.4" />
      <rect x="26" y="30" width="30" height="74" rx="3" fill={C.growth} opacity="0.75" />
      <rect x="70" y="61" width="30" height="43" rx="3" fill={C.crimson} />
      <path d="M 56 26 L 70 57" stroke={C.crimson} strokeWidth="2" strokeDasharray="3 3" />
      <path d="M 70 57 l -1 -8 l 8 4 z" fill={C.crimson} />
      <text x="41" y="118" textAnchor="middle" fill={C.soft} fontSize="10" fontFamily="var(--f-mono)">no AI</text>
      <text x="85" y="118" textAnchor="middle" fill={C.soft} fontSize="10" fontFamily="var(--f-mono)">chatbot</text>
    </svg>
  );
}

/** Twice the gains: the same technology, pointed at learning. */
export function StatRise() {
  return (
    <svg viewBox="0 0 120 120" {...svg({ width: 108 })}>
      <line x1="14" y1="104" x2="112" y2="104" stroke={C.line} strokeWidth="1.4" />
      <rect x="26" y="66" width="30" height="38" rx="3" fill={C.soft} opacity="0.5" />
      <rect x="70" y="22" width="30" height="82" rx="3" fill={C.growth} />
      <path d="M 56 62 L 70 26" stroke={C.growth} strokeWidth="2" strokeDasharray="3 3" />
      <path d="M 70 26 l -7 1 l 4 7 z" fill={C.growth} />
      <text x="41" y="118" textAnchor="middle" fill={C.soft} fontSize="10" fontFamily="var(--f-mono)">usual</text>
      <text x="85" y="118" textAnchor="middle" fill={C.soft} fontSize="10" fontFamily="var(--f-mono)">designed</text>
    </svg>
  );
}

/* ------------------------------------------------------- the two questions */

/** Left: the tools are gone. Right: the tools are far better. Same person. */
export function TwoStates({ side }: { side: 'alone' | 'amplified' }) {
  const tint = side === 'alone' ? C.maroon : C.growth;
  return (
    <svg viewBox="0 0 300 150" {...svg()}>
      <line x1="20" y1="126" x2="280" y2="126" stroke={C.line} strokeWidth="1.4" />
      {side === 'alone' ? (
        <>
          {[70, 110, 150, 190, 230].map((x, i) => (
            <g key={x} opacity={0.16}>
              <rect x={x - 13} y={70 + i % 2 * 6} width="26" height="26" rx="4" fill="none"
                stroke={C.soft} strokeWidth="1.4" strokeDasharray="3 4" />
            </g>
          ))}
          <circle cx="150" cy="58" r="11" fill={tint} />
          <path d="M 150 71 L 150 108 M 150 80 L 133 96 M 150 80 L 167 96 M 150 108 L 138 126 M 150 108 L 162 126"
            stroke={tint} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {[[60, 44], [96, 30], [240, 44], [204, 30]].map(([x, y], i) => (
            <g key={i}>
              <line x1="150" y1="72" x2={x} y2={y} stroke={tint} strokeOpacity={0.34} strokeWidth="1.4" />
              <circle cx={x} cy={y} r={i % 2 ? 7 : 10} fill="none" stroke={tint} strokeWidth="1.8" />
            </g>
          ))}
          <circle cx="150" cy="26" r="20" fill="none" stroke={tint} strokeWidth="1.6" strokeDasharray="3 5" />
          <circle cx="150" cy="58" r="11" fill={tint} />
          <path d="M 150 71 L 150 108 M 150 80 L 133 96 M 150 80 L 167 96 M 150 108 L 138 126 M 150 108 L 162 126"
            stroke={tint} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

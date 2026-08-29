'use client';

/**
 * Charts for the second half of the report.
 *
 * The narrative engine supplies every word and every number; these components
 * only decide how they are drawn. Each one exists because a specific block was
 * previously a wall of prose that a reader had to parse to find their own
 * result.
 */

import type { CompassResult, DimensionDetail } from '@/engine';
import { CONSTRUCTS, STAGES } from '@/engine/config';
import { bandColor, bandTextColor } from './Visuals';

const stateWord = (s: DimensionDetail['microState']) =>
  s === 'strong' ? 'Strength' : s === 'developing' ? 'Developing' : 'Needs attention';

/* ------------------------------------------------- score ring for a card */

function ScoreRing({ value, healthy, size = 74 }: { value: number; healthy: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, value)) / 100;
  const col = bandColor(healthy);
  const textCol = bandTextColor(healthy);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="score-ring">
      <circle cx={c} cy={c} r={r} fill="none" stroke="#EDE5D7" strokeWidth={7} />
      <circle
        cx={c} cy={c} r={r} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={`${circ * filled} ${circ}`} transform={`rotate(-90 ${c} ${c})`}
      />
      <text x={c} y={c + 5} textAnchor="middle" className="score-ring-n" fill={textCol}>{value}</text>
    </svg>
  );
}

/* --------------------------------------- the ten dimensions, as cards */

/**
 * Replaces ten stacked prose blocks. Each card leads with the number, the
 * state in words, and where the score sits against the strength and
 * vulnerability lines, so a reader can scan for their own weak points.
 */
export function DimensionCards({ details }: { details: DimensionDetail[] }) {
  const ordered = [...details].sort((a, b) => a.healthy - b.healthy);
  return (
    <div className="dimcards">
      {ordered.map((d) => (
        <article className={`dimcard state-${d.microState}`} key={d.construct}>
          <header className="dimcard-head">
            <ScoreRing value={d.shown} healthy={d.healthy} />
            <div className="dimcard-title">
              <h4>{d.label}</h4>
              <div className="dimcard-chips">
                <span className={`chip-state state-${d.microState}`}>{stateWord(d.microState)}</span>
                {d.confidence !== 'high' ? <span className="chip-conf">{d.confidence}</span> : null}
                {d.flaggedGap ? <span className="chip-gap">said vs did</span> : null}
              </div>
              {d.independentCapability !== undefined ? (
                <p className="dimcard-inverse">
                  Lower is healthier here. Independent capability {d.independentCapability}.
                </p>
              ) : null}
            </div>
          </header>

          {/* where this score sits between the two lines the report uses */}
          <div className="dimcard-scale" aria-hidden="true">
            <span className="sc-track">
              <span className="sc-fill" style={{ width: `${Math.max(2, d.healthy)}%`, background: bandColor(d.healthy) }} />
              <b className="sc-mark sc-vuln" style={{ left: '45%' }} />
              <b className="sc-mark sc-strong" style={{ left: '65%' }} />
            </span>
            <span className="sc-legend"><i /> 45 needs attention below · 65 strength above</span>
          </div>

          <dl className="dimcard-body">
            <div><dt>What it measures</dt><dd>{d.whatItMeasures}</dd></div>
            <div><dt>Your reading</dt><dd>{d.reading}</dd></div>
            <div><dt>Why it matters</dt><dd>{d.whyItMatters}</dd></div>
          </dl>

          <details className="dimcard-more">
            <summary>What moves it, and the research</summary>
            <ul>{d.practices.map((p, i) => <li key={i}>{p}</li>)}</ul>
            <p className="dimcard-res">{d.research.claim} <em>({d.research.source})</em></p>
          </details>
        </article>
      ))}
    </div>
  );
}

/* ----------------------------------------------- fingerprint as meters */

export function FingerprintMeters({ readings }: { readings: Array<{ level: string; label: string }> }) {
  const pos = (lvl: string) => {
    const l = lvl.toLowerCase();
    if (l === 'high' || l === 'strong') return 88;
    if (l === 'moderate' || l === 'stable') return 58;
    if (l === 'low-moderate') return 40;
    if (l === 'elevated') return 78;
    return 20; // low, weak
  };
  // Dependency reads the other way: elevated is a concern, not an achievement.
  const healthyFor = (label: string, p: number) => (/dependency/i.test(label) ? 100 - p : p);
  return (
    <div className="fingerprint">
      {readings.map((r) => {
        const p = pos(r.level);
        const col = bandColor(healthyFor(r.label, p));
        return (
          <div className="fp-row" key={r.label}>
            <span className="fp-label">{r.label}</span>
            <span className="fp-track"><span style={{ width: `${p}%`, background: col }} /></span>
            <span className="fp-level" style={{ color: bandTextColor(healthyFor(r.label, p)) }}>{r.level}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------- bottleneck gate */

export function GateGap({ result }: { result: CompassResult }) {
  if (result.bottleneck.saturated) return null;
  const c = result.bottleneck.construct;
  const d = result.dimensions[c];
  const next = result.nextTarget.stage;

  // The first stage at or above the next one that actually gates on this
  // dimension tells us the number to clear.
  let required: number | undefined;
  let requiredStage: number | undefined;
  for (const st of STAGES) {
    if (st.stage < next) continue;
    const g = st.gates as Record<string, number> | undefined;
    if (g && g[c] !== undefined) { required = g[c]; requiredStage = st.stage; break; }
  }
  const gap = required !== undefined ? Math.max(0, Math.round((required - d.score) * 10) / 10) : undefined;

  return (
    <div className="gategap">
      <div className="gg-head">
        <span className="gg-name">{CONSTRUCTS[c].name}</span>
        <span className="gg-now" style={{ color: bandTextColor(d.score) }}>{d.score}</span>
      </div>
      <div className="gg-track">
        <span className="gg-fill" style={{ width: `${Math.max(2, d.score)}%`, background: bandColor(d.score) }} />
        {required !== undefined ? <b className="gg-req" style={{ left: `${required}%` }} /> : null}
      </div>
      <div className="gg-labels">
        <span>you are here</span>
        {required !== undefined ? <span>stage {requiredStage} needs {required}</span> : null}
      </div>
      <p className="gg-note">
        {gap !== undefined && gap > 0
          ? `This is the single reading doing most to hold your position. About ${gap} points of movement here is what opens the way up.`
          : 'This is the single reading doing most to hold your position.'}
      </p>
    </div>
  );
}

/* --------------------------------- strengths and vulnerabilities strip */

export function ThresholdStrip({ result }: { result: CompassResult }) {
  const rows = Object.values(result.dimensions).map((d) => ({
    name: CONSTRUCTS[d.construct].reportedAsRisk ? 'Dependency Risk' : CONSTRUCTS[d.construct].name,
    healthy: d.score,
    shown: CONSTRUCTS[d.construct].reportedAsRisk ? d.reportedScore : d.score,
  })).sort((a, b) => a.healthy - b.healthy);

  return (
    <div className="tstrip">
      <div className="ts-scale" aria-hidden="true">
        <span className="ts-zones">
          <span className="ts-zone ts-watch">needs attention</span>
          <span className="ts-zone ts-dev">developing</span>
          <span className="ts-zone ts-strong">strength</span>
        </span>
      </div>
      {rows.map((r) => (
        <div className="ts-row" key={r.name}>
          <span className="ts-name">{r.name}</span>
          <span className="ts-track">
            <b className="ts-line ts-l45" />
            <b className="ts-line ts-l65" />
            <span className="ts-dot" style={{ left: `${r.healthy}%`, background: bandColor(r.healthy) }} />
          </span>
          <span className="ts-val" style={{ color: bandTextColor(r.healthy) }}>{r.shown}</span>
        </div>
      ))}
      <p className="ts-note">
        Plotted on the healthy reading, so Dependency Risk sits by its independent capability rather
        than by the risk number. Below 45 is named a vulnerability, above 65 a strength.
      </p>
    </div>
  );
}

/* ------------------------------------------------- self-knowledge scale */

export function CalibrationScale({ result }: { result: CompassResult }) {
  const { desirabilityGap, calibrationGap } = result.calibration;
  const idx = result.stage.rawIndex;
  // The same band ladder the engine uses for the gaps.
  const measured = idx >= 80 ? 5 : idx >= 62 ? 4 : idx >= 44 ? 3 : idx >= 26 ? 2 : 1;
  const clamp = (b: number) => Math.max(1, Math.min(5, b));

  const rows: Array<{ key: string; label: string; band: number; note: string; tone: string }> = [];
  if (desirabilityGap !== undefined) {
    rows.push({
      key: 'felt', label: 'How it felt', band: clamp(measured + desirabilityGap),
      note: 'Before any questions', tone: 'felt',
    });
  }
  if (calibrationGap !== undefined) {
    rows.push({
      key: 'pred', label: 'What you predicted', band: clamp(measured + calibrationGap),
      note: 'Your own forecast', tone: 'pred',
    });
  }
  rows.push({
    key: 'meas', label: 'What your answers measured', band: measured,
    note: 'The result', tone: 'meas',
  });

  const BANDS = ['Lowest', 'Lower', 'Middle', 'Higher', 'Highest'];

  return (
    <div className="calib">
      {/* Each reading gets its own row, so two markers on the same band can
          never sit on top of one another. */}
      {rows.map((r) => (
        <div className={`cal-row tone-${r.tone}`} key={r.key}>
          <span className="cal-label">
            {r.label}
            <em>{r.note}</em>
          </span>
          <span className="cal-scale" role="img" aria-label={`${r.label}: band ${r.band} of 5`}>
            {[1, 2, 3, 4, 5].map((b) => (
              <span key={b} className={`cal-seg${b === r.band ? ' is-on' : ''}`}>
                {b === r.band ? <b /> : null}
              </span>
            ))}
          </span>
          <span className="cal-band">{BANDS[r.band - 1]}</span>
        </div>
      ))}
      <div className="cal-axis" aria-hidden="true">
        {BANDS.map((b) => <span key={b}>{b}</span>)}
      </div>
      <p className="cal-note">
        Three readings on one five band scale: how healthy your relationship with AI felt before you
        started, where you predicted you would land, and where your answers actually placed you. The
        first two were never scored.
      </p>
    </div>
  );
}

/* -------------------------------------------------------- pattern cards */

export function PatternCards({ result, kind }: { result: CompassResult; kind: 'help' | 'harm' }) {
  const hits = result.patterns.filter((p) => (kind === 'help' ? p.kind === 'help' : p.kind === 'harm'));
  if (!hits.length) return null;
  return (
    <div className={`patterns ${kind}`}>
      {hits.map((p) => (
        <div className="pattern" key={p.id}>
          <span className="pat-mark" aria-hidden="true">{kind === 'help' ? '↑' : '↓'}</span>
          <div>
            <h4>{p.label}</h4>
            <p>{p.narrative}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

/**
 * Charts for the admin dashboard.
 *
 * Presentational only. Every number arrives already computed by
 * src/lib/analytics.ts, and every chart states the n it was drawn from,
 * because a distribution over four people is a different claim from one over
 * four hundred.
 */

import type { ReactNode } from 'react';

export const bandColor = (healthy: number) =>
  healthy >= 65 ? '#159E88' : healthy >= 40 ? '#E5AA45' : '#CF796E';

export function Card({ title, hint, right, children }: {
  title: string; hint?: string; right?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="admin-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="admin-strong font-serif text-lg">{title}</h3>
          {hint ? <p className="admin-muted mt-1 text-xs leading-relaxed">{hint}</p> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Kpi({ label, value, sub, tone }: {
  label: string; value: string | number; sub?: string; tone?: 'good' | 'watch' | 'bad';
}) {
  const color = tone === 'good' ? '#159E88' : tone === 'bad' ? '#CF796E' : tone === 'watch' ? '#C08A2E' : undefined;
  return (
    <div className="admin-card rounded-2xl p-4">
      <div className="admin-muted text-[11px] uppercase tracking-[0.14em]">{label}</div>
      <div className="mt-1 font-serif text-3xl font-bold" style={color ? { color } : undefined}>{value}</div>
      {sub ? <div className="admin-muted mt-1 text-xs leading-snug">{sub}</div> : null}
    </div>
  );
}

/** Horizontal distribution, used for stages, archetypes, personas and usage. */
export function BarList({ rows, total, colorFor }: {
  rows: Array<{ label: string; count: number; hint?: string }>;
  total: number;
  colorFor?: (row: { label: string; count: number }, i: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={r.label} className="grid grid-cols-[minmax(96px,180px)_1fr_52px] items-center gap-3">
          <div className="truncate text-xs" title={r.label}>{r.label}</div>
          <div className="h-2.5 rounded-full" style={{ background: 'rgba(128,116,100,0.18)' }}>
            <div
              className="h-2.5 rounded-full"
              style={{ width: `${(r.count / max) * 100}%`, background: colorFor ? colorFor(r, i) : '#159E88' }}
            />
          </div>
          <div className="admin-muted text-right font-mono text-xs">
            {r.count}
            {total ? <span className="opacity-60"> · {Math.round((r.count / total) * 100)}%</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dimension means with the interquartile range drawn as a band. */
export function SpreadChart({ rows }: {
  rows: Array<{ name: string; reportedAsRisk: boolean; stat: { n: number; mean: number; p25: number; p75: number; min: number; max: number }; watchShare: number }>;
}) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.name} className="grid grid-cols-[minmax(120px,190px)_1fr_92px] items-center gap-3">
          <div className="truncate text-xs" title={r.name}>
            {r.name}
            {r.reportedAsRisk ? <span className="admin-muted"> (as capability)</span> : null}
          </div>
          <div className="relative h-5">
            <div className="absolute inset-x-0 top-2 h-1 rounded" style={{ background: 'rgba(128,116,100,0.18)' }} />
            {/* interquartile range: where the middle half of people sit */}
            <div
              className="absolute top-1.5 h-2 rounded"
              style={{
                left: `${r.stat.p25}%`, width: `${Math.max(1, r.stat.p75 - r.stat.p25)}%`,
                background: 'rgba(128,116,100,0.35)',
              }}
            />
            <div
              className="absolute top-0 h-5 w-[3px] rounded"
              style={{ left: `${r.stat.mean}%`, background: bandColor(r.stat.mean) }}
              title={`mean ${r.stat.mean}`}
            />
          </div>
          <div className="text-right font-mono text-xs" style={{ color: bandColor(r.stat.mean) }}>
            {r.stat.mean}
            <span className="admin-muted opacity-70"> · {r.watchShare}% watch</span>
          </div>
        </div>
      ))}
      <p className="admin-muted pt-1 text-[11px] leading-relaxed">
        The bar is the mean, the shaded band the middle half of respondents. Dependency Risk is shown
        by independent capability so that higher is healthier on every row.
      </p>
    </div>
  );
}

/** Persona against dimension, as a heat grid. */
export function Heatmap({ personas, dims, dimLabels }: {
  personas: Array<{ persona: string; n: number; index: number; dims: Record<string, number> }>;
  dims: string[];
  dimLabels: Record<string, string>;
}) {
  const cell = (v: number) => {
    const c = bandColor(v);
    const alpha = 0.18 + Math.min(1, Math.max(0, v / 100)) * 0.62;
    return { background: c, opacity: alpha };
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="admin-muted sticky left-0 z-10 bg-transparent p-1 text-left font-normal">Persona</th>
            {dims.map((d) => (
              <th key={d} className="admin-muted p-1 text-center font-normal">
                <span className="inline-block max-w-[74px] truncate" title={dimLabels[d]}>{dimLabels[d]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personas.map((p) => (
            <tr key={p.persona}>
              <td className="admin-strong sticky left-0 z-10 p-1 font-medium capitalize">
                {p.persona}
                <span className="admin-muted font-mono"> ({p.n})</span>
              </td>
              {dims.map((d) => (
                <td key={d} className="p-0.5">
                  <div className="relative h-8 rounded" title={`${p.persona} · ${dimLabels[d]}: ${p.dims[d]}`}>
                    <div className="absolute inset-0 rounded" style={cell(p.dims[d])} />
                    <span className="relative flex h-8 items-center justify-center font-mono text-[10px]">
                      {Math.round(p.dims[d])}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="admin-muted pt-2 text-[11px]">
        Mean score per dimension within each persona, plotted so that higher and greener is healthier.
      </p>
    </div>
  );
}

/** A person's index across attempts. */
export function Sparkline({ points, width = 260, height = 64 }: {
  points: Array<{ at: string; index: number }>; width?: number; height?: number;
}) {
  if (points.length < 2) {
    return <p className="admin-muted text-xs">A second attempt is needed before movement can be shown.</p>;
  }
  const xs = points.map((_, i) => (i / (points.length - 1)) * (width - 16) + 8);
  const ys = points.map((p) => height - 10 - (Math.max(0, Math.min(100, p.index)) / 100) * (height - 20));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'} ${x} ${ys[i]}`).join(' ');
  const rising = points[points.length - 1].index >= points[0].index;
  const col = rising ? '#159E88' : '#CF796E';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`Index across ${points.length} attempts, from ${points[0].index} to ${points[points.length - 1].index}`}>
      <line x1={8} y1={height - 10} x2={width - 8} y2={height - 10} stroke="rgba(128,116,100,0.3)" strokeWidth={1} />
      <path d={d} fill="none" stroke={col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={3} fill={col} />)}
    </svg>
  );
}

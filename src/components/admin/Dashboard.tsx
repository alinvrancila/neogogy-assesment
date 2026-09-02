'use client';

/**
 * The v2 analytics dashboard.
 *
 * Reads /api/admin/analytics and renders cohort statistics, the ten
 * dimensions, per-person progression and organisation rollups. Deletion is
 * available here because erasure requests have to be actionable, and every
 * delete asks for confirmation naming what will be removed.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONSTRUCTS } from '@/engine/config';
import type {
  CohortReport, OrgReport, AudienceReport, QualityReport, ItemStat,
  ReachReport, TechReport, EngagementReport,
} from '@/lib/analytics';
import { Card, Kpi, BarList, SpreadChart, Heatmap, Sparkline, bandColor } from './charts';

type PersonRow = {
  email: string; name: string; domain: string; isOrganisational: boolean;
  persona: string; attempts: number; firstAt: string; latestAt: string;
  index: number; stage: number; stageName: string; archetype: string;
  confidence: string; usage: number; dependencyIndex: number;
  underexposed: boolean; gated: boolean;
  indexDelta?: number; stageDelta?: number; direction: string; latestId: string;
  country?: string; countryCode?: string; city?: string;
  device?: string; browser?: string; os?: string; datacenter?: boolean;
};

type Payload = {
  cohort: CohortReport;
  audience: AudienceReport;
  quality: QualityReport;
  reach: ReachReport;
  tech: TechReport;
  engagement: EngagementReport;
  items: ItemStat[];
  organisations: OrgReport[];
  people: PersonRow[];
  legacyCount: number;
};

type PersonDetail = {
  email: string; name: string; domain: string; direction: string;
  indexDelta?: number; stageDelta?: number;
  series: Array<{
    id: string; at: string; index: number; stage: number; stageName: string;
    archetype: string; confidence: string; usage: number; rescored: boolean;
    dims: Record<string, number>;
    patterns: Array<{ id: string; label: string; kind: string }>;
    bottleneck: string;
  }>;
};

const DIMS = Object.keys(CONSTRUCTS);
const DIM_LABELS: Record<string, string> = Object.fromEntries(
  DIMS.map((d) => [d, CONSTRUCTS[d as keyof typeof CONSTRUCTS].reportedAsRisk
    ? 'Dependency' : CONSTRUCTS[d as keyof typeof CONSTRUCTS].name])
);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

type Tab = 'overview' | 'dimensions' | 'people' | 'organisations' | 'segments'
  | 'audience' | 'reach' | 'quality';

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [persona, setPersona] = useState('');
  const [domain, setDomain] = useState('');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** The organisation a group report is being prepared for. */
  const [reportFor, setReportFor] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const qs = new URLSearchParams();
      if (persona) qs.set('persona', persona);
      if (domain) qs.set('domain', domain);
      const res = await fetch(`/api/admin/analytics?${qs}`, { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Could not load analytics');
      setData(await res.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, [persona, domain]);

  useEffect(() => { void load(); }, [load]);

  const openPerson = async (email: string) => {
    setDetail(null);
    const res = await fetch(`/api/admin/person?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    if (res.ok) setDetail(await res.json());
  };

  const removeAttempt = async (id: string, label: string) => {
    if (!window.confirm(`Delete this single submission (${label})?\n\nThe person's other attempts are kept. This cannot be undone.`)) return;
    setBusy(id);
    const res = await fetch(`/api/admin/leads?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setBusy(null);
    if (res.ok) { setNotice('Submission deleted.'); setDetail(null); void load(); }
    else setNotice((await res.json().catch(() => null))?.error || 'Delete failed.');
  };

  const removePerson = async (email: string, attempts: number) => {
    if (!window.confirm(`Delete ${email} and all ${attempts} of their submissions?\n\nThis erases every result for that address and cannot be undone.`)) return;
    setBusy(email);
    const res = await fetch(`/api/admin/person?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    setBusy(null);
    if (res.ok) { setNotice(`Removed ${email}.`); setDetail(null); void load(); }
    else setNotice((await res.json().catch(() => null))?.error || 'Delete failed.');
  };

  const people = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.people;
    return data.people.filter((p) =>
      [p.email, p.name, p.domain, p.archetype, p.stageName, p.persona].join(' ').toLowerCase().includes(q));
  }, [data, query]);

  if (loading && !data) return <p className="admin-muted p-6 text-sm">Loading analytics...</p>;
  if (err) return <p className="admin-muted p-6 text-sm">{err}</p>;
  if (!data) return null;

  const c = data.cohort;
  const TABS: Array<[Tab, string]> = [
    ['overview', 'Overview'], ['dimensions', 'Dimensions'], ['people', 'People'],
    ['organisations', 'Organisations'], ['segments', 'Segments'],
    ['audience', 'Audience'], ['reach', 'Reach and devices'],
    ['quality', 'Quality and items'],
  ];

  return (
    <div className="space-y-5">
      {/* filters apply to every statistic below */}
      <div className="admin-card flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                tab === id ? 'admin-button admin-button-primary' : 'admin-button admin-button-muted'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select value={persona} onChange={(e) => setPersona(e.target.value)}
            className="admin-input rounded-xl px-3 py-2 text-xs outline-none">
            <option value="">All personas</option>
            {c.personas.map((p) => <option key={p.persona} value={p.persona}>{p.persona} ({p.count})</option>)}
          </select>
          <select value={domain} onChange={(e) => setDomain(e.target.value)}
            className="admin-input rounded-xl px-3 py-2 text-xs outline-none">
            <option value="">All organisations</option>
            {data.organisations.map((o) => <option key={o.domain} value={o.domain}>{o.domain} ({o.people})</option>)}
          </select>
          {(persona || domain) ? (
            <button onClick={() => { setPersona(''); setDomain(''); }}
              className="admin-button admin-button-muted rounded-full px-3 py-2 text-xs">Clear</button>
          ) : null}
        </div>
      </div>

      {notice ? (
        <div className="admin-card rounded-2xl p-3 text-sm">
          {notice} <button className="admin-accent ml-2 underline" onClick={() => setNotice(null)}>dismiss</button>
        </div>
      ) : null}

      {c.n === 0 ? (
        <Card title="No scored submissions yet"
          hint="Analytics appear once people complete the assessment. Legacy v1 records are excluded because their scores are not comparable.">
          <p className="admin-muted text-sm">{data.legacyCount} legacy record(s) on file.</p>
        </Card>
      ) : null}

      {/* ------------------------------------------------------- overview */}
      {tab === 'overview' && c.n > 0 ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="People" value={c.people} sub={`${c.n} scored profiles, ${c.repeatTakers} have taken it more than once`} />
            <Kpi label="Mean index" value={c.index.mean} sub={`median ${c.index.median}, middle half ${c.index.p25} to ${c.index.p75}`} />
            <Kpi label="Capable but eroding"
              value={`${c.indicators.find((i) => i.id === 'erosionRisk')?.share ?? 0}%`}
              tone="bad" sub="Fluent with AI, thin independent capability" />
            <Kpi label="Healthy profiles"
              value={`${c.indicators.find((i) => i.id === 'healthy')?.share ?? 0}%`}
              tone="good" sub="Checking habits and independence both hold" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Where people sit on the route" hint={`Stage distribution across ${c.n} people.`}>
              <BarList total={c.n} rows={c.stages.map((s) => ({ label: `${s.stage}. ${s.name}`, count: s.count }))}
                colorFor={(_r, i) => (i >= 7 ? '#159E88' : i >= 4 ? '#E5AA45' : '#CF796E')} />
            </Card>
            <Card title="Archetypes" hint="The pattern each person's answers matched most closely.">
              <BarList total={c.n} rows={c.archetypes.map((a) => ({ label: a.name, count: a.count }))} />
            </Card>
          </div>

          <Card title="Health and harm indicators"
            hint="Each is a share of the cohort. These are the questions worth acting on rather than admiring.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {c.indicators.map((i) => (
                <div key={i.id} className="admin-card rounded-xl p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">{i.label}</span>
                    <span className="font-mono text-sm"
                      style={{ color: i.tone === 'good' ? '#159E88' : i.tone === 'bad' ? '#CF796E' : '#C08A2E' }}>
                      {i.share}%
                    </span>
                  </div>
                  <div className="admin-muted mt-1 text-[11px] leading-snug">{i.count} of {c.n}. {i.note}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Movement over repeat attempts"
              hint={`${c.movement.tracked} people have taken the assessment more than once.`}>
              {c.movement.tracked ? (
                <>
                  <BarList total={c.movement.tracked} rows={[
                    { label: 'Improved', count: c.movement.improved },
                    { label: 'Held position', count: c.movement.held },
                    { label: 'Declined', count: c.movement.declined },
                  ]} colorFor={(r) => (r.label === 'Improved' ? '#159E88' : r.label === 'Declined' ? '#CF796E' : '#C08A2E')} />
                  <p className="admin-muted mt-3 text-xs">
                    Mean index change {c.movement.meanDelta > 0 ? '+' : ''}{c.movement.meanDelta} points between first and latest attempt.
                  </p>
                </>
              ) : (
                <p className="admin-muted text-sm">
                  Nobody has retaken it yet. Movement becomes measurable on a second sitting with the same email address.
                </p>
              )}
            </Card>

            <Card title="Self-knowledge"
              hint="Whether people can predict their own result, and whether it feels healthier than it measures.">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="admin-muted">Predicted within one band</span>
                  <span className="font-mono">{c.calibration.predictedWithinOneBand} of {c.calibration.tracked}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="admin-muted">Felt healthier than it measured</span>
                  <span className="font-mono" style={{ color: '#CF796E' }}>{c.calibration.feltHealthierThanMeasured} of {c.n}</span>
                </div>
              </div>
              <p className="admin-muted mt-3 text-[11px] leading-relaxed">
                A large second number is the productivity illusion showing up at population scale:
                assistance improves the visible output and the feeling of capability follows it.
              </p>
            </Card>
          </div>

          {c.timeline.length > 1 ? (
            <Card title="Submissions over time" hint="Count and mean index by month.">
              <BarList total={0} rows={c.timeline.map((t) => ({ label: `${t.month} (index ${t.meanIndex})`, count: t.count }))} />
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* ----------------------------------------------------- dimensions */}
      {tab === 'dimensions' && c.n > 0 ? (
        <div className="space-y-5">
          <Card title="The ten dimensions across everyone"
            hint="Mean and interquartile range per dimension, with the share of people whose reading falls in the watch band.">
            <SpreadChart rows={c.dimensions} />
          </Card>

          <Card title="Persona against dimension"
            hint="Where each group is strong and where it is thin. Useful for deciding who needs which intervention.">
            <Heatmap personas={c.byPersona} dims={DIMS} dimLabels={DIM_LABELS} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Composite readings" hint="The six questions that combine several dimensions.">
              <div className="space-y-2">
                {Object.entries(c.composites).map(([k, s]) => {
                  const risk = k === 'dependencyIndex' || k === 'underexposure';
                  return (
                    <div key={k} className="grid grid-cols-[minmax(120px,180px)_1fr_46px] items-center gap-3">
                      <span className="text-xs capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="h-2.5 rounded-full" style={{ background: 'rgba(128,116,100,0.18)' }}>
                        <div className="h-2.5 rounded-full"
                          style={{ width: `${s.mean}%`, background: bandColor(risk ? 100 - s.mean : s.mean) }} />
                      </div>
                      <span className="text-right font-mono text-xs">{s.mean}</span>
                    </div>
                  );
                })}
              </div>
              <p className="admin-muted mt-3 text-[11px]">
                On dependency index and underexposure a lower number is healthier, so their colour is inverted.
              </p>
            </Card>

            <Card title="Relationships worth watching"
              hint="Correlation across the cohort. Read cautiously below about thirty people.">
              <div className="space-y-3">
                {c.correlations.map((r) => (
                  <div key={r.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-semibold">{r.label}</span>
                      <span className="font-mono text-xs"
                        style={{ color: r.r > 0.2 ? '#159E88' : r.r < -0.2 ? '#CF796E' : undefined }}>
                        r = {r.r} <span className="admin-muted">n={r.n}</span>
                      </span>
                    </div>
                    <p className="admin-muted mt-0.5 text-[11px] leading-snug">{r.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Patterns detected" hint="Cross-dimensional patterns that fired in people's answers.">
            <BarList total={c.n} rows={c.patterns.map((p) => ({ label: p.label, count: p.count }))}
              colorFor={(_r, i) => (c.patterns[i].kind === 'help' ? '#159E88' : c.patterns[i].kind === 'harm' ? '#CF796E' : '#C08A2E')} />
          </Card>
        </div>
      ) : null}

      {/* --------------------------------------------------------- people */}
      {tab === 'people' ? (
        <div className="space-y-4">
          <div className="admin-card flex flex-wrap items-center gap-3 rounded-2xl p-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="search"
              placeholder="Search name, email, organisation, archetype..."
              className="admin-input w-full rounded-xl px-4 py-2.5 text-sm outline-none sm:w-96" />
            <span className="admin-muted text-xs">{people.length} of {data.people.length} people</span>
          </div>

          <div className="admin-card overflow-x-auto rounded-2xl p-2">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="admin-muted text-left text-[11px] uppercase tracking-[0.12em]">
                  <th className="p-2">Person</th><th className="p-2">Persona</th><th className="p-2">Stage</th>
                  <th className="p-2 text-right">Index</th><th className="p-2 text-right">Attempts</th>
                  <th className="p-2 text-right">Movement</th><th className="p-2">Flags</th><th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.email} className="border-t" style={{ borderColor: 'rgba(128,116,100,0.18)' }}>
                    <td className="p-2">
                      <div className="admin-strong font-medium">{p.name || p.email}</div>
                      <div className="admin-muted text-xs">{p.email}</div>
                    </td>
                    <td className="admin-muted p-2 capitalize">{p.persona}</td>
                    <td className="p-2">
                      <div className="text-xs">{p.stage}. {p.stageName}</div>
                      <div className="admin-muted text-[11px]">{p.archetype}</div>
                    </td>
                    <td className="p-2 text-right font-mono">{p.index}</td>
                    <td className="admin-muted p-2 text-right font-mono">{p.attempts}</td>
                    <td className="p-2 text-right font-mono text-xs">
                      {p.indexDelta === undefined ? <span className="admin-muted">first</span> : (
                        <span style={{ color: p.indexDelta > 0 ? '#159E88' : p.indexDelta < 0 ? '#CF796E' : undefined }}>
                          {p.indexDelta > 0 ? '+' : ''}{p.indexDelta}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {p.gated ? <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'rgba(229,170,69,.2)' }}>gated</span> : null}
                        {p.underexposed ? <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'rgba(229,170,69,.2)' }}>underexposed</span> : null}
                        {p.dependencyIndex >= 55 ? <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'rgba(207,121,110,.25)' }}>dependency</span> : null}
                        {p.confidence !== 'high' ? <span className="admin-muted rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'rgba(128,116,100,.15)' }}>{p.confidence}</span> : null}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <button onClick={() => void openPerson(p.email)}
                        className="admin-button admin-button-outline rounded-full px-3 py-1.5 text-xs">Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------- organisations */}
      {tab === 'organisations' ? (
        <div className="space-y-4">
          {reportFor ? (
            <GroupReportPanel
              domain={reportFor}
              people={data.organisations.find((o) => o.domain === reportFor)?.people ?? 0}
              onClose={() => setReportFor('')}
            />
          ) : null}

          <Card title="Organisations"
            hint="People grouped by email domain, personal providers excluded, and only where at least two people share a domain.">
            {data.organisations.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="admin-muted text-left text-[11px] uppercase tracking-[0.12em]">
                      <th className="p-2">Domain</th><th className="p-2 text-right">People</th>
                      <th className="p-2 text-right">Mean index</th><th className="p-2">Most common</th>
                      <th className="p-2 text-right">Eroding</th><th className="p-2 text-right">Underexposed</th>
                      <th className="p-2 text-right">Improved</th><th className="p-2 text-right">Declined</th><th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.organisations.map((o) => (
                      <tr key={o.domain} className="border-t" style={{ borderColor: 'rgba(128,116,100,0.18)' }}>
                        <td className="admin-strong p-2 font-medium">{o.domain}</td>
                        <td className="p-2 text-right font-mono">{o.people}</td>
                        <td className="p-2 text-right font-mono" style={{ color: bandColor(o.index.mean) }}>{o.index.mean}</td>
                        <td className="admin-muted p-2 text-xs">{o.topArchetype}</td>
                        <td className="p-2 text-right font-mono" style={{ color: o.atRisk ? '#CF796E' : undefined }}>{o.atRisk}</td>
                        <td className="p-2 text-right font-mono">{o.underexposed}</td>
                        <td className="p-2 text-right font-mono" style={{ color: '#159E88' }}>{o.improved}</td>
                        <td className="p-2 text-right font-mono" style={{ color: '#CF796E' }}>{o.declined}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                          <button onClick={() => { setDomain(o.domain); setTab('overview'); }}
                            className="admin-button admin-button-outline rounded-full px-3 py-1.5 text-xs">Filter</button>
                          <button onClick={() => setReportFor(o.domain)}
                            className="admin-button admin-button-outline ml-2 rounded-full px-3 py-1.5 text-xs">
                            Generate report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-muted text-sm">
                No organisation has two or more people yet. Groups appear once several colleagues use the same work address.
              </p>
            )}
          </Card>

          {data.organisations.slice(0, 4).map((o) => (
            <Card key={o.domain} title={o.domain} hint={`${o.people} people, ${o.attempts} submissions. Mean dimension scores.`}>
              <SpreadChart rows={DIMS.map((d) => ({
                name: DIM_LABELS[d],
                reportedAsRisk: !!CONSTRUCTS[d as keyof typeof CONSTRUCTS].reportedAsRisk,
                stat: { n: o.people, mean: o.dims[d], p25: o.dims[d], p75: o.dims[d], min: o.dims[d], max: o.dims[d] },
                watchShare: 0,
              }))} />
            </Card>
          ))}
        </div>
      ) : null}

      {/* ------------------------------------------------------ segments */}
      {tab === 'segments' && c.n > 0 ? (
        <div className="space-y-4">
          {c.segments.map((s) => (
            <Card key={s.id} title={`${s.label} · ${s.emails.length} people (${s.share}%)`} hint={s.description}>
              <div className="flex flex-wrap gap-1.5">
                {s.emails.map((e) => (
                  <button key={e} onClick={() => void openPerson(e)}
                    className="admin-button admin-button-muted rounded-full px-2.5 py-1 text-[11px]">{e}</button>
                ))}
              </div>
            </Card>
          ))}
          {!c.segments.length ? <Card title="No segments" hint="No group crossed its threshold."><span /></Card> : null}
        </div>
      ) : null}

      {/* -------------------------------------------------------- audience */}
      {tab === 'audience' ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Marketing consent" value={`${data.audience.consentRate}%`}
              sub="Agreed to occasional insights at the gate" />
            <Kpi label="Phone provided" value={`${data.audience.phoneRate}%`}
              sub="Optional field, so this is a measure of willingness" />
            <Kpi label="Context recorded" value={`${data.audience.known} of ${c.n}`}
              sub="Referrer and device are only on submissions taken since this was added" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Where they say they heard about it"
              hint="Asked at the gate. This was being collected all along and never shown anywhere.">
              <BarList total={c.n} rows={data.audience.heardFrom.map((h) => ({ label: h.label, count: h.count }))} />
            </Card>
            <Card title="Where the browser says they came from"
              hint="Referring host. Worth comparing against the answer above, since people misremember.">
              {data.audience.referrers.length
                ? <BarList total={c.n} rows={data.audience.referrers} />
                : <p className="admin-muted text-sm">No referrer recorded yet. Direct visits and privacy settings both report nothing.</p>}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Why light users say their use is low"
              hint="The adaptive branch shown to anyone reporting low use. Collected since v2 and never surfaced until now. This separates deliberate restraint from not knowing where to start.">
              {data.audience.lowUseReasons.length
                ? <BarList total={0} rows={data.audience.lowUseReasons} />
                : <p className="admin-muted text-sm">Nobody reporting low use has answered this yet.</p>}
            </Card>
            <Card title="Campaigns and devices" hint="UTM tags where present, and the device used to finish.">
              {data.audience.campaigns.length ? (
                <div className="mb-4">
                  <p className="admin-muted mb-1 text-[11px] uppercase tracking-[0.12em]">Campaigns</p>
                  <BarList total={0} rows={data.audience.campaigns} />
                </div>
              ) : null}
              {data.audience.devices.length
                ? <BarList total={0} rows={data.audience.devices} />
                : <p className="admin-muted text-sm">No device recorded yet.</p>}
            </Card>
          </div>

          {data.audience.hours.length ? (
            <Card title="When people finish" hint="Local hour of submission. Useful for timing reminders and sessions.">
              <BarList total={0} rows={data.audience.hours.map((h) => ({ label: `${String(h.hour).padStart(2, '0')}:00`, count: h.count }))} />
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* --------------------------------------------- reach and devices */}
      {tab === 'reach' ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Countries reached" value={data.reach.countries.length}
              sub={data.reach.countries[0] ? `Most from ${data.reach.countries[0].label}` : 'No location recorded yet'} />
            <Kpi label="Context recorded" value={`${data.reach.known} of ${data.reach.total}`}
              sub="Location and device are on submissions taken since this was added" />
            <Kpi label="Inside the EU" value={`${data.reach.euShare}%`}
              sub="GDPR applies to these records, so erasure requests are more likely"
              tone={data.reach.euShare > 0 ? 'watch' : undefined} />
            <Kpi label="Datacentre networks" value={`${data.reach.datacenterShare}%`}
              sub="VPN, proxy or automation rather than a home or office connection"
              tone={data.reach.datacenterShare > 15 ? 'bad' : undefined} />
          </div>

          {data.reach.unresolvedAddresses && data.reach.known
            && data.reach.unresolvedAddresses === data.reach.known ? (
            <div className="admin-error-box rounded-xl px-4 py-3 text-sm">
              Every record carries device details but no place. That is the signature of the
              location lookup being blocked rather than of unusual visitors, so the server may not
              be able to reach the geolocation provider.
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Countries" hint="From the address the submission came from, not from anything they typed.">
              {data.reach.countries.length
                ? <BarList total={data.reach.known} rows={data.reach.countries.map((r) => ({ label: r.label, count: r.count }))} />
                : <p className="admin-muted text-sm">No location recorded yet.</p>}
            </Card>
            <Card title="Cities" hint="City level only. An address places a network, never a street.">
              {data.reach.cities.length
                ? <BarList total={data.reach.known} rows={data.reach.cities.slice(0, 12)} />
                : <p className="admin-muted text-sm">No location recorded yet.</p>}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Devices" hint="Phone, tablet or desktop, from the viewport at submission.">
              {data.tech.devices.length
                ? <BarList total={data.tech.known} rows={data.tech.devices} />
                : <p className="admin-muted text-sm">No device recorded yet.</p>}
            </Card>
            <Card title="Screen widths" hint="What the results page actually had to fit into.">
              {data.tech.screens.length
                ? <BarList total={data.tech.known} rows={data.tech.screens} />
                : <p className="admin-muted text-sm">No screen size recorded yet.</p>}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Browsers" hint="Name and major version, so support decisions rest on real traffic.">
              {data.tech.browsers.length
                ? <BarList total={data.tech.known} rows={data.tech.browsers.slice(0, 10)} />
                : <p className="admin-muted text-sm">No browser recorded yet.</p>}
            </Card>
            <Card title="Operating systems">
              {data.tech.operatingSystems.length
                ? <BarList total={data.tech.known} rows={data.tech.operatingSystems.slice(0, 10)} />
                : <p className="admin-muted text-sm">No system recorded yet.</p>}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Languages and timezones"
              hint="The browser's own settings, which describe a person better than an address does.">
              {data.reach.languages.length ? (
                <div className="mb-4">
                  <p className="admin-muted mb-1 text-[11px] uppercase tracking-[0.12em]">Languages</p>
                  <BarList total={0} rows={data.reach.languages.slice(0, 8)} />
                </div>
              ) : null}
              {data.reach.timezones.length
                ? <BarList total={0} rows={data.reach.timezones.slice(0, 8)} />
                : <p className="admin-muted text-sm">Nothing recorded yet.</p>}
            </Card>
            <Card title="Networks"
              hint="The internet provider behind each submission. A university or a company name here is a lead in itself.">
              {data.reach.networks.length
                ? <BarList total={0} rows={data.reach.networks.slice(0, 10)} />
                : <p className="admin-muted text-sm">No network recorded yet.</p>}
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Median time" value={data.engagement.minutes.n ? `${data.engagement.minutes.median} min` : 'n/a'}
              sub={data.engagement.minutes.n ? `Middle half ${data.engagement.minutes.p25} to ${data.engagement.minutes.p75}` : 'Not recorded yet'} />
            <Kpi label="Seconds per answer"
              value={data.engagement.secondsPerAnswer.n ? `${data.engagement.secondsPerAnswer.median}s` : 'n/a'}
              sub="Median pace. Very fast is worth a second look" />
            <Kpi label="Left the tab" value={`${data.engagement.leftTabShare}%`}
              sub="Switched away at least once while answering" />
            <Kpi label="Rushed" value={`${data.engagement.rushedShare}%`}
              sub="Three or more answers faster than a question can be read"
              tone={data.engagement.rushedShare > 10 ? 'watch' : undefined} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="How the page was read"
              hint="Stated browser preferences. These decide whether the dark results panels and the animations were ever seen as designed.">
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi label="Dark mode" value={`${data.tech.darkShare}%`} sub="Prefer a dark interface" />
                <Kpi label="Reduced motion" value={`${data.tech.reducedMotionShare}%`} sub="Ask for less animation" />
                <Kpi label="Touch screen" value={`${data.tech.touchShare}%`} sub="Answered by tapping" />
              </div>
            </Card>
            <Card title="Shared addresses"
              hint="One address used by more than one person: a household, a shared office, or a class taking it together. Worth knowing before reading them as independent responses.">
              {data.reach.sharedNetworks.length
                ? <BarList total={0} rows={data.reach.sharedNetworks.map((r) => ({
                    label: `${r.label} (${r.people} people)`, count: r.count }))} />
                : <p className="admin-muted text-sm">Every submission so far came from its own address.</p>}
            </Card>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ quality and items */}
      {tab === 'quality' ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Median time to complete"
              value={data.quality.durationKnown ? `${data.quality.duration.median} min` : 'n/a'}
              sub={data.quality.durationKnown ? `recorded for ${data.quality.durationKnown} submissions` : 'recorded from now on'} />
            <Kpi label="Finished suspiciously fast" value={data.quality.fastCount} tone={data.quality.fastCount ? 'watch' : 'good'}
              sub="Under three minutes. Too quick to have read the questions." />
            <Kpi label="Longest identical run" value={data.quality.straightLining.median}
              sub="Median across respondents. A high number suggests answering without reading." />
            <Kpi label="Low confidence profiles" value={`${data.quality.lowConfidenceRate}%`} tone="watch"
              sub="Preliminary or insufficient evidence" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Responses worth a second look"
              hint="Fast completions, long runs of identical answers, or too little evidence. Not proof of anything, but these are the records to check before drawing conclusions from a cohort.">
              {data.quality.suspect.length ? (
                <div className="space-y-1.5">
                  {data.quality.suspect.map((sx) => (
                    <div key={sx.email} className="flex items-baseline justify-between gap-3 text-xs">
                      <button onClick={() => void openPerson(sx.email)} className="admin-accent underline">{sx.email}</button>
                      <span className="admin-muted text-right">{sx.reason}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="admin-muted text-sm">Nothing flagged.</p>}
            </Card>

            <Card title="Answer revisions and skipped outcomes"
              hint="How often people changed an answer, and how often they chose not enough experience to say.">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="admin-muted">Median revisions</span><span className="font-mono">{data.quality.revisions.median}</span></div>
                <div className="flex justify-between"><span className="admin-muted">Most revisions by one person</span><span className="font-mono">{data.quality.revisions.max}</span></div>
                <div className="flex justify-between"><span className="admin-muted">Outcome questions answered not enough experience</span><span className="font-mono">{data.quality.notApplicableRate}%</span></div>
              </div>
              <p className="admin-muted mt-3 text-[11px] leading-relaxed">
                A high skip rate on the outcome questions means people cannot yet judge their own
                change, which is itself a finding about how new AI is to them.
              </p>
            </Card>
          </div>

          <Card title="Which questions are earning their place"
            hint="Computed from stored answers. Discrimination is how strongly an item tracks its own dimension: near zero means everyone answers it the same way, so it costs time and tells you little. Sorted weakest first.">
            {data.items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-xs">
                  <thead>
                    <tr className="admin-muted text-left uppercase tracking-[0.12em]">
                      <th className="p-2">Item</th><th className="p-2">Dimension</th><th className="p-2">Type</th>
                      <th className="p-2 text-right">n</th><th className="p-2 text-right">Mean</th>
                      <th className="p-2 text-right">Discrimination</th><th className="p-2">Spread of answers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.slice(0, 24).map((it) => {
                      const max = Math.max(1, ...it.distribution.map((d) => d.count));
                      return (
                        <tr key={it.id} className="border-t" style={{ borderColor: 'rgba(128,116,100,0.18)' }}>
                          <td className="p-2 font-mono text-[11px]">{it.id}</td>
                          <td className="admin-muted p-2">{it.construct}</td>
                          <td className="admin-muted p-2">{it.type}</td>
                          <td className="p-2 text-right font-mono">{it.n}</td>
                          <td className="p-2 text-right font-mono">{it.mean}</td>
                          <td className="p-2 text-right font-mono"
                            style={{ color: Math.abs(it.discrimination) < 0.2 ? '#CF796E' : Math.abs(it.discrimination) > 0.5 ? '#159E88' : undefined }}>
                            {it.discrimination}
                          </td>
                          <td className="p-2">
                            <div className="flex items-end gap-0.5" style={{ height: 18 }}>
                              {it.distribution.map((d) => (
                                <div key={d.value} title={`${d.value}: ${d.count}`}
                                  style={{ width: 9, height: `${(d.count / max) * 18}px`, background: '#159E88', opacity: 0.75 }} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="admin-muted mt-2 text-[11px]">
                  Showing the 24 weakest of {data.items.length} items with enough responses. Read this
                  cautiously below about thirty respondents.
                </p>
              </div>
            ) : (
              <p className="admin-muted text-sm">Not enough responses yet for item level review.</p>
            )}
          </Card>
        </div>
      ) : null}

      {/* --------------------------------------------------- person panel */}
      {detail ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDetail(null)}>
          <div className="admin-card h-full w-full max-w-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="admin-strong font-serif text-xl">{detail.name || detail.email}</h3>
                <p className="admin-muted text-xs">{detail.email}{detail.domain ? ` · ${detail.domain}` : ''}</p>
              </div>
              <button onClick={() => setDetail(null)} className="admin-button admin-button-muted rounded-full px-3 py-1.5 text-xs">Close</button>
            </div>

            <div className="mt-4">
              <p className="admin-muted text-[11px] uppercase tracking-[0.14em]">Index across attempts</p>
              <Sparkline points={detail.series.map((s) => ({ at: s.at, index: s.index }))} />
              {detail.indexDelta !== undefined ? (
                <p className="mt-1 text-sm">
                  <span style={{ color: detail.indexDelta > 0 ? '#159E88' : detail.indexDelta < 0 ? '#CF796E' : undefined }}>
                    {detail.indexDelta > 0 ? '+' : ''}{detail.indexDelta} points
                  </span>
                  <span className="admin-muted"> between first and latest attempt</span>
                </p>
              ) : null}
            </div>

            {detail.series.map((s, i) => {
              const prev = i > 0 ? detail.series[i - 1] : null;
              return (
                <div key={s.id} className="admin-card mt-4 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="admin-strong text-sm font-semibold">
                        Attempt {i + 1} · {fmtDate(s.at)}{s.rescored ? ' (rescored from v1)' : ''}
                      </div>
                      <div className="admin-muted text-xs">
                        Stage {s.stage}. {s.stageName} · index {s.index} · {s.archetype} · confidence {s.confidence}
                      </div>
                    </div>
                    <button disabled={busy === s.id} onClick={() => void removeAttempt(s.id, fmtDate(s.at))}
                      className="admin-button admin-button-muted rounded-full px-3 py-1.5 text-[11px] disabled:opacity-50">
                      Delete test
                    </button>
                  </div>

                  <div className="mt-3 space-y-1">
                    {DIMS.map((d) => {
                      const v = s.dims[d];
                      const delta = prev ? Math.round((v - prev.dims[d]) * 10) / 10 : undefined;
                      const isRisk = !!CONSTRUCTS[d as keyof typeof CONSTRUCTS].reportedAsRisk;
                      const healthy = isRisk ? 100 - v : v;
                      const better = delta === undefined ? null : isRisk ? delta < 0 : delta > 0;
                      return (
                        <div key={d} className="grid grid-cols-[minmax(90px,130px)_1fr_38px_46px] items-center gap-2">
                          <span className="truncate text-[11px]">{DIM_LABELS[d]}</span>
                          <div className="h-2 rounded-full" style={{ background: 'rgba(128,116,100,0.18)' }}>
                            <div className="h-2 rounded-full" style={{ width: `${Math.max(2, v)}%`, background: bandColor(healthy) }} />
                          </div>
                          <span className="text-right font-mono text-[11px]">{v}</span>
                          <span className="text-right font-mono text-[11px]"
                            style={{ color: better === null ? undefined : better ? '#159E88' : '#CF796E' }}>
                            {delta === undefined || delta === 0 ? '' : `${delta > 0 ? '+' : ''}${delta}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {s.patterns.length ? (
                    <p className="admin-muted mt-2 text-[11px]">
                      Patterns: {s.patterns.map((x) => x.label).join(', ')}
                    </p>
                  ) : null}
                  <p className="admin-muted mt-1 text-[11px]">Bottleneck: {DIM_LABELS[s.bottleneck] ?? s.bottleneck}</p>
                </div>
              );
            })}

            <div className="mt-6 border-t pt-4" style={{ borderColor: 'rgba(128,116,100,0.2)' }}>
              <p className="admin-muted text-[11px] leading-relaxed">
                Deleting a person erases every result stored for that address. Use this for erasure
                requests and for clearing test accounts.
              </p>
              <button disabled={busy === detail.email}
                onClick={() => void removePerson(detail.email, detail.series.length)}
                className="admin-button mt-2 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
                style={{ background: '#CF796E', color: '#fff' }}>
                Delete this person and all {detail.series.length} submissions
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Prepare one report for a whole organisation.
 *
 * The domain is how people are grouped, but a class is rarely called by its
 * email domain, so the cover takes whatever name is typed here. The persona
 * filter is offered because a school is usually two groups sharing an address:
 * a report that mixes its teachers and its students describes neither.
 */
function GroupReportPanel(
  { domain, people, onClose }: { domain: string; people: number; onClose: () => void }
) {
  const [label, setLabel] = useState(domain);
  const [persona, setPersona] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ domain, label: label.trim() || domain });
      if (persona) qs.set('persona', persona);
      const res = await fetch(`/api/admin/org-report?${qs.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(label.trim() || domain).replace(/[^a-z0-9]+/gi, '_')}_Group_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate the report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={`Group report: ${domain}`}
      hint={`One document for the whole group, built from every member's latest result. ${people} ${people === 1 ? 'person has' : 'people have'} completed it.`}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="admin-muted uppercase tracking-[0.12em]">Name on the cover</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Northgate College, Year 12"
            className="admin-input w-72 rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="admin-muted uppercase tracking-[0.12em]">Limit to one assessment</span>
          <select value={persona} onChange={(e) => setPersona(e.target.value)}
            className="admin-input w-56 rounded-lg px-3 py-2 text-sm">
            <option value="">Everyone in this organisation</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="administrator">Leaders</option>
            <option value="pastor">Ministers</option>
            <option value="business">Business owners</option>
          </select>
        </label>
        <button onClick={generate} disabled={busy}
          className="admin-button admin-button-primary rounded-full px-4 py-2 text-sm disabled:opacity-60">
          {busy ? 'Building the report...' : 'Generate report'}
        </button>
        <button onClick={onClose}
          className="admin-button admin-button-outline rounded-full px-4 py-2 text-sm">Close</button>
      </div>
      {error ? <p className="mt-3 text-sm" style={{ color: '#CF796E' }}>{error}</p> : null}
      <p className="admin-muted mt-3 text-xs">
        Each person is counted once, using their latest attempt. The report carries the group centre,
        the spread, both ends, the ten dimensions, what is holding the group, and the practices that
        would move it, all counted from the individual results rather than written for the group.
      </p>
    </Card>
  );
}

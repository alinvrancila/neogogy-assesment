'use client';

/**
 * The parts of a Business AI Health Check that no other persona produces.
 *
 * An owner should finish knowing three things without effort: whether AI is
 * helping or harming the business right now, where the exposure sits, and what
 * to do in the next ninety days. These modules answer those three in that
 * order, and they say so plainly when the honest answer is "nothing here".
 */

import type { CompassResult, RiskCategory } from '@/engine';
import { helpHarm } from '@/engine/patterns';
import {
  compositeName, dimensionScope, reportedConstructName, constructContent,
  SCOPE_LABEL, SCOPE_BLURB, type Scope,
} from '@/engine/display';
import { CONSTRUCTS } from '@/engine/config';
import type { ConstructId } from '@/engine/types';

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  legal: 'Legal and compliance',
  financial: 'Financial',
  operational: 'Operational',
  reputational: 'Reputational',
  strategic: 'Strategic',
};

const band = (n: number) => (n >= 65 ? 'strong' : n >= 45 ? 'developing' : 'watch');

/** 1. Is AI helping or harming this business right now. */
export function HealthHeadline({ result }: { result: CompassResult }) {
  const verdict = (() => {
    const harms = result.patterns.filter((p) => p.kind === 'harm').length;
    const helps = result.patterns.filter((p) => p.kind === 'help').length;
    if (helps && !harms) return 'Your responses are consistent with AI currently helping this business, on a base that would hold.';
    if (harms && !helps) return 'Your responses suggest AI is currently creating more exposure for this business than advantage.';
    if (harms && helps) return 'Your responses are consistent with real gains and real exposure sitting side by side, which is the most common position and the one worth acting on early.';
    return 'Your responses do not yet show either a settled advantage or a crossed exposure threshold. The readings below are where the useful detail sits.';
  })();

  return (
    <section className="biz-headline">
      <p className="asc-kicker">Business AI Health Check</p>
      <h2 className="biz-h1">{result.archetype.name}</h2>
      <p className="biz-verdict">{result.archetype.tagline}</p>
      <p className="biz-verdict">{verdict}</p>
      <div className="biz-score">
        <span className="biz-score-n">{result.stage.rawIndex}</span>
        <span className="biz-score-l">
          Business AI Health Score, out of 100. Stage {result.stage.stage} of 10, {result.stage.stageName}.
        </span>
      </div>
    </section>
  );
}

/** 2. Helping and harming, side by side. */
export function HelpingHarming({ result }: { result: CompassResult }) {
  const { helping, harming } = helpHarm(result.patterns);
  return (
    <section className="biz-hh">
      <div className="biz-hh-col">
        <h3 className="biz-h3">Where AI is helping the business</h3>
        {helping.length ? (
          <ul className="biz-list">
            {helping.map((p) => (
              <li key={p.id}><strong>{p.label}.</strong> {p.narrative}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            No help pattern has crossed its threshold yet. These are combinations across several
            dimensions, so they tend to arrive together rather than one at a time.
          </p>
        )}
      </div>
      <div className="biz-hh-col">
        <h3 className="biz-h3">Where AI may be working against the business</h3>
        {harming.length ? (
          <ul className="biz-list biz-list-harm">
            {harming.map((p) => (
              <li key={p.id}><strong>{p.label}.</strong> {p.narrative}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            No harm pattern crossed its threshold in your responses. That is a real result and it is
            worth stating plainly rather than hedging into a warning.
          </p>
        )}
      </div>
    </section>
  );
}

/** 3. The Risk Register. */
export function RiskRegister({ result }: { result: CompassResult }) {
  if (!result.riskRegister.length) {
    return (
      <section className="biz-block">
        <h3 className="biz-h3">Risk register</h3>
        <p className="muted">
          Nothing in your answers crossed an exposure threshold, so this register is empty. That is
          a real result rather than a blank, and it is worth re-running as your use grows.
        </p>
      </section>
    );
  }
  return (
    <section className="biz-block">
      <h3 className="biz-h3">Risk register</h3>
      <p className="muted">
        Each line is an exposure your answers point to, the category it falls in, and the action
        chosen for it below. Severity reflects how your answers landed, not a probability.
      </p>
      <p className="muted">
        The plan below is capped at five actions for the first ninety days. Everything else is listed
        here rather than hidden, so you can decide what comes after.
      </p>
      <div className="biz-table-wrap">
        <table className="biz-table">
          <thead>
            <tr><th>Exposure</th><th>Category</th><th>What your answers showed</th><th>Action</th></tr>
          </thead>
          <tbody>
            {result.riskRegister.map((e) => (
              <tr key={e.title}>
                <td><strong>{e.title}</strong><span className="biz-desc">{e.description}</span></td>
                <td><span className={`biz-cat biz-cat-${e.category}`}>{CATEGORY_LABEL[e.category]}</span></td>
                <td className="biz-evidence">{e.evidence}</td>
                <td>{e.action ?? <span className="muted">Listed, not scheduled</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** 4. What happens if the main tool disappears for a week. */
export function ContinuityTest({ result }: { result: CompassResult }) {
  const continuity = result.dimensions.dependencySafety.score;
  const capture = result.dimensions.transfer.score;
  const verdict = continuity >= 65 && capture >= 55
    ? 'Your responses are consistent with a business that would keep trading. Work would slow in places, and customers would be unlikely to see it.'
    : continuity >= 45
      ? 'Your responses suggest the business would keep going with visible strain: slower turnaround, and quality depending on who is available.'
      : 'Your answers suggest work would stop in the affected areas until the tool returned, because the process largely lives inside it.';
  return (
    <section className="biz-callout">
      <p className="asc-kicker">The continuity test</p>
      <h3 className="biz-h3">What happens if your main AI tool disappears for a week</h3>
      <p>{verdict}</p>
      <p className="muted">
        Read from operational continuity ({continuity}) and institutional knowledge capture
        ({capture}). {compositeName(result.persona, 'dependencyIndex', 'Continuity exposure')} sits
        at {result.composites.dependencyIndex} out of 100, where higher means more of what you
        produce would be hard to reproduce without the tools.
      </p>
    </section>
  );
}

/** 5. Trust and governance, with the benchmark named. */
export function TrustAndGovernance({ result }: { result: CompassResult }) {
  const gov = result.dimensions.responsibleUse.score;
  const market = result.dimensions.creativity.score;
  return (
    <section className="biz-block">
      <h3 className="biz-h3">Trust, data and governance</h3>
      <div className="biz-pair">
        <div>
          <p className="biz-metric"><span>{gov}</span> Governance, data and trust</p>
          <p className={`biz-band biz-band-${band(gov)}`}>{band(gov)}</p>
        </div>
        <div>
          <p className="biz-metric"><span>{market}</span> Market differentiation</p>
          <p className={`biz-band biz-band-${band(market)}`}>{band(market)}</p>
        </div>
      </div>
      <p>
        {gov >= 65
          ? 'Your responses describe governance you could show someone: a policy people know, approved tools, and a real view of what is in use.'
          : gov >= 45
            ? 'Your responses suggest boundaries that exist as understanding rather than as a written standard your team could state.'
            : 'Your answers suggest your business is exposed on data and governance, and this reading should be treated as a lower bound.'}
      </p>
      <p className="muted">
        Shadow AI research through 2026 consistently reports that most organisations have staff
        using unsanctioned AI tools, that a meaningful share of what is pasted is sensitive, that
        roughly four in ten companies have no AI use policy, and that executives overestimate their
        visibility into staff use by a wide margin. (IBM, Gartner, Cyberhaven and Verizon DBIR, as
        compiled by industry trackers, 2026)
      </p>
      <p className="muted">
        On the customer side, 2026 consumer research reports that a substantial share of people
        prefer brands that do not use generative AI in customer-facing content, and that the share
        who would trust a favourite brand less for heavy AI use roughly doubled year over year.
        (Gartner, Fractl and Klaviyo, 2026)
      </p>
    </section>
  );
}

/** 6. Decision integrity, with calibration reframed for an owner. */
export function DecisionIntegrity({ result }: { result: CompassResult }) {
  const gap = result.calibration.calibrationGap;
  const knows = gap === undefined ? null : Math.abs(gap) <= 1;
  return (
    <section className="biz-block">
      <h3 className="biz-h3">Decision integrity</h3>
      <div className="biz-pair">
        <div>
          <p className="biz-metric"><span>{result.dimensions.agency.score}</span> Owner decision ownership</p>
        </div>
        <div>
          <p className="biz-metric"><span>{result.dimensions.verification.score}</span> Verification before consequence</p>
        </div>
        <div>
          <p className="biz-metric">
            <span>{result.composites.judgment}</span>{' '}
            {compositeName(result.persona, 'judgment', 'Decision integrity')}
          </p>
        </div>
      </div>
      {knows === null ? null : (
        <p>
          <strong>How well you know your own business&rsquo;s AI position.</strong>{' '}
          {knows
            ? 'Your prediction of this result was close to accurate, which is worth knowing on its own: owners who can predict their own position tend to manage it better.'
            : 'Your prediction of this result was some distance from where your answers landed. That gap is ordinary, and it is the reason an instrument is worth running rather than relying on a sense of it.'}
        </p>
      )}
    </section>
  );
}

/** 9. The ninety day plan. */
export function NinetyDayPlan({ result }: { result: CompassResult }) {
  if (!result.ninetyDayPlan.length) return null;
  return (
    <section className="biz-block">
      <h3 className="biz-h3">Your next ninety days</h3>
      <p className="muted">
        Sequenced so that anything legal or financial is dealt with first, because that kind of
        exposure keeps accumulating while other work is done.
      </p>
      <div className="biz-plan">
        {result.ninetyDayPlan.map((phase) => (
          <div key={phase.window} className="biz-phase">
            <p className="asc-kicker">{phase.window}</p>
            <h4 className="biz-h4">{phase.title}</h4>
            <p className="muted">{phase.note}</p>
            {phase.actions.map((a) => (
              <div key={a.capability} className="biz-action">
                <p className="biz-action-h">{a.capability}</p>
                <p>{a.practice}</p>
                <p className="biz-check"><strong>Checkpoint.</strong> {a.checkpoint}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/** 10. One owner's experiment. */
export function OwnersExperiment() {
  return (
    <section className="biz-callout">
      <p className="asc-kicker">One thing to try</p>
      <h3 className="biz-h3">Run one core process both ways for a week</h3>
      <p>
        Pick a process that matters and run it as you do now, then run a comparable instance without
        AI. Compare three things: the error rate, the time it actually took, and what your team could
        still do unaided. That comparison, repeated occasionally, is the most reliable ongoing test
        of whether AI is building this business or hollowing it out.
      </p>
    </section>
  );
}


/**
 * The two levels, reported separately.
 *
 * Same readings the rest of the report uses, grouped so an owner can see at a
 * glance which findings are about their own judgment and which are about how
 * the business runs. Sorted worst first inside each block, because that is the
 * order the work happens in.
 */
export function ScopedDimensions({ result, scope }: { result: CompassResult; scope: Scope }) {
  const rows = (Object.keys(CONSTRUCTS) as ConstructId[])
    .filter((id) => dimensionScope(result.persona, id) === scope)
    .map((id) => ({
      id,
      name: reportedConstructName(result.persona, id),
      healthy: result.dimensions[id].score,
      shown: CONSTRUCTS[id].reportedAsRisk
        ? result.dimensions[id].reportedScore
        : result.dimensions[id].score,
      state: result.dimensions[id].microState,
      reading: (() => {
        const c = constructContent(result.persona, id);
        const st = result.dimensions[id].microState;
        return st === 'strong' ? c.atStrong : st === 'developing' ? c.atDeveloping : c.atWatch;
      })(),
    }))
    .sort((a, b) => a.healthy - b.healthy);

  const avg = Math.round(rows.reduce((a, r) => a + r.healthy, 0) / rows.length);

  return (
    <section className={`biz-scope biz-scope-${scope}`}>
      <div className="biz-scope-head">
        <div>
          <p className="asc-kicker">{scope === 'owner' ? 'Level one' : 'Level two'}</p>
          <h3 className="biz-h2">{SCOPE_LABEL[scope]}</h3>
          <p className="biz-scope-blurb">{SCOPE_BLURB[scope]}</p>
        </div>
        <div className="biz-scope-score">
          <span>{avg}</span>
          <small>{scope === 'owner' ? 'owner average' : 'business average'}</small>
        </div>
      </div>

      <div className="biz-bars">
        {rows.map((r) => (
          <div key={r.id} className="biz-bar-row">
            <span className="biz-bar-name">{r.name}</span>
            <span className="biz-bar-track">
              <b className="biz-bar-tick biz-bar-45" />
              <b className="biz-bar-tick biz-bar-65" />
              <i className={`biz-bar-fill biz-bar-${r.state}`} style={{ width: `${Math.max(2, r.healthy)}%` }} />
            </span>
            <span className={`biz-bar-val biz-bar-t-${r.state}`}>{r.shown}</span>
          </div>
        ))}
      </div>

      {rows.some((row) => CONSTRUCTS[row.id].reportedAsRisk) ? (
        <p className="muted biz-bar-note">
          Bars are plotted on the healthy reading, so Continuity Risk sits by the capability behind
          it rather than by the risk number. Below 45 is a vulnerability, above 65 a strength.
        </p>
      ) : (
        <p className="muted biz-bar-note">
          Below 45 is named a vulnerability, above 65 a strength. The two marks on each bar are
          those lines.
        </p>
      )}

      <div className="biz-scope-notes">
        {rows.slice(0, 2).map((r) => (
          <p key={r.id}><strong>{r.name}.</strong> {r.reading}</p>
        ))}
      </div>
    </section>
  );
}

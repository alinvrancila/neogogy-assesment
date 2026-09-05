'use client';

/**
 * Expedition modules for the ascent result.
 *
 * These are presentational. Every number arrives on the CompassResult; none is
 * derived here. Where the design calls for a field the assessment does not
 * collect, the field is omitted and the absence is stated plainly rather than
 * filled with a plausible value.
 */

import type { CompassResult } from '@/engine';
import { CONSTRUCTS, STAGES } from '@/engine/config';
import { constructName, constructContent, reportedConstructName, stageName, indexName } from '@/engine/display';
import { CONSTRUCT_CONTENT } from '@/engine/content';
import type { ConstructId } from '@/engine/types';
import { riskLean } from '@/engine/display';
import { firstStepFor } from '@/engine/firstStep';
import { GATE_DEFS } from './AscentMapHero';
import type { AttemptComparison } from '@/lib/history';

/* ------------------------------------------------------------------ header */

export function ResultHeader({ result }: { result: CompassResult }) {
  return (
    <header className="asc-header">
      <div className="asc-header-main">
        <p className="asc-eyebrow">Neogogy · AI relationship assessment</p>
        {result.persona === 'pastor' ? (
          <>
            <h1 className="asc-title">Where you are in your preparation</h1>
            <p className="asc-sub">
              This is a reading of how AI is currently shaping your preparation, your preaching, your
              care of people, and your own formation. It is a mirror rather than a verdict. Below you
              will find where your practice sits, where the tool is serving the work, where it may be
              standing in for it, and one way forward.
            </p>
          </>
        ) : result.persona === 'business' ? (
          <>
            <h1 className="asc-title">Where your business stands with AI</h1>
            <p className="asc-sub">
              This is a reading of how AI is currently shaping your decisions, your continuity, your
              customers&rsquo; trust, your knowledge and your people. It assesses the business rather
              than you. Below you will find where the business sits on the route, why it is there,
              where the exposure is, and what to do in the next ninety days.
            </p>
          </>
        ) : (
          <>
            <h1 className="asc-title">Your ascent with AI</h1>
            <p className="asc-sub">
              This is a reading of how AI is currently shaping your judgment, your capability and
              your own creative agency. It is a journey, not a verdict. Below you will find where you
              are on the route, why you are there, what your ten dimensions look like, and what to do
              next.
            </p>
          </>
        )}
      </div>
      <DevelopmentalIndex result={result} />
    </header>
  );
}

export function DevelopmentalIndex({ result }: { result: CompassResult }) {
  return (
    <div className="asc-index" role="group" aria-label="Developmental index">
      <div className="asc-index-disc">
        <span className="asc-index-n">{result.stage.rawIndex}</span>
        <span className="asc-index-label">{indexName(result.persona)}</span>
      </div>
      <p className="asc-index-note">
        out of 100. How far along the route your answers place you.
      </p>
    </div>
  );
}

/* ---------------------------------------------------- orientation card */

export function OrientationCard({ result }: { result: CompassResult }) {
  const atTop = result.nextTarget.stage === result.stage.stage;
  return (
    <aside className="asc-orient" aria-label="Where you stand">
      <h2 className="asc-orient-h">
        Stage {result.stage.stage} of 10: {result.stage.stageName}
      </h2>
      <p className="asc-orient-sub">
        {result.stage.substage === 'early'
          ? 'You have recently arrived here'
          : result.stage.substage === 'established'
            ? 'You are settled in this stage'
            : 'You are moving toward the next stage'}
      </p>
      <p className="asc-orient-body">
        {STAGES.find((s) => s.stage === result.stage.stage)?.short}
      </p>

      {result.stage.borderline ? (
        <p className="asc-orient-zone">
          You are only {result.stage.borderline.distance} points from stage{' '}
          {result.stage.borderline.adjacentStage}, so treat this as a stretch of the route rather
          than a line you have crossed. A small change in habit moves it either way.
        </p>
      ) : null}

      {result.stage.gated ? (
        <p className="asc-orient-gate">
          Your score alone would put you at stage {result.stage.gated.cappedFrom}, but one practice
          is holding you here: {result.stage.gated.reasons[0]}. The later stages ask for a minimum on
          a few practices, so that being skilled with the tools cannot carry you past a weakness
          that matters.
        </p>
      ) : null}

      <div className="asc-orient-next">
        <p className="asc-kicker">The next meaningful shift</p>
        {atTop ? (
          <p className="asc-orient-body">
            You are at the far end of the route. The summit is a direction, not a finish line: from
            here the work is holding the pattern as the tools change.
          </p>
        ) : (
          <>
            <p className="asc-orient-nextname">
              Stage {result.nextTarget.stage}: {result.nextTarget.stageName}
            </p>
            <p className="asc-orient-body">
              {STAGES.find((s) => s.stage === result.nextTarget.stage)?.short}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------ route stages */

export function RouteStages({ result }: { result: CompassResult }) {
  const here = result.stage.stage;
  const next = result.nextTarget.stage;
  return (
    <section className="asc-stages" aria-labelledby="asc-stages-h">
      <h2 id="asc-stages-h" className="asc-h2">The route, basecamp to summit</h2>
      <ol className="asc-stage-list">
        {STAGES.map((s) => {
          const isHere = s.stage === here;
          const isNext = s.stage === next && next !== here;
          const reached = result.stage.index >= s.minIndex;
          return (
            <li
              key={s.stage}
              className={`asc-stage${isHere ? ' is-here' : ''}${isNext ? ' is-next' : ''}${reached ? ' is-reached' : ''}`}
              tabIndex={0}
              aria-current={isHere ? 'step' : undefined}
            >
              <span className="asc-stage-n" aria-hidden="true">{s.stage}</span>
              <span className="asc-stage-body">
                <span className="asc-stage-name">
                  {stageName(result.persona, s.stage)}
                  {isHere ? <span className="asc-flag asc-flag-here">You are here</span> : null}
                  {isNext ? <span className="asc-flag asc-flag-next">Next ledge</span> : null}
                </span>
                <span className="asc-stage-alt">index {s.minIndex} and above</span>
                {(isHere || isNext) ? <span className="asc-stage-short">{s.short}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ----------------------------------------------------------- practice gates */

export function PracticeGates({ result }: { result: CompassResult }) {
  return (
    <section className="asc-gates" aria-labelledby="asc-gates-h">
      <h2 id="asc-gates-h" className="asc-h2">Practice gates on the route</h2>
      <p className="asc-lead">
        From stage 5 onward, the route asks for a minimum on each of the practices below before you
        can move up. This is deliberate: being skilled with AI should not carry anyone past a
        weakness that matters. A gate that is not yet open is simply the next place to practise.
      </p>
      <ul className="asc-gate-list">
        {GATE_DEFS.map((g) => {
          const d = result.dimensions[g.construct];
          const stageDef = STAGES.find((s) => s.stage === g.firstStage);
          const required = (stageDef?.gates as Record<string, number> | undefined)?.[g.construct];
          const open = required === undefined ? undefined : d.score >= required;
          return (
            <li key={g.construct} className="asc-gate" tabIndex={0}>
              <div className="asc-gate-top">
                <span className="asc-gate-name">{g.label}</span>
                <span className={`asc-gate-state ${open === undefined ? 'unknown' : open ? 'open' : 'pending'}`}>
                  {open === undefined ? 'Not applicable' : open ? 'Open' : 'Not yet open'}
                </span>
              </div>
              <div className="asc-gate-meta">
                {constructName(result.persona, g.construct)} {d.score}
                {required !== undefined ? ` · stage ${g.firstStage} needs ${required}` : ''}
              </div>
              <div className="asc-gate-track" aria-hidden="true">
                <span style={{ width: `${Math.max(2, d.score)}%` }} className={open ? 'open' : 'pending'} />
                {required !== undefined ? <b style={{ left: `${required}%` }} /> : null}
              </div>
              <p className="asc-gate-note">{constructContent(result.persona, g.construct).whatItMeasures}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------- foothold */

const FOOTHOLD_ORDER: ConstructId[] = ['agency', 'verification', 'transfer', 'dependencySafety'];

export function FootholdCard({ result }: { result: CompassResult }) {
  return (
    <section className="asc-card" aria-labelledby="asc-foot-h">
      <p className="asc-kicker">Your foothold</p>
      <h2 id="asc-foot-h" className="asc-card-h">Where you stand today</h2>
      <p className="asc-foot-intro">
        Four of the ten dimensions matter most for staying steady on this route. Each is scored out
        of 100.
      </p>
      <ul className="asc-foot-list">
        {FOOTHOLD_ORDER.map((id) => {
          const d = result.dimensions[id];
          const isRisk = CONSTRUCTS[id].reportedAsRisk;
          const shown = isRisk ? d.reportedScore : d.score;
          const state = d.microState;
          const stateLabel = state === 'strong' ? 'Strength' : state === 'developing' ? 'Developing' : 'Needs attention';
          return (
            <li key={id} className={`asc-foot state-${state}`}>
              <div className="asc-foot-name">
                {reportedConstructName(result.persona, id)}
              </div>
              <div className="asc-foot-score">
                <span className="asc-foot-n">{shown}</span>
                <span className="asc-foot-den">/100</span>
              </div>
              {/* meaning is never carried by colour alone: every row states its status in words */}
              <div className="asc-foot-state">
                <span className={`asc-dot state-${state}`} aria-hidden="true" />
                {stateLabel}
              </div>
              {isRisk ? (
                <p className="asc-foot-dir"><strong>Lower is healthier.</strong> Independent capability {d.score}.</p>
              ) : null}
              <p className="asc-foot-note">
                {state === 'strong'
                  ? CONSTRUCT_CONTENT[id].atStrong
                  : state === 'developing'
                    ? CONSTRUCT_CONTENT[id].atDeveloping
                    : CONSTRUCT_CONTENT[id].atWatch}
              </p>
              {d.confidence !== 'high' ? (
                <p className="asc-foot-conf">Confidence: {d.confidence}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------- route log */

export function RouteLogCard({ result }: { result: CompassResult }) {
  const measured = Object.values(result.dimensions).filter((d) => d.confidence === 'high').length;
  const rows: Array<[string, string]> = [
    ['Current stage', `${result.stage.stageName} (${result.stage.stage} of 10)`],
    ['Position within stage', result.stage.substage],
    ['Developmental index', `${result.stage.rawIndex} of 100`],
    ['Reported AI use', result.usageProfile.category],
    ['Assessment confidence', result.overallConfidence],
    ['Dimensions at high confidence', `${measured} of ${Object.keys(result.dimensions).length}`],
  ];
  return (
    <section className="asc-card" aria-labelledby="asc-log-h">
      <p className="asc-kicker">Your route</p>
      <h2 id="asc-log-h" className="asc-card-h">Your pattern so far</h2>
      <p className="asc-foot-intro">
        The facts behind your placement, in one place.
      </p>
      <dl className="asc-log">
        {rows.map(([k, v]) => (
          <div className="asc-log-row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="asc-unavailable">
        Practice history, experiment counts and a start date are not shown because this assessment
        records a single sitting. They become available once you take it a second time.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------- next climb */

export function NextClimbCard({ result }: { result: CompassResult }) {
  // The first step comes from the constraint and the direction of risk, the
  // same two things the plan further down the page is built on. It used to be
  // one fixed sentence handed to everybody, including to readers whose problem
  // was that they already did it.
  const lean = riskLean(result.composites.dependencyIndex, result.composites.underexposure);
  const step = firstStepFor(result.bottleneck.construct, lean);
  const primary = result.recommendations[0];
  // Two habits from the respondent's own plan, not a fixed pair.
  const supporting = result.recommendations.slice(1, 3).map((rec) => ({
    title: rec.capability,
    body: rec.practice,
  }));
  return (
    <section className="asc-card" aria-labelledby="asc-next-h">
      <p className="asc-kicker">Your next climb</p>
      <h2 id="asc-next-h" className="asc-card-h">The next ledge up</h2>
      <p className="asc-foot-intro">
        One thing to start with, and two habits to build around it. Small and repeatable beats
        ambitious and abandoned. The full plan, in order, is further down this page.
      </p>

      <div className="asc-experiment">
        <p className="asc-kicker asc-kicker-gold">First step · start small, make it real</p>
        <h3 className="asc-exp-h">{step.title}</h3>
        <p className="asc-exp-b">{step.body}</p>
        {/* The reason, not another action. The bottleneck carries why this
            dimension is the one holding the person, which is the question the
            label actually asks. */}
        <p className="asc-exp-why">
          <strong>Why this one:</strong> {result.bottleneck.reason
            || primary?.riskToMonitor
            || `${constructName(result.persona, result.bottleneck.construct)} is the reading doing most to hold your position.`}
        </p>
      </div>

      <ul className="asc-support">
        {supporting.map((s) => (
          <li key={s.title}>
            <strong>{s.title}</strong> {s.body}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------- methodology */

export function MethodologyDisclosure() {
  return (
    <details className="asc-method">
      <summary>How to read this map</summary>
      <div className="asc-method-body">
        <p>
          The developmental index is a reading, not a grade. It places you along a route rather than
          ranking you against anyone else, and the stage you land in is a zone rather than a fixed
          identity: small, real changes in habit move it.
        </p>
        <p>
          Position is continuous. An index of 37.8 sits at 37.8 percent of the route, not at the
          middle of the stage that contains it, which is why the marker rarely lines up with a camp.
        </p>
        <p>
          Stages 5 and above carry practice gates: minimum readings on authorship, verification,
          boundaries and transfer. A gate can hold your placement below the stage your index alone
          would reach. That is deliberate, so that fluency cannot carry someone past a weakness that
          matters.
        </p>
        <p>
          Dependency risk is reported as a risk, so a lower number is healthier there. Every other
          dimension is reported so that a higher number is healthier.
        </p>
        <p>
          These are assessment indices derived from your self-reported answers. They describe
          patterns your answers are consistent with, and they are not clinical or validated
          psychometric measurements. The summit is a direction, not a finish line.
        </p>
      </div>
    </details>
  );
}


/* ------------------------------------------------------- since last ascent */

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? 'your previous attempt'
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export function ComparisonCard({ comparison }: { comparison: AttemptComparison }) {
  const c = comparison;
  const up = c.indexDelta > 0;
  const flat = c.indexDelta === 0;
  const moved = c.dimensions.filter((d) => d.delta !== 0);
  const gained = moved.filter((d) => d.improved).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const slipped = moved.filter((d) => d.improved === false).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <section className="asc-compare" aria-labelledby="asc-cmp-h">
      <div className="asc-cmp-head">
        <div>
          <p className="asc-kicker">Since your last ascent</p>
          <h2 id="asc-cmp-h" className="asc-h2">
            {flat
              ? 'You are holding your position'
              : up ? 'You have climbed higher' : 'You have moved down the route'}
          </h2>
          <p className="asc-lead" style={{ marginBottom: 0 }}>
            This is attempt {c.attemptNumber}. Your previous reading was taken on {fmtDate(c.previousAt)}
            {c.daysBetween > 0 ? `, ${c.daysBetween} day${c.daysBetween === 1 ? '' : 's'} ago` : ''}.
            Movement on this route comes from changed habits, so a small shift over a short gap is
            normal and a large one is worth understanding.
          </p>
        </div>
        <div className={`asc-cmp-delta ${flat ? 'is-flat' : up ? 'is-up' : 'is-down'}`}>
          <span className="asc-cmp-arrow" aria-hidden="true">{flat ? '=' : up ? '\u2191' : '\u2193'}</span>
          <span className="asc-cmp-n">{up ? '+' : ''}{c.indexDelta}</span>
          <span className="asc-cmp-lab">index change</span>
        </div>
      </div>

      <div className="asc-cmp-rows">
        <div className="asc-cmp-row">
          <span>Developmental index</span>
          <span><b>{c.previousIndex}</b> to <b>{c.currentIndex}</b></span>
        </div>
        <div className="asc-cmp-row">
          <span>Stage</span>
          <span>
            <b>{c.previousStage}. {c.previousStageName}</b> to <b>{c.currentStage}. {c.currentStageName}</b>
            {c.stageDelta === 0 ? ' (same stage)' : ''}
          </span>
        </div>
      </div>

      <div className="asc-cmp-cols">
        <div>
          <h3 className="asc-cmp-h3">Where you gained</h3>
          {gained.length ? (
            <ul className="asc-cmp-list">
              {gained.slice(0, 4).map((d) => (
                <li key={d.construct}>
                  <span className="asc-cmp-name">{d.name}</span>
                  <span className="asc-cmp-move up">
                    {d.previous} to {d.current}
                    <em>{d.reportedAsRisk ? ' (lower is healthier)' : ''}</em>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="asc-cmp-empty">No dimension improved since last time.</p>}
        </div>
        <div>
          <h3 className="asc-cmp-h3">Where you slipped</h3>
          {slipped.length ? (
            <ul className="asc-cmp-list">
              {slipped.slice(0, 4).map((d) => (
                <li key={d.construct}>
                  <span className="asc-cmp-name">{d.name}</span>
                  <span className="asc-cmp-move down">
                    {d.previous} to {d.current}
                    <em>{d.reportedAsRisk ? ' (lower is healthier)' : ''}</em>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="asc-cmp-empty">Nothing slipped since last time.</p>}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ retake call */

export function RetakeInvite({ hasHistory }: { hasHistory: boolean }) {
  return (
    <section className="asc-retake" aria-labelledby="asc-retake-h">
      <h2 id="asc-retake-h" className="asc-h2">Come back and climb it again</h2>
      <p className="asc-lead">
        {hasHistory
          ? 'Each time you return with the same email address, this map adds your previous position so you can see the movement rather than guess at it.'
          : 'Take this again in a few months using the same email address. Your previous position is remembered, so the map will show where you stood last time and how far you have moved.'}
      </p>
      <p className="asc-retake-note">
        A useful gap is eight to twelve weeks: long enough for a changed habit to show up in your
        answers, short enough that you still remember what you tried.
      </p>
    </section>
  );
}

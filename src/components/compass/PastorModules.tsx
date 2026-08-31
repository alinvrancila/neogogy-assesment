'use client';

/**
 * The parts of a Preaching Formation Check that no other persona produces.
 *
 * The register of this whole file is a letter from a friend who has read your
 * answers, not a report card. Where something is unhealthy it is named plainly
 * and hedged, and a practice and a resource follow immediately.
 */

import { useState } from 'react';
import type { CompassResult } from '@/engine';
import type { Submission } from '@/engine/types';
import { helpHarm } from '@/engine/patterns';
import { healthyMarker, constructName } from '@/engine/display';
import { CONSTRUCTS } from '@/engine/config';
import type { ConstructId } from '@/engine/types';

/** 1. The opening: what this is, and what it is not. */
export function PastorOpeningBlock({ result }: { result: CompassResult }) {
  return (
    <section className="pastor-open">
      <p className="asc-kicker">Preaching Formation Check</p>
      <h2 className="pastor-h1">{result.archetype.name}</h2>
      <p className="pastor-tagline">{result.archetype.tagline}</p>
      <p className="pastor-narrative">{result.archetype.narrative}</p>
      <div className="pastor-score">
        <span className="pastor-score-n">{result.stage.rawIndex}</span>
        <span className="pastor-score-l">
          Formation Health Score, out of 100. Stage {result.stage.stage} of 10, {result.stage.stageName}.
        </span>
      </div>
      <p className="pastor-disclaimer">
        This is a private self-reflection index drawn from your own answers. It is not a spiritual
        assessment of your calling, your faithfulness, or your ministry, and the practices and
        resources below are offered, not prescribed.
      </p>
    </section>
  );
}

/** 2 and 3. Serving, and standing in. */
export function ServingAndStandingIn({ result }: { result: CompassResult }) {
  const { helping, harming } = helpHarm(result.patterns);
  return (
    <>
      <section className="pastor-block">
        <h3 className="pastor-h3">Where AI is serving your calling</h3>
        {helping.length ? (
          <ul className="pastor-list">
            {helping.map((p) => <li key={p.id}><strong>{p.label}.</strong> {p.narrative}</li>)}
          </ul>
        ) : (
          <p className="muted">
            No pattern of clear benefit crossed its threshold in your answers yet. These are
            combinations across several dimensions, so they tend to arrive together rather than one
            at a time, and their absence is not a judgment on your ministry.
          </p>
        )}
      </section>

      <section className="pastor-block pastor-block-watch">
        <h3 className="pastor-h3">Where AI may be standing in for the work</h3>
        {harming.length ? (
          <ul className="pastor-list">
            {harming.map((p) => <li key={p.id}><strong>{p.label}.</strong> {p.narrative}</li>)}
          </ul>
        ) : (
          <p className="muted">
            Nothing in your answers crossed one of these thresholds. That is a real result and worth
            saying plainly rather than hedging into a warning.
          </p>
        )}
      </section>
    </>
  );
}

/** 4. The Dependence Check, on its own. */
export function DependenceCheckBlock({ result }: { result: CompassResult }) {
  const d = result.dependenceCheck;
  if (!d) return null;
  return (
    <section className={`pastor-dependence pastor-dependence-${d.level}`}>
      <p className="asc-kicker">The Dependence Check</p>
      <h3 className="pastor-h3">{d.heading}</h3>
      <p>{d.narrative}</p>
      {d.practice ? <p><strong>One practice.</strong> {d.practice}</p> : null}
      {d.resource ? <p className="muted">{d.resource}</p> : null}
      <p className="muted pastor-fineprint">
        This reading is a mirror rather than a measure. It does not affect your score, your stage, or
        anything else in this check, and the two questions behind it were not stored.
      </p>
    </section>
  );
}

/** 5. If every tool vanished this week. */
export function OutageReading({ result }: { result: CompassResult }) {
  const capacity = result.dimensions.dependencySafety.score;
  const retained = result.dimensions.transfer.score;
  const verdict = capacity >= 65 && retained >= 55
    ? 'Your answers are consistent with a preacher who would still have a word for Sunday. The week would be longer and the preparation would hold.'
    : capacity >= 45
      ? 'Your answers suggest you would get there, with a longer week and a thinner message than you would want.'
      : 'Your answers suggest the week would be hard, because much of the preparation now runs through the tools. That is recoverable, and the practices below are built for it.';
  return (
    <section className="pastor-callout">
      <p className="asc-kicker">The outage reading</p>
      <h3 className="pastor-h3">If every tool vanished this week</h3>
      <p>{verdict}</p>
      <p className="muted">
        Read from unaided preaching capacity ({capacity}) and formation retained ({retained}).
        Dependence Exposure sits at {result.composites.dependencyIndex} out of 100, where higher
        means more of your preparation would be hard to reproduce without the tools.
      </p>
    </section>
  );
}

/** 6. Faithfulness to the text, and integrity. */
export function FaithfulnessAndIntegrity({ result }: { result: CompassResult }) {
  const v = result.dimensions.verification.score;
  const c = result.dimensions.responsibleUse.score;
  return (
    <section className="pastor-block">
      <h3 className="pastor-h3">Faithfulness to the text, and integrity</h3>
      <div className="pastor-pair">
        <div>
          <p className="pastor-metric"><span>{v}</span> Faithfulness to the text</p>
        </div>
        <div>
          <p className="pastor-metric"><span>{c}</span> Integrity and care</p>
        </div>
        <div>
          <p className="pastor-metric"><span>{result.composites.judgment}</span> Pulpit Integrity</p>
        </div>
      </div>
      <p>
        {v >= 65
          ? 'Your answers describe checking that is part of preparation rather than a reaction to suspicion.'
          : v >= 45
            ? 'Your answers suggest you check when something feels off, which catches the obvious errors and misses the plausible ones.'
            : 'Your answers are consistent with material reaching your people that has not been confirmed. One habit catches most of it: never preach a quotation you have not seen in the source.'}
      </p>
      <p className="muted">
        For context rather than comparison: Barna Group&rsquo;s 2026 State of the Church research with Gloo
        found that only 13 percent of United States Protestant pastors do not use AI at all, that 24
        percent now write or edit sermons with its help, and that 71 percent describe themselves as
        cautious about it. This check treats that caution as wisdom worth equipping rather than a
        number to move.
      </p>
    </section>
  );
}

/** 7. The ten readings, each with the goal it points toward. */
export function PastorSignature({ result }: { result: CompassResult }) {
  const rows = (Object.keys(CONSTRUCTS) as ConstructId[])
    .map((id) => ({
      id,
      name: constructName(result.persona, id),
      healthy: result.dimensions[id].score,
      shown: CONSTRUCTS[id].reportedAsRisk
        ? result.dimensions[id].reportedScore : result.dimensions[id].score,
      state: result.dimensions[id].microState,
      confidence: result.dimensions[id].confidence,
      marker: healthyMarker(result.persona, id),
    }))
    .sort((a, b) => a.healthy - b.healthy);
  return (
    <section className="pastor-block">
      <h3 className="pastor-h3">The ten readings</h3>
      <p className="muted">
        Sorted with the one that would repay attention first at the top. Each carries the goal it
        points toward, so a number never has to stand on its own.
      </p>
      <div className="pastor-dims">
        {rows.map((r) => (
          <div key={r.id} className="pastor-dim">
            <div className="pastor-dim-head">
              <span className="pastor-dim-name">{r.name}</span>
              <span className={`pastor-dim-val pastor-t-${r.state}`}>{r.shown}</span>
            </div>
            <span className="pastor-dim-track">
              <b className="pastor-tick pastor-tick-45" />
              <b className="pastor-tick pastor-tick-65" />
              <i className={`pastor-dim-fill pastor-f-${r.state}`} style={{ width: `${Math.max(2, r.healthy)}%` }} />
            </span>
            {r.marker ? <p className="pastor-marker">{r.marker}</p> : null}
            {r.confidence !== 'high' ? (
              <p className="pastor-conf">{r.confidence} confidence, from the evidence in your answers</p>
            ) : null}
          </div>
        ))}
      </div>
      <p className="muted pastor-fineprint">
        Dependence Risk is shown as a risk, so a lower number is healthier there. Its bar is drawn on
        the capacity behind it.
      </p>
    </section>
  );
}

/** 9. This week, this month, this season. */
export function FormationRoadmap({ result }: { result: CompassResult }) {
  const plan = result.formationRoadmap;
  if (!plan?.length) return null;
  return (
    <section className="pastor-block">
      <h3 className="pastor-h3">A way forward</h3>
      <p className="muted">
        One thing this week, a rhythm this month, and the slower work of a season. Each carries what
        it would look like for it to be happening, so you can tell rather than guess.
      </p>
      <div className="pastor-plan">
        {plan.map((phase) => (
          <div key={phase.window} className="pastor-phase">
            <p className="asc-kicker">{phase.window}</p>
            <h4 className="pastor-h4">{phase.title}</h4>
            <p className="muted">{phase.note}</p>
            {phase.actions.map((a) => (
              <div key={a.capability} className="pastor-action">
                <p className="pastor-action-h">{a.capability}</p>
                <p>{a.practice}</p>
                <p className="pastor-check"><strong>What it looks like.</strong> {a.checkpoint}</p>
                {a.resource ? <p className="muted pastor-res">{a.resource}</p> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 10. Reading, chosen for this reader's pattern. MLA, so a pastor can find them
 * in a library catalogue rather than only in a shop.
 */
const LIBRARY: Array<{ id: string; cite: string; offers: string; when: (r: CompassResult) => boolean }> = [
  {
    id: 'faith-at-work',
    cite: 'Vrancila, Alin. "Faith at Work: Navigating the AI Shift." Includes "Created to Create: A Theology of Technology and AI for Faithful Christian Living."',
    offers: 'The read-first rule, the recovery of friction, and a plain line about what should not be handed over.',
    when: () => true,
  },
  {
    id: 'agath',
    cite: 'Vrancila, Alin. "Navigating the Agathokakological Age: Faith, Artificial Intelligence, and the Future of Human Flourishing."',
    offers: 'Why preaching is wisdom formation rather than information delivery.',
    when: (r) => r.dimensions.amplification.score < 65 || r.dimensions.creativity.score < 65,
  },
  {
    id: 'quad',
    cite: 'Spencer, James. "The Quad." Draft chapter, Being Human in the Digital Age.',
    offers: 'Four questions to ask of anything a tool hands you, including what skill stands behind it.',
    when: (r) => r.dimensions.verification.score < 70,
  },
  {
    id: 'dispositions',
    cite: 'Spencer, James. "Theological Dispositions in a Digital World." Draft chapter, Being Human in the Digital Age.',
    offers: 'Attention as a theological act, and responding to God rather than to the tool.',
    when: (r) => r.dimensions.agency.score < 70 || r.dependenceCheck?.level !== 'led',
  },
  {
    id: 'uncoordinated',
    cite: 'Spencer, James. "Uncoordinated: The Need for Discipled Content Creation and Consumption." Draft chapter, Being Human in the Digital Age.',
    offers: 'Why discernment about these tools is the work of the church together rather than yours alone.',
    when: (r) => r.dimensions.adaptability.score < 70,
  },
  {
    id: 'discernment',
    cite: 'Spencer, James. "Introduction: Discernment in the Digital Age." Draft chapter, Being Human in the Digital Age.',
    offers: 'A considered case for preserving human-to-human contact where it costs you something.',
    when: (r) => r.dimensions.responsibleUse.score < 70,
  },
  {
    id: 'korpi',
    cite: 'Korpi, Todd. AI Goes to Church.',
    offers: 'Pastoral wisdom for a congregation meeting these tools, written for people in the work.',
    when: (r) => r.usageProfile.usage <= 2 || r.dimensions.fluency.score < 60,
  },
  {
    id: 'crouch',
    cite: 'Crouch, Andy. The Life We Are Looking For.',
    offers: 'Communities where people are known, needed, and loved in the flesh.',
    when: (r) => r.dimensions.creativity.score < 65 || r.dimensions.responsibleUse.score < 65,
  },
  {
    id: 'kim',
    cite: 'Kim, Jay. Analog Christian.',
    offers: 'Cultivating wisdom, and the fruit of the Spirit, in a digital age.',
    when: (r) => r.dimensions.adaptability.score < 65,
  },
  {
    id: 'code',
    cite: 'Vrancila, Alin, and James Spencer. In the Image of Code.',
    offers: 'The longer argument behind the framework this check is built on.',
    when: () => true,
  },
];

export function PastorResources({ result }: { result: CompassResult }) {
  const picked = LIBRARY.filter((b) => b.when(result)).slice(0, 6);
  return (
    <section className="pastor-block">
      <h3 className="pastor-h3">A short reading list</h3>
      <p className="muted">
        Chosen for the pattern in your answers rather than as a syllabus. Any one of them would be
        enough for a season.
      </p>
      <ul className="pastor-reading">
        {picked.map((b) => (
          <li key={b.id}>
            <span className="pastor-cite">{b.cite}</span>
            <span className="pastor-offers">{b.offers}</span>
          </li>
        ))}
      </ul>
      <p className="muted pastor-fineprint">
        Quotations in this check come from these works and from Scripture in the New Living
        Translation. Where a source is named without a quotation, that is deliberate.
      </p>
    </section>
  );
}

/** 11. A closing word, chosen to fit the reading rather than repeated for all. */
const CLOSINGS: Record<string, { ref: string; text: string }> = {
  strategic_integrator: { ref: '2 Timothy 4:2, NLT', text: 'Preach the word of God. Be prepared, whether the time is favorable or not.' },
  augmented_thinker: { ref: 'Psalm 1:2, NLT', text: 'But they delight in the law of the Lord, meditating on it day and night.' },
  grounded_selectivist: { ref: 'Micah 6:8, NLT', text: 'to do what is right, to love mercy, and to walk humbly with your God.' },
  capable_but_unexposed: { ref: 'Proverbs 4:7, NLT', text: 'Getting wisdom is the wisest thing you can do!' },
  dependent_operator: { ref: '2 Corinthians 12:9, NLT', text: 'My grace is all you need. My power works best in weakness.' },
  uncritical_consumer: { ref: '1 Thessalonians 5:21, NLT', text: 'but test everything that is said. Hold on to what is good.' },
  curious_explorer: { ref: 'James 1:19, NLT', text: 'You must all be quick to listen, slow to speak, and slow to get angry.' },
  hesitant_starter: { ref: 'Joshua 1:9, NLT', text: 'Be strong and courageous! Do not be afraid or discouraged.' },
  forming_practitioner: { ref: 'Philippians 1:6, NLT', text: 'God, who began the good work within you, will continue his work until it is finally finished.' },
};

export function PastorClosing({ result, submission, onRetake }: {
  result: CompassResult;
  submission?: Submission | null;
  onRetake: () => void;
}) {
  const c = CLOSINGS[result.archetype.id] ?? CLOSINGS.forming_practitioner;
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Builds the file and hands it straight back. Nothing is stored. */
  const savePdf = async () => {
    if (!submission) return;
    setSaving(true); setErr(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: submission.persona, usage: submission.usage,
          b1: submission.b1, b2: submission.b2, answers: submission.answers,
        }),
      });
      if (!res.ok) throw new Error('The file could not be built.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preaching-formation-check-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'The file could not be built.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="pastor-closing">
      <blockquote className="pastor-quote">
        {c.text}
        <cite>{c.ref}</cite>
      </blockquote>
      <p>
        Take this again in six months and see what has moved. Nothing was stored, so the comparison
        will be yours to keep rather than ours.
      </p>
      <div className="dlrow">
        <button className="btn btn-primary" onClick={savePdf} disabled={saving || !submission}>
          {saving ? 'Preparing your copy' : 'Save as PDF'} <span className="arrow">&rarr;</span>
        </button>
        <button className="btn btn-ghost" onClick={onRetake}>Take it again</button>
      </div>
      {err ? <p className="gate-err">{err}</p> : null}
      <p className="muted pastor-fineprint">
        The file is built and handed straight back to you. No copy is kept, and nothing about this
        reading is stored anywhere.
      </p>
    </section>
  );
}

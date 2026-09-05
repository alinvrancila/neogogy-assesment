'use client';

/**
 * Human Advantage Assessment results experience.
 *
 * Flow (Part E, Phase 3, as revised): the email gate is required. A respondent
 * submits their details, the server scores the submission, and the full result
 * is then shown on screen in Part B10 order while the PDF is emailed.
 *
 * This component renders only. All prose comes from the narrative engine via
 * generateReportSections(); all numbers come from the CompassResult. Nothing
 * here scores anything.
 */

import { useState } from 'react';
import { ECOSYSTEM, NEXT_STEP } from '@/brand';
import {
  generateReportSections, reportHead, confidenceLabel, REPORT_DISCLAIMER,
  type CompassResult, type ReportSection, type ReportSectionKey,
} from '@/engine';
import { improvementPlan, dimensionDetails, fingerprintReadings } from '@/engine/narrative';
import {
  DimensionCards, FingerprintMeters, GateGap, ThresholdStrip, CalibrationScale, PatternCards,
} from './ResultCharts';
import { Markdown } from './Markdown';
import AscentResults from './ascent/AscentResults';
import ResultCover from './ResultCover';
import {
  HealthHeadline, HelpingHarming, RiskRegister, ContinuityTest, TrustAndGovernance,
  DecisionIntegrity, NinetyDayPlan, OwnersExperiment, ScopedDimensions,
} from './BusinessModules';
import {
  PastorOpeningBlock, ServingAndStandingIn, DependenceCheckBlock, OutageReading,
  FaithfulnessAndIntegrity, PastorSignature, FormationRoadmap, PastorResources, PastorClosing,
  PastorReflections, PastorCertificate,
} from './PastorModules';
import ShareResult from './ShareResult';
import type { AttemptComparison } from '@/lib/history';
import type { Submission } from '@/engine/types';
import { MethodologyDisclosure, RetakeInvite } from './ascent/modules';
import {
  DimensionRadar, NextStagePanel, StageLadder, DimensionBars, CompositesPanel, PlanTimeline,
} from './Visuals';

export type GateData = {
  firstName: string; lastName: string; email: string;
  mobilePhone: string; heardFrom: string; consent: boolean;
};

export type GateState = { submitting: boolean; error: string | null };

const HEARD_OPTIONS = [
  'Search engine', 'Social media', 'Friend or colleague', 'School or organization',
  'A talk, class, or event', 'Newsletter or email', 'Other',
];

/* ------------------------------------------------------------------ gate */

export function GateForm({
  gate, onSubmit, onBack
}: { gate: GateState; onSubmit: (d: GateData) => void; onBack: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [heardFrom, setHeardFrom] = useState('');
  const [heardOther, setHeardOther] = useState('');
  const [consent, setConsent] = useState(false);

  return (
    <div className="wrap results">
      <div className="gate-card">
        <div className="gate-eyebrow">Your answers are in</div>
        <h3>Where should we send your report?</h3>
        <p>
          Enter your details to see your full profile and receive the report as a PDF. Your results
          appear on screen as soon as this is submitted.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const heard = heardFrom === 'Other'
              ? (heardOther.trim() ? `Other: ${heardOther.trim()}` : 'Other')
              : heardFrom;
            onSubmit({ firstName, lastName, email, mobilePhone, heardFrom: heard, consent });
          }}
        >
          <div className="grid2">
            <div className="field">
              <label htmlFor="nfc-first">First name</label>
              <input id="nfc-first" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="nfc-last">Last name</label>
              <input id="nfc-last" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="nfc-email">Email</label>
              <input id="nfc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="nfc-mobile">Mobile phone <span className="opt-tag">optional</span></label>
              <input id="nfc-mobile" type="tel" inputMode="tel" autoComplete="tel" value={mobilePhone}
                onChange={(e) => setMobilePhone(e.target.value)} placeholder="+63 912 345 6789" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="nfc-heard">How did you hear about this assessment?</label>
            <select id="nfc-heard" value={heardFrom} onChange={(e) => setHeardFrom(e.target.value)}>
              <option value="">Select one</option>
              {HEARD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {heardFrom === 'Other' && (
            <div className="field">
              <label htmlFor="nfc-heard-other">Tell us how you heard about it</label>
              <input id="nfc-heard-other" type="text" value={heardOther}
                onChange={(e) => setHeardOther(e.target.value)} placeholder="e.g. a podcast, a person, a conference" />
            </div>
          )}
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Send me my report and occasional insights about educational opportunities. You can unsubscribe any time.</span>
          </label>
          {gate.error ? <p className="gate-err">{gate.error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={gate.submitting}
            style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
            {gate.submitting ? 'Scoring your answers' : 'Show my results'} <span className="arrow">&rarr;</span>
          </button>
          <p className="gate-fine">
            Along with what you typed, we record the technical details every website receives: your
            internet address and the city it maps to, your device, browser and language, and how
            long the assessment took. We use it to understand who this reaches and to spot answers
            that were not seriously given. We never sell your data, and one message to us deletes
            your record. What is held, why, for how long and how to have it removed is set out in
            full in the{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">privacy notice</a>, with the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">terms of use</a> beside it.
          </p>
        </form>
        <div className="qnav" style={{ marginTop: 18 }}>
          <button className="back" type="button" onClick={onBack}><span>&larr;</span> Back to the questions</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- results */

function ConfidenceBanner({ result }: { result: CompassResult }) {
  const level = result.overallConfidence;
  if (level === 'high' || level === 'moderate') return null;
  // Preliminary and insufficient are displayed prominently, never as a footnote.
  return (
    <div className="conf-banner" role="status">
      <div className="conf-label">{confidenceLabel(level)}</div>
      <p>
        {level === 'insufficient'
          ? 'Too few of your answers were recorded for this to be read as a profile. Treat everything below as provisional.'
          : 'Some parts of this profile rest on limited evidence. Read the dimensions marked preliminary with that in mind.'}
      </p>
      {result.confidenceNotes.length ? (
        <ul className="md-list">{result.confidenceNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      ) : null}
    </div>
  );
}

/**
 * Reading order for the screen.
 *
 * The ascent block above already answers "where am I" and "what is next", so
 * the narrative sections that repeated those are left to the PDF rather than
 * shown twice. What remains runs as one argument: what your answers say, why
 * you are here, the detail behind that, what is helping and hurting, how your
 * own sense of it compares, then what to do, then what this rests on.
 *
 * `lead` is the sentence that hands one section to the next.
 */
const SCREEN_ORDER: Array<{ key: ReportSectionKey; lead?: string }> = [
  { key: 'profile' },
  { key: 'bottleneck', lead: 'The map shows where you are. This is why you are there rather than a stage further on.' },
  { key: 'signature', lead: 'That constraint comes out of ten separate readings. Here is each one, what it measures, and how yours reads.' },
  { key: 'helping', lead: 'Individual scores only say so much. These next two sections look at how your answers combine, which is where the useful findings usually sit.' },
  { key: 'harming' },
  { key: 'strengths' },
  { key: 'selfKnowledge' },
  { key: 'plan', lead: 'That is the picture. This is what to do with it.' },
  { key: 'roadmap' },
  { key: 'evidence', lead: 'Finally, where all of this comes from, and what it honestly cannot tell you.' },
  { key: 'experiment' },
];

function orderedForScreen(
  sections: ReportSection[]
): Array<{ section: ReportSection; lead?: string }> {
  const byKey = new Map(sections.map((s) => [s.key, s]));
  const out: Array<{ section: ReportSection; lead?: string }> = [];
  for (const { key, lead } of SCREEN_ORDER) {
    const section = byKey.get(key);
    if (section) out.push({ section, lead });
  }
  return out;
}

/** Lines before the first sub-heading. */
function introOnly(lines: string[]): string[] {
  const at = lines.findIndex((l) => l.startsWith('### '));
  return at === -1 ? lines : lines.slice(0, at);
}

/** Lines up to a marker line, used where a chart replaces the prose below it. */
function upTo(lines: string[], marker: string): string[] {
  const at = lines.findIndex((l) => l.includes(marker));
  return at === -1 ? lines : lines.slice(0, at);
}

/** Drop bullet lines, used where the same items are drawn as a chart. */
const withoutBullets = (lines: string[]) => lines.filter((l) => !l.trimStart().startsWith('- '));

function SectionBlock(
  { section, result, lead }: { section: ReportSection; result: CompassResult; lead?: string }
) {
  // Visuals belong to specific sections. Everything else is prose only.
  const visualBefore =
    section.key === 'continuum' ? <StageLadder result={result} />
    : section.key === 'signature' ? (
        <>
          <DimensionBars result={result} />
          <div className="two-col" style={{ marginTop: 18 }}>
            <DimensionRadar result={result} />
            <div><CompositesPanel result={result} /></div>
          </div>
        </>
      )
    : section.key === 'bottleneck' ? <GateGap result={result} />
    : section.key === 'strengths' ? <ThresholdStrip result={result} />
    : section.key === 'selfKnowledge' ? <CalibrationScale result={result} />
    : null;

  const visualAfter =
    section.key === 'profile' ? <FingerprintMeters readings={fingerprintReadings(result)} />
    : section.key === 'signature' ? <DimensionCards details={dimensionDetails(result)} />
    : section.key === 'helping' ? <PatternCards result={result} kind="help" />
    : section.key === 'harming' ? <PatternCards result={result} kind="harm" />
    : section.key === 'nextStage' ? <NextStagePanel result={result} />
    : section.key === 'plan' ? <PlanTimeline blocks={improvementPlan(result)} />
    : null;

  return (
    <section className="results-section" id={`sec-${section.key}`}>
      {lead ? <p className="rs-lead">{lead}</p> : null}
      <h3>{section.title}</h3>
      {visualBefore}
      {/* The plan is rendered as a timeline below, so on screen this section
          shows only its intro rather than repeating every item as prose. The
          PDF still renders the full markdown. */}
      <Markdown
        lines={
          section.key === 'plan' ? introOnly(section.lines)
          : section.key === 'signature' ? upTo(section.lines, 'Each dimension, unpacked')
          : section.key === 'profile' ? upTo(section.lines, 'The short version')
          : section.key === 'helping' || section.key === 'harming' ? withoutBullets(section.lines)
          : section.lines
        }
      />
      {visualAfter}
    </section>
  );
}

export default function Results({
  result, firstName, emailed, onRetake, comparison, submission
}: {
  result: CompassResult;
  firstName?: string;
  emailed: boolean;
  onRetake: () => void;
  comparison?: AttemptComparison | null;
  /** Pastor persona only: kept in memory so a PDF can be built without storing anything. */
  submission?: Submission | null;
}) {
  const head = reportHead(result);
  const sections = generateReportSections(result);
  const isBusiness = result.persona === 'business';
  const isPastor = result.persona === 'pastor';

  // The pastor check is its own document: a letter rather than a report card,
  // and anonymous, so it carries no email confirmation and no sharing.
  if (isPastor) {
    return (
      <div className="wrap results pastor">
        <ResultCover result={result} name={firstName} />
        <PastorOpeningBlock result={result} />
        {emailed ? (
          <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
            {firstName ? `Thank you, ${firstName}. ` : ''}A PDF of this reading is on its way to your inbox.
          </p>
        ) : null}
        <AscentResults result={result} comparison={null} />
        <ServingAndStandingIn result={result} />
        <DependenceCheckBlock result={result} />
        <OutageReading result={result} />
        <FaithfulnessAndIntegrity result={result} />
        <PastorSignature result={result} />

        {orderedForScreen(sections)
          .filter(({ section }) => ['bottleneck'].includes(section.key))
          .map(({ section }) => (
            <SectionBlock key={section.key} section={section} result={result} />
          ))}

        <FormationRoadmap result={result} />
        <PastorReflections result={result} />
        <PastorResources result={result} />
        <PastorCertificate result={result} name={firstName} />
        <ShareResult result={result} />
        <PastorClosing result={result} submission={submission ?? null} onRetake={onRetake} />

        <div className="foot">
          <div className="footmark">International Center for Applied Neogogy <span className="wm-ican">(ICAN)</span></div>
          <div className="fl" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
            {REPORT_DISCLAIMER} This is a private self-reflection index drawn from your own answers,
            not a spiritual assessment of your calling, your faithfulness, or your ministry.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap results">
      <ResultCover result={result} name={firstName} />

      {isBusiness ? <HealthHeadline result={result} /> : null}

      <AscentResults result={result} comparison={comparison} />

      {isBusiness ? (
        <>
          <HelpingHarming result={result} />

          {/* the two levels, side by side in the reader's mind */}
          <ScopedDimensions result={result} scope="owner" />
          <DecisionIntegrity result={result} />

          <ScopedDimensions result={result} scope="business" />
          <ContinuityTest result={result} />
          <TrustAndGovernance result={result} />

          <RiskRegister result={result} />
        </>
      ) : null}

      <ConfidenceBanner result={result} />

      {emailed ? (
        <p className="muted" style={{ marginTop: 4 }}>
          {firstName ? `Thank you, ${firstName}. ` : ''}A PDF of this report is on its way to your inbox.
        </p>
      ) : null}

      {orderedForScreen(sections)
        // the business report answers these in its own modules above
        .filter(({ section }) => !(isBusiness && ['helping', 'harming'].includes(section.key)))
        .map(({ section, lead }) => (
          <SectionBlock key={section.key} section={section} result={result} lead={lead} />
        ))}

      {isBusiness ? (
        <>
          <NinetyDayPlan result={result} />
          <OwnersExperiment />
        </>
      ) : null}

      <div className="results-cta">
        <h3>Keep going</h3>
        <p>
          The books behind this framework, and the work of the International Center for Applied
          Neogogy, are at ican.ph.
        </p>
        <div className="dlrow">
          <a className="btn btn-primary" href="https://ican.ph/books" target="_blank" rel="noopener noreferrer">
            See the books <span className="arrow">&rarr;</span>
          </a>
          <button className="btn btn-ghost" onClick={onRetake}>Take it again</button>
        </div>
      </div>

      <ShareResult result={result} />

      <RetakeInvite hasHistory={!!comparison} />

      <MethodologyDisclosure />

      <NextStep />

      <EcosystemStrip />

      <div className="foot">
        <div className="footmark">International Center for Applied Neogogy <span className="wm-ican">(ICAN)</span></div>
        <div className="fl">
          Neogogy Human Advantage Assessment · Powered by ICAN.ph · created by Alin Vrancila, Ph.D. ·{' '}
          <a href="https://ican.ph" target="_blank" rel="noopener noreferrer">ican.ph</a>
          {' · '}<a href="/privacy">Privacy</a>
          {' · '}<a href="/terms">Terms</a>
        </div>
        <div className="fl" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>{REPORT_DISCLAIMER}</div>
      </div>
    </div>
  );
}


/**
 * Where a respondent goes next.
 *
 * The reading ends with a position and a set of practices, so the one link that
 * belongs here is the place those practices are worked on. It says the same
 * sentence as the last page of the report, from the same constant.
 */
function NextStep() {
  return (
    <div className="nextstep">
      <p className="nextstep-line">{NEXT_STEP.line}</p>
      <a className="nextstep-link" href={NEXT_STEP.url} target="_blank" rel="noopener noreferrer">
        {NEXT_STEP.label}
      </a>
    </div>
  );
}

/** The four organisations, as supplied, each one a link. */
function EcosystemStrip() {
  return (
    <div className="ecostrip">
      <p className="ecostrip-h">The work behind the assessment</p>
      <ul>
        {ECOSYSTEM.map((o) => (
          <li key={o.name}>
            <a href={o.url} target="_blank" rel="noopener noreferrer"
              aria-label={`${o.name}, opens in a new tab`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.logo} alt={o.name} width={o.w} height={o.h} loading="lazy" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

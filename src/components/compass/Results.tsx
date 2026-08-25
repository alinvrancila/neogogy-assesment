'use client';

/**
 * Formation Compass v2 results experience.
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
import {
  generateReportSections, reportHead, confidenceLabel, REPORT_DISCLAIMER,
  type CompassResult, type ReportSection,
} from '@/engine';
import { improvementPlan } from '@/engine/narrative';
import { Markdown } from './Markdown';
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
            We honor the Philippines Data Privacy Act and GDPR basics: deletion on request, and we
            never sell your data.
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

/** Lines before the first sub-heading. */
function introOnly(lines: string[]): string[] {
  const at = lines.findIndex((l) => l.startsWith('### '));
  return at === -1 ? lines : lines.slice(0, at);
}

function SectionBlock({ section, result }: { section: ReportSection; result: CompassResult }) {
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
    : null;
  const visualAfter =
    section.key === 'nextStage' ? <NextStagePanel result={result} />
    : section.key === 'plan' ? <PlanTimeline blocks={improvementPlan(result)} />
    : null;

  return (
    <section className="results-section" id={`sec-${section.key}`}>
      <div className="rs-head"><span className="eyebrow">Section {section.n}</span></div>
      <h3>{section.title}</h3>
      {visualBefore}
      {/* The plan is rendered as a timeline below, so on screen this section
          shows only its intro rather than repeating every item as prose. The
          PDF still renders the full markdown. */}
      <Markdown lines={section.key === 'plan' ? introOnly(section.lines) : section.lines} />
      {visualAfter}
    </section>
  );
}

export default function Results({
  result, firstName, emailed, onRetake
}: {
  result: CompassResult;
  firstName?: string;
  emailed: boolean;
  onRetake: () => void;
}) {
  const head = reportHead(result);
  const sections = generateReportSections(result);

  return (
    <div className="wrap results">
      <header className="results-hero">
        <span className="eyebrow">{head.title}</span>
        <h2 className="verdict-label">{result.archetype.name}</h2>
        <p className="verdict-sub">{result.archetype.tagline}</p>
        <div className="index-badge">
          Stage {result.stage.stage} of 10, {result.stage.stageName}
          {' · '}index {result.stage.rawIndex}
          {' · '}{confidenceLabel(result.overallConfidence)}
        </div>
      </header>

      <ConfidenceBanner result={result} />

      {emailed ? (
        <p className="muted" style={{ marginTop: 4 }}>
          {firstName ? `Thank you, ${firstName}. ` : ''}A PDF of this report is on its way to your inbox.
        </p>
      ) : null}

      {sections.map((s) => <SectionBlock key={s.key} section={s} result={result} />)}

      <div className="results-cta">
        <h3>Come back to this</h3>
        <p>
          Habits move. Retaking this in a few months is the simplest way to see whether your
          position on the continuum is holding, rising, or slipping.
        </p>
        <div className="dlrow">
          <a className="btn btn-primary" href="https://www.ican.ph" target="_blank" rel="noopener noreferrer">
            Visit www.ican.ph <span className="arrow">&rarr;</span>
          </a>
          <button className="btn btn-ghost" onClick={onRetake}>Take it again</button>
        </div>
      </div>

      <div className="foot">
        <div className="footmark">International Center for Applied Neogogy <span className="wm-ican">(ICAN)</span></div>
        <div className="fl">
          The Neogogy Formation Compass · created by Alin Vrancila, Ph.D. ·{' '}
          <a href="https://www.ican.ph" target="_blank" rel="noopener noreferrer">www.ican.ph</a>
        </div>
        <div className="fl" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>{REPORT_DISCLAIMER}</div>
      </div>
    </div>
  );
}

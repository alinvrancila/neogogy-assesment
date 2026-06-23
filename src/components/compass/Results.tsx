'use client';

import { useState } from 'react';
import { dimensions, axes, evidence } from '@/data/compass';
import { bandOf, vulnList, type CompassResult } from '@/lib/engine';
import { CompassGauge, QuadrantMap, RadarSvg, DimensionBars } from './Visuals';

const Html = ({ html, ...rest }: { html: string } & React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...rest} dangerouslySetInnerHTML={{ __html: html }} />
);

type GateState = { submitting: boolean; error: string | null };

export type GateData = { firstName: string; lastName: string; email: string; heardFrom: string; consent: boolean };

export type ResultsProps = {
  result: CompassResult;
  modality: string;
  locked: boolean;
  gate?: GateState;
  onSubmit?: (data: GateData) => void;
  onDownload?: () => void;
  downloading?: boolean;
  onRetake?: () => void;
};

/* ---- verdict hero ---- */
function VerdictHero({ result }: { result: CompassResult }) {
  const P = result.persona;
  return (
    <div className="verdict-hero">
      <span className="eyebrow" style={{ justifyContent: 'center' }}>Your formation profile</span>
      <div className="verdict-compass" style={{ marginTop: 14 }}>
        <div className="compass" style={{ width: '100%' }}>
          <CompassGauge value={result.overall} size={420} />
          <div className="compass-readout">
            <div className="val" style={{ fontSize: '2.4rem' }}>{result.overall}</div>
            <div className="lab">formation index</div>
          </div>
        </div>
      </div>
      <div className="poles" style={{ maxWidth: 420, margin: '0 auto' }}>
        <span className="harm">Deforming</span><span className="help">Forming</span>
      </div>
      <div style={{ fontSize: '3rem', marginTop: 30 }}>{P.emoji}</div>
      <div className="verdict-label" style={{ color: P.accent }}>You are {P.name}</div>
      <div className="mono" style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)', marginTop: 8 }}>{P.quad}</div>
      <p className="verdict-sub">{P.tagline}</p>
      <div className="index-badge">Resilience {result.resilience} · Readiness {result.readiness}{result.abstainer ? ' · low AI use detected' : ''}</div>
    </div>
  );
}

function MapSection({ result }: { result: CompassResult }) {
  return (
    <div className="results-section">
      <div className="rs-head"><span className="eyebrow">Where you stand</span></div>
      <h3>The map of formation</h3>
      <p className="rs-intro">
        Two forces decide whether AI helps or harms a learner: how well your mind is <strong>protected</strong> from its erosions, and how <strong>prepared</strong> you are to thrive with it. Your position is plotted below, with the path toward The Guide.
      </p>
      <div className="surface chart-wrap">
        <QuadrantMap result={result} />
        <div className="legend-row">
          <span className="lg"><span className="sw" style={{ background: 'var(--growth)' }} /> The Guide · wise &amp; capable</span>
          <span className="lg"><span className="sw" style={{ background: 'var(--gold)' }} /> The Anchor · safe, unprepared</span>
          <span className="lg"><span className="sw" style={{ background: 'var(--crimson)' }} /> The Sprinter · capable, eroding</span>
          <span className="lg"><span className="sw" style={{ background: '#7a6b5c' }} /> The Wanderer · most to gain</span>
        </div>
      </div>
    </div>
  );
}

function PersonaAnatomy({ result }: { result: CompassResult }) {
  const P = result.persona;
  return (
    <div className="results-section">
      <div className="rs-head"><span className="eyebrow">Who you are right now</span></div>
      <h3 style={{ color: P.accent }}>{P.name}</h3>
      <p className="rs-intro" style={{ maxWidth: '64ch' }}>{P.portrait}</p>

      <div className="surface" style={{ padding: '20px 24px', marginBottom: 14, borderLeft: `4px solid ${P.accent}` }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: P.accent, marginBottom: 7 }}>What this looks like</div>
        <p>{P.looksLike}</p>
      </div>

      <div className="tip" style={{ marginBottom: 18 }}>
        <div className="tlab">📊 The research behind this</div>
        <div className="ttext">{P.research.text}</div>
        <div className="tsrc">{P.research.src}</div>
      </div>

      <div className="two-col" style={{ marginTop: 8 }}>
        <div className="sr-card surface">
          <h4 style={{ color: 'var(--growth)' }}>✦ Your strengths</h4>
          {P.strengths.map((s) => (
            <div className="sr-item" key={s}>
              <span className="sr-ic" style={{ background: 'rgba(47,111,98,.14)', color: 'var(--growth)' }}>+</span>
              <div className="sr-body"><div className="sr-name">{s}</div></div>
            </div>
          ))}
        </div>
        <div className="sr-card surface">
          <h4 style={{ color: 'var(--crimson)' }}>⚲ Your blind spots</h4>
          {P.blindspots.map((s) => (
            <div className="sr-item" key={s}>
              <span className="sr-ic" style={{ background: 'rgba(158,29,32,.12)', color: 'var(--crimson)' }}>!</span>
              <div className="sr-body"><div className="sr-name">{s}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface" style={{ padding: '24px 26px', marginTop: 18, borderLeft: `4px solid ${P.accent}` }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: P.accent, marginBottom: 8 }}>The Pull: what works against you</div>
        <p style={{ fontSize: '1.05rem' }}>{P.pull}</p>
      </div>

      <div className="results-section" style={{ marginTop: 24 }}>
        <div className="rs-head"><span className="eyebrow">What to do about it</span></div>
        <h3>Your next moves</h3>
        <div className="moves">
          {P.moves.map((m, i) => (
            <div className="move" key={m}>
              <span className="move-n" style={{ background: P.accent }}>{i + 1}</span>
              <span className="move-t">{m}</span>
            </div>
          ))}
        </div>
        <div className="surface" style={{ padding: '24px 26px', marginTop: 16, borderLeft: '4px solid var(--growth)' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--growth)', marginBottom: 8 }}>Your next step: toward The Guide</div>
          <Html html={P.nextstep} style={{ fontSize: '1.05rem' }} />
        </div>
      </div>
    </div>
  );
}

function BlindSpots({ result }: { result: CompassResult }) {
  const items = vulnList(result);
  return (
    <div className="results-section">
      <div className="rs-head"><span className="eyebrow">Read this even if you scored well</span></div>
      <h3>Your blind spots, named</h3>
      <p className="rs-intro">A good result is not the same as no risk. These are the vulnerabilities your specific pattern hides, the ways a person can &ldquo;pass&rdquo; this assessment and still be exposed.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((it) => (
          <div className="surface" key={it.title} style={{ padding: '22px 24px', borderLeft: '4px solid var(--amber)' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 7 }}>⚠ {it.title}</div>
            <p>{it.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DimensionsSection({ result }: { result: CompassResult }) {
  return (
    <div className="results-section">
      <div className="rs-head"><span className="eyebrow">The full picture</span></div>
      <h3>Your ten dimensions</h3>
      <p className="rs-intro">One weak dimension can undermine nine strong ones, because Critical Partnership holds the whole system together. Here is every dimension, honestly.</p>
      <div className="two-col">
        <div className="surface chart-wrap"><RadarSvg result={result} /></div>
        <div className="surface chart-wrap"><DimensionBars result={result} /></div>
      </div>
    </div>
  );
}

function IllusionMeter({ result }: { result: CompassResult }) {
  const pos = Math.max(0, Math.min(100, 50 + result.illusion * 16));
  const numColor = result.illusion >= 2 ? 'var(--crimson)' : result.illusion <= -1 ? 'var(--growth)' : 'var(--amber)';
  const blurb =
    result.illusion >= 2
      ? 'This modality feels considerably better than it actually forms you. That gap is where the real risk lives.'
      : result.illusion <= -1
      ? 'You judged yourself more harshly than the evidence. Give yourself credit, then keep building.'
      : 'Your sense of this and its real effect are well aligned. That self-awareness is itself a strength.';
  return (
    <div className="results-section">
      <div className="rs-head"><span className="eyebrow">Feeling vs reality</span></div>
      <h3>The productivity illusion meter</h3>
      <p className="rs-intro">Before you started, you told us how healthy this felt. Here is that feeling against what your answers actually measured.</p>
      <div className="surface illusion-card">
        <div className="illusion-num" style={{ color: numColor }}>{result.illusion > 0 ? '+' : ''}{result.illusion}</div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', marginTop: 4 }}>illusion gap</div>
        <div className="illusion-track"><div className="illusion-marker" style={{ left: `${pos}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
          <span style={{ color: 'var(--growth)' }}>clear-eyed</span><span>honest</span><span style={{ color: 'var(--crimson)' }}>over-confident</span>
        </div>
        <p style={{ marginTop: 16, fontSize: '.95rem', maxWidth: '52ch', marginLeft: 'auto', marginRight: 'auto' }}>{blurb}</p>
      </div>
    </div>
  );
}

/* The complete profile, shown crisp when unlocked and blurred behind the gate when locked. */
function FullProfile({ result }: { result: CompassResult }) {
  return (
    <>
      <VerdictHero result={result} />
      <MapSection result={result} />
      <PersonaAnatomy result={result} />
      <BlindSpots result={result} />
      <DimensionsSection result={result} />
      <IllusionMeter result={result} />
    </>
  );
}

const HEARD_OPTIONS = ['Search engine', 'Social media', 'Friend or colleague', 'School or organization', 'A talk, class, or event', 'Newsletter or email', 'Other'];

function GateForm({ gate, onSubmit }: { gate?: GateState; onSubmit?: (d: GateData) => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [heardFrom, setHeardFrom] = useState('');
  const [heardOther, setHeardOther] = useState('');
  const [consent, setConsent] = useState(false);
  return (
    <div className="gate-card">
      <div className="gate-eyebrow">Your report is ready</div>
      <h3>Get your full report, free</h3>
      <p>Tell us where to send it and we will email your complete formation profile: your map, every dimension, your blind spots, and your next moves.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const heard = heardFrom === 'Other' ? (heardOther.trim() ? `Other: ${heardOther.trim()}` : 'Other') : heardFrom;
          onSubmit?.({ firstName, lastName, email, heardFrom: heard, consent });
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
        <div className="field">
          <label htmlFor="nfc-email">Email</label>
          <input id="nfc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="nfc-heard">How did you hear about this assessment?</label>
          <select id="nfc-heard" value={heardFrom} onChange={(e) => setHeardFrom(e.target.value)}>
            <option value="">Select one…</option>
            {HEARD_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        {heardFrom === 'Other' && (
          <div className="field">
            <label htmlFor="nfc-heard-other">Tell us how you heard about it</label>
            <input id="nfc-heard-other" type="text" value={heardOther} onChange={(e) => setHeardOther(e.target.value)} placeholder="e.g. a podcast, a person, a conference" />
          </div>
        )}
        <label className="consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Send me my report and occasional insights about educational opportunities. You can unsubscribe any time.</span>
        </label>
        {gate?.error ? <p className="gate-err">{gate.error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={gate?.submitting} style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
          {gate?.submitting ? 'Sending…' : 'Send me my report'} <span className="arrow">→</span>
        </button>
        <p className="gate-fine">We honor the Philippines Data Privacy Act and GDPR basics: deletion on request, never a sale of your data.</p>
      </form>
    </div>
  );
}

/* Confirmation shown after the email is captured. The results are delivered by
   email, not on screen. Built from the closing page of the PDF report. */
export function ThankYou({ firstName, email, onRetake }: { firstName: string; email: string; onRetake?: () => void }) {
  return (
    <div className="wrap results">
      <div className="thanks-hero">
        <div className="thanks-badge">✓ Report on its way</div>
        <h2 className="thanks-title">Thank you{firstName ? `, ${firstName}` : ''}.</h2>
        <p className="thanks-sent">
          We are sending your full Neogogy Formation Compass report to <strong>{email || 'your inbox'}</strong> right now. It should arrive within a few minutes. If you do not see it, check your spam or promotions folder.
        </p>
      </div>

      <div className="results-section">
        <div className="rs-head"><span className="eyebrow">The one question beneath it all</span></div>
        <h3 className="thanks-q">Does this way of learning make you stronger or weaker once the machine is set aside?</h3>
        <p className="rs-intro" style={{ maxWidth: '64ch' }}>
          A way of learning can lift your output on every visible measure while lowering you on every invisible one, and avoiding AI altogether trades one debt for another. Neogogy exists to keep both lines moving the same way, so that as the tools get smarter, you get wiser.
        </p>
      </div>

      <div className="results-cta">
        <h3>Keep going</h3>
        <p>Read Neogogy: Learning at the Speed of Mind and Understanding Neogogy. Bring this instrument to your school, team, or family, or become a Certified Neogogy Educator with the International Center for Applied Neogogy.</p>
        <div className="dlrow">
          <a className="btn btn-primary" href="https://www.ican.ph" target="_blank" rel="noopener noreferrer">Visit www.ican.ph <span className="arrow">→</span></a>
          <button className="btn btn-ghost" onClick={onRetake}>Take it again</button>
        </div>
        <p style={{ marginTop: 22, fontSize: '.85rem' }}>Re-take this assessment in a few months to track how your formation moves over time.</p>
      </div>

      <div className="foot">
        <div className="footmark">International Center for Applied Neogogy <span className="wm-ican">(ICAN)</span></div>
        <div className="fl">The Neogogy Formation Compass · created by Alin Vrancila, Ph.D. · <a href="https://www.ican.ph" target="_blank" rel="noopener noreferrer">www.ican.ph</a></div>
        <div className="fl" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>Grounded in the Neogogy framework and peer-reviewed research, 2023 to 2026.</div>
      </div>
    </div>
  );
}

export default function Results({ result, modality, locked, gate, onSubmit, onDownload, downloading, onRetake }: ResultsProps) {
  const P = result.persona;
  const mod = modality ? `“${modality}”` : 'your learning';

  if (locked) {
    return (
      <div className="wrap results">
        <div className="locked-stage">
          <div className="locked-blur" aria-hidden="true">
            <FullProfile result={result} />
          </div>
          <div className="locked-gate">
            <GateForm gate={gate} onSubmit={onSubmit} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap results">
      <FullProfile result={result} />

      <div className="results-cta">
        <h3>Take your full report with you</h3>
        <p>A beautiful PDF with your compass, your map, every dimension, your blind spots, and what to do next, everything you need to understand whether AI is helping or harming {mod}. We have also sent it to your inbox.</p>
        <div className="dlrow">
          <button className="btn btn-primary" onClick={onDownload} disabled={downloading}>{downloading ? 'Preparing…' : '↓ Download my PDF report'}</button>
          <button className="btn btn-ghost" onClick={onRetake}>Retake</button>
        </div>
        <p style={{ marginTop: 22, fontSize: '.85rem' }}>{P.feed}</p>
      </div>

      <div className="foot">
        <div className="footmark">International Center for Applied Neogogy <span className="wm-ican">(ICAN)</span></div>
        <div className="fl">The Neogogy Formation Compass · created by Alin Vrancila, Ph.D. · <a href="https://www.ican.ph" target="_blank" rel="noopener noreferrer">www.ican.ph</a></div>
        <div className="fl" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>Grounded in the Neogogy framework and peer-reviewed research, 2023 to 2026.</div>
      </div>
    </div>
  );
}

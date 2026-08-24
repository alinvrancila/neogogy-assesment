'use client';

/**
 * Formation Compass v2, assessment flow.
 *
 * This component drives screens and collects answers. It contains no scoring
 * math of any kind: the screen list comes from applicableItems(), and the
 * Submission it assembles is scored server side by src/engine.
 *
 * Screen order (Part E, Phase 2):
 *   hero -> setup (persona, B1, B2) -> usage -> applicableItems(persona, usage) -> gate
 */

import '@/app/compass.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applicableItems } from '@/engine';
import type { Item, Persona, Submission } from '@/engine/types';
import { USAGE_ITEM } from '@/items/shared';
import type { CompassResult } from '@/engine';
import {
  ItemScreen, OptionCards, optionsFor, B1_CHOICES, BAND_CHOICES, type Choice
} from './items';
import { IcanLogo, ReportPreview } from './Visuals';
import Results, { GateForm, type GateData, type GateState } from './Results';

type Screen = 'hero' | 'setup' | 'quiz' | 'gate' | 'results';

const PERSONAS: Array<{ id: Persona; name: string; blurb: string }> = [
  { id: 'student', name: 'Student', blurb: 'How AI shapes my own learning and my own work' },
  { id: 'teacher', name: 'Teacher', blurb: 'How AI shapes my teaching practice' },
  { id: 'parent', name: 'Parent', blurb: 'How AI shapes my parenting and my family life' },
  { id: 'administrator', name: 'Administrator', blurb: 'How AI shapes my leadership and my decisions' }
];

/** Coarse screen count used only before the usage answer is known. */
const COARSE_TOTAL = 34;

const STORE_KEY = 'nfc2Progress';

type Saved = {
  screen: Screen;
  persona: Persona | null;
  usage: number | null;
  b1: number | null;
  b2: number | null;
  answers: Record<string, number>;
  pos: number;
};

export default function CompassApp() {
  const [screen, setScreen] = useState<Screen>('hero');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [usage, setUsage] = useState<number | null>(null);
  const [b1, setB1] = useState<number | null>(null);
  const [b2, setB2] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pos, setPos] = useState(0);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [gate, setGate] = useState<GateState>({ submitting: false, error: null });
  const [result, setResult] = useState<CompassResult | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [firstName, setFirstName] = useState('');

  const restored = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------------------------ applicable screen list */
  const items: Item[] = useMemo(
    () => (persona && usage != null ? applicableItems(persona, usage) : []),
    [persona, usage]
  );
  const itemsRef = useRef<Item[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const totalScreens = usage != null ? 1 + items.length : COARSE_TOTAL;
  const answeredCount =
    (usage != null ? 1 : 0) + items.filter((i) => answers[i.id] !== undefined).length;
  const progress = Math.min(100, Math.round((answeredCount / totalScreens) * 100));

  /* ----------------------------------------------------------- persistence */
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Saved;
        // Only in-progress screens are resumable. The gate and results screens
        // depend on a submission and a result that live in memory only, so
        // restoring onto them would strand the respondent on a dead button.
        const resumable = s.screen === 'setup' || s.screen === 'quiz';
        const usable = resumable && (s.screen === 'setup' || (s.persona != null && s.usage != null));
        if (usable) {
          setScreen(s.screen);
          setPersona(s.persona ?? null);
          setUsage(s.usage ?? null);
          setB1(s.b1 ?? null);
          setB2(s.b2 ?? null);
          setAnswers(s.answers ?? {});
          setPos(s.pos ?? 0);
        } else {
          window.sessionStorage.removeItem(STORE_KEY);
        }
      }
    } catch {
      /* a corrupt draft simply starts the assessment over */
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      const s: Saved = { screen, persona, usage, b1, b2, answers, pos };
      window.sessionStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {
      /* storage is best effort */
    }
  }, [screen, persona, usage, b1, b2, answers, pos]);

  const clearDraft = useCallback(() => {
    try { window.sessionStorage.removeItem(STORE_KEY); } catch { /* best effort */ }
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [screen, pos]);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  /* -------------------------------------------------------------- assembly */
  const finish = useCallback(() => {
    if (!persona || usage == null) return;
    const applicable = itemsRef.current;
    const ids = new Set(applicable.map((i) => i.id));
    const clean: Record<string, number> = {};
    Object.entries(answers).forEach(([k, v]) => { if (ids.has(k)) clean[k] = v; });

    if (process.env.NODE_ENV !== 'production') {
      const stray = Object.keys(answers).filter((k) => !ids.has(k));
      if (stray.length) {
        // eslint-disable-next-line no-console
        console.error('[compass] answers contain non-applicable item ids:', stray);
      }
    }

    setSubmission({
      persona,
      usage,
      b1: b1 ?? undefined,
      b2: b2 ?? undefined,
      answers: clean
    });
    setScreen('gate');
  }, [persona, usage, b1, b2, answers]);

  /* ------------------------------------------------------------ navigation */
  const advance = useCallback(() => {
    setPos((p) => {
      const lastPos = itemsRef.current.length; // pos 0 is usage, items occupy 1..n
      if (p >= lastPos) { finish(); return p; }
      return p + 1;
    });
  }, [finish]);

  const advanceSoon = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(advance, 280);
  }, [advance]);

  const back = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (pos === 0) { setScreen('setup'); return; }
    setPos((p) => Math.max(0, p - 1));
  }, [pos]);

  /* --------------------------------------------------------------- answers */
  const chooseUsage = useCallback((v: number) => {
    if (!persona) return;
    setUsage(v);
    // Changing usage changes which adaptive branches apply. Drop any answer that
    // is no longer applicable so the Submission never carries a stale item id.
    const ids = new Set(applicableItems(persona, v).map((i) => i.id));
    setAnswers((a) => {
      const next: Record<string, number> = {};
      Object.entries(a).forEach(([k, val]) => { if (ids.has(k)) next[k] = val; });
      return next;
    });
    advanceSoon();
  }, [persona, advanceSoon]);

  const chooseItem = useCallback((id: string, v: number) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    advanceSoon();
  }, [advanceSoon]);

  /* ---------------------------------------------------------------- submit */
  const submitGate = useCallback(async (data: GateData) => {
    if (!submission) return;
    if (!data.firstName.trim() || !data.email.trim()) {
      setGate({ submitting: false, error: 'First name and email are required.' });
      return;
    }
    setGate({ submitting: true, error: null });
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submission, ...data, name: `${data.firstName} ${data.lastName}`.trim() })
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.result) {
        setGate({ submitting: false, error: payload?.error || 'Something went wrong. Please try again.' });
        return;
      }
      setResult(payload.result as CompassResult);
      setEmailed(Boolean(payload.emailSent));
      setFirstName(data.firstName.trim());
      setGate({ submitting: false, error: null });
      clearDraft();
      setScreen('results');
    } catch {
      setGate({ submitting: false, error: 'Network error. Please check your connection and try again.' });
    }
  }, [submission, clearDraft]);

  /* -------------------------------------------------------------- keyboard */
  const atUsage = pos === 0;
  const currentItem: Item | null = atUsage ? USAGE_ITEM : (items[pos - 1] ?? null);
  const currentChoices: Choice[] = useMemo(
    () => (currentItem ? optionsFor(currentItem) : []),
    [currentItem]
  );

  useEffect(() => {
    if (screen !== 'quiz' || !currentItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { back(); return; }
      const match = currentChoices.find((c) => String(c.value) === e.key);
      if (!match) return;
      if (atUsage) chooseUsage(match.value);
      else chooseItem(currentItem.id, match.value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, currentItem, currentChoices, atUsage, back, chooseUsage, chooseItem]);

  const restart = useCallback(() => {
    clearDraft();
    setScreen('hero'); setPersona(null); setUsage(null); setB1(null); setB2(null);
    setAnswers({}); setPos(0); setSubmission(null);
    setResult(null); setEmailed(false); setFirstName('');
    setGate({ submitting: false, error: null });
  }, [clearDraft]);

  /* ---------------------------------------------------------------- render */
  // Every selector in compass.css is scoped under .nfc, so each screen must be
  // wrapped in it or the entire design system silently fails to match.
  const shell = (inner: React.ReactNode) => <div className="nfc">{inner}</div>;

  if (screen === 'hero') {
    return shell(<Hero onStart={() => setScreen('setup')} />);
  }

  if (screen === 'setup') {
    return shell(
      <Setup
        persona={persona}
        b1={b1}
        b2={b2}
        onPersona={setPersona}
        onB1={setB1}
        onB2={setB2}
        onBack={() => setScreen('hero')}
        onStart={() => { setPos(0); setScreen('quiz'); }}
      />
    );
  }

  if (screen === 'quiz' && currentItem) {
    const selected = atUsage ? usage : (answers[currentItem.id] ?? null);
    const header = atUsage
      ? 'First, a quick read on how much you use AI'
      : `Question ${pos + 1} of ${totalScreens}`;
    const note = currentItem.type === 'reverse'
      ? 'This one is worded in the negative. Answer it as it really is.'
      : undefined;

    return shell(
      <section className="screen" id="quiz">
        <QuizBar
          personaName={PERSONAS.find((p) => p.id === persona)?.name ?? ''}
          progress={progress}
          exact={usage != null}
        />
        <div className="wrap quiz">
          <ItemScreen
            item={currentItem}
            choices={currentChoices}
            selected={selected}
            onPick={(v) => (atUsage ? chooseUsage(v) : chooseItem(currentItem.id, v))}
            header={header}
            note={note}
          />
          <div className="qnav">
            <button className="back" onClick={back}><span>&larr;</span> Back</button>
            <span className="keyhint">press a number or click</span>
          </div>
        </div>
      </section>
    );
  }

  if (screen === 'results' && result) {
    return shell(<Results result={result} firstName={firstName} emailed={emailed} onRetake={restart} />);
  }

  // Gate: results are shown only after the respondent provides their details.
  // If there is no assembled submission the gate cannot do anything, so send
  // the respondent somewhere that works rather than to an inert form.
  if (!submission) {
    return shell(<Hero onStart={() => { restart(); setScreen('setup'); }} />);
  }
  return shell(
    <GateForm
      gate={gate}
      onSubmit={submitGate}
      onBack={() => { setScreen('quiz'); setPos(itemsRef.current.length); }}
    />
  );
}

/* ============================== SUB SCREENS ============================== */

function QuizBar({ personaName, progress, exact }: { personaName: string; progress: number; exact: boolean }) {
  return (
    <div className="qbar">
      <div className="wrap qbar-in">
        <div className="qbar-brand">
          <span className="app-title">The Neogogy Formation Compass</span>
          <span className="app-sub">ICAN.ph assessment</span>
        </div>
        <div className="qbar-status">
          <div className="meta">
            <div className="dimname">{personaName}</div>
            <div className="count">{exact ? 'Progress' : 'Getting started'}</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="screen" id="hero">
      <div className="wrap">
        <div className="brandbar">
          <IcanLogo height={132} className="brand-logo" />
          <span className="bsep" />
          <span className="btext">The Formation Compass<br />a reflective assessment</span>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <h1 className="display">Is AI making you <em>sharper</em>,<br />or just faster?</h1>
            <p className="lede">
              A free, research-informed assessment of your working relationship with AI. In about
              twelve minutes it looks at ten dimensions of how you use it, how carefully you check
              it, and what happens to your own capability along the way. You get your position on a
              ten stage continuum and a personal report built from what you actually reported.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={onStart}>Get started <span className="arrow">&rarr;</span></button>
              <button className="btn btn-ghost" onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })}>
                Why this matters
              </button>
            </div>
            <div className="hero-meta">
              <span className="chip"><span className="dot" /> About 12 minutes</span>
              <span className="chip"><span className="dot" /> 10 dimensions</span>
              <span className="chip"><span className="dot" /> A personal PDF report</span>
            </div>
          </div>
          <div className="hero-visual">
            <ReportPreview />
          </div>
        </div>

        <div id="why" className="strip">
          <div className="cell surface">
            <div className="n">92%</div>
            <div className="t">of students now learn with AI, yet only about a third have ever received guidance on how.</div>
            <div className="src">HEPI / Kortext 2025</div>
          </div>
          <div className="cell surface">
            <div className="n">17%</div>
            <div className="t">worse on a later unaided exam for students who practiced with an unrestricted chatbot, against no AI at all.</div>
            <div className="src">Bastani et al., PNAS 2025</div>
          </div>
          <div className="cell surface">
            <div className="n">2&times;</div>
            <div className="t">the learning gains when the same AI is designed well, against our best classroom practice.</div>
            <div className="src">Kestin et al., Sci. Reports 2025</div>
          </div>
        </div>

        <div className="report-gallery">
          <p className="gallery-eyebrow">A glimpse of what you get</p>
          <h2 className="gallery-title">A designed, keepsake-grade report. Built from your answers.</h2>
          <div className="pages-grid">
            <div className="page-card">
              <div className="pc-banner">
                <span className="pc-eyebrow">Where you stand</span>
                <span className="pc-title">Ten stages, one position</span>
              </div>
              <div className="pc-body">
                <p className="lede" style={{ fontSize: '.95rem' }}>
                  Your placement is continuous, not a box. If you sit close to a boundary the report
                  says so and shows the zone rather than pretending the line is sharp.
                </p>
              </div>
            </div>
            <div className="page-card">
              <div className="pc-banner">
                <span className="pc-eyebrow">The full picture</span>
                <span className="pc-title">Your ten dimensions</span>
              </div>
              <div className="pc-body">
                <p className="lede" style={{ fontSize: '.95rem' }}>
                  Agency, verification, independent capability, fluency, transfer and five more, each
                  with its own confidence level so thin evidence is labelled instead of hidden.
                </p>
              </div>
            </div>
            <div className="page-card">
              <div className="pc-banner">
                <span className="pc-eyebrow">Built for you, not a template</span>
                <span className="pc-title">Your roadmap</span>
              </div>
              <div className="pc-body">
                <div className="pc-illusion">
                  <div className="pc-il-row"><span className="pc-il-lab">Felt</span><div className="pc-il-track"><span style={{ width: '90%', background: 'var(--gold)' }} /></div><b>90</b></div>
                  <div className="pc-il-row"><span className="pc-il-lab">Measured</span><div className="pc-il-track"><span style={{ width: '72%', background: 'var(--growth-bright)' }} /></div><b>72</b></div>
                </div>
                <p className="pc-il-note">
                  Your next moves are assembled from the patterns your own answers show, never looked
                  up from a label.
                </p>
              </div>
            </div>
          </div>
          <p className="gallery-foot">
            Your position, the ten dimensions behind it, what appears to be helping and what may be
            working against you, and concrete next moves, in a PDF you can keep.
          </p>
        </div>

        <p className="lede center mt-l" style={{ maxWidth: '60ch', marginLeft: 'auto', marginRight: 'auto' }}>
          Same technology, different outcomes. The difference is rarely the tool, it is the{' '}
          <em style={{ color: 'var(--crimson)', fontStyle: 'italic' }}>design</em> of how you work
          with it. This instrument helps you read that difference in your own practice.
        </p>
        <div className="center" style={{ marginTop: 32, paddingBottom: 16 }}>
          <button className="btn btn-primary" onClick={onStart}>Get started <span className="arrow">&rarr;</span></button>
        </div>

        <p className="muted center" style={{ maxWidth: '62ch', margin: '28px auto 0', fontSize: '.85rem' }}>
          These are assessment indices built from self reported answers. They are designed to support
          reflection, and they are not a validated psychometric measurement.
        </p>
      </div>
    </section>
  );
}

function Setup({
  persona, b1, b2, onPersona, onB1, onB2, onBack, onStart
}: {
  persona: Persona | null;
  b1: number | null;
  b2: number | null;
  onPersona: (p: Persona) => void;
  onB1: (v: number) => void;
  onB2: (v: number) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const ready = !!persona;
  return (
    <section className="screen">
      <div className="wrap setup">
        <span className="eyebrow">Set your lens</span>
        <h2 className="section-title mt-s">Which of these fits you best?</h2>
        <p className="lede" style={{ maxWidth: '58ch' }}>
          Every question that follows is about you and your own practice. Choosing a role selects a
          set of questions written for the situations you actually meet.
        </p>

        <div className="field mt-m">
          <div className="role-grid">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                className={`role ${persona === p.id ? 'sel' : ''}`}
                onClick={() => onPersona(p.id)}
              >
                <span className="check" />
                <span className="ic">{p.name.charAt(0)}</span>
                <span className="rname">{p.name}</span>
                <span className="rq">{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="surface" style={{ padding: '26px 28px', marginTop: 30 }}>
          <span className="eyebrow">Two questions we do not score</span>
          <p className="muted" style={{ fontSize: '.92rem', margin: '8px 0 20px' }}>
            Neither answer affects your result. They are compared with your result at the end, so you
            can see how your sense of things lines up with what your answers describe.
          </p>

          <div className="baseline">
            <div className="q">Before any questions: how healthy does your current relationship with AI feel to you?</div>
            <OptionCards choices={B1_CHOICES} selected={b1} onPick={onB1} />
          </div>

          <div className="baseline" style={{ marginTop: 22 }}>
            <div className="q">Prediction: where do you expect your result to land on a ten stage continuum?</div>
            <OptionCards choices={BAND_CHOICES} selected={b2} onPick={onB2} />
          </div>
        </div>

        <div className="qnav" style={{ marginTop: 34 }}>
          <button className="back" onClick={onBack}><span>&larr;</span> Back</button>
          <button className="btn btn-primary" onClick={onStart} disabled={!ready}>
            Begin the assessment <span className="arrow">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
}

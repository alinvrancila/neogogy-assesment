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
import {
  ItemScreen, OptionCards, optionsFor, B1_CHOICES, BAND_CHOICES, type Choice
} from './items';

type Screen = 'hero' | 'setup' | 'quiz' | 'gate';

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
        setScreen(s.screen ?? 'hero');
        setPersona(s.persona ?? null);
        setUsage(s.usage ?? null);
        setB1(s.b1 ?? null);
        setB2(s.b2 ?? null);
        setAnswers(s.answers ?? {});
        setPos(s.pos ?? 0);
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
  }, [clearDraft]);

  /* ---------------------------------------------------------------- render */
  if (screen === 'hero') {
    return <Hero onStart={() => setScreen('setup')} />;
  }

  if (screen === 'setup') {
    return (
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

    return (
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

  // Phase 3 replaces this with the email gate and the results experience.
  return (
    <section className="screen">
      <div className="wrap results">
        <div className="qcard">
          <div className="qnum">Answers collected</div>
          <div className="qstem">Your responses are ready to be scored.</div>
          <p className="muted" style={{ marginTop: 12 }}>
            {submission
              ? `${Object.keys(submission.answers).length} answers recorded for the ${submission.persona} assessment.`
              : 'No submission assembled.'}
          </p>
          <div className="qnav" style={{ marginTop: 20 }}>
            <button className="back" onClick={back}><span>&larr;</span> Back</button>
            <button className="btn btn-ghost" onClick={restart}>Start over</button>
          </div>
        </div>
      </div>
    </section>
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
        <div className="hero-copy">
          <span className="eyebrow">The Formation Compass</span>
          <h1 className="display">How is AI shaping the way you think?</h1>
          <p className="lede">
            A reflective assessment that looks at your relationship with AI across ten dimensions:
            how you use it, how carefully you check it, and what happens to your own capability
            along the way. It takes about twelve minutes. Your answers place you on a ten stage
            continuum and produce a report written from what you actually reported.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={onStart}>Begin <span className="arrow">&rarr;</span></button>
          </div>
          <div className="hero-meta">
            <span className="chip"><span className="dot" /> About 12 minutes</span>
            <span className="chip"><span className="dot" /> Ten dimensions</span>
            <span className="chip"><span className="dot" /> A personal report</span>
          </div>
          <p className="muted" style={{ marginTop: 24, maxWidth: '60ch' }}>
            These are assessment indices built from self reported answers. They are designed to
            support reflection, and they are not a validated psychometric measurement.
          </p>
        </div>
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

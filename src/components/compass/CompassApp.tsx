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
import {
  collectAttribution, collectEnvironment, pacing, SittingWatcher,
} from '@/lib/clientSignals';
import { BASELINE_ITEMS, BUSINESS_BASELINE_ITEMS } from '@/items/shared';
import { applicableItems } from '@/engine';
import type { Item, Persona, Submission } from '@/engine/types';
import { USAGE_ITEM } from '@/items/shared';
import type { CompassResult } from '@/engine';
import type { AttemptComparison } from '@/lib/history';
import {
  ItemScreen, OptionCards, optionsFor, B1_CHOICES, BAND_CHOICES, type Choice
} from './items';
import { IcanLogo, DimensionBars, DimensionRadar } from './Visuals';
import { STAGES } from '@/engine/config';
import Results, { GateForm, type GateData, type GateState } from './Results';

type Screen = 'hero' | 'setup' | 'context' | 'quiz' | 'gate' | 'results';

const PERSONAS: Array<{
  id: Persona; name: string; who: string; blurb: string; expect: string[];
  /** Two sentences, shown on the card, explaining what this set assesses. */
  explain: string;
  /** A short line under the explanation: how long, and how to answer. */
  note?: string;
  isNew?: boolean;
}> = [
  {
    id: 'student',
    explain: 'Questions about your own learning and your own work. They ask what you actually do with AI on assignments, revision and exams, not what you know about it.',
    name: 'Student',
    who: 'You are studying, at any level',
    blurb: 'Questions about your own learning and your own work.',
    expect: [
      'Essays, assignments and revision',
      'What happens in an exam with no AI allowed',
      'Group work, and being honest about what AI wrote',
    ],
  },
  {
    id: 'teacher',
    explain: 'Questions about your own practice, not about grading your students. They ask how AI shapes your planning, your materials and what reaches a class.',
    name: 'Teacher',
    who: 'You teach, train or lecture',
    blurb: 'Questions about your own practice, not about grading your students.',
    expect: [
      'Planning lessons and building materials',
      'Checking AI content before it reaches a class',
      'Student data, feedback, and what you will not paste into a tool',
    ],
  },
  {
    id: 'parent',
    explain: 'Questions about your own use and the decisions you make at home. They ask how AI shows up in homework, in school communication, and in what you share about your children.',
    name: 'Parent',
    who: 'You are raising a child of any age',
    blurb: 'Questions about your own use and your family decisions.',
    expect: [
      'Homework help and screen time decisions',
      'Understanding school letters and documents',
      'What you share about your children with a tool',
    ],
  },
  {
    id: 'administrator',
    explain: 'Questions about your own leadership work and the calls you make. They ask how AI shapes your analysis, your decisions and what you do with confidential material.',
    name: 'Leader or administrator',
    who: 'You lead a team, school or organisation',
    blurb: 'Questions about your own leadership work and your decisions.',
    expect: [
      'Analysis, budgets and board-ready work',
      'Vendor claims, dashboards and personnel decisions',
      'Policy, disclosure and confidential information',
    ],
  },
  {
    id: 'business',
    name: 'Business Owner',
    isNew: true,
    who: 'You own, founded or run a business',
    blurb: 'Questions about the business, not about you.',
    explain: 'This one is different. It does not assess how you learn; it assesses your business: whether the way you and your team use AI is strengthening or weakening your decisions, your continuity, your customers\u2019 trust, your knowledge, and your people.',
    note: 'About 10 minutes. Answer for the business as it actually runs today, not as you intend it to run.',
    expect: [
      'Decisions, pricing and what reaches a customer',
      'What happens if your main AI tool disappears',
      'Staff tool use, customer data and your policy',
    ],
  },
];

/** Coarse screen count used only before the usage answer is known. */
const COARSE_TOTAL = 34;

const STORE_KEY = 'nfc2Progress';

const ATTRIB_KEY = 'nfc2Attrib';

/**
 * Capture where the visit came from, once, on first load: the referring host
 * and path, any campaign tags, and which ad platform's click identifier was on
 * the URL. Stored locally so it survives the walk through the questions.
 */
function captureAttribution() {
  try {
    if (window.localStorage.getItem(ATTRIB_KEY)) return;
    window.localStorage.setItem(ATTRIB_KEY, JSON.stringify(collectAttribution()));
  } catch { /* attribution is a convenience */ }
}

function readAttribution(): Record<string, unknown> {
  try { return JSON.parse(window.localStorage.getItem(ATTRIB_KEY) || '{}'); }
  catch { return {}; }
}

/** Best-effort funnel tracking. Never blocks or fails the assessment. */
const track = (event: string, extra: Record<string, unknown> = {}) => {
  try {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...extra }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never interrupt a respondent */
  }
};

type Saved = {
  screen: Screen;
  persona: Persona | null;
  usage: number | null;
  b1: number | null;
  b2: number | null;
  answers: Record<string, number>;
  pos: number;
};

export default function CompassApp({ sample }: { sample?: CompassResult }) {
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
  const [comparison, setComparison] = useState<AttemptComparison | null>(null);
  const [firstName, setFirstName] = useState('');
  /** Business Owner only, every field optional, never scored. */
  const [biz, setBiz] = useState<BusinessContext>({ company: '', industry: '', teamSize: '', tools: '' });

  const sessionId = useRef<string>('');
  const startedRef = useRef(false);
  const startedAt = useRef<number | null>(null);
  const revisions = useRef(0);
  /** When each answer landed, so pace can be reported without storing order. */
  const answerStamps = useRef<number[]>([]);
  const watcher = useRef<SittingWatcher | null>(null);
  const resumedDraft = useRef(false);
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
      let sid = window.localStorage.getItem('nfc2Session');
      if (!sid) {
        sid = (window.crypto?.randomUUID && window.crypto.randomUUID())
          || `s_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
        window.localStorage.setItem('nfc2Session', sid);
      }
      sessionId.current = sid;
      captureAttribution();
    } catch {
      /* a session id is a convenience, not a requirement */
    }
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
          resumedDraft.current = s.screen === 'quiz';
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
    const w = new SittingWatcher();
    w.start();
    watcher.current = w;
    return () => w.stop();
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
    track('assessment_complete', {
      sessionId: sessionId.current, role: persona, step: Object.keys(clean).length,
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
    setAnswers((a) => {
      // A different value for a question already answered is a revision, which
      // is a useful signal about how considered the responses are.
      if (a[id] !== undefined && a[id] !== v) revisions.current += 1;
      answerStamps.current.push(Date.now());
      return { ...a, [id]: v };
    });
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
        body: JSON.stringify({
          ...submission, ...data,
          name: `${data.firstName} ${data.lastName}`.trim(),
          sessionId: sessionId.current,
          business: persona === 'business' ? biz : undefined,
          meta: {
            durationMs: startedAt.current ? Date.now() - startedAt.current : undefined,
            revisions: revisions.current,
            resumed: resumedDraft.current,
            localHour: new Date().getHours(),
            weekday: new Date().getDay(),
            ...pacing(answerStamps.current),
            ...(watcher.current ? watcher.current.read() : {}),
            ...collectEnvironment(),
            ...readAttribution(),
          },
        })
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.result) {
        setGate({ submitting: false, error: payload?.error || 'Something went wrong. Please try again.' });
        return;
      }
      setResult(payload.result as CompassResult);
      setComparison((payload.comparison as AttemptComparison | null) ?? null);
      setEmailed(Boolean(payload.emailSent));
      setFirstName(data.firstName.trim());
      setGate({ submitting: false, error: null });
      clearDraft();
      setScreen('results');
    } catch {
      setGate({ submitting: false, error: 'Network error. Please check your connection and try again.' });
    }
  }, [submission, clearDraft, biz, persona]);

  /* -------------------------------------------------------------- keyboard */
  const atUsage = pos === 0;
  const currentItem: Item | null = atUsage ? USAGE_ITEM : (items[pos - 1] ?? null);
  const currentChoices: Choice[] = useMemo(
    () => (currentItem ? optionsFor(currentItem, sessionId.current) : []),
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
    setResult(null); setEmailed(false); setFirstName(''); setComparison(null);
    setGate({ submitting: false, error: null });
  }, [clearDraft]);

  /* ---------------------------------------------------------------- render */
  // Every selector in compass.css is scoped under .nfc, so each screen must be
  // wrapped in it or the entire design system silently fails to match.
  const shell = (inner: React.ReactNode) => <div className="nfc">{inner}</div>;

  if (screen === 'hero') {
    return shell(<Hero onStart={() => setScreen('setup')} sample={sample} />);
  }

  if (screen === 'setup') {
    return shell(
      <Setup
        persona={persona}
        b1={b1}
        b2={b2}
        onPersona={(p) => {
          setPersona(p);
          if (!startedRef.current) {
            startedRef.current = true;
            track('assessment_start', { sessionId: sessionId.current, role: p });
          }
          track('role_selected', { sessionId: sessionId.current, role: p });
        }}
        onB1={setB1}
        onB2={setB2}
        onBack={() => setScreen('hero')}
        onStart={() => {
          if (persona === 'business') { setScreen('context'); return; }
          startedAt.current = Date.now();
          setPos(0);
          setScreen('quiz');
        }}
      />
    );
  }

  if (screen === 'context') {
    return shell(
      <BusinessContextScreen
        value={biz}
        onChange={setBiz}
        onBack={() => setScreen('setup')}
        onNext={() => {
          startedAt.current = Date.now();
          setPos(0);
          setScreen('quiz');
        }}
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
    return shell(
      <Results result={result} firstName={firstName} emailed={emailed}
        onRetake={restart} comparison={comparison} />
    );
  }

  // Gate: results are shown only after the respondent provides their details.
  // If there is no assembled submission the gate cannot do anything, so send
  // the respondent somewhere that works rather than to an inert form.
  if (!submission) {
    return shell(<Hero onStart={() => { restart(); setScreen('setup'); }} sample={sample} />);
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

export type BusinessContext = { company: string; industry: string; teamSize: string; tools: string };

const TEAM_SIZES = ['Just me', '2 to 9', '10 to 49', '50 to 249', '250 or more'];

/**
 * Business Owner only, and every field is optional. None of it is scored. It
 * exists so the report can address the business by name and so results can be
 * read by industry and size later.
 */
function BusinessContextScreen({
  value, onChange, onBack, onNext,
}: {
  value: BusinessContext;
  onChange: (v: BusinessContext) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const set = (k: keyof BusinessContext, v: string) => onChange({ ...value, [k]: v });
  return (
    <section className="screen">
      <div className="wrap setup">
        <span className="eyebrow">Step 2 of 2, optional</span>
        <h2 className="section-title mt-s">A little about the business</h2>
        <p className="lede" style={{ maxWidth: '62ch' }}>
          All four are optional and none of them are scored. They let the report address your
          business by name, and they help us understand which kinds of business this reaches. Skip
          any of them and the assessment works exactly the same.
        </p>

        <div className="field mt-m">
          <label htmlFor="biz-company">Company or trading name</label>
          <input id="biz-company" type="text" value={value.company}
            onChange={(e) => set('company', e.target.value)} placeholder="Optional" />
        </div>
        <div className="field">
          <label htmlFor="biz-industry">Industry</label>
          <input id="biz-industry" type="text" value={value.industry}
            onChange={(e) => set('industry', e.target.value)}
            placeholder="Optional, for example construction, accounting, retail" />
        </div>
        <div className="field">
          <label htmlFor="biz-team">Team size</label>
          <select id="biz-team" value={value.teamSize} onChange={(e) => set('teamSize', e.target.value)}>
            <option value="">Prefer not to say</option>
            {TEAM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="biz-tools">Which AI tools are in use</label>
          <input id="biz-tools" type="text" value={value.tools}
            onChange={(e) => set('tools', e.target.value)}
            placeholder="Optional, for example ChatGPT, Copilot, a scheduling agent" />
        </div>

        <div className="lp-howto">
          <h3 className="lp-h3">Before you start</h3>
          <ul className="lp-howto-list">
            <li>
              <strong>Answer for the business as it actually runs today.</strong> Several questions
              ask what would really happen under pressure. Those answers carry more weight than the
              ones where you describe the business, because habits show up in situations.
            </li>
            <li>
              <strong>Nothing here is reported to anyone.</strong> There is no pass mark and no
              inspection. An honest answer about a weak spot is what makes the result useful to you.
            </li>
            <li>
              <strong>About ten minutes.</strong> Forty questions, plus a few that depend on how
              embedded AI already is.
            </li>
          </ul>
        </div>

        <div className="qnav mt-m">
          <button className="back" type="button" onClick={onBack}><span>&larr;</span> Back</button>
          <button className="btn btn-primary" type="button" onClick={onNext}>
            Start the health check <span className="arrow">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
}

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

function Hero({ onStart, sample }: { onStart: () => void; sample?: CompassResult }) {
  return (
    <section className="screen" id="hero">
      <div className="wrap">
        <div className="brandbar">
          <IcanLogo height={120} className="brand-logo" />
          <span className="bsep" />
          <span className="btext">The Formation Compass<br />a reflective assessment</span>
        </div>
      </div>

      {/* the painted route, used here as the promise of the result */}
      <div className="lp-hero">
        <div className="wrap lp-hero-inner">
          <div className="lp-hero-copy">
            <h1 className="display">Find out where<br />you stand with AI.</h1>
            <p className="lede">
              Most of us can tell whether AI makes us faster. Almost none of us can tell whether it is
              making us sharper. This assessment answers that, across ten dimensions of how you work
              with AI, and places you on a ten stage route from first contact to a mature practice.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={onStart}>
                Start the assessment <span className="arrow">&rarr;</span>
              </button>
              <button className="btn btn-ghost" onClick={() => document.getElementById('lp-what')?.scrollIntoView({ behavior: 'smooth' })}>
                See what you get
              </button>
            </div>
            <div className="hero-meta">
              <span className="chip"><span className="dot" /> About 12 minutes</span>
              <span className="chip"><span className="dot" /> 33 to 36 questions</span>
              <span className="chip"><span className="dot" /> Free, with a report to keep</span>
            </div>
          </div>
        </div>
        <div className="lp-hero-art" aria-hidden="true" />
      </div>

      <div className="wrap">
        {/* the whole route, so nobody starts blind */}
        <section className="lp-block" id="lp-continuum">
          <p className="lp-kicker">The route</p>
          <h2 className="lp-h2">Ten stages, from first contact to a practice that renews itself</h2>
          <p className="lp-lead">
            Your answers place you somewhere along this route. It is not a ranking and there is no
            pass mark. Most people land in the middle, and the useful part is knowing which stage you
            are in and what the next one actually asks of you.
          </p>
          <ol className="lp-stages">
            {STAGES.map((st) => (
              <li key={st.stage}>
                <span className="lp-stage-n">{st.stage}</span>
                <span className="lp-stage-body">
                  <strong>{st.name}</strong>
                  <span>{st.short}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* what the result actually looks like, from a real computed example */}
        <section className="lp-block" id="lp-what">
          <p className="lp-kicker">What you get</p>
          <h2 className="lp-h2">A report built from your answers, not a label</h2>
          <p className="lp-lead">
            Everything below is a genuine result produced by the same engine that will score you,
            from one example set of answers. Your own numbers will be different.
          </p>

          {sample ? (
            <div className="lp-sample">
              <div className="lp-sample-tag">Example profile, not your result</div>
              <div className="lp-sample-grid">
                <div>
                  <h3 className="lp-h3">Ten dimensions, scored and explained</h3>
                  <DimensionBars result={sample} />
                </div>
                <div>
                  <h3 className="lp-h3">The shape of a profile</h3>
                  <DimensionRadar result={sample} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="lp-gets">
            <div className="lp-get">
              <h3 className="lp-h3">Where you are, and why</h3>
              <p>
                Your stage on the route, and the one practice doing most to hold you there. Not
                always your lowest score, which is usually the more useful finding.
              </p>
            </div>
            <div className="lp-get">
              <h3 className="lp-h3">What is helping and what is costing you</h3>
              <p>
                Patterns across your answers, including the one this instrument exists to catch:
                high capability sitting on thin independent skill, which feels like success while it
                develops.
              </p>
            </div>
            <div className="lp-get">
              <h3 className="lp-h3">A plan you can actually start</h3>
              <p>
                One thing for this week, a habit for the next month, and what would move you a stage
                over three months. Built from your answers rather than looked up from a label.
              </p>
            </div>
            <div className="lp-get">
              <h3 className="lp-h3">Honest limits</h3>
              <p>
                Each dimension carries a confidence level. Where your answers gave us little to work
                with, the report says so instead of pretending to certainty.
              </p>
            </div>
          </div>
        </section>

        {/* why it matters */}
        <section className="lp-block" id="why">
          <p className="lp-kicker">Why this matters</p>
          <h2 className="lp-h2">Same tool, opposite outcomes</h2>
          <div className="strip">
            <div className="cell surface">
              <div className="n">92%</div>
              <div className="t">of students now learn with AI, while only about a third have ever had guidance on how.</div>
              <div className="src">HEPI / Kortext 2025</div>
            </div>
            <div className="cell surface">
              <div className="n">17%</div>
              <div className="t">worse on a later unaided exam for those who practised with an unrestricted chatbot, against no AI at all.</div>
              <div className="src">Bastani et al., PNAS 2025</div>
            </div>
            <div className="cell surface">
              <div className="n">2&times;</div>
              <div className="t">the learning gains when the same technology is used deliberately, against established classroom practice.</div>
              <div className="src">Kestin et al., Sci. Reports 2025</div>
            </div>
          </div>
          <p className="lp-lead center" style={{ maxWidth: '62ch', margin: '22px auto 0' }}>
            The difference between those two results is not the tool. It is how it is used. This
            assessment is a way of reading that difference in your own practice.
          </p>
        </section>

        <div className="center" style={{ marginTop: 30, paddingBottom: 10 }}>
          <button className="btn btn-primary" onClick={onStart}>
            Start the assessment <span className="arrow">&rarr;</span>
          </button>
          <p className="muted" style={{ maxWidth: '58ch', margin: '18px auto 0', fontSize: '.86rem' }}>
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
  const chosen = PERSONAS.find((p) => p.id === persona);
  // the two unscored questions come from the item bank, so the screen and the
  // stored item can never drift apart
  const isBusiness = persona === 'business';
  const baselinePrompts = (isBusiness ? BUSINESS_BASELINE_ITEMS : BASELINE_ITEMS).map((i) => i.prompt);

  return (
    <section className="screen">
      <div className="wrap setup">
        <span className="eyebrow">Step 1 of 2</span>
        <h2 className="section-title mt-s">Which of these is closest to you?</h2>
        <p className="lede" style={{ maxWidth: '62ch' }}>
          There are five sets of questions. Four of them ask about you and your own practice. The
          fifth, Business Owner, is different: it assesses a business rather than a person. Pick the
          one that matches the life you actually live day to day, and if two fit, choose the one
          where you use AI most.
        </p>

        <div className="field mt-m">
          <div className="lp-persona-grid">
            {PERSONAS.map((p) => {
              const sel = persona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`lp-persona${sel ? ' sel' : ''}`}
                  onClick={() => onPersona(p.id)}
                  aria-pressed={sel}
                >
                  <span className="lp-persona-head">
                    <span className="lp-persona-name">
                      {p.name}
                      {p.isNew ? <span className="lp-persona-new">NEW</span> : null}
                    </span>
                    <span className="lp-persona-check" aria-hidden="true">{sel ? '\u2713' : ''}</span>
                  </span>
                  <span className="lp-persona-who">{p.who}</span>
                  <span className="lp-persona-blurb">{p.explain}</span>
                  {p.note ? <span className="lp-persona-note">{p.note}</span> : null}
                  <span className="lp-persona-expect">
                    <span className="lp-persona-expect-h">You will be asked about</span>
                    <span>{p.expect.join(' · ')}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {chosen ? (
          <div className="lp-chosen" role="status">
            <strong>{chosen.name} selected.</strong> {chosen.explain} You can go back and change
            this before you begin.
          </div>
        ) : null}

        {/* how to take it, and why honesty is the whole point */}
        <div className="lp-howto">
          <h3 className="lp-h3">Before you start</h3>
          <ul className="lp-howto-list">
            <li>
              <strong>Answer for what is true, not what sounds right.</strong> Several questions ask
              what {isBusiness ? 'would really happen under pressure' : 'you would actually do under time pressure'}. Those
              answers carry more weight than the ones where you describe
              {isBusiness ? ' the business' : ' yourself'}, because habits show up in situations
              rather than in intentions.
            </li>
            <li>
              <strong>Your answers are not shared with anyone.</strong>{' '}
              {isBusiness
                ? 'No client, lender or regulator sees this. There is no pass mark, no inspection, and nothing here is reported. An honest answer about a weak spot is the only kind that is any use to you.'
                : 'No teacher, employer or school sees this. There is no pass mark and nothing here is reported. An honest result is the only kind that is any use to you.'}
            </li>
            <li>
              <strong>Some questions are worded in the negative.</strong> Those are marked. Answer
              them as they really are; the scoring accounts for the wording.
            </li>
            <li>
              <strong>If you genuinely cannot judge something, say so.</strong> A few questions offer
              a &ldquo;not enough experience to say&rdquo; option. Choosing it is treated as missing evidence and
              excluded, which is more accurate than guessing at the middle.
            </li>
            <li>
              <strong>You can take it again.</strong> Come back in a couple of months with the same
              email address and your previous position is remembered, so you see how far you moved
              rather than guessing. That only works if both readings were honest.
            </li>
          </ul>
          <p className="lp-howto-time">
            {isBusiness
              ? 'About ten minutes, 40 to 42 questions depending on your answers. You can go back and change any answer before the end.'
              : 'About twelve minutes, 33 to 36 questions depending on your answers. You can go back and change any answer before the end.'}
          </p>
        </div>

        {/* the two unscored calibration questions */}
        <div className="surface" style={{ padding: '24px 26px', marginTop: 26 }}>
          <span className="eyebrow">Two questions we do not score</span>
          <p className="muted" style={{ fontSize: '.92rem', margin: '8px 0 18px', maxWidth: '62ch' }}>
            {isBusiness
              ? 'Neither of these affects your result. We compare them with the result at the end, so you can see how your own sense of the business lines up with what your answers describe. Answering them is optional.'
              : 'Neither of these affects your result. We compare them with your result at the end, so you can see how your own sense of things lines up with what your answers describe. Answering them is optional.'}
          </p>

          <div className="baseline">
            <div className="q">{baselinePrompts[0]}</div>
            <OptionCards choices={B1_CHOICES} selected={b1} onPick={onB1} />
          </div>

          <div className="baseline" style={{ marginTop: 22 }}>
            <div className="q">{baselinePrompts[1]}</div>
            <OptionCards choices={BAND_CHOICES} selected={b2} onPick={onB2} />
          </div>
        </div>

        <div className="qnav" style={{ marginTop: 30 }}>
          <button className="back" onClick={onBack}><span>&larr;</span> Back</button>
          <button className="btn btn-primary" onClick={onStart} disabled={!ready}>
            {ready ? 'Begin the assessment' : 'Choose a role to begin'} <span className="arrow">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
}

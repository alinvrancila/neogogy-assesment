'use client';

import '@/app/compass.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  roles, dimensions, usageItem, scales, baselineLabels, applyRole, subjectLabel, modalityExamples,
  type RoleId, type Dimension, type Item, type Scenario
} from '@/data/compass';
import { compute, type Answers, type Baseline, type CompassResult } from '@/lib/engine';
import { CompassGauge, ReportPreview, RadarSvg, QuadrantMap } from './Visuals';
import Results, { ThankYou, type GateData } from './Results';

type Step =
  | { type: 'usage' }
  | { type: 'dimintro'; dim: Dimension }
  | { type: 'item'; dim: Dimension; item: Item }
  | { type: 'scenario'; dim: Dimension; scenario: Scenario };

const FLOW: Step[] = [
  { type: 'usage' },
  ...dimensions.flatMap((dim): Step[] => [
    { type: 'dimintro', dim },
    ...dim.items.map((item): Step => ({ type: 'item', dim, item })),
    ...(dim.scenario ? [{ type: 'scenario', dim, scenario: dim.scenario } as Step] : [])
  ])
];

const TOTAL_Q = FLOW.filter((s) => s.type === 'item' || s.type === 'scenario' || s.type === 'usage').length;

// A sample result used only to preview the assessment's visuals on the home page.
const SAMPLE_ANSWERS: Answers = (() => {
  const a: Answers = {};
  const targets = [92, 68, 86, 60, 74, 80, 64, 90, 72, 66];
  dimensions.forEach((d, di) => {
    const v = Math.max(1, Math.min(5, Math.round((targets[di] / 100) * 4 + 1)));
    d.items.forEach((it) => {
      a[it.id] = it.reverse ? 6 - v : v;
    });
    if (d.scenario) a[d.scenario.id] = v;
  });
  return a;
})();
const SAMPLE = compute(SAMPLE_ANSWERS, { b1: 4, b2: 4 }, 4);

const track = (event: string, extra: Record<string, unknown> = {}) => {
  try {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...extra }),
      keepalive: true
    }).catch(() => {});
  } catch {
    /* analytics is best-effort */
  }
};

export default function CompassApp() {
  const [screen, setScreen] = useState<'hero' | 'setup' | 'quiz' | 'results' | 'thanks'>('hero');
  const [role, setRole] = useState<RoleId | null>(null);
  const [modality, setModality] = useState('');
  const [baseline, setBaseline] = useState<Baseline>({ b1: 3, b2: 3 });
  const [usageVal, setUsageVal] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<CompassResult | null>(null);
  const [locked, setLocked] = useState(true);
  const [gate, setGate] = useState<{ submitting: boolean; error: string | null }>({ submitting: false, error: null });
  const [submittedName, setSubmittedName] = useState('');
  const [submittedFirst, setSubmittedFirst] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [downloading, setDownloading] = useState(false);

  const sessionId = useRef<string>('');
  const startedRef = useRef(false);

  useEffect(() => {
    let sid = window.localStorage.getItem('nfcSession');
    if (!sid) {
      sid = (window.crypto?.randomUUID && window.crypto.randomUUID()) || `s_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      window.localStorage.setItem('nfcSession', sid);
    }
    sessionId.current = sid;
  }, []);

  // Always land at the top when the screen changes or a new question/intro is
  // shown, so a button near the bottom of one screen never drops the user at
  // the bottom of the next.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, pos]);

  const answeredCount = useMemo(() => {
    let n = usageVal != null ? 1 : 0;
    FLOW.forEach((s) => {
      if (s.type === 'item' && answers[s.item.id] != null) n++;
      if (s.type === 'scenario' && answers[s.scenario.id] != null) n++;
    });
    return n;
  }, [answers, usageVal]);

  const liveEstimate = useMemo(() => {
    let sum = 0;
    let c = 0;
    dimensions.forEach((dim) => {
      dim.items.forEach((it) => {
        const r = answers[it.id];
        if (r != null) {
          sum += it.reverse ? 6 - r : r;
          c++;
        }
      });
      if (dim.scenario) {
        const v = answers[dim.scenario.id];
        if (v != null) {
          sum += v;
          c++;
        }
      }
    });
    if (!c) return 50;
    return Math.round(((sum / c - 1) / 4) * 100);
  }, [answers]);

  const beginQuiz = () => {
    setPos(0);
    setScreen('quiz');
  };

  const finish = useCallback(() => {
    const r = compute(answers, baseline, usageVal);
    setResult(r);
    setLocked(true);
    setScreen('results');
    track('assessment_complete', { sessionId: sessionId.current, role, zone: r.pkey });
  }, [answers, baseline, usageVal, role]);

  const next = useCallback(() => {
    setPos((p) => {
      if (p < FLOW.length - 1) return p + 1;
      finish();
      return p;
    });
  }, [finish]);

  const prev = () => setPos((p) => Math.max(0, p - 1));

  const chooseUsage = (v: number) => {
    setUsageVal(v);
    setTimeout(next, 240);
  };
  const chooseScenario = (id: string, v: number) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setTimeout(next, 240);
  };
  const chooseItem = (id: string, v: number) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setTimeout(next, 220);
  };

  // Keyboard support during the quiz.
  useEffect(() => {
    if (screen !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      const step = FLOW[pos];
      if (e.key === 'ArrowRight' && step.type === 'dimintro') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (step.type === 'item' && /^[1-5]$/.test(e.key)) chooseItem(step.item.id, Number(e.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, pos, next]);

  const pickRole = (id: RoleId) => {
    setRole(id);
    if (!startedRef.current) {
      startedRef.current = true;
      track('assessment_start', { sessionId: sessionId.current, role: id });
      track('role_selected', { sessionId: sessionId.current, role: id });
    }
  };

  const submitGate = async ({ firstName, lastName, email, heardFrom, consent }: GateData) => {
    const name = `${firstName} ${lastName}`.trim();
    if (!firstName.trim() || !email.trim()) {
      setGate({ submitting: false, error: 'First name and email are required.' });
      return;
    }
    setGate({ submitting: true, error: null });
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, name, email, heardFrom, consent, role, modality, answers, baseline, usageVal, sessionId: sessionId.current })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setGate({ submitting: false, error: data?.error || 'Something went wrong. Please try again.' });
        return;
      }
      setSubmittedName(name);
      setSubmittedFirst(firstName.trim());
      setSubmittedEmail(email.trim());
      setGate({ submitting: false, error: null });
      track('email_submit', { sessionId: sessionId.current, role, zone: result?.pkey });
      // Do not reveal results on screen; confirm the email is on its way.
      setScreen('thanks');
    } catch {
      setGate({ submitting: false, error: 'Network error. Please check your connection and try again.' });
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: submittedName, role, modality, answers, baseline, usageVal })
      });
      if (!res.ok) throw new Error('report failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Neogogy_Formation_Compass_${result.persona.name.replace(/\s/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      track('report_download', { sessionId: sessionId.current, role });
    } catch {
      /* swallow: the report was already emailed */
    } finally {
      setDownloading(false);
    }
  };

  const retake = () => {
    setScreen('hero');
    setRole(null);
    setModality('');
    setBaseline({ b1: 3, b2: 3 });
    setUsageVal(null);
    setAnswers({});
    setPos(0);
    setResult(null);
    setLocked(true);
    startedRef.current = false;
  };

  /* ---------------------------------------------------------------- RENDER */
  return (
    <div className="nfc">
      {screen === 'hero' && <Hero onStart={() => setScreen('setup')} />}

      {screen === 'setup' && (
        <Setup
          role={role}
          modality={modality}
          baseline={baseline}
          onPickRole={pickRole}
          onModality={setModality}
          onBaseline={setBaseline}
          onBack={() => setScreen('hero')}
          onStart={beginQuiz}
        />
      )}

      {screen === 'quiz' && (
        <Quiz
          step={FLOW[pos]}
          pos={pos}
          total={TOTAL_Q}
          role={role}
          modality={modality}
          answeredCount={answeredCount}
          liveEstimate={liveEstimate}
          answers={answers}
          usageVal={usageVal}
          onUsage={chooseUsage}
          onScenario={chooseScenario}
          onItem={chooseItem}
          onContinue={next}
          onBack={prev}
        />
      )}

      {screen === 'results' && result && (
        <Results
          result={result}
          modality={modality}
          locked={locked}
          gate={gate}
          onSubmit={submitGate}
          onDownload={downloadPdf}
          downloading={downloading}
          onRetake={retake}
        />
      )}

      {screen === 'thanks' && (
        <ThankYou firstName={submittedFirst} email={submittedEmail} onRetake={retake} />
      )}
    </div>
  );
}

/* ============================ HERO ============================ */
function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="screen" id="hero">
      <div className="wrap">
        <div className="brandbar">
          <span className="wordmark">International Center for Applied Neogogy <span className="wm-ican">(ICAN)</span></span>
          <span className="bsep" />
          <span className="btext">The Formation Compass<br />a diagnostic instrument</span>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Learning at the Speed of Mind</span>
            <h1 className="display">Is AI making you <em>wiser</em>,<br />or just faster?</h1>
            <p className="lede">A free, research-backed diagnostic that reveals whether your way of learning with AI is forming you or quietly hollowing you out. In about ten minutes you will discover your formation persona, see exactly where you are strong and exposed, and get a personalized report to keep.</p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={onStart}>Get started <span className="arrow">→</span></button>
              <button className="btn btn-ghost" onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })}>Why this matters</button>
            </div>
            <div className="hero-meta">
              <span className="chip"><span className="dot" /> About 10 minutes</span>
              <span className="chip"><span className="dot" /> 10 research-backed dimensions</span>
              <span className="chip"><span className="dot" /> A personalized PDF report</span>
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
            <div className="t">worse on a later unaided exam for students who practiced with an unrestricted chatbot, versus no AI at all.</div>
            <div className="src">Bastani et al., PNAS 2025</div>
          </div>
          <div className="cell surface">
            <div className="n">2×</div>
            <div className="t">the learning gains when the same AI is designed well, against our best classroom practice.</div>
            <div className="src">Kestin et al., Sci. Reports 2025</div>
          </div>
        </div>

        <div className="report-gallery">
          <p className="gallery-eyebrow">A glimpse of what you get</p>
          <h2 className="gallery-title">A designed, keepsake-grade report. Built for you.</h2>
          <div className="pages-grid">
            <div className="page-card">
              <div className="pc-banner"><span className="pc-eyebrow">Where you stand</span><span className="pc-title">The map of formation</span></div>
              <div className="pc-body"><QuadrantMap result={SAMPLE} /></div>
            </div>
            <div className="page-card">
              <div className="pc-banner"><span className="pc-eyebrow">The full picture</span><span className="pc-title">Your ten dimensions</span></div>
              <div className="pc-body"><RadarSvg result={SAMPLE} /></div>
            </div>
            <div className="page-card">
              <div className="pc-banner"><span className="pc-eyebrow">Read even if you scored well</span><span className="pc-title">Your blind spots</span></div>
              <div className="pc-body">
                <div className="pc-illusion">
                  <div className="pc-il-row"><span className="pc-il-lab">Felt</span><div className="pc-il-track"><span style={{ width: '90%', background: 'var(--gold)' }} /></div><b>90</b></div>
                  <div className="pc-il-row"><span className="pc-il-lab">Real</span><div className="pc-il-track"><span style={{ width: '78%', background: 'var(--growth-bright)' }} /></div><b>78</b></div>
                </div>
                <p className="pc-il-note">The productivity-illusion meter, plus every blind spot your specific pattern hides, named and explained.</p>
              </div>
            </div>
          </div>
          <p className="gallery-foot">Your formation index, the research behind your result, and your concrete next moves, in a seven-page PDF you can keep and share.</p>
        </div>

        <p className="lede center mt-l" style={{ maxWidth: '60ch', marginLeft: 'auto', marginRight: 'auto' }}>
          Same technology. Opposite outcomes. The difference is never the tool, it is the <em style={{ color: 'var(--crimson)', fontStyle: 'italic' }}>design</em> of how you learn with it. This instrument helps you read that difference in your own learning.
        </p>
        <div className="center" style={{ marginTop: 32, paddingBottom: 16 }}>
          <button className="btn btn-primary" onClick={onStart}>Get started <span className="arrow">→</span></button>
        </div>
      </div>
    </section>
  );
}

/* ============================ SETUP ============================ */
function Setup({
  role, modality, baseline, onPickRole, onModality, onBaseline, onBack, onStart
}: {
  role: RoleId | null;
  modality: string;
  baseline: Baseline;
  onPickRole: (id: RoleId) => void;
  onModality: (v: string) => void;
  onBaseline: (b: Baseline) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const ready = !!role;
  return (
    <section className="screen">
      <div className="wrap setup">
        <span className="eyebrow">Set your lens</span>
        <h2 className="section-title mt-s">Pick your role, then begin.</h2>
        <p className="lede" style={{ maxWidth: '58ch' }}>The questions ahead are the same for everyone in your role. Choosing a role tailors who each question is about; the optional focus below simply sharpens your result.</p>

        <div className="field mt-m">
          <label>Your primary role</label>
          <div className="role-grid">
            {roles.map((r) => (
              <button key={r.id} className={`role ${role === r.id ? 'sel' : ''}`} onClick={() => onPickRole(r.id)}>
                <span className="check" />
                <span className="ic">{r.icon}</span>
                <span className="rname">{r.name}</span>
                <span className="rq">{r.q}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Want to focus on one practice? <span className="opt-tag">optional</span></label>
          <p className="explain">
            You can take this about <strong>your learning with AI in general</strong>, just leave this blank and continue. Or, if one real practice is on your mind, name it here. It does not change the questions; it simply makes your <strong>result and report speak directly to that practice</strong> and gives you one concrete thing to picture while you answer. Not sure yet? Skip it, you can always retake with a specific focus later.
          </p>
          <input
            type="text"
            maxLength={120}
            value={modality}
            onChange={(e) => onModality(e.target.value)}
            placeholder={role ? `e.g. ${modalityExamples[role][0]}` : 'e.g. how I use AI to write my essays'}
          />
          {role && (
            <div className="ex-chips">
              <span className="ex-lab">Examples:</span>
              {modalityExamples[role].map((ex) => (
                <button key={ex} type="button" className="ex-chip" onClick={() => onModality(ex)}>{ex}</button>
              ))}
            </div>
          )}
        </div>

        <div className="surface" style={{ padding: '26px 28px', marginTop: 30 }}>
          <label style={{ display: 'block', fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Two quick calibrations</label>
          <p className="muted" style={{ fontSize: '.92rem', marginBottom: 20 }}>Not scored as right or wrong. We compare them to your real results at the end, to measure something the research calls the <em>productivity illusion</em>, the gap between how good a modality feels and how well it actually forms you.</p>

          <div className="baseline">
            <div className="q">Right now, my gut says this modality <strong>helps</strong> my learning far more than it harms it.</div>
            <div className="slider-row">
              <input type="range" min={1} max={5} step={1} value={baseline.b1} onChange={(e) => onBaseline({ ...baseline, b1: Number(e.target.value) })} />
              <span className="slider-val">{baselineLabels[baseline.b1 - 1]}</span>
            </div>
          </div>
          <div className="baseline">
            <div className="q">I predict my final result will land in the <strong>healthy</strong> range.</div>
            <div className="slider-row">
              <input type="range" min={1} max={5} step={1} value={baseline.b2} onChange={(e) => onBaseline({ ...baseline, b2: Number(e.target.value) })} />
              <span className="slider-val">{baselineLabels[baseline.b2 - 1]}</span>
            </div>
          </div>
        </div>

        <div className="qnav" style={{ marginTop: 34 }}>
          <button className="back" onClick={onBack}><span>←</span> Back</button>
          <button className="btn btn-primary" onClick={onStart} disabled={!ready}>Begin the assessment <span className="arrow">→</span></button>
        </div>
      </div>
    </section>
  );
}

/* ============================ QUIZ ============================ */
function Quiz({
  step, pos, total, role, modality, answeredCount, liveEstimate, answers, usageVal, onUsage, onScenario, onItem, onContinue, onBack
}: {
  step: Step;
  pos: number;
  total: number;
  role: RoleId | null;
  modality: string;
  answeredCount: number;
  liveEstimate: number;
  answers: Answers;
  usageVal: number | null;
  onUsage: (v: number) => void;
  onScenario: (id: string, v: number) => void;
  onItem: (id: string, v: number) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const progress = Math.round((answeredCount / total) * 100);
  const dimName = step.type === 'usage' ? 'Setting the baseline' : step.dim.title;
  const count = step.type === 'usage' ? 'A quick honest read' : `Dimension ${step.dim.n} of 10`;
  const roleOpts = (opts: { t: string; v: number }[]) => opts.map((o) => ({ t: applyRole(o.t, role), v: o.v }));

  // Question index for the "Question X of Y" label.
  let qIndex = 0;
  for (let i = 0; i <= pos; i++) {
    const s = FLOW[i];
    if (s.type === 'item' || s.type === 'scenario' || s.type === 'usage') qIndex++;
  }

  return (
    <section className="screen" id="quiz">
      <div className="qbar">
        <div className="wrap qbar-in">
          <div className="mini"><CompassGauge value={liveEstimate} size={42} stroke={8} /></div>
          <div className="meta">
            <div className="dimname">{dimName}</div>
            <div className="count">{count}</div>
            {role && (
              <div className="lens">Assessing <strong>{subjectLabel[role]}</strong>{modality ? <> · “{modality}”</> : null}</div>
            )}
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="wrap quiz">
        {step.type === 'usage' && (
          <ScenarioCard
            eyebrow="How often is AI actually used here?"
            stem={applyRole(usageItem.stem, role)}
            opts={roleOpts(usageItem.opts)}
            selected={usageVal}
            onPick={(v) => onUsage(v)}
            onBack={onBack}
            backDisabled={pos === 0}
          />
        )}

        {step.type === 'dimintro' && (
          <div className="dim-intro">
            <div className="ring">Dimension {step.dim.n} · {step.dim.axis === 'resilience' ? 'Resilience' : 'Readiness'} axis</div>
            <h2>{step.dim.title}</h2>
            <span className="principle">◈ Neogogy principle · {step.dim.principle}</span>
            <p className="brief">{step.dim.brief}</p>
            <div className="tip">
              <div className="tlab">💡 What the research shows</div>
              <div className="ttext">{step.dim.tip.text}</div>
              <div className="tsrc">{step.dim.tip.src}</div>
            </div>
            <div>
              <button className="btn btn-primary" onClick={onContinue}>Continue <span className="arrow">→</span></button>
            </div>
            <div className="qnav" style={{ marginTop: 26 }}>
              <button className="back" onClick={onBack} disabled={pos === 0}><span>←</span> Back</button>
              <span className="keyhint">press <span className="kbd">→</span> to continue</span>
            </div>
          </div>
        )}

        {step.type === 'item' && (
          <div className="qcard">
            <div className="qnum">{step.item.star ? '★ ' : ''}Question {qIndex} of {total}</div>
            <div className="qstem" dangerouslySetInnerHTML={{ __html: applyRole(step.item.stem, role) }} />
            {step.item.reverse ? (
              <div className="reverse-flag">⚠ A high answer here is a caution sign, we account for that.</div>
            ) : (
              <div style={{ height: 14 }} />
            )}
            <div className="opts">
              {scales[step.item.type].map((lab, i) => (
                <button key={lab} className={`opt ${answers[step.item.id] === i + 1 ? 'sel' : ''}`} onClick={() => onItem(step.item.id, i + 1)}>
                  <span className="bub">{i + 1}</span>
                  <span className="otext">{lab}</span>
                </button>
              ))}
            </div>
            <div className="qnav">
              <button className="back" onClick={onBack} disabled={pos === 0}><span>←</span> Back</button>
              <span className="keyhint">press <span className="kbd">1</span> to <span className="kbd">5</span> or click</span>
            </div>
          </div>
        )}

        {step.type === 'scenario' && (
          <ScenarioCard
            eyebrow="A real moment, not the ideal"
            stem={applyRole(step.scenario.stem, role)}
            opts={roleOpts(step.scenario.opts)}
            selected={answers[step.scenario.id] ?? null}
            onPick={(v) => onScenario(step.scenario.id, v)}
            onBack={onBack}
            backDisabled={pos === 0}
          />
        )}
      </div>
    </section>
  );
}

function ScenarioCard({
  eyebrow, stem, opts, selected, onPick, onBack, backDisabled
}: {
  eyebrow: string;
  stem: string;
  opts: { t: string; v: number }[];
  selected: number | null;
  onPick: (v: number) => void;
  onBack: () => void;
  backDisabled: boolean;
}) {
  return (
    <div className="qcard">
      <div className="qnum">{eyebrow}</div>
      <div className="qstem">{stem}</div>
      <div style={{ height: 14 }} />
      <div className="opts">
        {opts.map((o, i) => (
          <button key={o.v} className={`opt ${selected === o.v ? 'sel' : ''}`} onClick={() => onPick(o.v)}>
            <span className="bub">{String.fromCharCode(65 + i)}</span>
            <span className="otext">{o.t}</span>
          </button>
        ))}
      </div>
      <div className="qnav">
        <button className="back" onClick={onBack} disabled={backDisabled}><span>←</span> Back</button>
        <span className="keyhint">choose one to continue</span>
      </div>
    </div>
  );
}

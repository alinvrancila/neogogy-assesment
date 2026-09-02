'use client';

/**
 * The page a visitor lands on.
 *
 * Its job is not to explain an assessment. It is to move someone from a
 * question they have not asked themselves to wanting to know where they stand,
 * and to let them start from the page rather than clicking Begin to find out
 * what is on offer. Persona selection lives here, at full depth, because
 * choosing the right assessment is the first act of the assessment.
 *
 * Two readers are served at once. A fast reader can start from the hero or the
 * persona rail without scrolling further. A reader who wants the argument can
 * take the whole page: the thesis, the two risks, what is easy and hard to see,
 * the two opposite questions, the research, and what the report contains.
 *
 * Copy rule: no em dashes anywhere a respondent can read. See tests/compass/copy.ts.
 */

import '@/app/home.css';
import { useEffect, useRef, useState } from 'react';
import type { Persona } from '@/engine/types';
import { PERSONA_CONTENT, type PersonaContent } from '@/content/personas';
import { COVER_PERSONA } from '@/lib/covers/data';
import { BRAND, CORE_QUESTION, ECOSYSTEM } from '@/brand';
import MotifMark from './Motifs';
import { RouteBand, Spectrum, SurfaceDepth, StatRing, StatDrop, StatRise, TwoStates, DimensionRing, CardGlyph } from './Figures';

const ACCENT: Record<Persona, string> = {
  student: '#2F6F62',
  teacher: '#1F3B32',
  parent: '#A9482F',
  administrator: '#2E4756',
  pastor: '#7B2B32',
  business: '#9E1D20',
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ----------------------------------------------------------------- header */

function Header({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    // The bar floats over the page, so it earns its shadow only once there is
    // something underneath it to lift away from.
    const onScroll = () => setMoved(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = [
    ['Why it matters', 'ha-thesis'],
    ['Choose your assessment', 'ha-personas'],
    ['Human Advantage', 'ha-definition'],
    ['Research', 'ha-research'],
    ['Your report', 'ha-report'],
  ] as const;
  return (
    <header className={`ha-header${moved ? ' is-moved' : ''}`}>
      <div className="ha-wrap ha-header-in">
        {/* The institution first, then the product. The logo is the attribution,
            so the words "Powered by ICAN.ph" are not repeated beside it here;
            they carry on in the hero, the results and the report.

            Both marks return to the top of the page. A header logo that leaves
            the site takes a visitor out of the assessment mid-thought; the four
            logos at the foot of the page are where each organisation is
            actually visited. */}
        <div className="ha-lockup">
          <a className="ha-lockup-ican" href="#top"
            onClick={(e) => { e.preventDefault(); scrollTo('top'); }}
            aria-label="ICAN, International Center for Applied Neogogy, back to the top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ECOSYSTEM[0].logo} alt="ICAN" width={ECOSYSTEM[0].w} height={ECOSYSTEM[0].h} />
          </a>
          <span className="ha-lockup-rule" aria-hidden="true" />
          <a className="ha-brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTo('top'); }}>
            <span className="ha-brand-org">{BRAND.org}</span>
            <span className="ha-brand-product">Human Advantage Assessment</span>
          </a>
        </div>

        <nav className={`ha-nav${open ? ' is-open' : ''}`} aria-label="Sections">
          {nav.map(([label, id]) => (
            <button key={id} type="button" onClick={() => { setOpen(false); scrollTo(id); }}>{label}</button>
          ))}
        </nav>

        <div className="ha-header-act">
          <button type="button" className="ha-btn ha-btn-sm" onClick={onStart}>Take the assessment</button>
          <button type="button" className="ha-burger" aria-expanded={open} aria-label="Sections"
            onClick={() => setOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------- hero */

function Hero({ variant, onStart }: { variant: 'a' | 'b'; onStart: () => void }) {
  return (
    <section className="ha-hero" id="top">
      <div className="ha-wrap ha-hero-in">
        <p className="ha-eyebrow">
          <span className="ha-eyebrow-org">{BRAND.org}</span> Human Advantage Assessment
        </p>

        {variant === 'b' ? (
          <>
            <h1 className="ha-display">AI is becoming more capable.<br /><em>Are you?</em></h1>
            <p className="ha-lede">
              The {BRAND.product} examines whether the way you use AI, or choose not to use AI, is
              building the capabilities your future requires.
            </p>
            <p className="ha-question">{CORE_QUESTION}</p>
          </>
        ) : (
          <>
            <h1 className="ha-display ha-display-q">
              Is the way you use AI,<br />or choose not to use AI,<br /><em>strengthening your capabilities?</em>
            </h1>
            <p className="ha-lede">
              AI can strengthen how you think, learn, create, teach, lead, and make decisions. It can
              also produce excellent work without strengthening the capabilities underneath it.
              Avoiding AI altogether can leave important new capabilities undeveloped.
            </p>
            <p className="ha-lede">
              The {BRAND.product} helps you discover what your current relationship with AI appears
              to be strengthening, what may need attention, and what to develop next.
            </p>
          </>
        )}

        <div className="ha-hero-cta">
          <button type="button" className="ha-btn ha-btn-lg" onClick={onStart}>
            Choose my assessment <span aria-hidden="true">&rarr;</span>
          </button>
          <button type="button" className="ha-link" onClick={() => scrollTo('ha-thesis')}>
            Why this matters
          </button>
        </div>

        <ul className="ha-proof">
          <li>About 10 to 12 minutes</li>
          <li>Six perspectives</li>
          <li>Research informed</li>
          <li>A personal {BRAND.report} to keep</li>
        </ul>

        <p className="ha-by">{BRAND.poweredBy}</p>

        {/* The route, inside the hero rather than under it. It is the promise
            the assessment makes, not a section standing between a visitor and
            the moment they can begin. */}
        <div className="ha-routeband">
          <RouteBand />
          <p className="ha-routeband-cap">
            Ten stages, from first contact to a practice that renews itself. Your answers place you
            on this route.
          </p>
        </div>
      </div>
      <div className="ha-hero-art" aria-hidden="true" />
    </section>
  );
}

/* --------------------------------------------------------------- personas */

function PersonaPanel({ p, onBegin }: { p: PersonaContent; onBegin: (id: Persona) => void }) {
  const accent = ACCENT[p.id];
  return (
    <div className="ha-panel" style={{ ['--accent' as string]: accent }}>
      {/* All six banners are held here at once, and the chosen one is faded in.
          Loading a single banner on demand meant every switch showed an empty
          band while a fresh request went out; six cropped strips together weigh
          less than one of the full covers did. */}
      <div className="ha-panel-art" style={{ backgroundColor: accent }}>
        {PERSONA_CONTENT.map((q) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={q.id} src={`/covers/band/${COVER_PERSONA[q.id]}.jpg`} alt=""
            className={q.id === p.id ? 'is-on' : ''} width={1160} height={442} decoding="async" />
        ))}
        <span className="ha-panel-art-mark"><MotifMark motif={p.motif} color="#fff" size={64} /></span>
        <span className="ha-panel-art-name">
          <em>{p.motifName}</em>
          <strong>{p.name}</strong>
        </span>
      </div>

      <div className="ha-panel-head">
        <div className="ha-panel-motif"><MotifMark motif={p.motif} color={accent} size={104} /></div>
        <div>
          <p className="ha-kicker">{p.motifName}</p>
          <h3 className="ha-panel-name">{p.name}</h3>
          <p className="ha-panel-who">{p.who}</p>
          {p.whoList ? (
            <ul className="ha-chips">{p.whoList.map((w) => <li key={w}>{w}</li>)}</ul>
          ) : null}
        </div>
      </div>

      {p.clarification ? <p className="ha-clarify">{p.clarification}</p> : null}

      <p className="ha-panel-core">{p.coreQuestion}</p>

      {/* The way in sits here as well as at the foot. Someone who already knows
          this is their assessment should never have to read to the bottom to
          start it, and on a phone the bottom is a long way down. */}
      <div className="ha-panel-go">
        <button type="button" className="ha-btn ha-btn-lg ha-btn-go" onClick={() => onBegin(p.id)}>
          {p.cta} <span aria-hidden="true">&rarr;</span>
        </button>
        <span className="ha-go-meta">{p.minutes}. Free, with a {BRAND.report} to keep.</span>
      </div>

      <div className="ha-panel-body">
        <div>
          <h4 className="ha-h4">What this assessment is about</h4>
          {p.about.map((t) => <p key={t.slice(0, 24)}>{t}</p>)}
        </div>
        <div>
          <h4 className="ha-h4">{p.whyHeading}</h4>
          {p.why.map((t) => <p key={t.slice(0, 24)}>{t}</p>)}
          {p.whyPull ? <p className="ha-pull">{p.whyPull}</p> : null}
        </div>
      </div>

      <h4 className="ha-h4">You will be asked about</h4>
      <ul className="ha-asked">
        {p.asked.map((a) => (
          <li key={a.title}><strong>{a.title}</strong><span>{a.body}</span></li>
        ))}
      </ul>

      <div className="ha-panel-foot">
        <div>
          <h4 className="ha-h4">What you may discover</h4>
          <ul className="ha-ticks">{p.discover.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
        <div className="ha-panel-start">
          <p className="ha-mins">{p.minutes}</p>
          <p className="ha-gets">Your answers generate a personal {BRAND.report}, with your position,
            your pattern, what to watch, and what to do next.</p>
          <button type="button" className="ha-btn ha-btn-lg" onClick={() => onBegin(p.id)}>
            {p.cta} <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Personas({ selected, onSelect, onBegin }: {
  selected: Persona; onSelect: (id: Persona) => void; onBegin: (id: Persona) => void;
}) {
  const current = PERSONA_CONTENT.find((p) => p.id === selected) ?? PERSONA_CONTENT[0];
  return (
    <section className="ha-section" id="ha-personas">
      <div className="ha-wrap">
        <p className="ha-kicker">Choose your assessment</p>
        <h2 className="ha-h2">Choose the part of your life you want to examine.</h2>
        <p className="ha-lead">
          Your Human Advantage looks different depending on the work you do and the responsibilities
          you carry. The assessment asks different questions for different contexts. Choose the
          perspective that best matches what you want to examine.
        </p>

        <div className="ha-persona-split">
          <div className="ha-rail" role="tablist" aria-label="Assessments">
            {PERSONA_CONTENT.map((p) => (
              <button key={p.id} type="button" role="tab" aria-selected={p.id === selected}
                aria-controls={`panel-${p.slug}`} id={`tab-${p.slug}`}
                className={`ha-rail-item${p.id === selected ? ' is-on' : ''}`}
                style={{ ['--accent' as string]: ACCENT[p.id] }}
                onClick={() => onSelect(p.id)}>
                <span className="ha-rail-mark"><MotifMark motif={p.motif} color={ACCENT[p.id]} size={44} /></span>
                <span className="ha-rail-text">
                  <strong>{p.name}{p.isNew ? <em className="ha-new">New</em> : null}</strong>
                  <span>{p.who}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="ha-panel-hold" role="tabpanel" id={`panel-${current.slug}`}
            aria-labelledby={`tab-${current.slug}`}>
            <PersonaPanel p={current} onBegin={onBegin} />
          </div>
        </div>

        {/* On a narrow screen the rail and the panel become one accordion, so no
            information depends on a second column that is not there. */}
        <div className="ha-accordion">
          {PERSONA_CONTENT.map((p) => {
            const open = p.id === selected;
            return (
              <div key={p.id} className={`ha-acc-item${open ? ' is-open' : ''}`}
                style={{ ['--accent' as string]: ACCENT[p.id] }}>
                <button type="button" className="ha-acc-head" aria-expanded={open}
                  aria-controls={`acc-${p.slug}`}
                  onClick={() => onSelect(open ? ('' as Persona) : p.id)}>
                  <span className="ha-rail-mark"><MotifMark motif={p.motif} color={ACCENT[p.id]} size={34} /></span>
                  <span className="ha-rail-text">
                    <strong>{p.name}{p.isNew ? <em className="ha-new">New</em> : null}</strong>
                    <span>{p.who}</span>
                  </span>
                  <span className="ha-acc-sign" aria-hidden="true" />
                </button>
                {open ? (
                  <div className="ha-acc-body" id={`acc-${p.slug}`}>
                    <PersonaPanel p={p} onBegin={onBegin} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- the argument */

function Definition() {
  return (
    <section className="ha-section ha-section-tint" id="ha-definition">
      <div className="ha-wrap">
        <div className="ha-def">
          <div>
            <p className="ha-kicker">Human Advantage</p>
            <h2 className="ha-h2">What is your Human Advantage?</h2>
            <p className="ha-lead">
              As AI becomes more capable, the important question is not whether humans can outperform
              machines at every task. The question is whether people are developing the judgment,
              independence, creativity, adaptability, responsibility, and wisdom required to use
              powerful systems without surrendering the capabilities that should remain theirs.
            </p>
            <p className="ha-statement ha-statement-left">
              Your Human Advantage is not simply what AI cannot do. It is the capability you continue
              to build, own, exercise, and take responsibility for in a world where AI is everywhere.
            </p>
          </div>
          <div className="ha-def-fig">
            <DimensionRing />
            <p className="ha-fig-cap">
              The ten dimensions your answers are read across. They move independently, and the
              shape you make across all ten is the finding.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Thesis() {
  return (
    <section className="ha-section" id="ha-thesis">
      <div className="ha-wrap ha-narrow ha-center">
        <h2 className="ha-h1">
          The goal is not more AI.<br />
          The goal is not less AI.<br />
          <em>The goal is greater Human Advantage.</em>
        </h2>
        <p className="ha-lead">
          Use AI without preserving independent capability and dependence can grow. Avoid AI
          completely and important fluency, adaptability, and judgment may remain underdeveloped.
        </p>
        <p className="ha-lead"><strong>The challenge is learning to use AI in ways that make the human stronger.</strong></p>
      </div>
    </section>
  );
}

function Risks() {
  const cols = [
    {
      k: 'Too dependent', tone: 'warm',
      items: ['Independent capability becomes less practiced', 'Verification decreases',
        'Judgment shifts toward the tool', 'Authorship becomes less clear',
        'Knowledge does not transfer', 'Important work becomes difficult without AI'],
    },
    {
      k: 'Too disconnected', tone: 'cool',
      items: ['AI fluency remains weak', 'Adaptability develops slowly', 'AI judgment stays theoretical',
        'Emerging workflows remain unfamiliar', 'Opportunities for legitimate augmentation are missed',
        'Future readiness suffers'],
    },
  ];
  return (
    <section className="ha-section ha-section-tint">
      <div className="ha-wrap">
        <p className="ha-kicker">Two risks, not one</p>
        <h2 className="ha-h2">Both ends of the range carry a cost.</h2>
        <div className="ha-fig ha-fig-wide"><Spectrum /></div>
        <div className="ha-risks">
          {cols.map((c) => (
            <div key={c.k} className={`ha-risk ha-risk-${c.tone}`}>
              <h3 className="ha-h3">{c.k}</h3>
              <ul>{c.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
          <div className="ha-risk ha-risk-mid">
            <h3 className="ha-h3">Capable and intentional</h3>
            <p>Use AI where it strengthens you. Preserve what should remain yours. Build the judgment
              to know the difference.</p>
            <p className="ha-note">This is not a middle setting on a dial. A person may use AI heavily
              for one task and not at all for another. Human Advantage concerns intentionality,
              capability, judgment, and ownership.</p>
          </div>
        </div>
        <p className="ha-principle">
          Capable humans know when to use AI, how to use it, and when not to use it.
        </p>
      </div>
    </section>
  );
}

function Performance() {
  const rows = [
    ['A better essay', 'deeper learning'],
    ['A faster decision', 'better judgment'],
    ['A polished sermon', 'deeper study'],
    ['A more efficient workflow', 'a more resilient business'],
  ];
  return (
    <section className="ha-section">
      <div className="ha-wrap">
        <p className="ha-kicker">Output is not capability</p>
        <h2 className="ha-h2">Better AI assisted performance does not automatically mean greater
          human capability.</h2>
        <div className="ha-split">
          <div className="ha-fig"><SurfaceDepth /></div>
          <ul className="ha-equations">
          {rows.map(([a, b]) => (
            <li key={a}><strong>{a}</strong><span aria-hidden="true">does not automatically mean</span><em>{b}</em></li>
          ))}
          </ul>
        </div>
        <p className="ha-statement">The Human Advantage Assessment looks beneath the output.</p>
      </div>
    </section>
  );
}

function Visibility() {
  const easy = ['Speed', 'Polished output', 'More content', 'Better formatting', 'Instant information', 'Automated tasks'];
  const hard = ['Judgment', 'Memory', 'Independent capability', 'Verification', 'Authorship', 'Depth', 'Transfer', 'Agency', 'Adaptability'];
  return (
    <section className="ha-section ha-section-dark">
      <div className="ha-wrap">
        <div className="ha-cols2">
          <div>
            <p className="ha-kicker">Easy to see</p>
            <ul className="ha-list-plain">{easy.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
          <div>
            <p className="ha-kicker">Harder to see</p>
            <ul className="ha-list-plain ha-list-strong">{hard.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        </div>
        <p className="ha-statement ha-statement-light">
          Productivity shows what was produced. Human Advantage asks what capability was developed.
        </p>
      </div>
    </section>
  );
}

function TwoQuestions() {
  const gone = ['Explain the thinking?', 'Reproduce the work?', 'Make the decision?', 'Teach the idea?',
    'Defend the conclusion?', 'Remember what you learned?', 'Perform the task?', 'Recognize when something is wrong?'];
  const better = ['Understand what it does well?', 'Identify where it should not be trusted?',
    'Verify its output?', 'Collaborate intelligently?', 'Redesign workflows?',
    'Remain responsible for decisions?', 'Know what should stay human?', 'Adapt as technology changes?'];
  return (
    <section className="ha-section">
      <div className="ha-wrap">
        <div className="ha-two-q">
          <div>
            <div className="ha-fig ha-fig-sm"><TwoStates side="alone" /></div>
            <h2 className="ha-h2">If AI disappeared tomorrow, what could you still do?</h2>
            <ul className="ha-qlist">{gone.map((q) => <li key={q}>{q}</li>)}</ul>
            <p className="ha-note">Independence matters. But this is only half of the question.</p>
          </div>
          <div>
            <div className="ha-fig ha-fig-sm"><TwoStates side="amplified" /></div>
            <h2 className="ha-h2">If AI becomes dramatically more capable tomorrow, will you know how
              to work with it?</h2>
            <ul className="ha-qlist">{better.map((q) => <li key={q}>{q}</li>)}</ul>
            <p className="ha-note">Fluency matters too, and it is not the same thing as exposure.</p>
          </div>
        </div>
        <p className="ha-statement">
          Human Advantage requires both. The capability to work independently when necessary, and the
          capability to work intelligently with AI when it helps.
        </p>
      </div>
    </section>
  );
}

function Research() {
  const stats = [
    { n: '92%', t: 'of students now learn with AI, while only about a third have ever had guidance on how.', src: 'HEPI / Kortext 2025' },
    { n: '17%', t: 'worse on a later unaided exam for those who practised with an unrestricted chatbot, against no AI at all.', src: 'Bastani et al., PNAS 2025' },
    { n: '2x', t: 'the learning gains when the same technology is used deliberately, against established classroom practice.', src: 'Kestin et al., Scientific Reports 2025' },
  ];
  return (
    <section className="ha-section ha-section-tint" id="ha-research">
      <div className="ha-wrap">
        <p className="ha-kicker">Research informed</p>
        <h2 className="ha-h2">The same technology can produce very different human outcomes.</h2>
        <ol className="ha-research">
          {stats.map((s, i) => (
            <li key={s.n}>
              <span className="ha-stat-fig">{i === 0 ? <StatRing /> : i === 1 ? <StatDrop /> : <StatRise />}</span>
              <span className="ha-stat-n">{s.n}</span>
              <span className="ha-stat-t">{s.t}</span>
              <span className="ha-stat-src">{s.src}</span>
              {i < stats.length - 1 ? <span className="ha-stat-arrow" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
        <p className="ha-statement">Same technology. Different human outcomes. How we use AI matters.</p>
      </div>
    </section>
  );
}

function Different() {
  const items = [
    ['It measures the human side of AI', 'Most AI assessments ask what you know about AI. This one examines what your relationship with AI appears to be doing to your capabilities.'],
    ['It looks at both dependence and underexposure', 'More AI is not automatically better. Less AI is not automatically healthier.'],
    ['It separates output from capability', 'Excellent assisted work does not guarantee excellent independent capability.'],
    ['It examines independence and augmentation', 'Can you work without AI? Can you work better with AI? Both matter.'],
    ['It is context specific', 'A student’s relationship with AI is fundamentally different from a teacher’s, parent’s, leader’s, minister’s, or business owner’s. The assessment changes accordingly.'],
    ['It gives you somewhere to go', 'You do not finish with a label. You receive a developmental position and practices for moving forward.'],
  ];
  return (
    <section className="ha-section">
      <div className="ha-wrap">
        <p className="ha-kicker">What makes it different</p>
        <h2 className="ha-h2">What makes the {BRAND.product} different?</h2>
        <div className="ha-grid3">
          {items.map(([h, b], i) => (
            <div key={h} className="ha-card">
              <span className="ha-card-glyph"><CardGlyph kind={i} /></span>
              <h3 className="ha-h3">{h}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/**
 * Pages from a real report.
 *
 * Every image here is a page rendered from the same engine and the same layout
 * a respondent receives, not a mockup, which is why the gallery says whose
 * numbers they are. The point of showing twelve is the point of the section:
 * the reading is long, and a person deciding whether to spend ten minutes on it
 * deserves to see what comes back.
 */
const REPORT_PAGES: Array<{ file: string; caption: string; only?: string }> = [
  { file: 'cover', caption: 'Your result, named' },
  { file: 'route', caption: 'Where you are on the route' },
  { file: 'profile', caption: 'What your answers say about you' },
  { file: 'dimensions', caption: 'Ten dimensions, one at a time' },
  { file: 'helping', caption: 'What is helping, and what is working against you' },
  { file: 'strengths', caption: 'What you do well, and what needs attention' },
  { file: 'next-stage', caption: 'Your next stage, and the practices that reach it' },
  { file: 'plan', caption: 'What to do next, in order' },
  { file: 'limits', caption: 'What this is built on, and what it cannot tell you' },
  { file: 'risk-register', caption: 'A risk register', only: 'Business Owner' },
  { file: 'ninety-days', caption: 'Your next ninety days', only: 'Business Owner' },
  { file: 'roadmap', caption: 'This week, this month, this season', only: 'Minister' },
];

function ReportPages() {
  return (
    <div className="ha-pages">
      <div className="ha-pages-head">
        <p className="ha-kicker">Inside the report</p>
        <p className="ha-pages-note">
          Real pages, rendered by the same engine that will read your answers. The numbers on them
          belong to one example profile rather than to you. Open any page to read it.
        </p>
      </div>
      <ul>
        {REPORT_PAGES.map((p) => (
          <li key={p.file}>
            <a href={`/report/${p.file}.jpg`} target="_blank" rel="noopener noreferrer"
              aria-label={`${p.caption}, a full size page from an example report, opens in a new tab`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/report/${p.file}.jpg`} alt={`Report page: ${p.caption}`}
                width={760} height={984} loading="lazy" />
              <span className="ha-page-cap">
                {p.only ? <em>{p.only}</em> : null}
                {p.caption}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportValue({ onStart }: { onStart: () => void }) {
  const steps = [
    ['Your position', 'See where your current practices place you on a developmental continuum.'],
    ['Your pattern', 'Understand what your answers suggest about your current relationship with AI.'],
    ['Your strengths', 'See which capabilities appear to be holding strong.'],
    ['What to watch', 'Identify dependence, underexposure, verification, transfer, or judgment areas that need attention.'],
    ['Your constraint', 'See which capability is currently doing the most to limit movement toward the next stage.'],
    ['Your next stage', 'Understand what development looks like from here.'],
    ['What to do next', 'Receive practical actions and habits for continued development.'],
  ];
  return (
    <section className="ha-section ha-section-tint" id="ha-report">
      <div className="ha-wrap">
        <p className="ha-kicker">Your {BRAND.report}</p>
        <h2 className="ha-h2">This is not just a score. It is a map of where you are and what to
          strengthen next.</h2>
        <p className="ha-lead">
          Your answers produce a personal reading: your position on the continuum, the pattern behind
          it, and the one capability doing most to hold you where you are. The developmental
          visualisation inside it is your {BRAND.map}.
        </p>
        <ol className="ha-steps">
          {steps.map(([h, b], i) => (
            <li key={h}><span className="ha-step-n">{String(i + 1).padStart(2, '0')}</span>
              <strong>{h}</strong><span>{b}</span></li>
          ))}
        </ol>
        <ReportPages />

        <div className="ha-center">
          <button type="button" className="ha-btn ha-btn-lg" onClick={onStart}>
            See my Human Advantage <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function Ecosystem() {
  return (
    <section className="ha-section">
      <div className="ha-wrap ha-center">
        <p className="ha-kicker">The work behind the assessment</p>
        <h2 className="ha-h3">Built and maintained across four organisations</h2>
        <ul className="ha-orgs">
          {ECOSYSTEM.map((o) => (
            <li key={o.name}>
              <a href={o.url} target="_blank" rel="noopener noreferrer"
                aria-label={`${o.name}, opens in a new tab`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.logo} alt={o.name} width={o.w} height={o.h} loading="lazy" />
                <span className="ha-org-note">{o.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Closing({ onStart }: { onStart: () => void }) {
  return (
    <section className="ha-section ha-section-dark">
      <div className="ha-wrap ha-narrow ha-center">
        <h2 className="ha-h1">Your Human Advantage can change.</h2>
        <p className="ha-lead">
          AI changes. Your responsibilities change. Your habits change. Your capabilities change.
        </p>
        <button type="button" className="ha-btn ha-btn-lg ha-btn-light" onClick={onStart}>
          Choose my assessment <span aria-hidden="true">&rarr;</span>
        </button>
        <p className="ha-disclaimer">
          These are assessment indices built from self reported answers. They are designed to support
          reflection, and they are not a clinical diagnosis, a psychological evaluation, or a
          validated psychometric measurement.
        </p>
        <p className="ha-by ha-by-light">{BRAND.product}. {BRAND.poweredBy}</p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- page */

export default function Home({ initialPersona, onBegin }: {
  initialPersona?: Persona; onBegin: (p: Persona) => void;
}) {
  const [selected, setSelected] = useState<Persona>(initialPersona ?? 'student');
  const [variant, setVariant] = useState<'a' | 'b'>('b');
  const [barOn, setBarOn] = useState(false);
  const deepLinked = useRef(Boolean(initialPersona));
  const current = PERSONA_CONTENT.find((p) => p.id === selected);

  useEffect(() => {
    // On a phone the persona reading is long, so once someone is past the hero
    // the way in follows them down the page instead of waiting at the bottom.
    const onScroll = () => {
      const el = document.getElementById('ha-personas');
      if (!el) return;
      setBarOn(window.scrollY > el.offsetTop - 120);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // ?hero=a serves the question-first hero, for side by side comparison.
    const q = new URLSearchParams(window.location.search).get('hero');
    if (q === 'a' || q === 'b') setVariant(q);
    // Someone who arrived on a persona route lands on their assessment, with the
    // other five still one click away.
    if (deepLinked.current) {
      const t = window.setTimeout(() => scrollTo('ha-personas'), 60);
      return () => window.clearTimeout(t);
    }
  }, []);

  return (
    <div className={`ha${barOn ? ' has-bar' : ''}`}>
      <Header onStart={() => scrollTo('ha-personas')} />
      <div className="ha-header-space" aria-hidden="true" />
      <Hero variant={variant} onStart={() => scrollTo('ha-personas')} />
      <Personas selected={selected} onSelect={setSelected} onBegin={onBegin} />
      <Definition />
      <Thesis />
      <Risks />
      <Performance />
      <Visibility />
      <TwoQuestions />
      <Research />
      <Different />
      <ReportValue onStart={() => scrollTo('ha-personas')} />
      <Ecosystem />
      <Closing onStart={() => scrollTo('ha-personas')} />

      {current ? (
        <div className={`ha-bar${barOn ? ' is-on' : ''}`} style={{ ['--accent' as string]: ACCENT[current.id] }}>
          <div className="ha-bar-in">
            <span className="ha-bar-who">
              <strong>{current.name}</strong>
              <span>{current.minutes}</span>
            </span>
            <button type="button" className="ha-btn ha-btn-go" onClick={() => onBegin(current.id)}>
              {current.cta} <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

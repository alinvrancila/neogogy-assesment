/**
 * The six persona experiences, in words.
 *
 * One source of truth for what each assessment is, who it is for, what it asks
 * about, and what a respondent may find. The page, the persona detail panel and
 * the assessment introduction all read from here, so the promise made on the way
 * in cannot drift from the promise made anywhere else.
 *
 * Durations are derived from the real item counts rather than chosen: the four
 * base personas run 34 to 35 scored items, minister and business run 41 to 42.
 */

import type { Persona } from '@/engine/types';

/** The visual motif each persona is built on. Never an emoji, never an icon of a job. */
export type Motif = 'emergence' | 'illumination' | 'stewardship' | 'systems' | 'formation' | 'resilience';

export type AskedAbout = { title: string; body: string };

export type PersonaContent = {
  id: Persona;
  name: string;
  /** The route segment, so a link can drop someone straight into their context. */
  slug: string;
  motif: Motif;
  motifName: string;
  motifMeaning: string;
  who: string;
  whoList?: string[];
  /** Shown as a marked-out note where the assessment is commonly misread. */
  clarification?: string;
  coreQuestion: string;
  about: string[];
  whyHeading: string;
  why: string[];
  /** The sentence set in display type at the end of the why block. */
  whyPull?: string;
  asked: AskedAbout[];
  discover: string[];
  minutes: string;
  cta: string;
  isNew?: boolean;
};

export const PERSONA_CONTENT: PersonaContent[] = [
  /* ------------------------------------------------------------- student */
  {
    id: 'student',
    name: 'Student',
    slug: 'student',
    motif: 'emergence',
    motifName: 'Emergence',
    motifMeaning: 'Knowledge becoming capability.',
    who: 'You are studying, at any level.',
    whoList: ['High school', 'College', 'University', 'Graduate education', 'Professional learning', 'Adult education'],
    coreQuestion: 'Is the way you use AI, or choose not to use it, strengthening your ability to learn?',
    about: [
      'These questions are about your own learning and your own work. They do not primarily ask what you know about artificial intelligence.',
      'They ask what you actually do with AI when you write, research, revise, solve problems, complete assignments, prepare for exams, collaborate, and perform work where AI is unavailable.',
      'The assessment examines whether AI assisted work becomes knowledge and capability that are genuinely yours. It also looks for situations where excellent AI assisted output may be hiding work you could not yet reproduce independently.',
      'And it examines underexposure. If you use little AI, it considers whether limited experience is leaving important AI fluency, adaptability, judgment, or future readiness undeveloped.',
    ],
    whyHeading: 'Why this matters',
    why: [
      'A completed assignment can look excellent while telling us very little about what the student actually learned.',
      'Your Human Advantage includes being able to explain it, remember it, question it, reproduce important work, perform without AI when necessary, and use AI intelligently when it helps.',
    ],
    asked: [
      { title: 'Essays, assignments and revision', body: 'How AI enters the actual work you submit and what parts of the thinking remain yours.' },
      { title: 'Exams and unaided work', body: 'What happens when you must perform without AI.' },
      { title: 'Understanding and retention', body: 'Whether AI assisted work becomes knowledge you can use later.' },
      { title: 'Research and verification', body: 'How you decide whether information from AI deserves trust.' },
      { title: 'Group work and authorship', body: 'How AI generated contributions are handled when other people are involved.' },
      { title: 'AI fluency and future readiness', body: 'Whether you are developing the ability to work intelligently with AI rather than merely avoiding it or depending on it.' },
    ],
    discover: [
      'Where AI appears to strengthen your learning',
      'Where it may be replacing learning',
      'How much capability remains without assistance',
      'Whether practical AI fluency is developing',
      'How judgment and verification are functioning',
      'What your next developmental stage requires',
    ],
    minutes: 'About 10 minutes',
    cta: 'Begin as a Student',
  },

  /* ------------------------------------------------------------- teacher */
  {
    id: 'teacher',
    name: 'Teacher',
    slug: 'teacher',
    motif: 'illumination',
    motifName: 'Illumination',
    motifMeaning: 'Information becoming learning through human judgment.',
    who: 'You teach, train or lecture.',
    whoList: ['K to 12 teachers', 'University faculty', 'College faculty', 'Instructors', 'Trainers', 'Facilitators', 'Professional educators'],
    clarification: 'This assessment is about your own practice, not about grading how your students use AI.',
    coreQuestion: 'Is the way you use AI strengthening your capability as an educator?',
    about: [
      'The questions examine how AI enters your actual teaching practice. They look at lesson planning, course design, teaching materials, explanations, assessment preparation, feedback, research, communication, verification, student information, and professional judgment.',
      'The assessment considers whether AI expands what you can do while your own instructional capability remains strong. It also examines whether AI may be performing work you increasingly accept without enough independent judgment.',
      'And it examines underexposure. If you remain largely disconnected from AI, are you developing enough practical understanding to guide learners whose education and future work will increasingly include AI?',
    ],
    whyHeading: 'Why this matters',
    why: [
      'Teachers increasingly stand between powerful information systems and learners. AI can produce content. The educator remains responsible for judgment, context, verification, pedagogy, learning, and human presence.',
      'Your Human Advantage as an educator is not simply producing materials more quickly. It is knowing what should reach a learner, why, whether it is accurate, how it supports learning, and what should remain human.',
    ],
    asked: [
      { title: 'Planning lessons and building materials', body: 'Where AI enters planning and what remains your intellectual work.' },
      { title: 'Checking AI content before it reaches a class', body: 'How you verify claims, explanations, examples, citations, and other generated material.' },
      { title: 'Assessment and feedback', body: 'How AI influences judgments about student work and learning.' },
      { title: 'Student information', body: 'What information you will and will not place into AI systems.' },
      { title: 'Your instructional capability', body: 'Whether repeated AI assistance is strengthening your craft or making some parts of it less practiced.' },
      { title: 'AI fluency', body: 'Whether you understand AI well enough to make informed educational decisions.' },
    ],
    discover: [
      'Where AI genuinely expands your teaching',
      'Where judgment needs attention',
      'How verification is functioning',
      'Whether instructional capability remains independent',
      'Whether underexposure may limit readiness',
      'What practices could move you forward',
    ],
    minutes: 'About 10 minutes',
    cta: 'Begin as a Teacher',
  },

  /* -------------------------------------------------------------- parent */
  {
    id: 'parent',
    name: 'Parent',
    slug: 'parent',
    motif: 'stewardship',
    motifName: 'Stewardship',
    motifMeaning: 'Helping another person grow toward capability.',
    who: 'You are raising a child of any age.',
    clarification: 'This assessment is primarily about your own use of AI and the decisions you make as a parent. It is not a score for your child.',
    coreQuestion: 'Is the way your family engages with AI strengthening the capabilities your child will need?',
    about: [
      'AI increasingly enters family life through homework, search, school communication, devices, entertainment, writing, advice, translation, planning, and information.',
      'The assessment examines learning, independence, privacy, judgment, boundaries, modeling, communication, trust, and future readiness.',
      'It also considers what your own behavior teaches your child about technology. Children learn not only from the rules parents create. They also learn from what parents themselves do.',
    ],
    whyHeading: 'Why this matters',
    why: [
      'There are two different risks. AI can become so convenient that children stop practicing capabilities they still need to develop. But preventing meaningful AI engagement completely may also leave children unprepared for a world in which intelligent technology will increasingly affect education, employment, communication, and society.',
      'The better question is not how much AI a child should use.',
    ],
    whyPull: 'Is the way we engage with AI strengthening the child?',
    asked: [
      { title: 'Homework help', body: 'When AI helps a child understand and when it begins doing the learning for them.' },
      { title: 'Screen and technology decisions', body: 'How you decide when AI belongs in family life and when it does not.' },
      { title: 'School communication', body: 'How AI is used to understand letters, documents, assignments, and school information.' },
      { title: 'What you share about your child', body: 'What personal information or situations you would or would not place into an AI system.' },
      { title: 'Modeling', body: 'What your own AI habits demonstrate.' },
      { title: 'Independence and future readiness', body: 'Whether your child is developing independent capability and intelligent engagement with emerging technology.' },
    ],
    discover: [
      'Where AI appears to help',
      'Where boundaries need attention',
      'How parental behavior shapes AI habits',
      'Where privacy matters',
      'Whether independence is developing',
      'Whether future readiness is developing',
      'Practical actions to consider at home',
    ],
    minutes: 'About 10 minutes',
    cta: 'Begin as a Parent',
  },

  /* -------------------------------------------------------------- leader */
  {
    id: 'administrator',
    name: 'Leader / Administrator',
    slug: 'leader',
    motif: 'systems',
    motifName: 'Systems',
    motifMeaning: 'Human judgment operating inside complexity.',
    who: 'You lead a team, school, institution, ministry, department, or organisation.',
    whoList: ['Executives', 'Administrators', 'Department leaders', 'School leaders', 'Nonprofit leaders', 'Ministry leaders', 'Institutional leaders', 'Team leaders', 'Decision makers'],
    coreQuestion: 'Is the way you use AI strengthening your ability to lead and make sound decisions?',
    about: [
      'These questions focus on your leadership work and the decisions for which you remain responsible. They examine how AI enters analysis, budgets, planning, strategy, board work, dashboards, personnel decisions, policy, research, vendor evaluation, communication, and confidential information.',
      'The assessment looks at whether AI helps you understand complexity and make better decisions. It also looks for situations where polished analysis, speed, or automation may substitute for leadership judgment.',
      'And it examines underexposure. If your AI exposure is limited, are you sufficiently prepared to evaluate AI tools, vendors, claims, risks, and organizational change?',
    ],
    whyHeading: 'Why this matters',
    why: [
      'AI can make information appear clearer. It can make decisions appear easier. But faster analysis does not automatically mean better leadership.',
      'Leaders remain responsible for people, judgment, ethics, consequences, governance, confidentiality, and decisions, even when AI contributes to the analysis.',
      'Your Human Advantage as a leader includes being able to understand the decision, question the analysis, explain the reasoning, challenge assumptions, defend the conclusion, and take responsibility for the outcome.',
    ],
    asked: [
      { title: 'Analysis, budgets and board ready work', body: 'How AI contributes to information used for important decisions.' },
      { title: 'Vendor claims and dashboards', body: 'How you evaluate recommendations, metrics, and technology claims.' },
      { title: 'Personnel decisions', body: 'Where AI contributes and where human judgment should remain primary.' },
      { title: 'Policy and disclosure', body: 'Whether the organization has clear AI expectations.' },
      { title: 'Confidential information', body: 'What information should or should not enter AI systems.' },
      { title: 'Leadership independence', body: 'Whether you can explain and defend the reasoning behind important decisions.' },
      { title: 'Future readiness', body: 'Whether you understand AI well enough to lead through the changes it is creating.' },
    ],
    discover: [
      'Where AI strengthens leadership',
      'Where automation may substitute for judgment',
      'How well AI assisted analysis is verified',
      'Whether confidentiality boundaries are clear',
      'Whether underexposure creates strategic vulnerability',
      'What capability most needs development next',
    ],
    minutes: 'About 10 minutes',
    cta: 'Begin as a Leader',
  },

  /* ------------------------------------------------------------ minister */
  {
    id: 'pastor',
    name: 'Minister / Preacher',
    slug: 'minister',
    motif: 'formation',
    motifName: 'Formation',
    motifMeaning: 'Calling, Scripture, judgment, voice, study, presence.',
    who: 'You prepare and preach to a congregation.',
    coreQuestion: 'Is the way you use AI strengthening your ministry capability without replacing the work that should form you?',
    about: [
      'This is a private self check for those who prepare and preach the Word. It asks where AI is serving your calling and where it may be standing in for the work God does in you through prayer, Scripture, study, dependence, reflection, preparation, and presence with your people.',
      'This assessment is not based on the assumption that AI use in ministry is automatically faithful or automatically unfaithful. The question is more careful: is the way you use AI serving the work of ministry while preserving the formation, judgment, voice, and presence that should remain yours?',
      'The assessment also considers underexposure. Ministers increasingly need enough understanding of AI to guide congregations, evaluate information, understand ethical questions, recognize how AI is shaping people, use appropriate tools wisely, and speak intelligently into an AI shaped world.',
    ],
    whyHeading: 'Why this matters',
    why: [
      'A sermon can become more polished without the preacher becoming more formed. Research can become faster without study becoming deeper. Language can become clearer without the message becoming more truly yours.',
      'At the same time, pastors who do not understand AI may struggle to guide people whose education, work, relationships, and everyday decisions are increasingly influenced by it.',
      'The question is not simply whether AI enters ministry.',
    ],
    whyPull: 'What happens to the minister when it does?',
    asked: [
      { title: 'Preparation and prayer', body: 'What happens before AI enters preparation and whether prayer, Scripture, and your own thinking still lead the process.' },
      { title: 'What reaches the pulpit', body: 'How AI contributes to material that becomes part of preaching.' },
      { title: 'Checking quotations, word studies and citations', body: 'Whether AI supplied material is verified against Scripture and real sources.' },
      { title: 'Study and formation', body: 'Whether AI assisted study becomes understanding that remains with you.' },
      { title: 'Pastoral care', body: 'Where AI should and should not enter deeply human ministry situations.' },
      { title: 'Confidences', body: 'What information about people you refuse to place into a tool.' },
      { title: 'Your own voice', body: 'Whether sermons continue to carry your convictions, context, congregation, testimony, and calling.' },
      { title: 'Unaided capability', body: 'What preparation would look like if the tools disappeared.' },
      { title: 'Ministry AI fluency', body: 'Whether you understand AI well enough to use it intentionally and guide others wisely.' },
    ],
    discover: [
      'Authorship and faithfulness to the text',
      'Unaided preaching capability',
      'Formation and voice',
      'Integrity and care',
      'Ministry AI fluency and deeper study',
      'Discerning practice and dependence',
      'Future readiness and your next developmental stage',
    ],
    minutes: 'Around 12 minutes',
    cta: 'Begin as a Minister',
    isNew: true,
  },

  /* ------------------------------------------------------------ business */
  {
    id: 'business',
    name: 'Business Owner',
    slug: 'business',
    motif: 'resilience',
    motifName: 'Resilience',
    motifMeaning: 'A business becoming more capable without becoming fragile beneath its tools.',
    who: 'You own, founded, or run a business.',
    whoList: ['Founders', 'Entrepreneurs', 'Owner operators', 'Small business owners', 'Family business owners', 'Executives functioning as principal owners'],
    clarification: 'This assessment is different. It does not primarily assess how you learn. It examines your business.',
    coreQuestion: 'Is the way you and your team use AI making you and your business more capable?',
    about: [
      'It asks whether the way you and your team use AI is strengthening or weakening decisions, continuity, customer trust, business knowledge, operational capability, people, resilience, and future readiness. It examines AI inside an operating business, not merely as a personal productivity tool.',
      'Three questions in ten are about you as the owner. They examine the calls you make, how you evaluate information, how you think, where judgment remains independent, and where responsibility sits.',
      'The other seven are about the business. They examine how the business operates, what knowledge it retains, what tools it relies on, how staff use AI, what information is exposed, what happens if critical AI disappears, and how resilient the business actually is.',
      'Each question is marked, so you always know which of the two you are answering.',
    ],
    whyHeading: 'Why this matters',
    why: [
      'A business can become dramatically more efficient through AI while simultaneously becoming more fragile.',
      'If critical knowledge increasingly lives inside tools, what happens when those tools change? If staff use AI without common boundaries, what happens to customer information? If AI drafts customer communication, who remains accountable? If AI influences pricing or strategy, who can explain the reasoning? If the main AI platform disappears tomorrow, what can the company still do?',
      'At the same time, businesses that avoid AI entirely may lose adaptability, productivity, new capabilities, competitive awareness, innovation opportunities, and future readiness. The objective is not maximum automation.',
    ],
    whyPull: 'The objective is a stronger, more capable, and more resilient business.',
    asked: [
      { title: 'Decisions', body: 'How AI contributes to important business calls and whether those decisions remain understandable.' },
      { title: 'Pricing', body: 'How AI influences pricing and commercial judgment.' },
      { title: 'What reaches a customer', body: 'How AI generated communication and decisions are reviewed.' },
      { title: 'Business continuity', body: 'What happens if your primary AI system becomes unavailable.' },
      { title: 'Institutional knowledge', body: 'Whether important knowledge remains inside the business.' },
      { title: 'Staff AI use', body: 'What tools employees use and what expectations exist.' },
      { title: 'Customer data', body: 'What information enters AI systems and whether appropriate boundaries exist.' },
      { title: 'Policy and disclosure', body: 'Whether AI use inside the business is intentional and understood.' },
      { title: 'Owner judgment', body: 'Whether the owner remains capable of evaluating, challenging, and owning AI assisted decisions.' },
    ],
    discover: [
      'Where AI strengthens the business',
      'Where dependence creates fragility',
      'What happens if important tools disappear',
      'Whether knowledge remains inside the organization',
      'How staff AI use affects exposure',
      'Whether customer information is appropriately handled',
      'Where owner judgment remains strong',
      'Whether underexposure creates competitive vulnerability',
      'What the business should strengthen next',
    ],
    minutes: 'Around 12 minutes',
    cta: 'Begin as a Business Owner',
    isNew: true,
  },
];

export const personaBySlug = (slug: string) => PERSONA_CONTENT.find((p) => p.slug === slug);
export const personaById = (id: Persona) => {
  const found = PERSONA_CONTENT.find((p) => p.id === id);
  if (!found) throw new Error(`No persona content for: ${String(id)}`);
  return found;
};

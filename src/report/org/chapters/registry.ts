/**
 * The chapter registry.
 *
 * One entry per chapter: the number, the title, the question it answers, the
 * level of the hierarchy it belongs to, and the section of the individual
 * report it aggregates. The visual contents page reads it, and so do the tests
 * that check every chapter is present and in order.
 */

export interface ChapterMeta {
  number: number;
  title: string;
  question: string;
  level: number;
  /** The "where this comes from" line the brief requires on every chapter. */
  source: string;
  /** Minutes, for the visual contents page. */
  minutes: number;
}

export const CHAPTER_META: ChapterMeta[] = [
  { number: 1, title: 'The executive answer', level: 6, minutes: 1,
    question: 'What kind of AI workforce do I have, and what should I do first?',
    source: 'every section of the individual report, summarised' },
  { number: 2, title: 'How to read the numbers', level: 0, minutes: 3,
    question: 'What do these words and numbers actually mean?',
    source: 'the reading notes that accompany each individual report' },
  { number: 3, title: 'Your workforce on the AI readiness journey', level: 1, minutes: 3,
    question: 'How far along is my workforce, and how alike are my people?',
    source: 'the "Where you are on the route" section' },
  { number: 4, title: 'Which way your workforce leans', level: 1, minutes: 2,
    question: 'Is my risk avoidance or over-reliance?',
    source: 'the "Which way you are off the path" section' },
  { number: 5, title: 'AI readiness against human protection', level: 2, minutes: 3,
    question: 'Are we building AI capability safely?',
    source: 'the composites and the healthy adoption criteria' },
  { number: 6, title: 'The ten human advantage dimensions', level: 2, minutes: 6,
    question: 'Where is my workforce strong, developing, vulnerable or divided?',
    source: 'the "Your ten dimensions" section' },
  { number: 7, title: 'Six questions every AI-enabled organisation should ask', level: 2, minutes: 4,
    question: 'What do the six bigger readings say?',
    source: 'the "Six bigger questions" section' },
  { number: 8, title: 'AI use against actual capability', level: 4, minutes: 2,
    question: 'Who do I scale, check, develop first, or found?',
    source: 'the pre-questions and the signals' },
  { number: 9, title: 'Are AI skills developing faster than AI judgment?', level: 3, minutes: 2,
    question: 'Is fluency outrunning judgment?',
    source: 'the fluency dimension against the judgment composite' },
  { number: 10, title: 'What your workforce is already doing well', level: 2, minutes: 3,
    question: 'What is working, and what should I protect?',
    source: 'the "Where AI seems to be helping" section' },
  { number: 11, title: 'Risks and vulnerabilities to address', level: 3, minutes: 4,
    question: 'Where is my exposure, and how many people carry it?',
    source: 'the "What to watch" section and the vulnerability line' },
  { number: 12, title: 'Your workforce is not one group', level: 4, minutes: 5,
    question: 'Which populations inside my workforce need different things?',
    source: 'the "What your answers say about you" section' },
  { number: 13, title: 'What employees say against what they do', level: 3, minutes: 3,
    question: 'Where do stated beliefs and practical choices diverge?',
    source: 'the "Said against chosen" section' },
  { number: 14, title: 'Does the workforce know where it stands?', level: 3, minutes: 2,
    question: 'Does my workforce see itself accurately?',
    source: 'the "Feel against measure" section' },
  { number: 15, title: 'What is preventing your workforce from moving forward?', level: 5, minutes: 4,
    question: 'Which single capability, if grown, moves the most people?',
    source: 'the "The constraint" section and the practice gates' },
  { number: 16, title: 'How much of the workforce can move next?', level: 5, minutes: 3,
    question: 'How many people can move within a quarter?',
    source: 'the "Moving people up" section' },
  { number: 17, title: 'Where should we invest first?', level: 6, minutes: 3,
    question: 'What training reaches the most people, and matters most?',
    source: 'the priority level on every recommended practice' },
  { number: 18, title: 'The development portfolio', level: 6, minutes: 5,
    question: 'What is the full curriculum my people were actually given?',
    source: 'the "Your practices, in detail" section' },
  { number: 19, title: 'Training architecture', level: 6, minutes: 3,
    question: 'What kind of programme do I need to build?',
    source: 'the developmental cohorts, mapped on to tiers' },
  { number: 20, title: 'The ninety day workforce development plan', level: 6, minutes: 4,
    question: 'What should we do first, second and third?',
    source: 'the sequenced plan in each individual report' },
  { number: 21, title: 'What to measure next', level: 0, minutes: 2,
    question: 'What would the next measurement layer tell me?',
    source: 'the appendix note on what is not collected' },
  { number: 22, title: 'Retake and movement', level: 6, minutes: 2,
    question: 'Can I compare this with the last wave and the next?',
    source: 'the report dates and instrument versions' },
];

export const chapterMeta = (n: number): ChapterMeta =>
  CHAPTER_META.find((c) => c.number === n)!;

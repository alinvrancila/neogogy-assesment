/**
 * The cover's presentation model.
 *
 * One mapper turns a HumanAdvantageResult and the details the respondent gave into the
 * values the six layouts read. Nothing here computes, scores, or decides
 * anything: it renames what the assessment already produced so that six
 * different layouts cannot drift apart in what they call things.
 *
 * Deliberately absent: the developmental index, the stage number, and anything
 * that ranks. These covers carry a qualitative result, not a score.
 */

import { BRAND } from '@/brand';
import type { HumanAdvantageResult, Persona } from '@/engine/types';
import { reportTitle } from '@/engine/display';

export type CoverPersona =
  | 'student' | 'teacher' | 'parent' | 'leader' | 'minister' | 'business' | 'professional';

export type AssessmentCoverData = {
  persona: CoverPersona;
  assessmentName: string;
  resultTitle: string;
  resultSummary: string;
  personName: string;
  assessmentDate: string;
  reportId?: string;
  accessUrl?: string;
  /** The concept label carried by the artwork. Decorative, and optional. */
  conceptTitle?: string;
  conceptSubtitle?: string;
  existingMetadata?: Array<{ label: string; value: string }>;
};

/** The engine's persona ids are not the design system's. One place converts. */
export const COVER_PERSONA: Record<Persona, CoverPersona> = {
  student: 'student',
  teacher: 'teacher',
  parent: 'parent',
  administrator: 'leader',
  professional: 'professional',
  pastor: 'minister',
  business: 'business',
};

/**
 * One product, seven editions.
 *
 * These were seven different product names, each appearing on the same page as
 * "Human Advantage Assessment", so a report carried two names and a school
 * running three editions held three products. An edition is a version of one
 * thing, and the masthead now says so.
 */
const EDITION_NAME: Record<CoverPersona, string> = {
  student: 'Student edition',
  teacher: 'Teacher edition',
  parent: 'Parent edition',
  leader: 'Leader edition',
  minister: 'Preaching edition',
  business: 'Business Owner edition',
  professional: 'Professional edition',
};

const ASSESSMENT_NAME: Record<CoverPersona, string> = Object.fromEntries(
  (Object.keys(EDITION_NAME) as CoverPersona[])
    .map((k) => [k, `${BRAND.report}: ${EDITION_NAME[k]}`])
) as Record<CoverPersona, string>;

const CONCEPT: Record<CoverPersona, { title: string; subtitle: string }> = {
  student: { title: 'The Field of Questions', subtitle: 'An expanding fan of inquiry lines' },
  teacher: { title: 'The Table of Many Lights', subtitle: 'Concentric rings of transmission' },
  parent: { title: 'The Shared Canopy', subtitle: 'An open arch joining two independent paths' },
  leader: { title: 'The Consequence Room', subtitle: 'A branching civic decision junction' },
  minister: { title: 'The Quiet Threshold', subtitle: 'A vertical threshold crossed by a page-path' },
  business: { title: 'The Resilient Workshop', subtitle: 'A removable operating loop' },
  professional: { title: 'The Working Thread', subtitle: 'A woven thread through the workday' },
};

const ID_PREFIX: Record<CoverPersona, string> = {
  student: 'STU', teacher: 'TCH', parent: 'PAR',
  leader: 'LDR', minister: 'MIN', business: 'BUS', professional: 'PRO',
};

/**
 * A stable reference for a report. Uses the stored record id where there is
 * one, so a respondent quoting it can be found, and otherwise derives four
 * digits from the reading itself so two people never quote the same number for
 * different reports.
 */
function makeReportId(persona: CoverPersona, r: HumanAdvantageResult, leadId?: string): string {
  if (leadId) return `${ID_PREFIX[persona]}-${leadId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const seed = `${r.archetype.id}|${r.stage.rawIndex}|${Object.values(r.dimensions).map((d) => d.score).join()}`;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${ID_PREFIX[persona]}-${String(h % 10000).padStart(4, '0')}`;
}

export function toCoverData(args: {
  result: HumanAdvantageResult;
  name?: string;
  leadId?: string;
  company?: string;
  date?: Date;
}): AssessmentCoverData {
  const { result: r, name = '', leadId, company, date = new Date() } = args;
  const persona = COVER_PERSONA[r.persona];
  const concept = CONCEPT[persona];

  return {
    persona,
    assessmentName: ASSESSMENT_NAME[persona],
    // the qualitative result the engine already chose, in its own words
    resultTitle: r.archetype.name.replace(/^The\s+/i, ''),
    resultSummary: r.archetype.tagline,
    personName: (persona === 'business' ? (company || name) : name).trim() || 'Your report',
    // Fixed zone. The cover is server rendered on a saved report and rendered
    // in the browser at the end of a sitting, and a date that shifts between
    // the two is both a hydration mismatch and a wrong answer.
    assessmentDate: date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    }),
    reportId: makeReportId(persona, r, leadId),
    accessUrl: 'assessment.neogogy.ai',
    conceptTitle: concept.title,
    conceptSubtitle: concept.subtitle,
    existingMetadata: [],
  };
}

export { reportTitle };

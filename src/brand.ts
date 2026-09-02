/**
 * The product's identity, in one place.
 *
 * Every surface (page, results, report, PDF, metadata, share card, email) reads
 * its name from here. When the product is renamed again, it is renamed once.
 *
 * Naming rule: the full name establishes meaning, so it leads. HAS is an
 * internal shorthand and never the dominant public label. The attribution names
 * the institution behind the work without competing with the product.
 *
 * Copy rule, enforced by tests/compass/copy.ts: no em dash or en dash appears in
 * any respondent-facing string in this codebase. Use commas, colons, or a second
 * sentence.
 */

export const BRAND = {
  /** The full public product name. */
  product: 'Neogogy Human Advantage Assessment',
  /** When the full name has already been established on the surface. */
  productShort: 'Human Advantage Assessment',
  /** Internal shorthand: code, analytics, configuration. Not a public headline. */
  abbrev: 'HAS',
  /** The organisation the product belongs to. */
  org: 'Neogogy',
  /** The institutional attribution. */
  poweredBy: 'Powered by ICAN.ph',
  /** The result artifact the respondent receives. */
  report: 'Human Advantage Report',
  /** The developmental visualisation inside the report. */
  map: 'Capability Map',
  site: 'assessment.neogogy.ai',
  url: 'https://assessment.neogogy.ai',
} as const;

/** The question the whole product points at. */
export const CORE_QUESTION =
  'Is the way you use AI, or choose not to use AI, strengthening your capabilities?';

/**
 * The four organisations behind the work.
 *
 * The supplied logos are used as supplied: cropped to their own ink and scaled,
 * never redrawn, re-typeset or approximated. Each carries its own aspect so the
 * page, the results and the report can size them optically rather than by a
 * single box that would squash one and starve another.
 */
export const ECOSYSTEM = [
  { name: 'ICAN', note: 'International Center for Applied Neogogy',
    url: 'https://ican.ph', logo: '/orgs/ican.png', w: 433, h: 300, pdfW: 76 },
  { name: 'Life College International', note: 'Higher education',
    url: 'https://www.life.edu.ph', logo: '/orgs/life-college.png', w: 350, h: 420, pdfW: 46 },
  { name: 'Neogogy.ai', note: 'Learning at the speed of mind',
    url: 'https://www.neogogy.ai', logo: '/orgs/neogogy.png', w: 435, h: 360, pdfW: 64 },
  { name: 'LifeX', note: 'Get where you want to be, faster',
    url: 'https://lifex.ph', logo: '/orgs/lifex.png', w: 614, h: 200, pdfW: 92 },
] as const;

/** Where a respondent goes next, named once so the page and the report agree. */
export const NEXT_STEP = {
  line: 'Want to learn more and increase your advantage:',
  url: 'https://lifex.ph',
  label: 'lifex.ph',
} as const;

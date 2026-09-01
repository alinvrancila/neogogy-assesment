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
 * The four organisations behind the work. Logos are supplied artwork and are
 * never redrawn or approximated: each entry names the file it expects under
 * public/orgs, and the section renders a typographic placeholder until the real
 * file is dropped in.
 */
export const ECOSYSTEM = [
  { name: 'ICAN', logo: '/orgs/ican.svg', note: 'International Center for Applied Neogogy' },
  { name: 'Life College International', logo: '/orgs/life-college.svg', note: 'Higher education' },
  { name: 'Neogogy.ai', logo: '/orgs/neogogy.svg', note: 'Learning in the age of AI' },
  { name: 'LifeX', logo: '/orgs/lifex.svg', note: 'Applied practice' },
] as const;

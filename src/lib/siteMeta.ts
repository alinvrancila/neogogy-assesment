/**
 * What the site says about itself, everywhere.
 *
 * The title, the description and the share card were written inline in the root
 * layout, where the only way to check them was to read the file with a regular
 * expression. That is how "in six perspectives" stayed in the description of
 * every page, and on every link ever shared, for as long as there have been
 * seven. The counts are derived here, and the suite reads these values rather
 * than the source that produces them.
 */
import { BRAND, CORE_QUESTION } from '@/brand';
import { PERSONA_CONTENT } from '@/content/personas';
import { CONSTRUCTS } from '@/engine/config';
import { SITE_CARD } from '@/lib/shareCard';

export const DIMENSION_COUNT = Object.keys(CONSTRUCTS).length;
export const PERSPECTIVE_COUNT = PERSONA_CONTENT.length;

export const SHARE_TITLE = BRAND.product;

/**
 * Two sentences: the question the assessment exists to ask, then what a
 * respondent gets for answering it. Kept near 200 characters, which is what
 * Facebook, LinkedIn and X show before they cut.
 */
export const SHARE_DESC =
  `${CORE_QUESTION} A free assessment from ICAN.ph across ${DIMENSION_COUNT} dimensions, `
  + `in ${PERSPECTIVE_COUNT} perspectives, with a personal ${BRAND.report} to keep.`;

/** One card for every network. 1200 by 630 is the size Facebook, LinkedIn and X
 *  all crop from, so this is what a shared link shows. */
export const SHARE_IMAGE = {
  url: SITE_CARD,
  width: 1200,
  height: 630,
  alt: 'A person standing on a summit above the clouds at sunrise, under the words: '
    + `AI is becoming more capable, are you? Take the ${BRAND.product} to learn more.`,
  type: 'image/jpeg',
} as const;

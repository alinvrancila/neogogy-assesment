import fs from 'fs';
import path from 'path';

/**
 * The picture a link shows when it is posted.
 *
 * Each assessment can carry its own card at public/share/og-<slug>.jpg. Until
 * one is supplied the route falls back to the site card, so a link shared today
 * still previews as something rather than as nothing. See public/share/README.md
 * for the frame and the naming.
 */

export const SITE_CARD = '/share/og.jpg';
const DIR = path.join(process.cwd(), 'public', 'share');

export function shareCard(slug: string): string {
  const own = `og-${slug}.jpg`;
  return fs.existsSync(path.join(DIR, own)) ? `/share/${own}` : SITE_CARD;
}

/** True when the persona has a card of its own, for reporting what is still needed. */
export const hasOwnCard = (slug: string) => shareCard(slug) !== SITE_CARD;

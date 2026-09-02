import fs from 'fs';
import path from 'path';

/**
 * The picture a link shows when it is posted.
 *
 * Every card's filename carries a hash of its own bytes, written by
 * `npm run cards` into public/share/manifest.json. This is not tidiness: the
 * networks cache a preview image against its URL and hold it for a long time,
 * so replacing artwork behind a stable filename leaves them serving the picture
 * they already have. New artwork is a new URL, so a stale card is impossible.
 *
 * An assessment with no card of its own falls back to the site card, so a new
 * persona can ship before its artwork does.
 */

const DIR = path.join(process.cwd(), 'public', 'share');

type Manifest = Record<string, string>;

const manifest: Manifest = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf-8')) as Manifest;
  } catch {
    return {};
  }
})();

/** The site card, used for the homepage and as every fallback. */
export const SITE_CARD = manifest.og ? `/share/${manifest.og}` : '/share/og.jpg';

export function shareCard(slug: string): string {
  const own = manifest[`og-${slug}`];
  return own ? `/share/${own}` : SITE_CARD;
}

/** True when the persona has a card of its own, rather than the site's. */
export const hasOwnCard = (slug: string) => shareCard(slug) !== SITE_CARD;

import type { MetadataRoute } from 'next';
import { REPORT_PREFIX } from '@/lib/reportLink';

/**
 * What a crawler is asked to leave alone.
 *
 * The assessment itself should be found, so the site stays open. Everything
 * that belongs to one person or to the people running it does not: report
 * pages carry a token in their address, and the admin and the dev routes are
 * not for readers at all.
 *
 * Only the prefix is named here, never a token. A robots file is public, and
 * naming a private address in it is how private addresses stop being private.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [`${REPORT_PREFIX}/`, '/api/', '/admin', '/dev/'],
    },
  };
}

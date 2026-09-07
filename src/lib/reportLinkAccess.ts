/**
 * What the two report link controls are allowed to do, and how often.
 *
 * Both controls are authorised by possession of a live token and by nothing
 * else. That is the whole security model, and it is why this file is careful
 * about three things: it answers a bad token exactly as it answers an unknown
 * one, it never echoes a token into an error, and it never accepts a
 * destination address from the caller.
 */
import { getLeadByReportToken, lastCompletedAtForEmail, type LeadRecord } from '@/lib/storage';
import { isWellFormedToken, isLive, redactToken, reportUrl } from '@/lib/reportLink';
import { allow, peek, resetThrottles } from '@/lib/throttle';

// Re-exported so the routes and the suite keep one import for link access.
export { allow, peek, resetThrottles };
import { BRAND } from '@/brand';

/**
 * How many misses one address gets before it is turned away.
 *
 * A report link is an unauthenticated surface and every lookup costs a scan of
 * the table, so guessing is cheap for the guesser and expensive for us. Misses
 * are counted and successful opens are not, which means a person reading their
 * own report is never affected by this no matter how often they refresh.
 */
export const MISS_LIMIT = 20;
export const MISS_WINDOW_MS = 10 * 60 * 1000;

export const overMissBudget = (ip: string) => !peek(`report-miss:${ip}`, MISS_LIMIT);
export const recordMiss = (ip: string) => { allow(`report-miss:${ip}`, MISS_LIMIT, MISS_WINDOW_MS); };


export type LinkAccess =
  | { ok: true; lead: LeadRecord; lastCompletedAt: string; token: string }
  | { ok: false; status: number; error: string };

/** One answer for every way a token can fail, so the route tells an attacker
 *  nothing about which records exist. */
const CLOSED: LinkAccess = {
  ok: false,
  status: 404,
  error: 'This link is not active. Use the most recent link you were sent.',
};

/** Not the same fact as a dead link, and on a shared network not even a true
 *  one, so it is not told in the same words. */
const BUSY: LinkAccess = {
  ok: false,
  status: 429,
  error: 'Too many attempts from this network just now. Wait a few minutes and try again.',
};

/**
 * Open a link, or refuse it.
 *
 * The miss budget lives here rather than at one call site, because every route
 * that resolves a token pays the same scan of the table and every one of them
 * is unauthenticated. Passing the caller's address is what arms it; passing
 * nothing runs the lookup uncounted, which is only ever right in a test.
 */
export async function accessByToken(raw: unknown, ip?: string): Promise<LinkAccess> {
  const miss = () => {
    if (ip) recordMiss(ip);
    return CLOSED;
  };

  if (ip && overMissBudget(ip)) return BUSY;
  if (!isWellFormedToken(raw)) return miss();
  const token = raw;

  const lead = await getLeadByReportToken(token);
  if (!lead) return miss();

  const lastCompletedAt = (await lastCompletedAtForEmail(lead.email || '')) || lead.createdAt;
  // An expired link is refused here, so no caller can forget to ask.
  if (!isLive(lastCompletedAt)) return miss();

  return { ok: true, lead, lastCompletedAt, token };
}

/**
 * What a report view records.
 *
 * A function rather than an object literal inside the page, so a test can read
 * what would be written. Nothing here comes from the address: an event carries
 * what the record already discloses, never the token that opened it.
 */
export function reportViewEvent(lead: LeadRecord) {
  return {
    event: 'report_view' as const,
    role: lead.role,
    zone: lead.archetypeId || lead.persona,
  };
}

/** Log a failure without writing the token into the line. */
export function logQuietly(label: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(label, redactToken(detail));
}

/**
 * The "email me my link" message, built from the record and from nothing else.
 *
 * A pure function on purpose. The promise in the privacy notice is about the
 * destination, so the destination is computed here, where a test can read it,
 * rather than assembled inside a handler where the only way to check it is to
 * read the source and hope.
 */
export function linkEmailFor(lead: LeadRecord, token: string): {
  to: string; name: string; personaName: string; subject: string; bodyText: string;
} {
  const to = (lead.email || '').trim();
  const first = lead.firstName || lead.name || '';
  return {
    to,
    name: lead.name || '',
    personaName: lead.archetypeName || lead.personaName || '',
    subject: `Your ${BRAND.report} link`,
    bodyText: [
      first ? `Hello ${first},` : 'Hello,',
      ``,
      `Here is the link to your ${BRAND.report}:`,
      ``,
      `  ${reportUrl(token)}`,
      ``,
      `It opens the same report you were sent, and it works until the record does, twenty four months from your last completed assessment. Taking the assessment again starts that period over.`,
      ``,
      `Anyone holding this link can read the report, so treat it the way you would treat the report itself. If you have shared it and want it closed, open the report and choose "Get a new link". The old address stops working straight away.`,
      ``,
      `This link is only ever sent to the address already on the record, which is this one.`,
      ``,
      `Warmly,`,
      `The International Center for Applied Neogogy`,
    ].join('\n'),
  };
}

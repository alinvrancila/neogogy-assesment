import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clientIp } from '@/lib/requestContext';
import { getLead, saveLead, logEvent } from '@/lib/storage';
import { accessByToken, allow, logQuietly } from '@/lib/reportLinkAccess';
import { mintReportToken, reportPath } from '@/lib/reportLink';

export const runtime = 'nodejs';

/**
 * "Get a new link".
 *
 * Issues a fresh address and stops the old one working. Replacing the token is
 * what closes the old link: there is no separate revocation list to keep, and
 * nothing else in the system will ever match the value that was replaced.
 *
 * The new address is returned as a path rather than a whole URL, so the caller
 * navigates within the site and no absolute address with a token in it is
 * assembled anywhere it might be logged.
 */

/** Rotation is cheap for the respondent and expensive for anyone guessing at
 *  it, but a loop should still not be able to churn the record. */
const PER_HOUR = 10;

export async function POST(request: NextRequest) {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  // Same scan, same guess, same budget as the report page itself.
  const access = await accessByToken(body.token, clientIp(request.headers) || 'unknown');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  if (!allow(`link-rotate:${access.lead.id}`, PER_HOUR)) {
    return NextResponse.json(
      { error: 'That link has just been replaced several times. Try again in an hour.' },
      { status: 429 }
    );
  }

  // Re-read immediately before writing. saveLead replaces the whole item, so a
  // record modified in between (a rescoring job, an admin edit) must not be
  // rolled back by writing a copy read earlier in this request.
  const current = await getLead(access.lead.id);
  // Gone between the lookup and the write. Writing the record back would undo
  // an erasure request with a button press, so the link simply closes, which is
  // what deleting the record was supposed to do.
  if (!current) {
    return NextResponse.json(
      { error: 'This link is not active. Use the most recent link you were sent.' },
      { status: 404 }
    );
  }

  const token = mintReportToken();
  try {
    await saveLead({ ...current, reportToken: token, reportTokenIssuedAt: new Date().toISOString() });
  } catch (error) {
    logQuietly('report link rotate failed', error);
    return NextResponse.json(
      { error: 'A new link could not be issued just now. Your existing link still works.' },
      { status: 502 }
    );
  }

  try {
    await logEvent({ event: 'report_link_rotate', role: current.role });
  } catch (error) {
    logQuietly('report link event failed', error);
  }

  return NextResponse.json({ path: reportPath(token) });
}

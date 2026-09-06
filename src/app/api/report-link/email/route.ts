import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clientIp } from '@/lib/requestContext';
import { createHash } from 'crypto';
import { logEvent } from '@/lib/storage';
import { accessByToken, allow, logQuietly, linkEmailFor } from '@/lib/reportLinkAccess';
import { maskEmail } from '@/lib/reportLink';
import { sendReportEmail, isEmailEnabled } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * "Email me my link".
 *
 * Sends the link that already exists to the address that is already on the
 * record. There is no destination parameter, by design: a control that accepted
 * one would turn a leaked link into a way of forwarding somebody else's report,
 * and the privacy notice says plainly that this never sends to an address typed
 * at the time.
 */

/** Three an hour per link, and three an hour per address. Enough for a person
 *  who did not receive the first one, not enough to be a nuisance. */
const PER_HOUR = 3;

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

  const { lead, token } = access;
  const to = (lead.email || '').trim();
  if (!to) {
    return NextResponse.json(
      { error: 'This record has no address to send to. Write to us and we will help.' },
      { status: 422 }
    );
  }

  // Checked before the budget is touched. Spending an allowance on a message
  // that was never going to be sent is how a respondent ends up being told to
  // check an inbox nothing was ever sent to.
  if (!isEmailEnabled()) {
    return NextResponse.json(
      { error: 'Email is not switched on yet. Bookmark this page and it will keep working.' },
      { status: 503 }
    );
  }

  // Counted against a digest of the link rather than the link itself, so the
  // token is not left sitting in a map for an hour to be read out of a heap
  // dump. It lives in the database and nowhere else.
  const linkKey = createHash('sha256').update(token).digest('base64url').slice(0, 22);
  const tooOften = !allow(`link-email:link:${linkKey}`, PER_HOUR)
    || !allow(`link-email:to:${to.toLowerCase()}`, PER_HOUR);
  if (tooOften) {
    return NextResponse.json(
      { error: 'That has been sent a few times already. Check the inbox, and try again in an hour.' },
      { status: 429 }
    );
  }

  try {
    // Everything about the message, destination included, comes off the record.
    await sendReportEmail(linkEmailFor(lead, token));
  } catch (error) {
    logQuietly('report link email failed', error);
    return NextResponse.json(
      { error: 'The message could not be sent just now. Try again in a moment.' },
      { status: 502 }
    );
  }

  // The event records that a link was sent, never which link.
  try {
    await logEvent({ event: 'report_link_email', role: lead.role });
  } catch (error) {
    logQuietly('report link event failed', error);
  }

  return NextResponse.json({ sent: true, to: maskEmail(to) });
}

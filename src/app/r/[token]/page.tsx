import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { logEvent } from '@/lib/storage';
import { comparisonForStoredAttempt } from '@/lib/history';
import { resolveLeadResult } from '@/lib/leadResult';
import { expiresAt, daysRemaining, maskEmail, REPORT_PAGE_METADATA } from '@/lib/reportLink';
import type { Persona } from '@/engine/types';
import { accessByToken, reportViewEvent } from '@/lib/reportLinkAccess';
import { clientIp } from '@/lib/requestContext';
import ReportView from '@/components/compass/ReportView';
import { BRAND } from '@/brand';
import '@/app/compass.css';

/**
 * A stored report at its own address (audit item B3).
 *
 * Authorisation is possession of the token and nothing else, which is why the
 * page is never cached, never indexed and never passes its address on. The
 * lookup is exact: a token that is the wrong shape is refused before the
 * database is touched, and a token that matches nothing is answered the same
 * way as one that has expired, so the page cannot be used to learn which
 * addresses were ever real.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: `Your ${BRAND.report}`,
  ...REPORT_PAGE_METADATA,
};

function LinkClosed() {
  return (
    <div className="nfc">
      <div className="wrap" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 640 }}>
        <p className="asc-kicker">Report link</p>
        <h1 className="asc-h2">This link is not active</h1>
        <p className="asc-lead">
          The address may have been replaced by a newer one, or the record it pointed at may have
          reached the end of its twenty four months and been deleted along with the link.
        </p>
        <p className="muted" style={{ marginTop: 16 }}>
          If you asked for a new link, use the most recent one you were sent. If you have no working
          link, you can take the assessment again and a fresh report will be sent to you.
        </p>
        <div className="dlrow" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
          <Link className="btn btn-primary" href="/">
            Take the assessment <span className="arrow">&rarr;</span>
          </Link>
          <Link className="btn btn-ghost" href="/privacy">Read the privacy notice</Link>
        </div>
      </div>
    </div>
  );
}

function TooBusy() {
  return (
    <div className="nfc">
      <div className="wrap" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 640 }}>
        <p className="asc-kicker">Report link</p>
        <h1 className="asc-h2">Too many attempts from this network</h1>
        <p className="asc-lead">
          Report addresses are guarded against guessing, and this network has tried too many that
          did not exist. Your own link is unaffected. Wait a few minutes and open it again.
        </p>
        <div className="dlrow" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
          <Link className="btn btn-ghost" href="/">Go to the assessment</Link>
        </div>
      </div>
    </div>
  );
}

export default async function ReportLinkPage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // One place decides whether a link is open, and the page is not a second copy
  // of it. accessByToken refuses a malformed token before touching the
  // database, matches exactly, dates retention from the person's most recent
  // sitting rather than from this record, and counts a miss against the address
  // that made it. Each lookup is a scan of the table, so guessing is cheap for
  // the guesser and expensive for us; only misses are counted, so reading your
  // own report as often as you like costs you nothing.
  const access = await accessByToken(token, clientIp(headers() as unknown as Headers) || 'unknown');
  if (!access.ok) return access.status === 429 ? <TooBusy /> : <LinkClosed />;
  const { lead, lastCompletedAt } = access;

  // A v1 record with no stored answers cannot be scored into a report. The link
  // is real, so this is not a guess, but there is nothing to show.
  const resolved = resolveLeadResult(lead);
  if (!resolved.ok) return <LinkClosed />;

  // The event carries what the record already discloses and nothing from the
  // address. There is no field on an event record that could hold a token, and
  // none is added here.
  await logEvent(reportViewEvent(lead));

  const comparison = await comparisonForStoredAttempt(lead);

  // Every edition but the Minister can rebuild its file from the answers on the
  // record, so the saved page offers the download the results screen offers.
  // The Minister cannot: the two reflection answers behind its Dependence Check
  // are never written down, and a file rebuilt without them would disagree with
  // the letter printed above it.
  const submission = lead.role !== 'pastor' && lead.answers && Object.keys(lead.answers).length
    ? {
        persona: lead.role as Persona,
        usage: lead.usageVal ?? 3,
        b1: lead.baseline?.b1 || undefined,
        b2: lead.baseline?.b2 || undefined,
        answers: lead.answers,
      }
    : null;

  return (
    <ReportView
      result={resolved.result}
      firstName={lead.firstName || lead.name || ''}
      comparison={comparison}
      submission={submission}
      // The report states the day it was taken, not the day it is opened.
      takenAt={lead.createdAt}
      leadId={lead.id}
      link={{
        token,
        maskedEmail: maskEmail(lead.email || ''),
        expiresOn: expiresAt(lastCompletedAt).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
        }),
        daysLeft: daysRemaining(lastCompletedAt),
      }}
    />
  );
}

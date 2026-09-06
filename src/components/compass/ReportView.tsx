'use client';

/**
 * A stored report, opened from its own link.
 *
 * The report itself is the same document the respondent was shown when they
 * finished, rendered from the stored result rather than recomputed, so the page
 * cannot drift from the copy that was emailed. What is added here is the link
 * panel: the two controls the privacy notice promises, and a plain statement of
 * how long the address will keep working.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Results from './Results';
import type { CompassResult } from '@/engine';
import type { AttemptComparison } from '@/lib/history';

export type ReportLink = {
  token: string;
  /** The address on the record, shown back partly hidden so the respondent can
   *  recognise it without the page displaying it in full. */
  maskedEmail: string;
  /** When the link and the record go, written out for a reader. */
  expiresOn: string;
  daysLeft: number;
};

const dayCount = (n: number) =>
  // A live link with hours left has zero whole days left, and "0 more days"
  // reads as expired to the person still holding it.
  (n === 0 ? 'less than a day' : n === 1 ? '1 more day' : `${n} more days`);

function LinkPanel({ link }: { link: ReportLink }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const post = async (path: string) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The token travels in the body rather than the query string, so it is
      // not carried by a referrer and not written into a request line.
      body: JSON.stringify({ token: link.token }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || 'That did not work. Try again in a moment.');
    return payload as Record<string, unknown>;
  };

  const emailLink = async () => {
    setSending(true); setErr(null); setSent(false);
    try {
      await post('/api/report-link/email');
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'That did not work. Try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  const rotate = async () => {
    setRotating(true); setErr(null);
    try {
      const payload = await post('/api/report-link/rotate');
      const next = typeof payload.path === 'string' ? payload.path : null;
      if (!next) throw new Error('A new link could not be issued. Try again in a moment.');
      // replace, not push, so the closed link is not left one back button away.
      router.replace(next);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'A new link could not be issued.');
      setRotating(false);
      setConfirming(false);
    }
  };

  return (
    <section className="wrap" aria-labelledby="link-h" style={{ marginTop: 40, marginBottom: 48 }}>
      <p className="asc-kicker">Your link</p>
      <h2 id="link-h" className="asc-h2">This page is yours, and it is private</h2>
      <p className="asc-lead">
        The address of this page carries a long random token, so it cannot be guessed. It can be
        passed on, though, so treat the link the way you would treat the report itself. Anyone
        holding it can read everything on this page.
      </p>
      <p className="muted" style={{ marginTop: 12 }}>
        It keeps working until {link.expiresOn}, which is {dayCount(link.daysLeft)}, and then the
        link and the record behind it go together. Taking the assessment again starts that period
        over.
      </p>

      <div className="dlrow" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={emailLink} disabled={sending || rotating}>
          {sending ? 'Sending' : 'Email me my link'} <span className="arrow">&rarr;</span>
        </button>

        {confirming ? (
          <button className="btn btn-primary" onClick={rotate} disabled={rotating}>
            {rotating ? 'Issuing' : 'Yes, close this link'} <span className="arrow">&rarr;</span>
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={() => { setConfirming(true); setErr(null); }}
            disabled={sending || rotating}>
            Get a new link <span className="arrow">&rarr;</span>
          </button>
        )}
        {confirming && !rotating ? (
          <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Keep this one</button>
        ) : null}
      </div>

      {sent ? (
        <p className="muted" style={{ marginTop: 12 }}>
          Sent to {link.maskedEmail}, the address already on your record. It is the only address this
          link is ever sent to, so if that inbox is closed to you, write to us instead.
        </p>
      ) : null}

      {confirming && !rotating ? (
        <p className="muted" style={{ marginTop: 12 }}>
          A new address will be issued and this one will stop working straight away. Use it if you
          have shared a link and want it closed. Anyone you gave the old link to will lose access,
          including you if you have it bookmarked, so send yourself the new one afterwards.
        </p>
      ) : null}

      {err ? <p className="gate-err">{err}</p> : null}

      <p className="muted" style={{ marginTop: 16, fontSize: '.9rem' }}>
        Search engines are asked not to index this page, and it passes no part of its address to any
        site you click through to.
      </p>
    </section>
  );
}

export default function ReportView({
  result, firstName, comparison, link, takenAt, leadId,
}: {
  result: CompassResult;
  firstName?: string;
  comparison?: AttemptComparison | null;
  link: ReportLink;
  takenAt: string;
  leadId: string;
}) {
  const router = useRouter();
  return (
    <div className="nfc">
      {/* emailed is false: this is the saved copy being read, not a confirmation
          that something has just been sent. */}
      {/* No submission is passed, ever. The Minister edition rebuilds its file
          from the answers it was given, and the two reflection answers behind
          its Dependence Check are read once and never stored, so a file rebuilt
          here would disagree with the reading printed above it. */}
      <Results
        result={result}
        firstName={firstName}
        emailed={false}
        comparison={comparison}
        submission={null}
        takenAt={takenAt}
        leadId={leadId}
        onRetake={() => router.push('/')}
      />
      <LinkPanel link={link} />
    </div>
  );
}

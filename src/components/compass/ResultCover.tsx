'use client';

/**
 * The cover, on the page.
 *
 * The same six compositions the PDF opens with, so a respondent who reads the
 * result on screen and then opens the file sees one document rather than two
 * designs. It reads from the same mapper as the PDF, so the two cannot say
 * different things, and it carries no score for the same reason the PDF does
 * not: this is the qualitative result. The artwork comes from covers/web,
 * which is the same painting at a fifth of the weight: the print file needs
 * the full resolution, a phone opening its result does not.
 */

import type { CompassResult } from '@/engine';
import { toCoverData } from '@/lib/covers/data';

export default function ResultCover({ result, name, company }: {
  result: CompassResult; name?: string; company?: string;
}) {
  const d = toCoverData({ result, name, company });
  const resultLen = d.resultTitle.length > 52 ? 'long' : d.resultTitle.length > 30 ? 'medium' : 'short';
  const nameLen = d.personName.length > 34 ? 'long' : d.personName.length > 22 ? 'medium' : 'short';

  return (
    <section className={`rcover rcover-${d.persona}`} aria-label={`${d.assessmentName} cover`}>
      <div className="rcover-art" role="presentation">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/covers/web/${d.persona}.jpg`} alt="" loading="eager" decoding="async" />
      </div>

      <div className="rcover-inner">
        <header className="rcover-head">
          <span className="rcover-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/covers/mark.png" alt="" className="rcover-seal" />
            <span>
              <b>Neogogy</b>
              <i>The Formation Compass</i>
            </span>
          </span>
          <span className="rcover-assessment">{d.assessmentName}</span>
        </header>

        <div className="rcover-result">
          <p className="rcover-eyebrow">Your assessment result</p>
          <h2 className={`rcover-title len-${resultLen}`}>{d.resultTitle}</h2>
          <p className="rcover-summary">{d.resultSummary}</p>
        </div>

        <div className="rcover-identity">
          <p className="rcover-eyebrow">Prepared for</p>
          <p className={`rcover-name len-${nameLen}`}>{d.personName}</p>
        </div>

        {d.conceptTitle ? (
          <div className="rcover-concept" aria-hidden="true">
            <em>{d.conceptTitle}</em>
            <span>{d.conceptSubtitle}</span>
          </div>
        ) : null}

        <dl className="rcover-meta">
          <div><dt>Assessment date</dt><dd>{d.assessmentDate}</dd></div>
          {d.reportId ? <div><dt>Report ID</dt><dd>{d.reportId}</dd></div> : null}
          {d.accessUrl ? <div><dt>Access</dt><dd>{d.accessUrl}</dd></div> : null}
        </dl>
      </div>
    </section>
  );
}

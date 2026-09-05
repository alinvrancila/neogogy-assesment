import '@/app/compass.css';
import '@/app/home.css';
import type { Metadata } from 'next';
import { BRAND } from '@/brand';
import type { LegalDoc } from '@/content/legal';

export function legalMetadata(title: string, description: string): Metadata {
  return {
    title: `${title}: ${BRAND.product}`,
    description,
    alternates: { canonical: title === 'Privacy notice' ? '/privacy' : '/terms' },
    robots: { index: true, follow: true },
  };
}

/** One layout for both notices: plain reading width, no decoration. */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="nfc">
      <div className="ha">
        <div className="ha-wrap ha-narrow ha-legal">
          <p className="ha-kicker">{BRAND.product}</p>
          <h1 className="ha-h1">{doc.title}</h1>
          <p className="ha-lead">{doc.summary}</p>
          <p className="ha-legal-dates">
            In effect from {doc.effective}. Last reviewed {doc.reviewed}.
          </p>

          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="ha-h3">{s.heading}</h2>
              {s.body.map((p, i) => <p key={i}>{p}</p>)}
              {s.rows ? (
                <div className="ha-legal-table">
                  <table>
                    <thead><tr>{s.rows.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {s.rows.body.map((r, i) => (
                        <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {s.list ? <ul className="ha-legal-list">{s.list.map((li) => <li key={li}>{li}</li>)}</ul> : null}
            </section>
          ))}

          <p className="ha-legal-foot">
            <a href="/">Back to the assessment</a>
            {' · '}
            <a href={doc.title === 'Privacy notice' ? '/terms' : '/privacy'}>
              {doc.title === 'Privacy notice' ? 'Terms of use' : 'Privacy notice'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

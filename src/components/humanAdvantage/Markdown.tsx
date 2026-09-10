'use client';

/**
 * Minimal renderer for the narrative engine's section lines.
 *
 * The engine emits a small, fixed markdown subset: bold, italics, bullet
 * lines, blockquotes and h3 headings. This renders exactly that subset and
 * nothing else. It is layout only and never alters the prose.
 */

import { Fragment, type ReactNode } from 'react';

/** Inline **bold** and *italic*, applied in that order. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={`${keyBase}b${i}`}>{m[1]}</strong>);
    else out.push(<em key={`${keyBase}i${i}`}>{m[2]}</em>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ lines }: { lines: string[] }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (key: string) => {
    if (!bullets.length) return;
    blocks.push(
      <ul className="md-list" key={`ul${key}`}>
        {bullets.map((b, i) => <li key={i}>{inline(b, `${key}-${i}`)}</li>)}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.startsWith('- ')) { bullets.push(line.slice(2)); return; }
    flushBullets(String(idx));
    if (!line) return;
    if (line.startsWith('### ')) {
      blocks.push(<h4 className="md-h4" key={idx}>{inline(line.slice(4), `h${idx}`)}</h4>);
    } else if (line.startsWith('> ')) {
      blocks.push(<blockquote className="md-quote" key={idx}>{inline(line.slice(2), `q${idx}`)}</blockquote>);
    } else {
      blocks.push(<p className="md-p" key={idx}>{inline(line, `p${idx}`)}</p>);
    }
  });
  flushBullets('end');

  return <Fragment>{blocks}</Fragment>;
}

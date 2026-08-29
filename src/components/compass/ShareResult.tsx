'use client';

/**
 * Share panel on the results page.
 *
 * The post is shown in full and editable before anything is sent, because a
 * respondent should see exactly what would go out under their name. Networks
 * that drop prefilled text say so rather than quietly losing the words.
 */

import { useState } from 'react';
import type { CompassResult } from '@/engine';
import { sharePosts, shareHref, needsPaste, SHARE_URL, type SharePost } from '@/lib/share';

export default function ShareResult({ result }: { result: CompassResult }) {
  const posts = sharePosts(result);
  const [active, setActive] = useState<SharePost['network']>('linkedin');
  const current = posts.find((p) => p.network === active)!;
  const [text, setText] = useState(current.text);
  const [copied, setCopied] = useState(false);

  const pick = (n: SharePost['network']) => {
    setActive(n);
    setText(posts.find((p) => p.network === n)!.text);
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const open = async () => {
    const href = shareHref(active, text);
    if (needsPaste(active)) await copy();
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="share" aria-labelledby="share-h">
      <p className="asc-kicker">Share it</p>
      <h2 id="share-h" className="asc-h2">Tell people where you stand</h2>
      <p className="asc-lead">
        A post is written for you below. Edit it however you like before you send it. The link points
        at the assessment itself, so your scores are never published: people see the invitation, not
        your result.
      </p>

      <div className="share-tabs" role="tablist" aria-label="Choose a network">
        {posts.map((p) => (
          <button
            key={p.network}
            role="tab"
            aria-selected={active === p.network}
            className={`share-tab${active === p.network ? ' is-on' : ''}`}
            onClick={() => pick(p.network)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="share-label" htmlFor="share-text">Your post</label>
      <textarea
        id="share-text"
        className="share-text"
        value={text}
        rows={active === 'x' ? 4 : 9}
        onChange={(e) => { setText(e.target.value); setCopied(false); }}
      />
      {active === 'x' ? (
        <p className="share-count">{text.length} characters</p>
      ) : null}

      <div className="share-actions">
        <button className="btn btn-primary" onClick={() => void open()}>
          {active === 'instagram'
            ? 'Copy the caption'
            : needsPaste(active)
              ? `Copy and open ${current.label}`
              : `Post to ${current.label}`}
          <span className="arrow">&rarr;</span>
        </button>
        <button className="btn btn-ghost" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy text'}
        </button>
      </div>

      {needsPaste(active) ? (
        <p className="share-note">
          {active === 'instagram'
            ? 'Instagram has no web posting link, so the caption is copied for you to paste into the app.'
            : `${current.label} no longer accepts text from a link, so the post is copied to your clipboard. Paste it into the box that opens.`}
        </p>
      ) : null}

      <p className="share-note">
        Shared link: <span className="share-url">{SHARE_URL}</span>
      </p>
    </section>
  );
}

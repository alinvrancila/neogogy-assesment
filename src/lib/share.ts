/**
 * Prepared social posts for a respondent's result.
 *
 * One source of words for the results page and the email, so they cannot drift
 * apart. The copy is deliberately about the respondent's own reflection rather
 * than a score to be admired, and it never states anything the respondent has
 * not been shown about themselves.
 *
 * Privacy: the shared link points at the assessment, never at a personal
 * result. Nothing identifying is put in a URL.
 */
import type { CompassResult } from '@/engine';

export const SHARE_URL = 'https://assessment.neogogy.ai';

export interface SharePost { network: 'linkedin' | 'facebook' | 'x' | 'instagram'; label: string; text: string }

/** Longer, reflective, suited to a professional feed. */
function longPost(r: CompassResult): string {
  return [
    `I took the Neogogy Formation Compass, a free assessment of how AI is shaping the way I think and work.`,
    ``,
    `It placed me at stage ${r.stage.stage} of 10 on its continuum, ${r.stage.stageName}, and described the pattern in my answers as ${r.archetype.name}.`,
    ``,
    `What made it worth the twelve minutes is that it does not only ask how much I use AI. It asks what happens to my own judgment and capability along the way, and it was uncomfortably specific about where mine is thin.`,
    ``,
    `If you work with AI daily, it is worth knowing where you stand.`,
    ``,
    SHARE_URL,
  ].join('\n');
}

/** Short, for a feed that rewards brevity. */
function shortPost(r: CompassResult): string {
  return `Stage ${r.stage.stage} of 10 on the Neogogy Formation Compass: ${r.stage.stageName}. A free assessment of how AI is shaping your judgment and capability, not just your output. ${SHARE_URL}`;
}

/** Caption style, since Instagram has no share URL and everything is pasted. */
function captionPost(r: CompassResult): string {
  return [
    `Stage ${r.stage.stage} of 10: ${r.stage.stageName}.`,
    ``,
    `I took a free assessment of how AI is shaping my thinking, not just my output. It reads across ten dimensions: whether I still check things, whether I could still do the work unaided, whether what I learn with AI actually stays with me.`,
    ``,
    `Worth twelve minutes if you use these tools every day.`,
    ``,
    `Link: ${SHARE_URL}`,
  ].join('\n');
}

export function sharePosts(r: CompassResult): SharePost[] {
  return [
    { network: 'linkedin', label: 'LinkedIn', text: longPost(r) },
    { network: 'facebook', label: 'Facebook', text: longPost(r) },
    { network: 'x', label: 'X', text: shortPost(r) },
    { network: 'instagram', label: 'Instagram', text: captionPost(r) },
  ];
}

/**
 * Where each button goes.
 *
 * LinkedIn and Facebook no longer accept prefilled text from a share URL, so
 * those open with the link only and the post is copied to the clipboard for
 * pasting. Saying so in the interface is better than silently losing the words.
 */
export function shareHref(network: SharePost['network'], text: string): string | null {
  const url = encodeURIComponent(SHARE_URL);
  switch (network) {
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case 'x': return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    case 'instagram': return null; // no web share endpoint exists
  }
}

/** True when the network drops prefilled text and the user must paste. */
export const needsPaste = (network: SharePost['network']) =>
  network === 'linkedin' || network === 'facebook' || network === 'instagram';

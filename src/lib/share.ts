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

/**
 * The Minister/Preacher posts.
 *
 * These say that the check was completed and, where the answers support it,
 * that the practice met the standard the check looks for. They never carry a
 * score, a stage, an archetype, or a dimension: what a preacher answered about
 * prayer and dependence is not material for a feed.
 *
 * The wording is careful on purpose. This instrument reads self-reported habits.
 * It can say a practice met a standard of responsible use; it cannot certify
 * that anyone's use of AI is safe, and it does not claim to.
 */
export interface PastorStanding {
  passed: boolean;
  label: string;
  detail: string;
}

const STANDARD = {
  verification: 55,
  agency: 55,
  responsibleUse: 55,
  dependencySafety: 45,
} as const;

/** Whether the reading meets the standard the check looks for. */
export function pastorStanding(r: CompassResult): PastorStanding {
  const meets = (Object.keys(STANDARD) as Array<keyof typeof STANDARD>)
    .every((k) => r.dimensions[k].score >= STANDARD[k]);
  const noHarm = !r.patterns.some((p) => p.kind === 'harm');
  const passed = meets && noHarm;
  return passed
    ? {
      passed: true,
      label: 'Responsible AI practice in ministry',
      detail: 'Your answers met the standard this check looks for: authorship kept, claims checked before the pulpit, care and confidences held in your own hands, and the capacity to prepare without the tools.',
    }
    : {
      passed: false,
      label: 'Completed',
      detail: 'You completed the check. One or more readings sit below the standard it looks for, which is a normal result and the reason the practices are there. You can share that you did the work without sharing what it found.',
    };
}

function pastorLong(r: CompassResult): string {
  const st = pastorStanding(r);
  return [
    st.passed
      ? `I completed the Preaching Formation Check, an advanced assessment of how AI is used in ministry preparation and preaching, and my practice met its standard for responsible use.`
      : `I completed the Preaching Formation Check, an advanced assessment of how AI is used in ministry preparation and preaching.`,
    ``,
    `It looks at forty questions across ten areas: whether the message is still received and owned by the preacher, whether what reaches the pulpit has been checked, whether pastoral care and confidences stay in human hands, and whether a preacher could still prepare without any tool at all.`,
    ``,
    `I am not posting my results. They are between me and the page. What I will say is that pastors using these tools should know where they stand, and that this took about twelve minutes.`,
    ``,
    SHARE_URL,
  ].join('\n');
}

function pastorShort(r: CompassResult): string {
  const st = pastorStanding(r);
  return st.passed
    ? `Completed the Preaching Formation Check and met its standard for responsible AI use in ministry. Forty questions on preparation, preaching, care, and formation. Results stay private. ${SHARE_URL}`
    : `Completed the Preaching Formation Check: forty questions on how AI is shaping preparation, preaching, care, and formation. Results stay private. ${SHARE_URL}`;
}

function pastorCaption(r: CompassResult): string {
  const st = pastorStanding(r);
  return [
    st.passed
      ? `Responsible AI practice in ministry: standard met.`
      : `Preaching Formation Check: completed.`,
    ``,
    `An advanced assessment of how AI is shaping preparation, preaching, pastoral care, and a preacher's own formation. Forty questions, ten areas, about twelve minutes.`,
    ``,
    `I am keeping the findings to myself. The point of taking it was not a score.`,
    ``,
    `Link: ${SHARE_URL}`,
  ].join('\n');
}

export function sharePosts(r: CompassResult): SharePost[] {
  if (r.persona === 'pastor') {
    return [
      { network: 'linkedin', label: 'LinkedIn', text: pastorLong(r) },
      { network: 'facebook', label: 'Facebook', text: pastorLong(r) },
      { network: 'x', label: 'X', text: pastorShort(r) },
      { network: 'instagram', label: 'Instagram', text: pastorCaption(r) },
    ];
  }
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

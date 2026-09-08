'use client';

/**
 * Item rendering primitives for the Human Advantage Assessment.
 *
 * Components never score. They render an Item from the engine's item model and
 * report the chosen raw value back. All scoring happens in src/engine.
 *
 * Presentation rules (Part E, Phase 2):
 * - claim and reverse items use the shared agree-style scale row.
 * - scenario, branch and outcome items use full-width anchored option cards.
 * - the outcome "not enough experience" option is a full option card of equal
 *   visual weight, never a skip link.
 */

import type { Item } from '@/engine/types';
import { SCALE_LABELS } from '@/items/shared';

export type Choice = { value: number; label: string };

/** value 0 on outcome items means "excluded from scoring", not "zero". */
export const OUTCOME_NA: Choice = { value: 0, label: 'Not enough experience to say' };

/** Band labels for B2. B2 is compared against the measured band ladder, so it is
 *  asked as a band prediction rather than on an agreement scale. */
export const BAND_CHOICES: Choice[] = [
  { value: 1, label: 'Near the start of the continuum' },
  { value: 2, label: 'Below the middle' },
  { value: 3, label: 'Around the middle' },
  { value: 4, label: 'Above the middle' },
  { value: 5, label: 'Near the far end' },
];

export const B1_CHOICES: Choice[] = [
  { value: 1, label: 'Not healthy' },
  { value: 2, label: 'Slightly healthy' },
  { value: 3, label: 'Somewhere in between' },
  { value: 4, label: 'Fairly healthy' },
  { value: 5, label: 'Very healthy' },
];

/**
 * A stable shuffle: the same respondent always sees the same order for an item,
 * and two respondents see different orders. Scoring reads the value, so order
 * never affects a result. It exists so that "the last option is the good one"
 * does not become a pattern people answer to.
 */
function shuffled<T>(list: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * An option that only makes sense after the one below it.
 *
 * Forty scenario options are written as a cumulative ladder, where each answer
 * takes the previous one as read: "I do that, and check twice when the cost of
 * being wrong is high." Shuffled, that can be presented first, referring to
 * nothing, and the respondent cannot tell whether choosing it also asserts the
 * behaviour it is built on.
 *
 * Detected rather than listed, so copy written in this shape later cannot
 * quietly reintroduce the problem.
 */
const buildsOnThePrevious = (label: string) => /^\s*I do that\b/i.test(label);

/**
 * Whether an item's options can be shown in any order.
 *
 * Shuffling exists so that display order cannot be read as a ranking. It can
 * only do that for options that stand on their own. A ladder already discloses
 * its own order in the words, so shuffling it hides nothing and costs sense.
 */
export const canShuffle = (item: Item): boolean =>
  item.type === 'scenario'
  && !!item.options?.length
  && !item.options.some((o) => buildsOnThePrevious(o.label));

/** The choices a given item offers, in display order. */
export function optionsFor(item: Item, seed?: string): Choice[] {
  if (item.options && item.options.length) {
    const choices = item.options.map((o) => ({ value: o.value, label: o.label }));
    // Scenarios are the only items whose options are behaviours rather than a
    // scale, so they are the only ones where display order could be read as a
    // ranking. A branch or an impact scale keeps its written order, and so does
    // a ladder, which cannot be reordered without breaking its own sentences.
    if (seed && canShuffle(item)) return shuffled(choices, `${seed}:${item.id}`);
    return choices;
  }
  const labels = SCALE_LABELS[item.scale ?? 'agreement'] ?? SCALE_LABELS.agreement;
  const base = labels.map((label, i) => ({ value: i + 1, label }));
  return item.type === 'outcome' ? [...base, OUTCOME_NA] : base;
}

/** Claims and reverses get the compact scale row; everything else gets cards. */
export function usesCards(item: Item): boolean {
  return item.type !== 'claim' && item.type !== 'reverse';
}

/** Keyboard digits that select an option, in the same order as the choices. */
export function keyForIndex(choice: Choice): string {
  return String(choice.value);
}

export function ScaleRow({
  choices, selected, onPick, labelledBy
}: {
  choices: Choice[]; selected: number | null; onPick: (v: number) => void;
  /** The question these answers belong to, so the group is announced with it. */
  labelledBy?: string;
}) {
  return (
    <div className="opts" role="radiogroup" aria-labelledby={labelledBy}>
      {choices.map((c, i) => (
        <button
          key={c.value}
          type="button"
          className={`opt ${selected === c.value ? 'sel' : ''}`}
          onClick={() => onPick(c.value)}
          role="radio"
          aria-checked={selected === c.value}
          aria-setsize={choices.length}
          aria-posinset={i + 1}
        >
          <span className="bub">{c.value}</span>
          <span className="otext">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

export function OptionCards({
  choices, selected, onPick, labelledBy
}: {
  choices: Choice[]; selected: number | null; onPick: (v: number) => void;
  labelledBy?: string;
}) {
  return (
    <div className="opts opts-cards" role="radiogroup" aria-labelledby={labelledBy}>
      {choices.map((c, i) => (
        <button
          key={c.value}
          type="button"
          className={`opt opt-card ${selected === c.value ? 'sel' : ''} ${c.value === 0 ? 'opt-na' : ''}`}
          onClick={() => onPick(c.value)}
          role="radio"
          aria-checked={selected === c.value}
          aria-setsize={choices.length}
          aria-posinset={i + 1}
        >
          <span className="bub">{c.value === 0 ? '0' : String.fromCharCode(65 + i)}</span>
          <span className="otext">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

/** One assessment screen. */
export function ItemScreen({
  item, choices, selected, onPick, header, note, scope
}: {
  item: Item;
  choices: Choice[];
  selected: number | null;
  onPick: (v: number) => void;
  header: string;
  note?: string;
  /** Business Owner only: whether this question is about the owner or the business. */
  scope?: 'owner' | 'business';
}) {
  const cards = usesCards(item);
  const stemId = `qstem-${item.id}`;
  return (
    <div className="qcard">
      {/* The question screen had no heading of any level, so a screen reader
          user arrived with nothing to orient on, and advancing announced
          nothing at all. The stem is the heading, and the live region says it
          again when the question changes. */}
      <div className="qnum">
        {header}
        {scope ? (
          <span className={`qscope qscope-${scope}`}>
            {scope === 'owner' ? 'About you as the owner' : 'About the business'}
          </span>
        ) : null}
      </div>
      <h1 className="qstem" id={stemId}>{item.prompt}</h1>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {header}. {item.prompt}
      </p>
      {item.context ? <p className="qcontext">{item.context}</p> : null}
      {item.why ? (
        <details className="qwhy">
          <summary>Why we ask this</summary>
          <p>{item.why}</p>
          {item.deeper ? <p className="qdeeper">Go deeper: {item.deeper}</p> : null}
        </details>
      ) : null}
      {note ? <div className="qnote">{note}</div> : (item.context ? null : <div style={{ height: 14 }} />)}
      {cards
        ? <OptionCards choices={choices} selected={selected} onPick={onPick} labelledBy={stemId} />
        : <ScaleRow choices={choices} selected={selected} onPick={onPick} labelledBy={stemId} />}
    </div>
  );
}

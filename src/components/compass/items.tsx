'use client';

/**
 * Item rendering primitives for Formation Compass v2.
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

/** The choices a given item offers, in display order. */
export function optionsFor(item: Item, seed?: string): Choice[] {
  if (item.options && item.options.length) {
    const choices = item.options.map((o) => ({ value: o.value, label: o.label }));
    // Scenarios are the only items whose options are behaviours rather than a
    // scale, so they are the only ones where display order could be read as a
    // ranking. A branch or an impact scale keeps its written order.
    if (item.type === 'scenario' && seed) return shuffled(choices, `${seed}:${item.id}`);
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
  choices, selected, onPick
}: { choices: Choice[]; selected: number | null; onPick: (v: number) => void }) {
  return (
    <div className="opts">
      {choices.map((c) => (
        <button
          key={c.value}
          type="button"
          className={`opt ${selected === c.value ? 'sel' : ''}`}
          onClick={() => onPick(c.value)}
          aria-pressed={selected === c.value}
        >
          <span className="bub">{c.value}</span>
          <span className="otext">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

export function OptionCards({
  choices, selected, onPick
}: { choices: Choice[]; selected: number | null; onPick: (v: number) => void }) {
  return (
    <div className="opts opts-cards">
      {choices.map((c, i) => (
        <button
          key={c.value}
          type="button"
          className={`opt opt-card ${selected === c.value ? 'sel' : ''} ${c.value === 0 ? 'opt-na' : ''}`}
          onClick={() => onPick(c.value)}
          aria-pressed={selected === c.value}
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
  item, choices, selected, onPick, header, note
}: {
  item: Item;
  choices: Choice[];
  selected: number | null;
  onPick: (v: number) => void;
  header: string;
  note?: string;
}) {
  const cards = usesCards(item);
  return (
    <div className="qcard">
      <div className="qnum">{header}</div>
      <div className="qstem">{item.prompt}</div>
      {item.context ? <p className="qcontext">{item.context}</p> : null}
      {note ? <div className="qnote">{note}</div> : (item.context ? null : <div style={{ height: 14 }} />)}
      {cards
        ? <OptionCards choices={choices} selected={selected} onPick={onPick} />
        : <ScaleRow choices={choices} selected={selected} onPick={onPick} />}
    </div>
  );
}

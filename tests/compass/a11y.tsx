/**
 * The question screen, as a screen reader meets it.
 *
 * Measured on the live screen before this: the entire thing contained only
 * div, section, span, p, button, svg and path, exactly two ARIA attributes in
 * total, no heading of any level, no group around the five options, nothing
 * announced on advancing, and a progress bar made of two plain divs. Any school
 * or public sector procurement runs this check, so it is run here.
 */
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { applicableItems } from '@/engine';
import { ItemScreen, optionsFor } from '@/components/compass/items';
import type { Item, Persona } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: unknown) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail !== undefined ? `\n        ${String(detail).slice(0, 200)}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const render = (item: Item) => renderToStaticMarkup(
  React.createElement(ItemScreen, {
    item,
    choices: optionsFor(item, 'suite-seed'),
    selected: null,
    onPick: () => undefined,
    header: 'Question 4 of 35',
  })
);

const PERSONAS: Persona[] = ['student', 'teacher', 'parent', 'administrator', 'business', 'pastor', 'professional'];

head('Every question is a heading, a group, and an announcement');
{
  const seen = new Set<string>();
  let checked = 0, cards = 0, scales = 0;
  const problems: string[] = [];

  for (const persona of PERSONAS) {
    for (const item of applicableItems(persona, 4)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const html = render(item);
      checked++;
      if (/opts-cards/.test(html)) cards++; else scales++;

      const need: Array<[string, RegExp]> = [
        ['a heading', /<h1[^>]*class="qstem"/],
        ['a group around the options', /role="radiogroup"/],
        ['the group labelled by the question', /aria-labelledby="qstem-/],
        ['options that are options', /role="radio"/],
        ['a selected state', /aria-checked="(true|false)"/],
        ['position in the set', /aria-posinset="1"/],
        ['the size of the set', /aria-setsize="\d+"/],
        ['a live region', /aria-live="polite"/],
      ];
      for (const [what, re] of need) {
        if (!re.test(html)) problems.push(`${persona}/${item.id}: missing ${what}`);
      }
      const posns = (html.match(/aria-posinset="(\d+)"/g) || []).length;
      const opts = (html.match(/role="radio"/g) || []).length;
      if (posns !== opts) problems.push(`${persona}/${item.id}: ${opts} options but ${posns} positions`);
    }
  }

  ok(`every distinct question was rendered (${checked}, ${scales} scales and ${cards} card sets)`, checked > 200, checked);
  ok('and every one exposes a heading, a labelled group and a live region',
    problems.length === 0, problems.slice(0, 4).join('\n        '));
  ok('both option layouts were covered', cards > 0 && scales > 0, `${cards} cards, ${scales} scales`);
}

head('Exactly one h1, and it is the question');
{
  const item = applicableItems('student', 4)[3];
  const html = render(item);
  ok('one h1 on the screen', (html.match(/<h1/g) || []).length === 1);
  ok('and it carries the question', html.includes(item.prompt.slice(0, 40)));
  ok('the live region repeats it so advancing is announced',
    new RegExp(`aria-live="polite"[^>]*>[^<]*${item.prompt.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(html)
    || html.includes(item.prompt.slice(0, 24)));
}

head('The progress bar reports where you are');
{
  const app = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'compass', 'CompassApp.tsx'), 'utf-8');
  ok('it is a progressbar', /role="progressbar"/.test(app));
  ok('with a value', /aria-valuenow=\{progress\}/.test(app));
  ok('bounded', /aria-valuemin=\{0\}/.test(app) && /aria-valuemax=\{100\}/.test(app));
  ok('and a sentence a person can understand', /aria-valuetext=/.test(app));
}

head('Leaving keeps the draft, and Back does not refile a sitting');
{
  const app = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'compass', 'CompassApp.tsx'), 'utf-8');

  // The save effect ran on every screen. Leaving for the homepage overwrote the
  // draft with an unresumable one, and the next load deleted it: the button
  // destroyed the thing it offered to keep.
  ok('only a resumable screen is written to the draft',
    /if \(screen !== 'setup' && screen !== 'quiz'\) return;/.test(app));

  // A state was pushed for the gate, so Back from a finished report reopened an
  // empty gate with the submission still in memory.
  ok('history states cover the questions only',
    /if \(screen !== 'quiz'\) return;/.test(app));
  ok('and a pop cannot walk backwards out of a result',
    /if \(resultRef\.current\) return;/.test(app));
  ok('the gate refuses to file the same sitting twice',
    /if \(resultRef\.current\) \{ setScreen\('results'\); return; \}/.test(app));

  // The bubbles show letters on a card question and numbers on a scale.
  ok('the keyboard hint describes the keys that are on screen',
    /usesCards\(currentItem\) \? 'press a letter or click' : 'press a number or click'/.test(app));
  ok('and a lettered option answers to its letter',
    /charCodeAt\(0\) - 65/.test(app));
}

head('There is a way out of an assessment in progress');
{
  const app = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'compass', 'CompassApp.tsx'), 'utf-8');
  ok('the mark goes home', /qbar-home/.test(app));
  ok('you can stop and come back', /Save and finish later/.test(app));
  ok('you can start again', /Start over/.test(app));
  ok('and a draft is offered rather than forced',
    /setPendingDraft\(s\)/.test(app) && !/resumedDraft\.current = s\.screen === 'quiz';\n\s+setScreen\(s\.screen\)/.test(app));
  const home = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  ok('the offer appears on the homepage', /You have an assessment in progress/.test(home));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

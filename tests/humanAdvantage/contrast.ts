/**
 * Colour a person can actually read.
 *
 * Measured before this: 48 text nodes on the report failed their contrast
 * requirement, the teal kicker at 2.92 against a 4.5 requirement, and four gold
 * labels on the homepage at 3.88. Any school or public sector procurement runs
 * this check, so it runs here on every release.
 *
 * The decorative tokens were not darkened. Borders, rules and fills are exempt
 * from the requirement and changing them would change the design, so there are
 * text-safe counterparts and this suite proves that text uses those.
 */
import fs from 'fs';
import path from 'path';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: unknown) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail !== undefined ? `\n        ${String(detail)}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const hex = (h: string): [number, number, number] => {
  let v = h.replace('#', '');
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number];
};
const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (r: [number, number, number]) => 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2]);
const ratio = (a: string, b: string) => {
  const [l1, l2] = [lum(hex(a)), lum(hex(b))];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

/** Every ground the product paints text on. */
const LIGHT = ['#FFFFFF', '#EFE7D9', '#F7F0E6', '#F2E8DC'];
const DARK = ['#690F0D', '#26201C', '#141210', '#4A0A08'];
const AA = 4.5;

const css = ['humanAdvantage.css', 'home.css', 'globals.css']
  .map((f) => fs.readFileSync(path.join(process.cwd(), 'src', 'app', f), 'utf-8')).join('\n');

const vars: Record<string, string> = {};
for (const m of css.matchAll(/(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,6})\s*;/g)) vars[m[1]] = m[2];

/**
 * The admin dashboard declares its palette twice, once light and once dark, and
 * a token is only readable against the ground declared beside it. Each block is
 * measured against its own `--admin-bg` rather than guessed at from the colour.
 */
const themedBlocks: Array<{ ground: string; tokens: Record<string, string> }> = [];
for (const block of css.split('}')) {
  const ground = block.match(/--admin-bg:\s*(#[0-9A-Fa-f]{3,6})/)?.[1];
  if (!ground) continue;
  const tokens: Record<string, string> = {};
  for (const m of block.matchAll(/(--admin-[a-z-]+):\s*(#[0-9A-Fa-f]{3,6})/g)) tokens[m[1]] = m[2];
  themedBlocks.push({ ground, tokens });
}

head('Every colour used for text is readable on the ground it sits on');
{
  const used = new Set<string>();
  for (const m of css.matchAll(/color:\s*var\((--[a-z0-9-]+)\)/g)) used.add(m[1]);
  ok('text tokens were found to check', used.size >= 8, `${used.size}`);

  const themed = new Set(themedBlocks.flatMap((b) => Object.keys(b.tokens)));
  const failures: string[] = [];
  for (const token of [...used].sort()) {
    const value = vars[token];
    if (!value) continue;
    // Checked below, against the ground declared with it.
    if (themed.has(token)) continue;
    // A light token is light on dark by construction; it is checked against the
    // dark grounds rather than pretending it sits on paper.
    const onDark = lum(hex(value)) > 0.5;
    const grounds = onDark ? DARK : LIGHT;
    const worst = Math.min(...grounds.map((g) => ratio(value, g)));
    if (worst < AA) failures.push(`${token} ${value} worst ${worst.toFixed(2)} on ${onDark ? 'dark' : 'light'}`);
  }
  ok(`every one clears ${AA} to 1`, failures.length === 0, failures.join('\n        '));
}

head('The admin palette is readable in both of its themes');
{
  ok('both themes were found', themedBlocks.length === 2, `${themedBlocks.length}`);
  const failures: string[] = [];
  for (const { ground, tokens } of themedBlocks) {
    for (const [token, value] of Object.entries(tokens)) {
      if (/-bg|-card|-subcard|-line|-button-text/.test(token)) continue;
      const r = ratio(value, ground);
      if (r < AA) failures.push(`${token} ${value} on ${ground} is ${r.toFixed(2)}`);
    }
  }
  ok('every admin text colour clears 4.5 against its own ground',
    failures.length === 0, failures.join('\n        '));
}

head('The seven edition accents are readable too');
{
  const home = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  const block = home.slice(home.indexOf('const ACCENT'), home.indexOf('function scrollTo'));
  const accents = [...block.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2]] as const);
  ok('all seven were found', accents.length === 7, `${accents.length}`);
  const bad = accents.filter(([, v]) => Math.min(...LIGHT.map((g) => ratio(v, g))) < AA);
  ok('and each one is readable as text',
    bad.length === 0, bad.map(([k, v]) => `${k} ${v}`).join(', '));
}

head('The decorative tokens were left alone');
{
  // The point of the text-safe counterparts is that the design keeps its
  // lighter golds for rules and fills. If these ever match, somebody has
  // darkened the design instead of fixing the text.
  ok('gold still differs from its text counterpart', vars['--gold'] !== vars['--gold-text']);
  ok('and the report teal does too', vars['--asc-teal'] !== vars['--asc-teal-text']);
  ok('the light golds are still used for borders and fills',
    /border[^;]*var\(--gold-soft\)|background:\s*var\(--gold-soft\)/.test(css));
}

head('No real interface text is set below ten pixels');
{
  // The faux report cover on the homepage is aria-hidden decoration and is
  // exempt: it is a picture of a report, not text anybody reads.
  const DECORATIVE = /^\.nfc \.(rp-|pc-eyebrow|pc-il-lab|gv-tag)/;
  const tiny: string[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^}]*font-size:\s*([0-9.]+)px[^}]*)\}/g)) {
    const size = Number(m[3]);
    if (size >= 10) continue;
    const selector = m[1].trim().split('\n').pop()!.trim();
    if (DECORATIVE.test(selector)) continue;
    tiny.push(`${selector} at ${size}px`);
  }
  ok('nothing a reader must read is under ten pixels', tiny.length === 0, tiny.join('\n        '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

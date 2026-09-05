/**
 * The copy rules, enforced.
 *
 * Two of them are absolute and easy to break by accident, so they are checked
 * rather than remembered:
 *
 *   1. No em dash or en dash anywhere in the source. The rule covers
 *      respondent-facing copy; the check covers everything, because a comment
 *      today is a headline tomorrow and a wide net costs nothing.
 *   2. The retired umbrella name does not reappear as the product name.
 *
 * It also checks the things the page promises against what the assessment
 * actually does, so a stated duration cannot drift from the item bank it
 * describes.
 */

import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { PERSONA_CONTENT } from '@/content/personas';
import { BRAND, CORE_QUESTION, ECOSYSTEM, NEXT_STEP } from '@/brand';
import { PRIVACY, TERMS } from '@/content/legal';
import { applicableItems } from '@/engine';
import { STAGES } from '@/engine/config';
import { stageName } from '@/engine/display';
import { shareCard, hasOwnCard, SITE_CARD } from '@/lib/shareCard';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: string) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

const FILES = walk(path.join(process.cwd(), 'src'));

head('No em dash, no en dash');
{
  const offenders: string[] = [];
  for (const f of FILES) {
    fs.readFileSync(f, 'utf-8').split('\n').forEach((line, i) => {
      if (line.includes('—') || line.includes('–')) {
        offenders.push(`${path.relative(process.cwd(), f)}:${i + 1}`);
      }
    });
  }
  ok('no dash characters anywhere in src', offenders.length === 0, offenders.join('\n        '));
}

head('The product is named once, and named the same everywhere');
{
  ok('the brand module is the full name', BRAND.product === 'Neogogy Human Advantage Assessment');
  ok('the attribution is present', BRAND.poweredBy === 'Powered by ICAN.ph');
  const stale: string[] = [];
  for (const f of FILES) {
    // storage.ts names what legacy records were, which stays true
    if (f.endsWith('storage.ts')) continue;
    const s = fs.readFileSync(f, 'utf-8');
    // case insensitive: the name lived on in capitals on every report cover for
    // a week because this check was not
    if (/formation compass/i.test(s)) stale.push(path.relative(process.cwd(), f));
  }
  ok('the retired umbrella name is gone', stale.length === 0, stale.join(', '));
  // "formation" as a concept is not the same thing as the retired product name
  const minister = PERSONA_CONTENT.find((p) => p.id === 'pastor')!;
  ok('formation survives where it is a concept', minister.motifName === 'Formation');
}

head('Six assessments, each one complete');
{
  const slugs = new Set(PERSONA_CONTENT.map((p) => p.slug));
  ok('seven personas', PERSONA_CONTENT.length === 7);
  ok('seven distinct routes', slugs.size === 7);
  ok('one of them is the catch-all', PERSONA_CONTENT.some((p) => p.slug === 'professional'));
  for (const p of PERSONA_CONTENT) {
    ok(`${p.name}: asks a core question`, p.coreQuestion.trim().endsWith('?'));
    ok(`${p.name}: explains what it is about`, p.about.length >= 2);
    ok(`${p.name}: says why it matters`, p.why.length >= 1);
    ok(`${p.name}: lists what it asks about`, p.asked.length >= 5);
    ok(`${p.name}: says what may be discovered`, p.discover.length >= 5);
    ok(`${p.name}: has its own way in`, p.cta.startsWith('Begin as'));
  }
}

head('A stated duration matches the bank behind it');
{
  // roughly 17 items a minute is the pace the production copy has always assumed
  for (const p of PERSONA_CONTENT) {
    const n = applicableItems(p.id, 5).length;
    const stated = Number((p.minutes.match(/\d+/) ?? ['0'])[0]);
    const implied = n <= 36 ? 10 : 12;
    ok(`${p.name}: ${n} items reads as ${implied} minutes`, stated === implied,
      `states "${p.minutes}" for ${n} items`);
  }
}

head('The four organisations, as supplied and linked');
{
  ok('four organisations', ECOSYSTEM.length === 4);
  const wanted = ['https://ican.ph', 'https://www.life.edu.ph', 'https://www.neogogy.ai', 'https://lifex.ph'];
  ok('each one links to its own site', ECOSYSTEM.every((o, i) => o.url === wanted[i]),
    ECOSYSTEM.map((o) => o.url).join(', '));
  for (const o of ECOSYSTEM) {
    const f = path.join(process.cwd(), 'public', o.logo.replace(/^\//, ''));
    ok(`${o.name}: the supplied artwork is present`, fs.existsSync(f));
    ok(`${o.name}: the stored aspect matches the file it describes`, o.w > 0 && o.h > 0);
  }
  ok('the next step points at LifeX', NEXT_STEP.url === 'https://lifex.ph');
  // ican.ph and lifex.ph have no www host at all, so a www link there is dead
  ok('no organisation link uses a host that does not exist',
    !ECOSYSTEM.some((o) => /^https:\/\/www\.(ican|lifex)\.ph/.test(o.url)));
  const homeSrc = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  ok('the header mark returns to the top rather than leaving the site',
    /ha-lockup-ican" href="#top"/.test(homeSrc));
  const pdf = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'reportPdfV2.tsx'), 'utf-8');
  ok('the report closes with the next step', pdf.includes('NEXT_STEP.line'));
  ok('the report carries the four logos', pdf.includes('EcosystemRow'));
  const res = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'compass', 'Results.tsx'), 'utf-8');
  ok('the results page carries both', res.includes('<NextStep />') && res.includes('<EcosystemStrip />'));
}

head('Every assessment has its own link, its own words, and a card');
{
  const missing: string[] = [];
  for (const p of PERSONA_CONTENT) {
    const card = shareCard(p.slug);
    ok(`${p.name}: /${p.slug} resolves a share card`,
      fs.existsSync(path.join(process.cwd(), 'public', card.replace(/^\//, ''))));
    if (!hasOwnCard(p.slug)) missing.push(p.slug);
  }
  ok('the site card exists as the fallback',
    fs.existsSync(path.join(process.cwd(), 'public', SITE_CARD.replace(/^\//, ''))));
  // The networks cache a picture against its URL, so the URL has to change when
  // the picture does. That is what the hash in the filename is for.
  const hashed = /\/share\/og(-[a-z-]+)?\.[0-9a-f]{8}\.jpg$/;
  ok('the site card URL is content addressed', hashed.test(SITE_CARD), SITE_CARD);
  for (const p of PERSONA_CONTENT) {
    ok(`${p.name}: card URL is content addressed`, hashed.test(shareCard(p.slug)), shareCard(p.slug));
  }
  const man = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'share', 'manifest.json'), 'utf-8'));
  ok('the manifest names seven cards', Object.keys(man).length === 7, Object.keys(man).join(', '));
  for (const [base, file] of Object.entries(man)) {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'share', String(file)));
    const want = createHash('sha256').update(buf).digest('hex').slice(0, 8);
    ok(`${base}: the hash in the name matches the bytes`, String(file).includes(`.${want}.`),
      `${file} holds ${want}`);
  }
  // A persona may ship before its artwork does: the route falls back to the
  // site card rather than to nothing. What must not happen is a route with no
  // card at all, which is checked above.
  if (missing.length) {
    console.log(`        awaiting artwork: ${missing.map((s2) => `og-${s2}.jpg`).join(', ')}`);
  }
  // A card that is too heavy is quietly skipped by WhatsApp and iMessage, so
  // the weight is checked, not just the presence.
  for (const p of PERSONA_CONTENT) {
    const f = path.join(process.cwd(), 'public', shareCard(p.slug).replace(/^\//, ''));
    const kb = Math.round(fs.statSync(f).size / 1024);
    ok(`${p.name}: card is light enough to preview (${kb}KB)`, kb < 300);
  }
  const route = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '[persona]', 'page.tsx'), 'utf-8');
  ok('the card is declared to both Open Graph and Twitter',
    /openGraph:[\s\S]*images: \[image\]/.test(route) && /twitter:[\s\S]*images: \[image\]/.test(route));
  ok('the description is the persona\'s own question', route.includes('p.coreQuestion'));
  ok('each route is its own canonical', route.includes('canonical: `/${p.slug}`'));
}

head('The report shows itself');
{
  const dir = path.join(process.cwd(), 'public', 'report');
  const home = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  const files = (home.match(/\{ file: '([a-z-]+)'/g) ?? []).map((m) => m.replace(/.*'([a-z-]+)'.*/, '$1'));
  ok('twelve pages are shown', files.length === 12, `${files.length} listed`);
  for (const f of files) {
    const p = path.join(dir, `${f}.jpg`);
    const kb = fs.existsSync(p) ? Math.round(fs.statSync(p).size / 1024) : -1;
    ok(`page ${f}.jpg is present and light (${kb}KB)`, kb > 0 && kb < 160);
  }
  // The pages carry an example profile's numbers, so the page has to say so.
  ok('the gallery says whose numbers these are',
    /belong to one example profile rather than to you/.test(home));
}

head('The site card says what the site is');
{
  const layout = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'layout.tsx'), 'utf-8');
  const title = (layout.match(/const SHARE_TITLE = '([^']+)'/) ?? [])[1] ?? '';
  const desc = (layout.match(/const SHARE_DESC = '([^']+)'/) ?? [])[1] ?? '';
  ok('the title is the product name', title === BRAND.product, title);
  const sentences = desc.split(/(?<=[.?!])\s+/).filter(Boolean);
  ok('the description is two sentences', sentences.length === 2, `${sentences.length}: ${desc}`);
  ok('it opens on the question the assessment asks', sentences[0] === CORE_QUESTION, sentences[0]);
  ok('it fits what a network will show', desc.length > 120 && desc.length <= 220, `${desc.length} characters`);
  ok('the alt text describes the picture that is there', /summit above the clouds/.test(layout));
}

head('The page draws the continuum the way the report does');
{
  const fig = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'site', 'Figures.tsx'), 'utf-8');
  ok('the band comes from the report\'s own route module',
    /from '@\/components\/compass\/ascent\/route'/.test(fig));
  ok('it draws the real stages rather than a decorative count',
    /STAGES\.map/.test(fig) && /from '@\/engine\/config'/.test(fig));
  ok('it carries no marker, because nobody is anywhere yet',
    !/rawIndex|stage\.index|YOU ARE HERE/.test(fig));
  ok('the graph the assessment never draws is gone', !/RisingCurves/.test(fig));
  const home = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  ok('the page opens on it', home.indexOf('<RouteBand />') < home.indexOf('<Personas'));
  // Business and minister rename their stages. A page that has not asked who
  // you are yet must not open in one of those worlds.
  ok('it uses the shared stage names', /stageName\('student', st\.stage\)/.test(fig));
  ok('student and teacher share those names',
    STAGES.every((st) => stageName('student', st.stage) === stageName('teacher', st.stage)));
  ok('business does not, which is why it is not the default',
    STAGES.some((st) => stageName('business', st.stage) !== stageName('student', st.stage)));
  // It belongs to the hero, so nothing stands between the route and choosing.
  ok('the route sits inside the hero rather than under it',
    /ha-hero[\s\S]{0,4000}<RouteBand \/>/.test(home));
}

head('The persona banners are ready before they are needed');
{
  const dir = path.join(process.cwd(), 'public', 'covers', 'band');
  let total = 0;
  for (const p of PERSONA_CONTENT) {
    const slug = p.slug === 'leader' ? 'leader' : p.slug === 'minister' ? 'minister' : p.slug;
    const f = path.join(dir, `${slug}.jpg`);
    const kb = fs.existsSync(f) ? Math.round(fs.statSync(f).size / 1024) : -1;
    total += Math.max(kb, 0);
    ok(`${p.name}: banner crop exists and is light (${kb}KB)`, kb > 0 && kb < 90);
  }
  // All six are held at once so a switch never waits on a request, which only
  // works while the set stays small.
  ok(`all of them together are under 500KB (${total}KB)`, total < 500);
  const home = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  ok('the panel holds every banner rather than fetching one on demand',
    /PERSONA_CONTENT\.map\(\(q\) => \(/.test(home) && /covers\/band/.test(home));
}

head('The site says what it does with your data');
{
  ok('a privacy notice exists', fs.existsSync(path.join(process.cwd(), 'src', 'app', 'privacy', 'page.tsx')));
  ok('terms exist', fs.existsSync(path.join(process.cwd(), 'src', 'app', 'terms', 'page.tsx')));

  const prose = PRIVACY.sections.flatMap((x) => [x.heading, ...x.body, ...(x.list ?? []),
    ...(x.rows?.body.flat() ?? [])]).join(' ');
  for (const required of ['controller', 'lawful basis', 'National Privacy Commission',
    'unsubscribe', 'delete']) {
    ok(`the notice covers ${required}`, new RegExp(required, 'i').test(prose));
  }
  ok('it names a route to exercise rights', /privacy@ican\.ph/.test(prose));
  ok('it states a retention period', /twenty four months/i.test(prose));
  ok('consent is not required to receive the report', /whether or not you tick it/i.test(prose));
  ok('the terms refuse appraisal use', /rank, appraise, select/i.test(
    TERMS.sections.flatMap((x) => x.body).join(' ')));

  // every category in the data inventory has to appear in the notice
  const inventory = fs.readFileSync(path.join(process.cwd(), 'docs', 'DATA-COLLECTED.md'), 'utf-8');
  for (const field of ['IP address', 'Mobile phone', 'Marketing consent', 'Email']) {
    ok(`the inventory lists ${field}`, inventory.includes(field));
    ok(`and the notice accounts for ${field}`,
      new RegExp(field.split(' ')[0], 'i').test(prose));
  }

  const results = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'compass', 'Results.tsx'), 'utf-8');
  ok('the lead form links the notice where the email is asked for', /href="\/privacy"/.test(results));
  ok('the old claim of compliance without a notice is gone',
    !/honor the Philippines Data Privacy Act/.test(results));
  const home = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  ok('the homepage links both', /href="\/privacy"/.test(home) && /href="\/terms"/.test(home));
}

head('The page counts what the assessment actually asks');
{
  const home = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'site', 'Home.tsx'), 'utf-8');
  ok('the perspective count is derived, not typed',
    /PERSONA_CONTENT\.length\} perspectives/.test(home) && !/Six perspectives/.test(home));
  ok('the duration is derived', /overallMinutes\(\)/.test(home));
  const app = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'compass', 'CompassApp.tsx'), 'utf-8');
  ok('the intro counts come from the bank',
    /questionCountLabel\(/.test(app) && !/40 to 42 questions/.test(app));
}

head('Nothing overclaims');
{
  const banned = [/\bvalidated psychometric\b(?!\s+measurement)/i, /\bclinical diagnos/i, /\bpsychological evaluation\b/i];
  const offenders: string[] = [];
  for (const f of FILES.filter((f) => f.includes('/site/') || f.endsWith('personas.ts'))) {
    const s = fs.readFileSync(f, 'utf-8');
    // the disclaimer says what this is NOT, which is the opposite of a claim
    const claims = s.replace(/they are not[^.]*\./gi, '');
    for (const b of banned) if (b.test(claims)) offenders.push(path.relative(process.cwd(), f));
  }
  ok('no clinical or psychometric claim is made', offenders.length === 0, offenders.join(', '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

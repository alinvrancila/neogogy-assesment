/**
 * The report link, held closed (audit item B3).
 *
 * The privacy notice describes this mechanism to respondents in plain words, so
 * every promise it makes is checked here against what the code actually does:
 * the address cannot be guessed, it lives exactly as long as the record, a new
 * one closes the old one, the send goes only to the address on file, and the
 * token reaches neither an export, nor an event, nor a log line.
 *
 * Storage is exercised for real. The suite runs in a temporary working
 * directory so the local JSON fallback writes there and never touches data/.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  mintReportToken, isWellFormedToken, tokensMatch, expiresAt, isLive,
  daysRemaining, redactToken, maskEmail, reportPath, reportUrl,
  TOKEN_LENGTH, RETENTION_MONTHS, REPORT_PREFIX,
} from '@/lib/reportLink';
import { compute, applicableItems } from '@/engine';
import type { Item, Persona, Submission } from '@/engine/types';

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail?: unknown) => {
  if (cond) { pass++; console.log(`  ok    ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail !== undefined ? `\n        ${String(detail)}` : ''}`); }
};
const head = (s: string) => console.log(`\n${s}`);

const ROOT = process.cwd();
/** The one sentence every refusal uses, so a caller learns nothing from which
 *  refusal it got. */
const CLOSED_WORDS = 'This link is not active. Use the most recent link you were sent.';
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf-8');

const top = (it: Item) => (it.options?.length ? Math.max(...it.options.map((o) => o.value)) : 5);
const build = (persona: Persona, usage: number, level: number): Submission => {
  const answers: Record<string, number> = {};
  applicableItems(persona, usage).forEach((it) => {
    const t = top(it);
    const h = Math.max(1, Math.min(t, Math.round(((level - 1) / 4) * (t - 1)) + 1));
    answers[it.id] = it.type === 'reverse' ? t + 1 - h : h;
  });
  return { persona, usage, b1: 3, b2: 3, answers };
};

async function main() {
  head('The address cannot be guessed');
  {
    const a = mintReportToken();
    ok('a token is the full length', a.length === TOKEN_LENGTH, a.length);
    ok('and is url safe', /^[A-Za-z0-9_-]+$/.test(a), a);

    const many = new Set(Array.from({ length: 5000 }, () => mintReportToken()));
    ok('five thousand tokens are five thousand different tokens', many.size === 5000, many.size);

    ok('a short string is not a token', !isWellFormedToken('abc'));
    ok('a long string is not a token', !isWellFormedToken('a'.repeat(TOKEN_LENGTH + 1)));
    ok('a path is not a token', !isWellFormedToken('../../etc/passwd'));
    ok('a query string is not a token', !isWellFormedToken(`${'a'.repeat(40)}?x=1`));
    ok('nothing is not a token', !isWellFormedToken(undefined) && !isWellFormedToken(null));
    ok('a real token is a token', isWellFormedToken(a));

    ok('a token matches itself', tokensMatch(a, a));
    ok('and matches nothing else', !tokensMatch(a, mintReportToken()));
    ok('and is not matched by a prefix of itself', !tokensMatch(a, a.slice(0, -1)));
    ok('and is never matched by undefined', !tokensMatch(undefined, undefined));
  }

  head('The link lives exactly as long as the record');
  {
    const from = '2026-09-06T10:00:00.000Z';
    const ends = expiresAt(from);
    ok(`it ends ${RETENTION_MONTHS} months later`,
      ends.toISOString() === '2028-09-06T10:00:00.000Z', ends.toISOString());

    // A month that has no such day must not roll forward into the next one.
    ok('a leap day expires in February, not in March',
      expiresAt('2024-02-29T00:00:00.000Z').toISOString().slice(0, 10) === '2026-02-28',
      expiresAt('2024-02-29T00:00:00.000Z').toISOString());
    ok('the end of a long month survives',
      expiresAt('2026-08-31T00:00:00.000Z').toISOString().slice(0, 10) === '2028-08-31');

    ok('a link is live the day before it ends',
      isLive(from, new Date('2028-09-05T10:00:00.000Z')));
    ok('and is closed the day after',
      !isLive(from, new Date('2028-09-07T10:00:00.000Z')));
    ok('and is closed on the instant itself',
      !isLive(from, new Date('2028-09-06T10:00:00.000Z')));
    ok('a record with no date has no live link', !isLive(undefined));
    ok('and neither does a broken one', !isLive('not a date'));

    ok('the days left are counted, not guessed',
      daysRemaining(from, new Date('2028-09-01T10:00:00.000Z')) === 5,
      daysRemaining(from, new Date('2028-09-01T10:00:00.000Z')));
    ok('an expired link has no days left',
      daysRemaining(from, new Date('2030-01-01T00:00:00.000Z')) === 0);
  }

  head('The token is stripped before anything is written down');
  {
    const t = mintReportToken();
    ok('a report path is redacted',
      redactToken(`${REPORT_PREFIX}/${t}`) === `${REPORT_PREFIX}/[token]`,
      redactToken(`${REPORT_PREFIX}/${t}`));
    ok('a whole address is redacted',
      !redactToken(reportUrl(t)).includes(t), redactToken(reportUrl(t)));
    ok('a sentence containing one is redacted',
      !redactToken(`failed to open ${reportPath(t)} for user`).includes(t));
    ok('ordinary text is left alone',
      redactToken('/privacy and /terms') === '/privacy and /terms');
    ok('nothing survives as nothing', redactToken(undefined) === undefined);

    ok('an address is shown back without being shown',
      maskEmail('respondent@example.com') === 'r********t@example.com',
      maskEmail('respondent@example.com'));
    ok('a very short name is still covered',
      !maskEmail('ab@example.com').startsWith('ab'), maskEmail('ab@example.com'));
    ok('something that is not an address does not crash',
      maskEmail('nonsense') === 'the address on your record');
  }

  /* ------------------------------------------------------------- storage */

  head('The record answers to its token and to nothing else');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'neogogy-b3-'));
  process.chdir(tmp);
  try {
    // Imported after the move, because the local fallback binds its directory
    // when the module first loads.
    const storage = await import('@/lib/storage');
    const history = await import('@/lib/history');

    const result = compute(build('student', 4, 4));
    const tokenA = mintReportToken();
    const lead = {
      id: 'lead-a', name: 'A Respondent', firstName: 'A', lastName: 'Respondent',
      email: 'Reader@Example.com', role: 'student', modality: '', consent: true,
      persona: result.archetype.id, personaName: result.archetype.name,
      overall: result.stage.rawIndex, createdAt: '2026-09-01T09:00:00.000Z',
      engineVersion: 2, result, stage: result.stage.stage, stageName: result.stage.stageName,
      archetypeId: result.archetype.id, archetypeName: result.archetype.name,
      answers: build('student', 4, 4).answers, usageVal: 4,
      reportToken: tokenA, reportTokenIssuedAt: '2026-09-01T09:00:00.000Z',
    } as any;
    await storage.saveLead(lead);

    const found = await storage.getLeadByReportToken(tokenA);
    ok('the right token finds the record', found?.id === 'lead-a', found?.id);

    ok('a different token finds nothing',
      (await storage.getLeadByReportToken(mintReportToken())) === null);
    ok('an empty token finds nothing',
      (await storage.getLeadByReportToken('')) === null);
    ok('a token that is one character short finds nothing',
      (await storage.getLeadByReportToken(tokenA.slice(0, -1))) === null);

    head('A new link closes the old one');
    {
      const tokenB = mintReportToken();
      await storage.saveLead({ ...lead, reportToken: tokenB, reportTokenIssuedAt: new Date().toISOString() });
      ok('the new token opens the report',
        (await storage.getLeadByReportToken(tokenB))?.id === 'lead-a');
      ok('and the old token stops working',
        (await storage.getLeadByReportToken(tokenA)) === null);
      ok('and the record was replaced rather than duplicated',
        (await storage.listLeads()).filter((l: any) => l.id === 'lead-a').length === 1);
      // put it back so the rest of the suite reads a known value
      await storage.saveLead(lead);
    }

    head('Retention runs from the last sitting, not from this one');
    {
      const later = { ...lead, id: 'lead-b', createdAt: '2027-03-01T09:00:00.000Z', reportToken: mintReportToken() };
      await storage.saveLead(later);

      const last = await storage.lastCompletedAtForEmail('reader@example.com');
      ok('the most recent sitting is the one that counts',
        last === '2027-03-01T09:00:00.000Z', last);
      ok('the address is matched however it was typed',
        (await storage.lastCompletedAtForEmail('READER@EXAMPLE.COM')) === last);
      ok('an unknown address has no sitting',
        (await storage.lastCompletedAtForEmail('nobody@example.com')) === null);

      ok('so the first report outlives its own twenty four months',
        isLive(last, new Date('2029-01-01T00:00:00.000Z')),
        'a later sitting must carry the earlier link with it');
      ok('and both go once that period runs out',
        !isLive(last, new Date('2029-04-01T00:00:00.000Z')));
    }

    head('One decision about whether a link is open');
    {
      const { accessByToken, resetThrottles } = await import('@/lib/reportLinkAccess');
      resetThrottles();

      const open = await accessByToken(tokenA);
      ok('a live token opens', open.ok === true);
      ok('and retention is dated from the latest sitting, not from this record',
        open.ok && open.lastCompletedAt === '2027-03-01T09:00:00.000Z',
        open.ok ? open.lastCompletedAt : 'refused');
      ok('which is later than the record this link belongs to',
        open.ok && open.lastCompletedAt > '2026-09-01T09:00:00.000Z');

      const forged = await accessByToken(mintReportToken());
      ok('a forged token is refused', forged.ok === false);
      const malformed = await accessByToken('nope');
      ok('a malformed token is refused', malformed.ok === false);
      ok('and both are refused identically',
        !forged.ok && !malformed.ok && forged.error === malformed.error
        && forged.status === malformed.status);
    }

    head('An expired link is refused, and no caller has to remember to ask');
    {
      const { accessByToken, resetThrottles } = await import('@/lib/reportLinkAccess');
      resetThrottles();

      // One person, one sitting, long ago. Nothing else of theirs exists, so
      // retention runs out and the link goes with the record.
      const oldToken = mintReportToken();
      await storage.saveLead({
        ...lead, id: 'lead-expired', email: 'gone@example.com',
        createdAt: '2020-01-01T00:00:00.000Z', reportToken: oldToken,
      });
      const expired = await accessByToken(oldToken);
      ok('a link past twenty four months is refused', expired.ok === false);
      ok('and is refused in the same words as an unknown one',
        !expired.ok && expired.error === CLOSED_WORDS, !expired.ok ? expired.error : '');

      // The same record, brought back inside retention by a later sitting.
      await storage.saveLead({
        ...lead, id: 'lead-expired-2', email: 'gone@example.com',
        createdAt: new Date().toISOString(), reportToken: mintReportToken(),
      });
      const revived = await accessByToken(oldToken);
      ok('and taking it again brings the earlier link back with it', revived.ok === true);
      resetThrottles();
    }

    head('Guessing is counted, and reading your own report is not');
    {
      const { accessByToken, resetThrottles, MISS_LIMIT } = await import('@/lib/reportLinkAccess');
      resetThrottles();

      const guesser = '203.0.113.9';
      for (let i = 0; i < MISS_LIMIT; i++) await accessByToken(mintReportToken(), guesser);
      const nextMiss = await accessByToken(mintReportToken(), guesser);
      ok('a caller that keeps missing is stopped',
        !nextMiss.ok && nextMiss.status === 429, !nextMiss.ok ? nextMiss.status : 'opened');
      ok('and is not told that a link is dead, which would not be true',
        !nextMiss.ok && nextMiss.error !== CLOSED_WORDS);

      const other = '198.51.100.4';
      ok('another address is unaffected',
        (await accessByToken(tokenA, other)).ok === true);

      resetThrottles();
      const reader = '198.51.100.7';
      for (let i = 0; i < MISS_LIMIT * 3; i++) {
        const open = await accessByToken(tokenA, reader);
        if (!open.ok) { ok('opening your own report never spends the budget', false, `stopped at ${i}`); break; }
        if (i === MISS_LIMIT * 3 - 1) ok('opening your own report never spends the budget', true);
      }
      resetThrottles();
    }

    head('Get a new link, driven through the route itself');
    {
      const { resetThrottles } = await import('@/lib/reportLinkAccess');
      const { POST: rotate } = await import('@/app/api/report-link/rotate/route');
      resetThrottles();

      const before = mintReportToken();
      await storage.saveLead({ ...lead, id: 'lead-rot', email: 'rot@example.com', reportToken: before });

      const res = await rotate(new Request('http://localhost/api/report-link/rotate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: before }),
      }) as never);
      const payload = await res.json() as { path?: string };
      ok('the route answers with a new address', res.status === 200 && !!payload.path, res.status);

      const after = String(payload.path).replace(`${REPORT_PREFIX}/`, '');
      ok('which is not the old one', after !== before);
      ok('and is a well formed token', isWellFormedToken(after));
      ok('the new address opens the record',
        (await storage.getLeadByReportToken(after))?.id === 'lead-rot');
      ok('and the old address stops working',
        (await storage.getLeadByReportToken(before)) === null,
        'the previous link still opens the report');
      ok('and the record was not duplicated',
        (await storage.listLeads()).filter((l: any) => l.id === 'lead-rot').length === 1);

      const replay = await rotate(new Request('http://localhost/api/report-link/rotate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: before }),
      }) as never);
      ok('and rotating the closed link is refused', replay.status === 404, replay.status);

      // Erased between the lookup and the write. Rotating must not write it back.
      const doomed = mintReportToken();
      await storage.saveLead({ ...lead, id: 'lead-doomed', email: 'doomed@example.com', reportToken: doomed });
      const access = await (await import('@/lib/reportLinkAccess')).accessByToken(doomed);
      ok('the doomed record opens first', access.ok === true);
      await storage.deleteLead('lead-doomed');
      const afterErasure = await rotate(new Request('http://localhost/api/report-link/rotate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: doomed }),
      }) as never);
      ok('a record erased mid request is not written back by rotating',
        (await storage.listLeads()).every((l: any) => l.id !== 'lead-doomed'),
        'an erasure request was undone by a button press');
      ok('and the caller is told the link is closed', afterErasure.status === 404, afterErasure.status);
      resetThrottles();
    }

    head('A submission is given an address, and is never given a dead one');
    {
      const { POST: submit } = await import('@/app/api/submit/route');
      const answers: Record<string, number> = {};
      applicableItems('student', 4).forEach((it) => {
        const t = top(it);
        answers[it.id] = it.type === 'reverse' ? t - 1 : 4;
      });

      const forged = mintReportToken();
      const res = await submit(new Request('http://localhost/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: 'student', usage: 4, b1: 4, b2: 3, answers,
          firstName: 'Fresh', lastName: 'Taker', email: 'fresh@example.com', consent: false,
          // As a browser would report it if the retake were started from a
          // report page, which is where a live token could walk into a record.
          meta: { referrerPath: `${REPORT_PREFIX}/${forged}`, landingPath: `${REPORT_PREFIX}/${forged}` },
        }),
      }) as never);
      const body = await res.json() as { reportPath?: string };
      ok('a submission answers with the address of its report',
        res.status === 200 && typeof body.reportPath === 'string'
        && body.reportPath.startsWith(`${REPORT_PREFIX}/`), `${res.status} ${body.reportPath}`);

      const minted = String(body.reportPath || '').replace(`${REPORT_PREFIX}/`, '');
      const saved = minted ? await storage.getLeadByReportToken(minted) : null;
      ok('and that address opens the record it was made for',
        saved?.email === 'fresh@example.com', saved?.email ?? 'nothing answered to it');
      ok('the token is on the record', saved?.reportToken === minted && !!minted);
      ok('and the moment it was issued is too', !!saved?.reportTokenIssuedAt);

      // The record as stored, whether or not it got a link, so the redaction is
      // checked even if the minting above failed.
      const fresh = (await storage.listLeads()).find((l: any) => l.email === 'fresh@example.com');
      ok('the submission was stored', !!fresh);
      ok('a token arriving as a referrer is not written to the record',
        !JSON.stringify(fresh?.meta || {}).includes(forged),
        JSON.stringify(fresh?.meta?.referrerPath));
      ok('and the redacted form is stored instead',
        (fresh?.meta?.referrerPath || '').includes('[token]'), fresh?.meta?.referrerPath);
    }

    head('P0-1: a returning respondent is shown their movement');
    {
      // The defect this replaces: the filter compared the archetype stored on
      // the record against the persona on the result, matched nothing, and told
      // every returning respondent they had never been here before.
      const earlier = compute(build('student', 3, 2));
      await storage.saveLead({
        ...lead, id: 'lead-early', createdAt: '2026-06-01T09:00:00.000Z',
        result: earlier, persona: earlier.archetype.id, archetypeId: earlier.archetype.id,
        reportToken: mintReportToken(),
      });

      const prior = await history.priorAttempts('reader@example.com', 'lead-a', 'student');
      ok('the earlier sitting of the same assessment is found', prior.length >= 1, prior.length);

      const comparison = await history.buildComparison(
        'reader@example.com', result, new Date('2026-09-01T09:00:00.000Z'), 'lead-a');
      ok('and a comparison is produced', comparison !== null);

      // A different assessment is still a different instrument.
      const teacher = compute(build('teacher', 4, 4));
      await storage.saveLead({
        ...lead, id: 'lead-teacher', role: 'teacher', createdAt: '2026-07-01T09:00:00.000Z',
        result: teacher, persona: teacher.archetype.id, archetypeId: teacher.archetype.id,
        reportToken: mintReportToken(),
      });
      const stillStudent = await history.priorAttempts('reader@example.com', 'lead-a', 'student');
      ok('and a sitting of another set is not counted as one',
        stillStudent.every((l: any) => l.role === 'student'),
        stillStudent.map((l: any) => l.role).join(','));

      ok('the assessment is read from the result, not from the archetype',
        history.assessmentOf({ role: 'x', persona: 'strategic_integrator', result } as any) === 'student');
    }

    head('A saved report reads as the report that was sent');
    {
      const at = await history.comparisonForStoredAttempt(
        (await storage.getLeadByReportToken(tokenA))!);
      ok('a stored attempt carries the comparison it had at the time', at !== null);
      ok('and it compares against the sitting before it, not after',
        at?.previousAt === '2026-06-01T09:00:00.000Z', at?.previousAt);
    }

    head('The message can only go to the address on the record');
    {
      const { linkEmailFor } = await import('@/lib/reportLinkAccess');
      const stored = (await storage.getLeadByReportToken(tokenA))!;
      const built = linkEmailFor(stored, tokenA);
      ok('the destination is the address on the record',
        built.to === 'Reader@Example.com', built.to);
      ok('the message carries the link', built.bodyText.includes(tokenA));
      ok('and says the link is only sent here',
        /only ever sent to the address already on the record/.test(built.bodyText));

      // The handler itself, called with a destination an attacker would supply.
      const { POST } = await import('@/app/api/report-link/email/route');
      const call = async (body: unknown) => {
        const res = await POST(new Request('http://localhost/api/report-link/email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }) as never);
        return { status: res.status, body: await res.json() };
      };

      const { resetThrottles } = await import('@/lib/reportLinkAccess');
      resetThrottles();

      const clean = await call({ token: tokenA });
      const poisoned = await call({
        token: tokenA, to: 'attacker@evil.example', email: 'attacker@evil.example',
        destination: 'attacker@evil.example', address: 'attacker@evil.example',
      });
      ok('a supplied address changes nothing about the outcome',
        clean.status === poisoned.status
          && JSON.stringify(clean.body) === JSON.stringify(poisoned.body),
        `${clean.status} ${JSON.stringify(clean.body)} vs ${poisoned.status} ${JSON.stringify(poisoned.body)}`);
      ok('and no attacker address is echoed back',
        !JSON.stringify(poisoned.body).includes('evil.example'));

      resetThrottles();
      const forged = await call({ token: mintReportToken() });
      ok('a forged token is refused', forged.status === 404, forged.status);
      ok('and is refused the same way an expired one is',
        /not active/.test(String(forged.body.error)));

      const malformed = await call({ token: { nested: 'object' } });
      ok('a token that is not a string is refused', malformed.status === 404, malformed.status);
      resetThrottles();
    }

    head('The token never leaves the database');
    {
      const stored = (await storage.getLeadByReportToken(tokenA))!;
      ok('the record carries it', !!stored.reportToken);

      const stripped = storage.withoutReportToken(stored);
      ok('a stripped record does not', !('reportToken' in stripped));
      ok('and keeps everything else', stripped.id === stored.id && stripped.email === stored.email);
      ok('and does not modify the original', !!stored.reportToken);

      const { buildLeadCsv } = await import('@/lib/leadCsv');
      const csv = buildLeadCsv(await storage.listLeads());
      ok('no token reaches the export', !csv.includes(tokenA), 'the CSV contained a live token');
      ok('and the export still has the record in it', csv.includes('lead-a'));

      await storage.logEvent({ event: 'report_view', role: 'student', zone: 'curious_explorer' });
      const events = fs.readFileSync(path.join(tmp, 'data', 'events.json'), 'utf-8');
      ok('an event is written', events.includes('report_view'));
      ok('and it carries no token', !events.includes(tokenA));
      ok('and no event field could hold one',
        !/token/i.test(read('src', 'lib', 'storage.ts').split('export type EventRecord')[1].split('};')[0]));
    }
  } finally {
    process.chdir(ROOT);
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* ------------------------------------------------- the stated promises */

  head('The page asks not to be indexed, and gives its address to nobody');
  {
    const page = read('src', 'app', 'r', '[token]', 'page.tsx');
    ok('the report page is never cached as a static page',
      /dynamic\s*=\s*'force-dynamic'/.test(page));
    ok('a refused link is one page, not a page per reason',
      !/notFound\(\)/.test(page) && /<LinkClosed \/>/.test(page));
    ok('and does not keep its own copy of what makes a link live',
      /accessByToken\(token,/.test(page)
      && !/lastCompletedAtForEmail/.test(page) && !/isLive\(/.test(page)
      && !/getLeadByReportToken/.test(page));
    ok('and hands the caller address over so the guess is counted',
      /clientIp\(/.test(page));

    // The metadata object itself, not the text that produces it. It lives in
    // reportLink.ts so a suite can read it without dragging a React page and
    // its stylesheet along; the route spreads it, which is checked separately.
    const { REPORT_PAGE_METADATA } = await import('@/lib/reportLink');
    const meta = REPORT_PAGE_METADATA as Record<string, any>;
    ok('the page exports metadata at all',
      /export const metadata/.test(page) && /REPORT_PAGE_METADATA/.test(page));
    ok('which refuses indexing', meta?.robots?.index === false && meta?.robots?.follow === false);
    ok('and refuses it to Google by name too', meta?.robots?.googleBot?.index === false);
    ok('and sends no referrer', meta?.referrer === 'no-referrer');
    ok('and inherits none of the site share card onto a private address',
      meta?.openGraph === null && meta?.twitter === null
      && meta?.alternates?.canonical === null);
    ok('and names no token in its title', !/[A-Za-z0-9_-]{43}/.test(String(meta?.title || '')));

    // The crawler directives Next.js emits, not the source that builds them.
    const robotsModule = await import('@/app/robots');
    const crawlers = robotsModule.default().rules as { allow?: unknown; disallow?: string[] };
    ok('the report route is disallowed to crawlers',
      Array.isArray(crawlers.disallow) && crawlers.disallow.includes(`${REPORT_PREFIX}/`),
      JSON.stringify(crawlers.disallow));
    ok('and the admin and the api go with it',
      Array.isArray(crawlers.disallow) && crawlers.disallow.includes('/api/')
      && crawlers.disallow.includes('/admin'));
    ok('and the file names no token',
      !/[A-Za-z0-9_-]{43}/.test(JSON.stringify(robotsModule.default())));

    // A saved report that restamps itself with the day it is opened is not a
    // record of anything, so the date is threaded from the record.
    const view = read('src', 'components', 'humanAdvantage', 'ReportView.tsx');
    ok('the report page states the day it was taken',
      /takenAt=\{lead\.createdAt\}/.test(page) && /takenAt=\{takenAt\}/.test(view));
    ok('and the cover reads that date rather than today',
      /date:\s*takenAt \? new Date\(takenAt\)/.test(
        read('src', 'components', 'humanAdvantage', 'ResultCover.tsx')));
    // Every other edition can rebuild its file from the stored answers, so the
    // saved page offers the download. The Minister cannot: the two reflection
    // answers behind its Dependence Check are never written down.
    ok('the saved page offers the file to the editions that can rebuild it',
      /submission=\{submission\}/.test(page) && /submission=\{submission \?\? null\}/.test(view));
    ok('and never to the Minister, whose answers were not all kept',
      /lead\.role !== 'pastor'/.test(page),
      'the Minister file would disagree with the letter printed above it');

    // The resolved value, not the text of the file, so a commented-out block
    // cannot pass this.
    const configPath = '../../next.config.mjs';
    const config = (await import(configPath)).default as {
      headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
    };
    const rules = await config.headers();
    const forReports = rules.find((r) => r.source.startsWith(`${REPORT_PREFIX}/`));
    ok('the report route has headers of its own', !!forReports,
      rules.map((r) => r.source).join(', '));
    const value = (key: string) =>
      forReports?.headers.find((h) => h.key.toLowerCase() === key)?.value || '';
    ok('the response says no referrer in a header too',
      value('referrer-policy') === 'no-referrer', value('referrer-policy'));
    ok('and says noindex in a header too',
      /noindex/.test(value('x-robots-tag')) && /nofollow/.test(value('x-robots-tag')),
      value('x-robots-tag'));
    ok('and forbids caching', /no-store/.test(value('cache-control')), value('cache-control'));
    ok('and covers the link controls as well',
      rules.some((r) => r.source.startsWith('/api/report-link/')),
      rules.map((r) => r.source).join(', '));


  }

  head('The send goes to the address on file and to no other');
  {
    const route = read('src', 'app', 'api', 'report-link', 'email', 'route.ts');
    ok('the address comes off the record', /lead\.email/.test(route));
    ok('and never off the request',
      !/body\.(to|email|address|destination)\b/.test(route),
      'the route read a destination from the caller');
    ok('and the send is throttled', /allow\(/.test(route));

    // The counters are the throttle, so exercise them rather than the word.
    const { allow: spend, resetThrottles: clear } = await import('@/lib/reportLinkAccess');
    clear();
    const spent = [1, 2, 3, 4].map(() => spend('suite:probe', 3));
    ok('a budget of three allows three and then refuses',
      JSON.stringify(spent) === JSON.stringify([true, true, true, false]), JSON.stringify(spent));
    ok('and a different key has its own budget', spend('suite:other', 3) === true);
    clear();
    ok('and clearing them starts the budget over', spend('suite:probe', 3) === true);
    clear();

    ok('email is checked before the budget is spent, so a refusal is not counted as a send',
      route.indexOf('isEmailEnabled()') < route.indexOf('allow(`link-email'),
      'three clicks with email off would report the fourth as already sent');

    // Every message this route can return to a caller, checked for the one
    // thing it must never contain.
    const errors = [...route.matchAll(/error:\s*(['"`])([\s\S]*?)\1/g)].map((m) => m[2]);
    ok('the route has errors to check', errors.length >= 4, errors.length);
    ok('and no error interpolates anything',
      errors.every((e) => !e.includes('${')), errors.filter((e) => e.includes('${')).join(' | '));
    ok('the throttle counts a digest of the link, not the link',
      /createHash\('sha256'\)/.test(route) && !/allow\(`[^`]*\$\{token\}/.test(route));

    const rotate = read('src', 'app', 'api', 'report-link', 'rotate', 'route.ts');
    ok('a new link is minted rather than derived', /mintReportToken\(\)/.test(rotate));
    ok('and the record is re-read before it is replaced', /getLead\(/.test(rotate));
    ok('and a path is returned rather than a whole address', /reportPath\(/.test(rotate));
  }

  head('The notice and the product say the same thing');
  {
    const { PRIVACY } = await import('@/content/legal');
    const notice = PRIVACY.sections.flatMap((s) => [s.heading, ...s.body, ...(s.list ?? [])]).join(' ');
    ok('the notice describes the link', /report link/i.test(notice));
    for (const promise of ['Email me my link', 'Get a new link']) {
      ok(`the notice names "${promise}"`, notice.includes(promise));
      ok(`and the product offers it`,
        read('src', 'components', 'humanAdvantage', 'ReportView.tsx').includes(promise));
    }
    ok('the notice ties the link to the retention period', /twenty four months/i.test(notice));

    const inventory = read('docs', 'DATA-COLLECTED.md');
    ok('the inventory lists the token', /Report token/.test(inventory));
    ok('and says it is never exported', /never exported/.test(inventory));
  }

  head('The server log keeps the route and loses the address');
  {
    const nginx = read('deploy', 'nginx.conf');
    ok('a redacted log format is defined', /log_format\s+redacted/.test(nginx));
    ok('and it is the one in use', /access_log\s+\S+\s+redacted/.test(nginx));
    ok('the report path is rewritten before it is logged',
      /map\s+\$uri\s+\$uri_logged/.test(nginx) && /\[token\]/.test(nginx));
    ok('and the raw request line is not logged instead',
      !/\$request\b/.test(nginx.split('log_format')[1] || ''));

    // Matched on the directive, not on any mention: the file explains in a
    // comment why the appending form was wrong, and saying so must not fail.
    const forwards = [...nginx.matchAll(/^\s*proxy_set_header\s+X-Forwarded-For\s+(\S+);/gm)]
      .map((m) => m[1]);
    ok('every server block forwards an address nginx saw itself',
      forwards.length >= 2 && forwards.every((v) => v === '$remote_addr'),
      forwards.join(', ') || 'no X-Forwarded-For directive found');

    const submit = read('src', 'app', 'api', 'submit', 'route.ts');
    ok('a token arriving as a referrer is redacted before it is stored',
      /redactToken\(str\(m\.referrerPath/.test(submit));
    ok('and so is one arriving as a landing path',
      /redactToken\(str\(m\.landingPath/.test(submit));

    const admin = read('src', 'app', 'api', 'admin', 'leads', 'route.ts');
    ok('the admin is sent records without tokens',
      /withoutReportToken/.test(admin) && !/NextResponse\.json\(\{ leads \}\)/.test(admin));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
